import { ENGINE_POLICY_ID_V1 } from "../policy.js"
import type { GameFeatures } from "../features/types.js"
import { CALIBRATION_V1 } from "./constants.js"
import type {
  CalibratedSuspicion,
  SuspicionBand,
  SuspicionUncertainty,
} from "./types.js"

const clamp01 = (value: number): number => {
  if (value <= 0) return 0
  if (value >= 1) return 1
  return value
}

const METHODOLOGY_NOTE =
  "Suspicion score uses policy calibration-v1 with engine policy engine-v1 (MultiPV 3, depth 18/16). Book plies are excluded from match and CPL aggregates. Bands are informational only."

const FALSE_POSITIVE_WARNING =
  "False positives are possible. Short games, missing clocks, long book stretches, and strong human play can raise or lower scores. This is an educational analysis aid, not a finding of cheating."

const FEATURES_USED = [
  "match.top1Rate",
  "match.top3Rate",
  "cpl.average",
  "match.usablePlies",
  "timing.fastHighMatchStreakMax",
  "timing.present",
] as const

const buildCaveats = (features: GameFeatures): string[] => {
  const caveats: string[] = []
  if (features.match.usablePlies < CALIBRATION_V1.minUsablePlies) {
    caveats.push(
      `Usable non-book plies (${features.match.usablePlies}) are below ${CALIBRATION_V1.minUsablePlies}; band is inconclusive.`,
    )
  }
  if (features.book.bookPlyCount > 0) {
    caveats.push(
      `Opening book boundary at ply ${features.book.noveltyPly ?? "end"}; ${features.book.bookPlyCount} book plies excluded from match/CPL.`,
    )
  }
  if (features.timing === null) {
    caveats.push("Clocks missing; timing features absent and uncertainty widened.")
  }
  return caveats
}

const computeScore = (features: GameFeatures): number => {
  const cplSignal = 1 - clamp01(features.cpl.average / CALIBRATION_V1.cplSoftCap)
  const matchSignal =
    0.55 * features.match.top1Rate +
    0.2 * features.match.top3Rate +
    0.25 * cplSignal

  let timingBoost = 0
  if (features.timing) {
    timingBoost =
      CALIBRATION_V1.timingBoostMax *
      clamp01(
        features.timing.fastHighMatchStreakMax / CALIBRATION_V1.timingStreakCap,
      )
  }

  return clamp01(matchSignal + timingBoost)
}

const computeUncertainty = (
  score: number,
  usablePlies: number,
  timingPresent: boolean,
): SuspicionUncertainty => {
  let halfWidth: number
  if (usablePlies <= 0) {
    halfWidth = 0.5
  } else {
    const baseHw = CALIBRATION_V1.uncertaintyK / Math.sqrt(usablePlies)
    const extra = timingPresent ? 0 : CALIBRATION_V1.missingClockExtraHalfWidth
    halfWidth = Math.min(0.5, baseHw + extra)
  }

  return {
    low: Math.max(0, score - halfWidth),
    high: Math.min(1, score + halfWidth),
    halfWidth,
  }
}

const resolveBand = (
  score: number,
  halfWidth: number,
  usablePlies: number,
): SuspicionBand => {
  if (
    halfWidth > CALIBRATION_V1.inconclusiveHalfWidth ||
    usablePlies < CALIBRATION_V1.minUsablePlies
  ) {
    return "inconclusive"
  }
  if (score < CALIBRATION_V1.bandLowMax) return "low"
  if (score < CALIBRATION_V1.bandElevatedMax) return "elevated"
  return "high"
}

/**
 * Map deterministic game features to a calibrated suspicion score and band.
 * Never emits a cheater label.
 */
export const calibrateSuspicion = (
  features: GameFeatures,
): CalibratedSuspicion => {
  const score = computeScore(features)
  const uncertainty = computeUncertainty(
    score,
    features.match.usablePlies,
    features.timing !== null,
  )
  const band = resolveBand(
    score,
    uncertainty.halfWidth,
    features.match.usablePlies,
  )

  return {
    calibrationPolicyId: CALIBRATION_V1.policyId,
    enginePolicyId: ENGINE_POLICY_ID_V1,
    score,
    uncertainty,
    band,
    methodologyNote: METHODOLOGY_NOTE,
    falsePositiveWarning: FALSE_POSITIVE_WARNING,
    featuresUsed: FEATURES_USED,
    sampleSizeCaveats: buildCaveats(features),
    bookBoundary: features.book,
  }
}
