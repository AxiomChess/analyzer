/** Frozen anchors for policy calibration-v1. Keep in sync with docs/calibration-v1.md. */

export const CALIBRATION_POLICY_ID_V1 = "calibration-v1" as const

export const CALIBRATION_V1 = {
  policyId: CALIBRATION_POLICY_ID_V1,
  priorTop1: 0.42,
  priorTop3: 0.68,
  cplSoftCap: 200,
  timingStreakCap: 12,
  timingBoostMax: 0.12,
  uncertaintyK: 0.75,
  missingClockExtraHalfWidth: 0.05,
  bandLowMax: 0.45,
  bandElevatedMax: 0.70,
  inconclusiveHalfWidth: 0.20,
  minUsablePlies: 20,
} as const

export type CalibrationV1Constants = typeof CALIBRATION_V1
