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

export const ANALYZER_PACKAGE_NAME = "@axiomchess/analyzer" as const
export const ANALYZER_PACKAGE_VERSION = "0.1.0" as const
