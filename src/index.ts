export {
  STOCKFISH_ENGINE_PIN,
  STOCKFISH_RELEASE_ASSETS,
  stockfishBinaryName,
  type StockfishEnginePin,
  type StockfishPlatform,
} from "./engine-pin.js"

export {
  ENGINE_POLICY_ID_V1,
  ENGINE_V1_POLICY,
  depthForTimeControl,
  type EnginePolicyId,
  type EngineTimeControlClass,
  type EngineV1Policy,
} from "./policy.js"

export {
  parseUciBestMoveLine,
  parseUciInfoLine,
  type UciBestMove,
  type UciInfoLine,
  type UciScore,
} from "./uci/parse.js"

export {
  defaultVendorStockfishPath,
  isStockfishBinaryAvailable,
  resolveStockfishBinaryPath,
} from "./uci/paths.js"

export {
  EngineCrashError,
  EngineTimeoutError,
  UciEngineRunner,
  type AnalyzePositionInput,
  type PositionEvalResult,
  type UciEngineRunnerOptions,
  type UciPvLine,
} from "./uci/runner.js"

export {
  OPENING_BOOK_V1,
  OPENING_BOOK_V1_LINES,
  OPENING_BOOK_V1_META,
  centipawnLoss,
  extractFeatures,
  findBookBoundary,
  getOpeningBook,
  isTop1Match,
  isTop3Match,
  matchRank,
  scoreToCp,
  type BookBoundary,
  type CplFeatures,
  type ExtractFeaturesOptions,
  type GameFeatures,
  type MatchFeatures,
  type MoveEvalInput,
  type MoveMultiPvLine,
  type OpeningBook,
  type OpeningBookMeta,
  type TimingFeatures,
} from "./features/index.js"

export {
  CALIBRATION_POLICY_ID_V1,
  CALIBRATION_V1,
  calibrateSuspicion,
  type CalibratedSuspicion,
  type CalibrationV1Constants,
  type SuspicionBand,
  type SuspicionUncertainty,
} from "./calibration/index.js"

export {
  ANALYSIS_RESULT_VERSION_V1,
  ANALYSIS_RESULT_V1_SCHEMA_PATH,
  buildAnalysisResultV1,
  deserializeAnalysisResultV1,
  isAnalysisResultV1,
  loadAnalysisResultV1Schema,
  parseAnalysisResultV1,
  resolveAnalysisResultV1SchemaPath,
  serializeAnalysisResultV1,
  type AnalysisEngineMetaV1,
  type AnalysisResultV1,
  type AnalysisResultV1JsonSchema,
  type AnalysisResultVersionV1,
  type AnalysisSuspicionV1,
  type BuildAnalysisResultV1Input,
  type ParseAnalysisResultError,
  type ParseAnalysisResultV1Result,
} from "./result/index.js"

export {
  createLogger,
  createMetricsRegistry,
  METRIC_NAMES,
  rootLogger,
  rootMetrics,
  type CreateLoggerOptions,
  type LogFields,
  type LogLevel,
  type MetricsRegistry,
  type MetricsSnapshot,
  type StructuredLogger,
} from "./observability/index.js"

export const ANALYZER_PACKAGE_NAME = "@axiomchess/analyzer" as const
export const ANALYZER_PACKAGE_VERSION = "0.1.0" as const
