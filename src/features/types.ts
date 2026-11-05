import type { UciScore } from "../uci/parse.js"

/** One MultiPV candidate before a played move (UCI side-to-move scores). */
export type MoveMultiPvLine = {
  readonly multiPv: number
  /** First move of the PV in UCI. */
  readonly moveUci: string
  readonly score: UciScore
}

/**
 * Per-ply engine snapshot used for deterministic feature extraction.
 * Scores follow UCI convention (side to move before the ply).
 */
export type MoveEvalInput = {
  /** 1-based ply index (White ply 1, Black ply 2, ...). */
  readonly ply: number
  readonly side: "white" | "black"
  readonly playedUci: string
  /** MultiPV lines before the move; multiPv 1 is best. */
  readonly lines: readonly MoveMultiPvLine[]
  /**
   * Eval of the played move from STM perspective before the move.
   * When omitted, derived from a matching MultiPV line if present.
   */
  readonly playedScore?: UciScore
  /** Clock remaining before this move, seconds. */
  readonly clockBeforeSec?: number
  /** Clock remaining after this move, seconds. */
  readonly clockAfterSec?: number
}

export type OpeningBookMeta = {
  readonly id: string
  readonly version: string
  readonly licenseSpdx: "CC0-1.0"
  readonly source: string
  readonly sourceCommit: string
  readonly sourceUrl: string
}

export type BookBoundary = {
  readonly bookId: string
  /** Number of leading plies still in book (0 if left on ply 1). */
  readonly bookPlyCount: number
  /** First out-of-book ply (1-based), or null if every ply stayed in book. */
  readonly noveltyPly: number | null
}

export type MatchFeatures = {
  readonly top1Rate: number
  readonly top3Rate: number
  readonly top1RateWhite: number
  readonly top1RateBlack: number
  readonly top3RateWhite: number
  readonly top3RateBlack: number
  /** Non-book plies included in rates. */
  readonly usablePlies: number
  readonly usablePliesWhite: number
  readonly usablePliesBlack: number
}

export type CplFeatures = {
  readonly average: number
  readonly median: number
  readonly p90: number
  readonly averageWhite: number
  readonly averageBlack: number
  /** Per non-book ply CPL in play order. */
  readonly values: readonly number[]
}

export type TimingFeatures = {
  readonly meanMoveTimeSec: number
  readonly medianMoveTimeSec: number
  /** Max consecutive plies that are top-1 matches and faster than the fast threshold. */
  readonly fastHighMatchStreakMax: number
  readonly fastMoveThresholdSec: number
  readonly moveTimesSec: readonly number[]
}

export type GameFeatures = {
  readonly book: BookBoundary
  readonly match: MatchFeatures
  readonly cpl: CplFeatures
  /** Present only when every non-book ply has both clock fields. */
  readonly timing: TimingFeatures | null
}

export type ExtractFeaturesOptions = {
  /** Override default opening-book-v1. */
  readonly bookId?: string
  /** Seconds at or below this count as "fast" for streak features. Default 3. */
  readonly fastMoveThresholdSec?: number
}
