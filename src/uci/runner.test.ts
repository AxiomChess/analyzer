import { afterAll, describe, expect, it } from "vitest"

import {
  ENGINE_POLICY_ID_V1,
  ENGINE_V1_POLICY,
  depthForTimeControl,
} from "../policy.js"
import { isStockfishBinaryAvailable } from "./paths.js"
import {
  EngineCrashError,
  EngineTimeoutError,
  UciEngineRunner,
} from "./runner.js"

describe("engine-v1 policy", () => {
  it("freezes MultiPV 3 and depths 18/16", () => {
    expect(ENGINE_V1_POLICY.id).toBe(ENGINE_POLICY_ID_V1)
    expect(ENGINE_V1_POLICY.multiPv).toBe(3)
    expect(ENGINE_V1_POLICY.depthStandard).toBe(18)
    expect(ENGINE_V1_POLICY.depthBullet).toBe(16)
    expect(depthForTimeControl(ENGINE_V1_POLICY, "standard")).toBe(18)
    expect(depthForTimeControl(ENGINE_V1_POLICY, "bullet")).toBe(16)
  })
})

const engineAvailable = await isStockfishBinaryAvailable()

describe.skipIf(!engineAvailable)("UciEngineRunner integration", () => {
  let runner: UciEngineRunner | undefined

  afterAll(async () => {
    await runner?.dispose()
  })

  it("launches Stockfish, records policy id, returns MultiPV lines", async () => {
    runner = await UciEngineRunner.launch({
      searchTimeoutMs: 60_000,
      readyTimeoutMs: 20_000,
    })

    const result = await runner.analyzePosition({
      startpos: true,
      depth: 6,
    })

    expect(result.policyId).toBe("engine-v1")
    expect(result.multiPv).toBe(3)
    expect(result.threads).toBe(ENGINE_V1_POLICY.threads)
    expect(result.hashMb).toBe(ENGINE_V1_POLICY.hashMb)
    expect(result.depth).toBe(6)
    expect(result.bestMove).toMatch(/^[a-h][1-8][a-h][1-8][qrbn]?$/)
    expect(result.lines.length).toBe(3)
    expect(result.lines.map((line) => line.multiPv)).toEqual([1, 2, 3])
    expect(result.lines[0]?.score).toBeDefined()
    expect(result.lines[0]?.pv.length).toBeGreaterThan(0)
  }, 90_000)

  it("isolates crash after dispose", async () => {
    const local = await UciEngineRunner.launch({
      searchTimeoutMs: 30_000,
      readyTimeoutMs: 20_000,
    })
    await local.dispose()
    await expect(
      local.analyzePosition({ startpos: true, depth: 4 }),
    ).rejects.toBeInstanceOf(EngineCrashError)
  }, 60_000)

  it("times out and kills a hung search budget", async () => {
    const local = await UciEngineRunner.launch({
      searchTimeoutMs: 1,
      readyTimeoutMs: 20_000,
    })
    try {
      await expect(
        local.analyzePosition({ startpos: true, depth: 40 }),
      ).rejects.toBeInstanceOf(EngineTimeoutError)
    } finally {
      await local.dispose()
    }
  }, 60_000)
})

describe.skipIf(engineAvailable)("UciEngineRunner gated", () => {
  it("skips live engine tests when binary is absent", () => {
    expect(engineAvailable).toBe(false)
  })
})
