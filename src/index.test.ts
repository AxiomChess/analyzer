import { describe, expect, it } from "vitest"

import {
  ANALYZER_PACKAGE_NAME,
  ANALYZER_PACKAGE_VERSION,
  STOCKFISH_ENGINE_PIN,
  STOCKFISH_RELEASE_ASSETS,
  stockfishBinaryName,
} from "./index.js"

describe("@axiomchess/analyzer bootstrap", () => {
  it("exports package identity", () => {
    expect(ANALYZER_PACKAGE_NAME).toBe("@axiomchess/analyzer")
    expect(ANALYZER_PACKAGE_VERSION).toBe("0.1.0")
  })

  it("pins Stockfish 19 from official release tag sf_19", () => {
    expect(STOCKFISH_ENGINE_PIN.name).toBe("Stockfish")
    expect(STOCKFISH_ENGINE_PIN.version).toBe("19")
    expect(STOCKFISH_ENGINE_PIN.releaseTag).toBe("sf_19")
    expect(STOCKFISH_ENGINE_PIN.licenseSpdx).toBe("GPL-3.0-or-later")
    expect(STOCKFISH_ENGINE_PIN.sourceUrl).toContain(
      "official-stockfish/Stockfish/tree/sf_19",
    )
    expect(STOCKFISH_ENGINE_PIN.copyingUrl).toContain("Copying.txt")
    expect(STOCKFISH_ENGINE_PIN.downloadBaseUrl).toContain(
      "releases/download/sf_19",
    )
    expect(STOCKFISH_ENGINE_PIN.defaultNnueFile).toBe("nn-1a298aa575a0.nnue")
    expect(STOCKFISH_ENGINE_PIN.nnueLicenseSpdx).toBe("CC0-1.0")
    expect(STOCKFISH_ENGINE_PIN.nnueSourceUrl).toContain(
      "official-stockfish/networks",
    )
    expect(STOCKFISH_ENGINE_PIN.vendorDirName).toBe("vendor/stockfish")
  })

  it("maps release assets and binary names without inventing hosts", () => {
    expect(STOCKFISH_RELEASE_ASSETS["linux-x86-64"]).toBe(
      "stockfish-linux-x86-64-universal.tar.gz",
    )
    expect(STOCKFISH_RELEASE_ASSETS["windows-x86-64"]).toBe(
      "stockfish-windows-x86-64-universal.zip",
    )
    expect(stockfishBinaryName("linux-x86-64")).toBe("stockfish")
    expect(stockfishBinaryName("windows-x86-64")).toBe("stockfish.exe")
  })
})
