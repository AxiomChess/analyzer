import { CALIBRATION_POLICY_ID_V1 } from "../calibration/constants.js"
import type { SuspicionBand } from "../calibration/types.js"
import type {
  BookBoundary,
  CplFeatures,
  GameFeatures,
  MatchFeatures,
  TimingFeatures,
} from "../features/types.js"
import { ENGINE_POLICY_ID_V1 } from "../policy.js"
import type {
  AnalysisEngineMetaV1,
  AnalysisResultV1,
  AnalysisSuspicionV1,
  ParseAnalysisResultError,
} from "./types.js"
import { ANALYSIS_RESULT_VERSION_V1 } from "./types.js"

const BANDS: readonly SuspicionBand[] = [
  "low",
  "elevated",
  "high",
  "inconclusive",
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value)

const isNonNegInt = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0

const isPosInt = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 1

const isUnitInterval = (value: unknown): value is number =>
  isFiniteNumber(value) && value >= 0 && value <= 1

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string")

const isNonEmptyStringArray = (value: unknown): value is string[] =>
  isStringArray(value) &&
  value.length > 0 &&
  value.every((item) => item.length > 0)

const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((item) => isFiniteNumber(item) && item >= 0)

const fail = (
  errors: ParseAnalysisResultError[],
  path: string,
  message: string,
): null => {
  errors.push({ path, message })
  return null
}

const parseBook = (
  value: unknown,
  errors: ParseAnalysisResultError[],
  path: string,
): BookBoundary | null => {
  if (!isRecord(value)) {
    return fail(errors, path, "must be an object")
  }
  if (typeof value.bookId !== "string" || value.bookId.length < 1) {
    fail(errors, `${path}.bookId`, "must be a non-empty string")
  }
  if (!isNonNegInt(value.bookPlyCount)) {
    fail(errors, `${path}.bookPlyCount`, "must be an integer >= 0")
  }
  const noveltyOk =
    value.noveltyPly === null || isPosInt(value.noveltyPly)
  if (!noveltyOk) {
    fail(errors, `${path}.noveltyPly`, "must be an integer >= 1 or null")
  }
  if (errors.some((e) => e.path.startsWith(path))) return null
  return {
    bookId: value.bookId as string,
    bookPlyCount: value.bookPlyCount as number,
    noveltyPly: value.noveltyPly as number | null,
  }
}

const parseMatch = (
  value: unknown,
  errors: ParseAnalysisResultError[],
  path: string,
): MatchFeatures | null => {
  if (!isRecord(value)) {
    return fail(errors, path, "must be an object")
  }
  const rates = [
    "top1Rate",
    "top3Rate",
    "top1RateWhite",
    "top1RateBlack",
    "top3RateWhite",
    "top3RateBlack",
  ] as const
  for (const key of rates) {
    if (!isUnitInterval(value[key])) {
      fail(errors, `${path}.${key}`, "must be a number in [0, 1]")
    }
  }
  for (const key of [
    "usablePlies",
    "usablePliesWhite",
    "usablePliesBlack",
  ] as const) {
    if (!isNonNegInt(value[key])) {
      fail(errors, `${path}.${key}`, "must be an integer >= 0")
    }
  }
  if (errors.some((e) => e.path.startsWith(path))) return null
  return {
    top1Rate: value.top1Rate as number,
    top3Rate: value.top3Rate as number,
    top1RateWhite: value.top1RateWhite as number,
    top1RateBlack: value.top1RateBlack as number,
    top3RateWhite: value.top3RateWhite as number,
    top3RateBlack: value.top3RateBlack as number,
    usablePlies: value.usablePlies as number,
    usablePliesWhite: value.usablePliesWhite as number,
    usablePliesBlack: value.usablePliesBlack as number,
  }
}

const parseCpl = (
  value: unknown,
  errors: ParseAnalysisResultError[],
  path: string,
): CplFeatures | null => {
  if (!isRecord(value)) {
    return fail(errors, path, "must be an object")
  }
  for (const key of [
    "average",
    "median",
    "p90",
    "averageWhite",
    "averageBlack",
  ] as const) {
    if (!isFiniteNumber(value[key]) || (value[key] as number) < 0) {
      fail(errors, `${path}.${key}`, "must be a number >= 0")
    }
  }
  if (!isNumberArray(value.values)) {
    fail(errors, `${path}.values`, "must be an array of numbers >= 0")
  }
  if (errors.some((e) => e.path.startsWith(path))) return null
  return {
    average: value.average as number,
    median: value.median as number,
    p90: value.p90 as number,
    averageWhite: value.averageWhite as number,
    averageBlack: value.averageBlack as number,
    values: value.values as number[],
  }
}

const parseTiming = (
  value: unknown,
  errors: ParseAnalysisResultError[],
  path: string,
): TimingFeatures | null => {
  if (value === null) return null
  if (!isRecord(value)) {
    fail(errors, path, "must be an object or null")
    return null
  }
  for (const key of [
    "meanMoveTimeSec",
    "medianMoveTimeSec",
    "fastMoveThresholdSec",
  ] as const) {
    if (!isFiniteNumber(value[key]) || (value[key] as number) < 0) {
      fail(errors, `${path}.${key}`, "must be a number >= 0")
    }
  }
  if (!isNonNegInt(value.fastHighMatchStreakMax)) {
    fail(
      errors,
      `${path}.fastHighMatchStreakMax`,
      "must be an integer >= 0",
    )
  }
  if (!isNumberArray(value.moveTimesSec)) {
    fail(errors, `${path}.moveTimesSec`, "must be an array of numbers >= 0")
  }
  if (errors.some((e) => e.path.startsWith(path))) return null
  return {
    meanMoveTimeSec: value.meanMoveTimeSec as number,
    medianMoveTimeSec: value.medianMoveTimeSec as number,
    fastHighMatchStreakMax: value.fastHighMatchStreakMax as number,
    fastMoveThresholdSec: value.fastMoveThresholdSec as number,
    moveTimesSec: value.moveTimesSec as number[],
  }
}

const parseFeatures = (
  value: unknown,
  errors: ParseAnalysisResultError[],
  path: string,
): GameFeatures | null => {
  if (!isRecord(value)) {
    return fail(errors, path, "must be an object")
  }
  const book = parseBook(value.book, errors, `${path}.book`)
  const match = parseMatch(value.match, errors, `${path}.match`)
  const cpl = parseCpl(value.cpl, errors, `${path}.cpl`)
  if (!("timing" in value)) {
    fail(errors, `${path}.timing`, "is required (object or null)")
  }
  const timing =
    value.timing === null
      ? null
      : parseTiming(value.timing, errors, `${path}.timing`)

  if (!book || !match || !cpl) return null
  if (value.timing !== null && timing === null) return null

  return { book, match, cpl, timing }
}

const parseEngine = (
  value: unknown,
  errors: ParseAnalysisResultError[],
  path: string,
): AnalysisEngineMetaV1 | null => {
  if (!isRecord(value)) {
    return fail(errors, path, "must be an object")
  }
  if (value.policyId !== ENGINE_POLICY_ID_V1) {
    fail(errors, `${path}.policyId`, `must be "${ENGINE_POLICY_ID_V1}"`)
  }
  if (value.multiPv !== 3) {
    fail(errors, `${path}.multiPv`, "must be 3")
  }
  if (!isPosInt(value.depth)) {
    fail(errors, `${path}.depth`, "must be an integer >= 1")
  }
  if (!isPosInt(value.threads)) {
    fail(errors, `${path}.threads`, "must be an integer >= 1")
  }
  if (!isPosInt(value.hashMb)) {
    fail(errors, `${path}.hashMb`, "must be an integer >= 1")
  }
  if (errors.some((e) => e.path.startsWith(path))) return null
  return {
    policyId: ENGINE_POLICY_ID_V1,
    multiPv: 3,
    depth: value.depth as number,
    threads: value.threads as number,
    hashMb: value.hashMb as number,
  }
}

const parseSuspicion = (
  value: unknown,
  errors: ParseAnalysisResultError[],
  path: string,
): AnalysisSuspicionV1 | null => {
  if (!isRecord(value)) {
    return fail(errors, path, "must be an object")
  }
  if (!isUnitInterval(value.score)) {
    fail(errors, `${path}.score`, "must be a number in [0, 1]")
  }
  if (!isRecord(value.uncertainty)) {
    fail(errors, `${path}.uncertainty`, "must be an object")
  } else {
    if (!isUnitInterval(value.uncertainty.low)) {
      fail(errors, `${path}.uncertainty.low`, "must be a number in [0, 1]")
    }
    if (!isUnitInterval(value.uncertainty.high)) {
      fail(errors, `${path}.uncertainty.high`, "must be a number in [0, 1]")
    }
    if (
      !isFiniteNumber(value.uncertainty.halfWidth) ||
      (value.uncertainty.halfWidth as number) < 0 ||
      (value.uncertainty.halfWidth as number) > 0.5
    ) {
      fail(
        errors,
        `${path}.uncertainty.halfWidth`,
        "must be a number in [0, 0.5]",
      )
    }
  }
  if (typeof value.band !== "string" || !BANDS.includes(value.band as SuspicionBand)) {
    fail(
      errors,
      `${path}.band`,
      'must be one of "low" | "elevated" | "high" | "inconclusive"',
    )
  }
  if (typeof value.band === "string" && value.band === "cheater") {
    fail(errors, `${path}.band`, "cheater label is not allowed")
  }
  if (errors.some((e) => e.path.startsWith(path))) return null
  const uncertainty = value.uncertainty as Record<string, unknown>
  return {
    score: value.score as number,
    uncertainty: {
      low: uncertainty.low as number,
      high: uncertainty.high as number,
      halfWidth: uncertainty.halfWidth as number,
    },
    band: value.band as SuspicionBand,
  }
}

export type ParseAnalysisResultV1Result =
  | { readonly ok: true; readonly value: AnalysisResultV1 }
  | {
      readonly ok: false
      readonly errors: readonly ParseAnalysisResultError[]
    }

/**
 * Validate and narrow unknown JSON into AnalysisResultV1.
 * Rejects any cheater band and requires version === "v1".
 */
export const parseAnalysisResultV1 = (
  input: unknown,
): ParseAnalysisResultV1Result => {
  const errors: ParseAnalysisResultError[] = []

  if (!isRecord(input)) {
    return { ok: false, errors: [{ path: "", message: "must be an object" }] }
  }

  if (input.version !== ANALYSIS_RESULT_VERSION_V1) {
    fail(errors, "version", `must be "${ANALYSIS_RESULT_VERSION_V1}"`)
  }
  if (typeof input.analyzedAt !== "string" || input.analyzedAt.length < 1) {
    fail(errors, "analyzedAt", "must be a non-empty string")
  }
  if (input.calibrationPolicyId !== CALIBRATION_POLICY_ID_V1) {
    fail(
      errors,
      "calibrationPolicyId",
      `must be "${CALIBRATION_POLICY_ID_V1}"`,
    )
  }
  if (typeof input.methodologyNote !== "string" || input.methodologyNote.length < 1) {
    fail(errors, "methodologyNote", "must be a non-empty string")
  }
  if (
    typeof input.falsePositiveWarning !== "string" ||
    input.falsePositiveWarning.length < 1
  ) {
    fail(errors, "falsePositiveWarning", "must be a non-empty string")
  }
  if (!isNonEmptyStringArray(input.featuresUsed)) {
    fail(errors, "featuresUsed", "must be a non-empty string array")
  }
  if (!isStringArray(input.sampleSizeCaveats)) {
    fail(errors, "sampleSizeCaveats", "must be a string array")
  }

  const engine = parseEngine(input.engine, errors, "engine")
  const features = parseFeatures(input.features, errors, "features")
  const suspicion = parseSuspicion(input.suspicion, errors, "suspicion")

  if (errors.length > 0 || !engine || !features || !suspicion) {
    return { ok: false, errors }
  }

  const value: AnalysisResultV1 = {
    version: ANALYSIS_RESULT_VERSION_V1,
    analyzedAt: input.analyzedAt as string,
    engine,
    calibrationPolicyId: CALIBRATION_POLICY_ID_V1,
    features,
    suspicion,
    methodologyNote: input.methodologyNote as string,
    falsePositiveWarning: input.falsePositiveWarning as string,
    featuresUsed: input.featuresUsed as string[],
    sampleSizeCaveats: input.sampleSizeCaveats as string[],
  }

  return { ok: true, value }
}

export const isAnalysisResultV1 = (input: unknown): input is AnalysisResultV1 =>
  parseAnalysisResultV1(input).ok

/**
 * JSON round-trip helper: stringify then parse through the validator.
 */
export const serializeAnalysisResultV1 = (result: AnalysisResultV1): string =>
  JSON.stringify(result)

export const deserializeAnalysisResultV1 = (
  json: string,
): ParseAnalysisResultV1Result => {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return {
      ok: false,
      errors: [{ path: "", message: "invalid JSON" }],
    }
  }
  return parseAnalysisResultV1(parsed)
}
