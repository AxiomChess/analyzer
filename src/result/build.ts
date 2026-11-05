import { calibrateSuspicion } from "../calibration/calibrate.js"
import { ENGINE_V1_POLICY } from "../policy.js"
import type {
  AnalysisResultV1,
  BuildAnalysisResultV1Input,
} from "./types.js"
import { ANALYSIS_RESULT_VERSION_V1 } from "./types.js"

/**
 * Build a versioned AnalysisResultV1 from extracted features and engine meta.
 */
export const buildAnalysisResultV1 = (
  input: BuildAnalysisResultV1Input,
): AnalysisResultV1 => {
  if (!Number.isInteger(input.depth) || input.depth < 1) {
    throw new Error("buildAnalysisResultV1: depth must be an integer >= 1")
  }

  const threads = input.threads ?? ENGINE_V1_POLICY.threads
  const hashMb = input.hashMb ?? ENGINE_V1_POLICY.hashMb

  if (!Number.isInteger(threads) || threads < 1) {
    throw new Error("buildAnalysisResultV1: threads must be an integer >= 1")
  }
  if (!Number.isInteger(hashMb) || hashMb < 1) {
    throw new Error("buildAnalysisResultV1: hashMb must be an integer >= 1")
  }

  const calibrated = calibrateSuspicion(input.features)

  return {
    version: ANALYSIS_RESULT_VERSION_V1,
    analyzedAt: input.analyzedAt ?? new Date().toISOString(),
    engine: {
      policyId: ENGINE_V1_POLICY.id,
      multiPv: ENGINE_V1_POLICY.multiPv,
      depth: input.depth,
      threads,
      hashMb,
    },
    calibrationPolicyId: calibrated.calibrationPolicyId,
    features: input.features,
    suspicion: {
      score: calibrated.score,
      uncertainty: calibrated.uncertainty,
      band: calibrated.band,
    },
    methodologyNote: calibrated.methodologyNote,
    falsePositiveWarning: calibrated.falsePositiveWarning,
    featuresUsed: calibrated.featuresUsed,
    sampleSizeCaveats: calibrated.sampleSizeCaveats,
  }
}
