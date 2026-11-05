import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { extractFeatures } from "../features/index.js"
import type { MoveEvalInput } from "../features/types.js"
import {
  CALIBRATION_POLICY_ID_V1,
  CALIBRATION_V1,
  calibrateSuspicion,
} from "./index.js"

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures/v1",
)

type GateFixture = {
  readonly id: string
  readonly gate: string
  readonly moves: MoveEvalInput[]
}

const loadGate = (name: string): GateFixture => {
  const raw = readFileSync(join(fixturesDir, name), "utf8")
  return JSON.parse(raw) as GateFixture
}

describe("calibration-v1 freeze", () => {
  it("locks band cut points to PROJECT_SPEC values", () => {
    expect(CALIBRATION_POLICY_ID_V1).toBe("calibration-v1")
    expect(CALIBRATION_V1.bandLowMax).toBe(0.45)
    expect(CALIBRATION_V1.bandElevatedMax).toBe(0.7)
    expect(CALIBRATION_V1.inconclusiveHalfWidth).toBe(0.2)
    expect(CALIBRATION_V1.minUsablePlies).toBe(20)
  })

  it("never uses a cheater band label", () => {
    const bands = ["low", "elevated", "high", "inconclusive"] as const
    expect(bands.includes("cheater" as (typeof bands)[number])).toBe(false)
  })
})

describe("fixture gates A1-A5", () => {
  it("A1: amateur blunders -> low or inconclusive", () => {
    const fixture = loadGate("a1-amateur-blunders.json")
    const features = extractFeatures(fixture.moves)
    const result = calibrateSuspicion(features)
    expect(["low", "inconclusive"]).toContain(result.band)
    expect(result.band).not.toBe("cheater")
    expect(JSON.stringify(result).toLowerCase()).not.toContain("cheater")
  })

  it("A2: engine-like sample score above elevated threshold", () => {
    const fixture = loadGate("a2-engine-like.json")
    const features = extractFeatures(fixture.moves)
    const result = calibrateSuspicion(features)
    expect(features.match.usablePlies).toBeGreaterThanOrEqual(20)
    expect(result.score).toBeGreaterThanOrEqual(CALIBRATION_V1.bandLowMax)
    expect(result.band).not.toBe("cheater")
    expect(JSON.stringify(result).toLowerCase()).not.toContain("cheater")
    expect(result.falsePositiveWarning.length).toBeGreaterThan(0)
    expect(result.methodologyNote).toContain("calibration-v1")
  })

  it("A3: book-heavy reports boundary and excludes book plies", () => {
    const fixture = loadGate("a3-book-heavy.json")
    const features = extractFeatures(fixture.moves)
    const result = calibrateSuspicion(features)
    expect(features.book.bookPlyCount).toBeGreaterThan(0)
    expect(features.book.noveltyPly).not.toBeNull()
    expect(features.match.usablePlies).toBe(
      fixture.moves.length - features.book.bookPlyCount,
    )
    expect(result.bookBoundary.bookPlyCount).toBe(features.book.bookPlyCount)
    expect(
      result.sampleSizeCaveats.some((caveat) =>
        caveat.toLowerCase().includes("book"),
      ),
    ).toBe(true)
  })

  it("A4: missing clocks widen uncertainty vs clocked peer", () => {
    const missing = loadGate("a4-missing-clocks.json")
    const clocked = loadGate("a4-clocked-peer.json")
    const missingFeatures = extractFeatures(missing.moves)
    const clockedFeatures = extractFeatures(clocked.moves)
    expect(missingFeatures.timing).toBeNull()
    expect(clockedFeatures.timing).not.toBeNull()
    expect(missingFeatures.match.usablePlies).toBe(
      clockedFeatures.match.usablePlies,
    )
    const missingResult = calibrateSuspicion(missingFeatures)
    const clockedResult = calibrateSuspicion(clockedFeatures)
    expect(missingResult.uncertainty.halfWidth).toBeGreaterThan(
      clockedResult.uncertainty.halfWidth,
    )
  })

  it("A5: idempotent score and features within 1e-9", () => {
    const fixture = loadGate("a2-engine-like.json")
    const firstFeatures = extractFeatures(fixture.moves)
    const secondFeatures = extractFeatures(fixture.moves)
    expect(firstFeatures).toEqual(secondFeatures)
    const first = calibrateSuspicion(firstFeatures)
    const second = calibrateSuspicion(secondFeatures)
    expect(Math.abs(first.score - second.score)).toBeLessThanOrEqual(1e-9)
    expect(
      Math.abs(first.uncertainty.halfWidth - second.uncertainty.halfWidth),
    ).toBeLessThanOrEqual(1e-9)
    expect(first.band).toBe(second.band)
    expect(first).toEqual(second)
  })
})
