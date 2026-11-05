import type { CALIBRATION_POLICY_ID_V1 } from "../calibration/constants.js"
import type {
  SuspicionBand,
  SuspicionUncertainty,
} from "../calibration/types.js"
import type { GameFeatures } from "../features/types.js"
import type { ENGINE_POLICY_ID_V1 } from "../policy.js"

/** Required version field for AnalysisResultV1 documents. */
export const ANALYSIS_RESULT_VERSION_V1 = "v1" as const

export type AnalysisResultVersionV1 = typeof ANALYSIS_RESULT_VERSION_V1

export type AnalysisEngineMetaV1 = {
  readonly policyId: typeof ENGINE_POLICY_ID_V1
  readonly multiPv: 3
  readonly depth: number
  readonly threads: number
  readonly hashMb: number
}

export type AnalysisSuspicionV1 = {
  readonly score: number
  readonly uncertainty: SuspicionUncertainty
  readonly band: SuspicionBand
}

/**
 * Stable machine JSON for API/web consumption (PROJECT_SPEC 7.6).
 * Never includes a cheater label.
 */
export type AnalysisResultV1 = {
  readonly version: AnalysisResultVersionV1
  /** ISO-8601 timestamp when analysis completed. */
  readonly analyzedAt: string
  readonly engine: AnalysisEngineMetaV1
  readonly calibrationPolicyId: typeof CALIBRATION_POLICY_ID_V1
  readonly features: GameFeatures
  readonly suspicion: AnalysisSuspicionV1
  readonly methodologyNote: string
  readonly falsePositiveWarning: string
  readonly featuresUsed: readonly string[]
  readonly sampleSizeCaveats: readonly string[]
}

export type BuildAnalysisResultV1Input = {
  readonly features: GameFeatures
  /** Search depth that was used for this game. */
  readonly depth: number
  readonly threads?: number
  readonly hashMb?: number
  /** Override wall-clock stamp; defaults to `new Date().toISOString()`. */
  readonly analyzedAt?: string
}

export type ParseAnalysisResultError = {
  readonly path: string
  readonly message: string
}
