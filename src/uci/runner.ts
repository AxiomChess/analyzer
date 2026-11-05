import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import { createInterface, type Interface } from "node:readline"

import {
  ENGINE_V1_POLICY,
  depthForTimeControl,
  type EngineTimeControlClass,
  type EngineV1Policy,
} from "../policy.js"
import {
  parseUciBestMoveLine,
  parseUciInfoLine,
  type UciInfoLine,
  type UciScore,
} from "./parse.js"
import { resolveStockfishBinaryPath } from "./paths.js"

export class EngineTimeoutError extends Error {
  readonly code = "engine_timeout" as const

  constructor(message: string) {
    super(message)
    this.name = "EngineTimeoutError"
  }
}

export class EngineCrashError extends Error {
  readonly code = "engine_crash" as const

  constructor(message: string) {
    super(message)
    this.name = "EngineCrashError"
  }
}

export type UciPvLine = {
  readonly multiPv: number
  readonly depth: number
  readonly score: UciScore
  readonly pv: readonly string[]
  readonly nodes?: number
  readonly timeMs?: number
}

export type PositionEvalResult = {
  readonly policyId: EngineV1Policy["id"]
  readonly depth: number
  readonly multiPv: number
  readonly threads: number
  readonly hashMb: number
  readonly bestMove: string
  readonly ponderMove?: string
  readonly lines: readonly UciPvLine[]
  readonly nodes?: number
  readonly timeMs?: number
}

export type AnalyzePositionInput = {
  readonly fen?: string
  readonly startpos?: boolean
  readonly moves?: readonly string[]
  /** Override policy depth for tests; defaults from timeControl. */
  readonly depth?: number
  readonly timeControl?: EngineTimeControlClass
}

export type UciEngineRunnerOptions = {
  readonly binaryPath?: string
  readonly policy?: EngineV1Policy
  /** Per-search timeout in ms (kills the process on fire). */
  readonly searchTimeoutMs?: number
  /** Handshake timeout for uci / isready. */
  readonly readyTimeoutMs?: number
}

type PendingWait = {
  readonly match: (line: string) => boolean
  readonly resolve: (line: string) => void
  readonly reject: (error: Error) => void
  readonly timer: ReturnType<typeof setTimeout>
}

const START_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

export class UciEngineRunner {
  readonly policy: EngineV1Policy
  readonly binaryPath: string

  #child: ChildProcessWithoutNullStreams
  #readline: Interface
  #queue: string[] = []
  #waiters: PendingWait[] = []
  #closed = false
  #searchTimeoutMs: number
  #readyTimeoutMs: number
  #writeChain: Promise<void> = Promise.resolve()

  private constructor(
    child: ChildProcessWithoutNullStreams,
    binaryPath: string,
    policy: EngineV1Policy,
    searchTimeoutMs: number,
    readyTimeoutMs: number,
  ) {
    this.#child = child
    this.binaryPath = binaryPath
    this.policy = policy
    this.#searchTimeoutMs = searchTimeoutMs
    this.#readyTimeoutMs = readyTimeoutMs
    this.#readline = createInterface({ input: child.stdout })

    this.#readline.on("line", (line) => {
      this.#handleLine(line)
    })

    child.stderr.on("data", () => {
      // Stockfish rarely writes stderr; ignore content, keep process isolated.
    })

    child.on("error", (error) => {
      this.#failAll(new EngineCrashError(`Engine process error: ${error.message}`))
    })

    child.on("exit", (code, signal) => {
      if (this.#closed) return
      this.#failAll(
        new EngineCrashError(
          `Engine exited unexpectedly (code=${String(code)}, signal=${String(signal)})`,
        ),
      )
    })
  }

  static async launch(
    options: UciEngineRunnerOptions = {},
  ): Promise<UciEngineRunner> {
    const policy = options.policy ?? ENGINE_V1_POLICY
    const binaryPath = await resolveStockfishBinaryPath(options.binaryPath)
    const searchTimeoutMs = options.searchTimeoutMs ?? 120_000
    const readyTimeoutMs = options.readyTimeoutMs ?? 15_000

    const child = spawn(binaryPath, [], {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    })

    const runner = new UciEngineRunner(
      child,
      binaryPath,
      policy,
      searchTimeoutMs,
      readyTimeoutMs,
    )

    try {
      await runner.#write("uci")
      await runner.#waitFor((line) => line === "uciok", readyTimeoutMs, "uciok")
      await runner.#configurePolicy()
      await runner.#write("isready")
      await runner.#waitFor(
        (line) => line === "readyok",
        readyTimeoutMs,
        "readyok",
      )
      return runner
    } catch (error) {
      await runner.dispose()
      throw error
    }
  }

  async analyzePosition(
    input: AnalyzePositionInput,
  ): Promise<PositionEvalResult> {
    if (this.#closed) {
      throw new EngineCrashError("Engine runner is closed")
    }

    const depth =
      input.depth ??
      depthForTimeControl(this.policy, input.timeControl ?? "standard")

    const positionCommand = this.#buildPositionCommand(input)
    await this.#write("ucinewgame")
    await this.#write("isready")
    await this.#waitFor(
      (line) => line === "readyok",
      this.#readyTimeoutMs,
      "readyok",
    )
    await this.#write(positionCommand)

    const latestByMultiPv = new Map<number, UciInfoLine>()
    let bestMove = ""
    let ponderMove: string | undefined
    let nodes: number | undefined
    let timeMs: number | undefined

    await this.#write(`go depth ${depth}`)

    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          void this.#killProcess()
          reject(
            new EngineTimeoutError(
              `Engine search timed out after ${this.#searchTimeoutMs}ms (depth ${depth})`,
            ),
          )
        }, this.#searchTimeoutMs)

        const onLine = (line: string) => {
          const info = parseUciInfoLine(line)
          if (info?.multiPv !== undefined && info.score && info.pv) {
            latestByMultiPv.set(info.multiPv, info)
            if (info.nodes !== undefined) nodes = info.nodes
            if (info.timeMs !== undefined) timeMs = info.timeMs
          }

          const best = parseUciBestMoveLine(line)
          if (!best) return

          clearTimeout(timer)
          this.#unsubscribe(onLine)
          bestMove = best.bestMove
          ponderMove = best.ponderMove
          resolve()
        }

        this.#subscribe(onLine)
      })
    } finally {
      this.#lineListeners.clear()
    }

    if (!bestMove || bestMove === "(none)") {
      throw new EngineCrashError("Engine returned no bestmove")
    }

    const lines: UciPvLine[] = [...latestByMultiPv.entries()]
      .sort(([a], [b]) => a - b)
      .map(([multiPv, info]) => {
        if (!info.score || !info.pv) {
          throw new EngineCrashError(`Incomplete MultiPV line ${multiPv}`)
        }
        return {
          multiPv,
          depth: info.depth ?? depth,
          score: info.score,
          pv: info.pv,
          ...(info.nodes !== undefined ? { nodes: info.nodes } : {}),
          ...(info.timeMs !== undefined ? { timeMs: info.timeMs } : {}),
        }
      })

    return {
      policyId: this.policy.id,
      depth,
      multiPv: this.policy.multiPv,
      threads: this.policy.threads,
      hashMb: this.policy.hashMb,
      bestMove,
      ...(ponderMove !== undefined ? { ponderMove } : {}),
      lines,
      ...(nodes !== undefined ? { nodes } : {}),
      ...(timeMs !== undefined ? { timeMs } : {}),
    }
  }

  async dispose(): Promise<void> {
    if (this.#closed) return
    this.#closed = true
    this.#failAll(new EngineCrashError("Engine runner disposed"))

    try {
      if (this.#child.exitCode === null && !this.#child.killed) {
        this.#child.stdin.write("quit\n")
      }
    } catch {
      // ignore broken pipe on shutdown
    }

    await this.#killProcess()
    this.#readline.close()
  }

  #buildPositionCommand(input: AnalyzePositionInput): string {
    const moves =
      input.moves && input.moves.length > 0
        ? ` moves ${input.moves.join(" ")}`
        : ""

    if (input.fen) {
      return `position fen ${input.fen}${moves}`
    }
    if (input.startpos === false && !input.fen) {
      return `position fen ${START_FEN}${moves}`
    }
    return `position startpos${moves}`
  }

  async #configurePolicy(): Promise<void> {
    const { threads, hashMb, multiPv } = this.policy
    await this.#write(`setoption name Threads value ${threads}`)
    await this.#write(`setoption name Hash value ${hashMb}`)
    await this.#write(`setoption name MultiPV value ${multiPv}`)
  }

  #write(line: string): Promise<void> {
    this.#writeChain = this.#writeChain.then(() => {
      if (this.#closed || this.#child.killed) {
        return Promise.reject(new EngineCrashError("Cannot write to closed engine"))
      }
      return new Promise<void>((resolve, reject) => {
        this.#child.stdin.write(`${line}\n`, (error) => {
          if (error) {
            reject(new EngineCrashError(`Engine stdin write failed: ${error.message}`))
            return
          }
          resolve()
        })
      })
    })
    return this.#writeChain
  }

  #waitFor(
    match: (line: string) => boolean,
    timeoutMs: number,
    label: string,
  ): Promise<string> {
    while (this.#queue.length > 0) {
      const queued = this.#queue.shift()
      if (queued !== undefined && match(queued)) {
        return Promise.resolve(queued)
      }
    }

    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#waiters = this.#waiters.filter((waiter) => waiter.resolve !== resolve)
        void this.#killProcess()
        reject(new EngineTimeoutError(`Timed out waiting for ${label}`))
      }, timeoutMs)

      this.#waiters.push({
        match,
        resolve: (line) => {
          clearTimeout(timer)
          resolve(line)
        },
        reject: (error) => {
          clearTimeout(timer)
          reject(error)
        },
        timer,
      })
    })
  }

  #lineListeners = new Set<(line: string) => void>()

  #subscribe(listener: (line: string) => void): void {
    this.#lineListeners.add(listener)
  }

  #unsubscribe(listener: (line: string) => void): void {
    this.#lineListeners.delete(listener)
  }

  #handleLine(line: string): void {
    for (const listener of this.#lineListeners) {
      listener(line)
    }

    const waiterIndex = this.#waiters.findIndex((waiter) => waiter.match(line))
    if (waiterIndex >= 0) {
      const [waiter] = this.#waiters.splice(waiterIndex, 1)
      if (waiter) {
        clearTimeout(waiter.timer)
        waiter.resolve(line)
      }
      return
    }

    this.#queue.push(line)
    if (this.#queue.length > 5000) {
      this.#queue.splice(0, this.#queue.length - 1000)
    }
  }

  #failAll(error: Error): void {
    const waiters = this.#waiters.splice(0, this.#waiters.length)
    for (const waiter of waiters) {
      clearTimeout(waiter.timer)
      waiter.reject(error)
    }
  }

  async #killProcess(): Promise<void> {
    if (this.#child.exitCode !== null || this.#child.killed) {
      return
    }

    this.#child.kill("SIGTERM")

    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        if (this.#child.exitCode === null && !this.#child.killed) {
          this.#child.kill("SIGKILL")
        }
        resolve()
      }, 1000)

      this.#child.once("exit", () => {
        clearTimeout(timer)
        resolve()
      })
    })
  }
}
