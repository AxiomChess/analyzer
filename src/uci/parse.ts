/**
 * Parse Stockfish UCI `info` and `bestmove` lines.
 * Protocol shape verified against official Stockfish UCI docs (sf_19 / wiki).
 */

export type UciScore =
  | { readonly type: "cp"; readonly value: number }
  | { readonly type: "mate"; readonly value: number }

export type UciInfoLine = {
  readonly depth?: number
  readonly seldepth?: number
  readonly multiPv?: number
  readonly score?: UciScore
  readonly nodes?: number
  readonly nps?: number
  readonly hashfull?: number
  readonly timeMs?: number
  readonly pv?: readonly string[]
  readonly bound?: "lowerbound" | "upperbound"
}

export type UciBestMove = {
  readonly bestMove: string
  readonly ponderMove?: string
}

const readInt = (tokens: string[], index: number): number | undefined => {
  const raw = tokens[index]
  if (raw === undefined) return undefined
  const value = Number.parseInt(raw, 10)
  if (!Number.isFinite(value)) return undefined
  return value
}

export const parseUciInfoLine = (line: string): UciInfoLine | null => {
  const trimmed = line.trim()
  if (!trimmed.startsWith("info ")) return null

  const tokens = trimmed.split(/\s+/)
  const out: {
    depth?: number
    seldepth?: number
    multiPv?: number
    score?: UciScore
    nodes?: number
    nps?: number
    hashfull?: number
    timeMs?: number
    pv?: string[]
    bound?: "lowerbound" | "upperbound"
  } = {}

  let i = 1
  while (i < tokens.length) {
    const key = tokens[i]
    if (key === undefined) break

    if (key === "depth") {
      const value = readInt(tokens, i + 1)
      if (value !== undefined) out.depth = value
      i += 2
      continue
    }
    if (key === "seldepth") {
      const value = readInt(tokens, i + 1)
      if (value !== undefined) out.seldepth = value
      i += 2
      continue
    }
    if (key === "multipv") {
      const value = readInt(tokens, i + 1)
      if (value !== undefined) out.multiPv = value
      i += 2
      continue
    }
    if (key === "nodes") {
      const value = readInt(tokens, i + 1)
      if (value !== undefined) out.nodes = value
      i += 2
      continue
    }
    if (key === "nps") {
      const value = readInt(tokens, i + 1)
      if (value !== undefined) out.nps = value
      i += 2
      continue
    }
    if (key === "hashfull") {
      const value = readInt(tokens, i + 1)
      if (value !== undefined) out.hashfull = value
      i += 2
      continue
    }
    if (key === "time") {
      const value = readInt(tokens, i + 1)
      if (value !== undefined) out.timeMs = value
      i += 2
      continue
    }
    if (key === "score") {
      const kind = tokens[i + 1]
      const value = readInt(tokens, i + 2)
      if (kind === "cp" && value !== undefined) {
        out.score = { type: "cp", value }
        i += 3
        const maybeBound = tokens[i]
        if (maybeBound === "lowerbound" || maybeBound === "upperbound") {
          out.bound = maybeBound
          i += 1
        }
        continue
      }
      if (kind === "mate" && value !== undefined) {
        out.score = { type: "mate", value }
        i += 3
        const maybeBound = tokens[i]
        if (maybeBound === "lowerbound" || maybeBound === "upperbound") {
          out.bound = maybeBound
          i += 1
        }
        continue
      }
      i += 1
      continue
    }
    if (key === "lowerbound" || key === "upperbound") {
      out.bound = key
      i += 1
      continue
    }
    if (key === "pv") {
      out.pv = tokens.slice(i + 1)
      break
    }
    if (key === "string" || key === "currmove" || key === "currmovenumber" || key === "wdl") {
      break
    }
    i += 1
  }

  if (
    out.depth === undefined &&
    out.score === undefined &&
    out.pv === undefined &&
    out.multiPv === undefined
  ) {
    return null
  }

  return out
}

export const parseUciBestMoveLine = (line: string): UciBestMove | null => {
  const trimmed = line.trim()
  if (!trimmed.startsWith("bestmove ")) return null

  const tokens = trimmed.split(/\s+/)
  const bestMove = tokens[1]
  if (!bestMove) return null

  if (tokens[2] === "ponder" && tokens[3]) {
    return { bestMove, ponderMove: tokens[3] }
  }
  return { bestMove }
}
