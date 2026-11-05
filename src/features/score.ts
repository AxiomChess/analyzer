import type { UciScore } from "../uci/parse.js"
import type { MoveEvalInput, MoveMultiPvLine } from "./types.js"

/** Mate distance scaled into a large cp-like unit for CPL arithmetic. */
const MATE_CP_BASE = 100_000
const MATE_CP_STEP = 100

/**
 * Convert a UCI score to a comparable centipawn-like value (STM perspective).
 */
export const scoreToCp = (score: UciScore): number => {
  if (score.type === "cp") {
    return score.value
  }
  if (score.value > 0) {
    return MATE_CP_BASE - score.value * MATE_CP_STEP
  }
  if (score.value < 0) {
    return -MATE_CP_BASE - score.value * MATE_CP_STEP
  }
  return MATE_CP_BASE
}

export const findMatchingLine = (
  playedUci: string,
  lines: readonly MoveMultiPvLine[],
): MoveMultiPvLine | undefined => {
  return lines.find((line) => line.moveUci === playedUci)
}

export const resolvePlayedScore = (move: MoveEvalInput): UciScore => {
  if (move.playedScore) {
    return move.playedScore
  }
  const matched = findMatchingLine(move.playedUci, move.lines)
  if (matched) {
    return matched.score
  }
  throw new Error(
    `Move ply ${move.ply}: playedScore required when ${move.playedUci} is not in MultiPV`,
  )
}

export const bestLine = (
  lines: readonly MoveMultiPvLine[],
): MoveMultiPvLine => {
  if (lines.length === 0) {
    throw new Error("MultiPV lines must not be empty")
  }
  const sorted = [...lines].sort((a, b) => a.multiPv - b.multiPv)
  const best = sorted[0]
  if (!best) {
    throw new Error("MultiPV lines must not be empty")
  }
  return best
}

/**
 * Centipawn loss for the moving side: max(0, best - played) in cp-like units.
 */
export const centipawnLoss = (move: MoveEvalInput): number => {
  const best = bestLine(move.lines)
  const played = resolvePlayedScore(move)
  const loss = scoreToCp(best.score) - scoreToCp(played)
  if (loss <= 0) return 0
  return loss
}

export const matchRank = (move: MoveEvalInput): number | null => {
  const matched = findMatchingLine(move.playedUci, move.lines)
  if (!matched) return null
  return matched.multiPv
}

export const isTop1Match = (move: MoveEvalInput): boolean => {
  return matchRank(move) === 1
}

export const isTop3Match = (move: MoveEvalInput): boolean => {
  const rank = matchRank(move)
  return rank !== null && rank >= 1 && rank <= 3
}

export const medianOf = (values: readonly number[]): number => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) {
    return sorted[mid] ?? 0
  }
  const lo = sorted[mid - 1] ?? 0
  const hi = sorted[mid] ?? 0
  return (lo + hi) / 2
}

export const percentile = (
  values: readonly number[],
  p: number,
): number => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const rank = (p / 100) * (sorted.length - 1)
  const low = Math.floor(rank)
  const high = Math.ceil(rank)
  const lowVal = sorted[low] ?? 0
  const highVal = sorted[high] ?? lowVal
  if (low === high) return lowVal
  const weight = rank - low
  return lowVal * (1 - weight) + highVal * weight
}

export const meanOf = (values: readonly number[]): number => {
  if (values.length === 0) return 0
  let sum = 0
  for (const value of values) {
    sum += value
  }
  return sum / values.length
}
