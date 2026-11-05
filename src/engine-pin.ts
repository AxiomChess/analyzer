/**
 * Pinned Stockfish acquisition metadata for AxiomChess analyzer.
 *
 * Verified against official sources (2026-11-05 / integrate-time pin):
 * - Engine license GPL v3: https://stockfishchess.org/about/
 * - Source + Copying.txt: https://github.com/official-stockfish/Stockfish
 * - Release tag sf_19 (Stockfish 19): https://github.com/official-stockfish/Stockfish/releases/tag/sf_19
 * - Default NNUE EvalFileDefaultName in sf_19 src/evaluate.h: nn-1a298aa575a0.nnue
 * - NNUE nets SPDX CC0-1.0: https://github.com/official-stockfish/networks
 *
 * Binary is not committed. Fetch with: pnpm engine:download
 */

export type StockfishPlatform =
  | "linux-x86-64"
  | "linux-arm64"
  | "macos-universal"
  | "windows-x86-64"
  | "windows-arm64"

export type StockfishEnginePin = {
  readonly name: "Stockfish"
  readonly version: "19"
  readonly releaseTag: "sf_19"
  readonly licenseSpdx: "GPL-3.0-or-later"
  readonly sourceUrl: string
  readonly copyingUrl: string
  readonly downloadBaseUrl: string
  readonly defaultNnueFile: string
  readonly nnueLicenseSpdx: "CC0-1.0"
  readonly nnueSourceUrl: string
  readonly vendorDirName: "vendor/stockfish"
}

export const STOCKFISH_ENGINE_PIN: StockfishEnginePin = {
  name: "Stockfish",
  version: "19",
  releaseTag: "sf_19",
  licenseSpdx: "GPL-3.0-or-later",
  sourceUrl: "https://github.com/official-stockfish/Stockfish/tree/sf_19",
  copyingUrl:
    "https://raw.githubusercontent.com/official-stockfish/Stockfish/sf_19/Copying.txt",
  downloadBaseUrl:
    "https://github.com/official-stockfish/Stockfish/releases/download/sf_19",
  defaultNnueFile: "nn-1a298aa575a0.nnue",
  nnueLicenseSpdx: "CC0-1.0",
  nnueSourceUrl: "https://github.com/official-stockfish/networks",
  vendorDirName: "vendor/stockfish",
}

export const STOCKFISH_RELEASE_ASSETS: Readonly<
  Record<StockfishPlatform, string>
> = {
  "linux-x86-64": "stockfish-linux-x86-64-universal.tar.gz",
  "linux-arm64": "stockfish-linux-arm64-universal.tar.gz",
  "macos-universal": "stockfish-macos-universal.tar.gz",
  "windows-x86-64": "stockfish-windows-x86-64-universal.zip",
  "windows-arm64": "stockfish-windows-arm64-universal.zip",
}

export const stockfishBinaryName = (platform: StockfishPlatform): string => {
  if (platform.startsWith("windows")) {
    return "stockfish.exe"
  }
  return "stockfish"
}
