import { access } from "node:fs/promises"
import { constants } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { STOCKFISH_ENGINE_PIN, stockfishBinaryName } from "../engine-pin.js"

const packageRootFromHere = (): string =>
  join(dirname(fileURLToPath(import.meta.url)), "..", "..")

const hostBinaryName = (): string => {
  if (process.platform === "win32") {
    return stockfishBinaryName("windows-x86-64")
  }
  return stockfishBinaryName("linux-x86-64")
}

export const defaultVendorStockfishPath = (): string =>
  join(
    packageRootFromHere(),
    STOCKFISH_ENGINE_PIN.vendorDirName,
    hostBinaryName(),
  )

export const resolveStockfishBinaryPath = async (
  explicitPath?: string,
): Promise<string> => {
  const fromEnv = process.env.AXIOMCHESS_STOCKFISH_PATH?.trim()
  const candidate = explicitPath?.trim() || fromEnv || defaultVendorStockfishPath()

  try {
    await access(candidate, constants.X_OK)
  } catch {
    try {
      await access(candidate, constants.F_OK)
    } catch {
      throw new Error(
        `Stockfish binary not found at ${candidate}. Run pnpm engine:download or set AXIOMCHESS_STOCKFISH_PATH.`,
      )
    }
  }

  return candidate
}

export const isStockfishBinaryAvailable = async (
  explicitPath?: string,
): Promise<boolean> => {
  try {
    await resolveStockfishBinaryPath(explicitPath)
    return true
  } catch {
    return false
  }
}
