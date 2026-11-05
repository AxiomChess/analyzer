import { findBookBoundary, getOpeningBook } from "./book.js"
import {
  centipawnLoss,
  isTop1Match,
  isTop3Match,
  meanOf,
  medianOf,
  percentile,
} from "./score.js"
import type {
  CplFeatures,
  ExtractFeaturesOptions,
  GameFeatures,
  MatchFeatures,
  MoveEvalInput,
  TimingFeatures,
} from "./types.js"

const DEFAULT_FAST_MOVE_THRESHOLD_SEC = 3

const rate = (hits: number, total: number): number => {
  if (total === 0) return 0
  return hits / total
}

const assertOrderedPlies = (moves: readonly MoveEvalInput[]): void => {
  for (let i = 0; i < moves.length; i += 1) {
    const move = moves[i]
    if (!move) continue
    if (move.ply !== i + 1) {
      throw new Error(
        `MoveEvalInput plies must be contiguous from 1; expected ply ${i + 1}, got ${move.ply}`,
      )
    }
  }
}

const buildMatchFeatures = (
  usable: readonly MoveEvalInput[],
): MatchFeatures => {
  const white = usable.filter((move) => move.side === "white")
  const black = usable.filter((move) => move.side === "black")

  const countTop1 = (list: readonly MoveEvalInput[]) =>
    list.filter((move) => isTop1Match(move)).length
  const countTop3 = (list: readonly MoveEvalInput[]) =>
    list.filter((move) => isTop3Match(move)).length

  return {
    top1Rate: rate(countTop1(usable), usable.length),
    top3Rate: rate(countTop3(usable), usable.length),
    top1RateWhite: rate(countTop1(white), white.length),
    top1RateBlack: rate(countTop1(black), black.length),
    top3RateWhite: rate(countTop3(white), white.length),
    top3RateBlack: rate(countTop3(black), black.length),
    usablePlies: usable.length,
    usablePliesWhite: white.length,
    usablePliesBlack: black.length,
  }
}

const buildCplFeatures = (usable: readonly MoveEvalInput[]): CplFeatures => {
  const values = usable.map((move) => centipawnLoss(move))
  const whiteValues = usable
    .filter((move) => move.side === "white")
    .map((move) => centipawnLoss(move))
  const blackValues = usable
    .filter((move) => move.side === "black")
    .map((move) => centipawnLoss(move))

  return {
    average: meanOf(values),
    median: medianOf(values),
    p90: percentile(values, 90),
    averageWhite: meanOf(whiteValues),
    averageBlack: meanOf(blackValues),
    values,
  }
}

const moveTimeSec = (move: MoveEvalInput): number | null => {
  if (move.clockBeforeSec === undefined || move.clockAfterSec === undefined) {
    return null
  }
  return move.clockBeforeSec - move.clockAfterSec
}

const buildTimingFeatures = (
  usable: readonly MoveEvalInput[],
  fastMoveThresholdSec: number,
): TimingFeatures | null => {
  if (usable.length === 0) return null

  const times: number[] = []
  for (const move of usable) {
    const time = moveTimeSec(move)
    if (time === null) return null
    times.push(time)
  }

  let streak = 0
  let streakMax = 0
  for (let i = 0; i < usable.length; i += 1) {
    const move = usable[i]
    const time = times[i]
    if (!move || time === undefined) continue
    const fastHighMatch = isTop1Match(move) && time <= fastMoveThresholdSec
    if (fastHighMatch) {
      streak += 1
      if (streak > streakMax) streakMax = streak
    } else {
      streak = 0
    }
  }

  return {
    meanMoveTimeSec: meanOf(times),
    medianMoveTimeSec: medianOf(times),
    fastHighMatchStreakMax: streakMax,
    fastMoveThresholdSec,
    moveTimesSec: times,
  }
}

/**
 * Extract deterministic match, CPL, timing, and book-boundary features.
 * Book plies are excluded from match/CPL/timing aggregates.
 */
export const extractFeatures = (
  moves: readonly MoveEvalInput[],
  options: ExtractFeaturesOptions = {},
): GameFeatures => {
  assertOrderedPlies(moves)

  const book = getOpeningBook(options.bookId)
  const playedUci = moves.map((move) => move.playedUci)
  const boundary = findBookBoundary(playedUci, book)

  const usable = moves.filter((move) => move.ply > boundary.bookPlyCount)
  const fastMoveThresholdSec =
    options.fastMoveThresholdSec ?? DEFAULT_FAST_MOVE_THRESHOLD_SEC

  return {
    book: boundary,
    match: buildMatchFeatures(usable),
    cpl: buildCplFeatures(usable),
    timing: buildTimingFeatures(usable, fastMoveThresholdSec),
  }
}
