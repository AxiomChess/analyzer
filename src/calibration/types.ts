import type { GameFeatures } from "../features/types.js"
import type { CALIBRATION_POLICY_ID_V1 } from "./constants.js"

export type SuspicionBand = "low" | "elevated" | "high" | "inconclusive"

export type SuspicionUncertainty = {
  readonly low: number
  readonly high: number
  readonly halfWidth: number
}

export type CalibratedSuspicion = {
  readonly calibrationPolicyId: typeof CALIBRATION_POLICY_ID_V1
  readonly enginePolicyId: "engine-v1"
  /** Suspicion score in [0, 1]. */
  readonly score: number
  readonly uncertainty: SuspicionUncertainty
  readonly band: SuspicionBand
  readonly methodologyNote: string
  readonly falsePositiveWarning: string
  readonly featuresUsed: readonly string[]
  readonly sampleSizeCaveats: readonly string[]
  readonly bookBoundary: GameFeatures["book"]
}
