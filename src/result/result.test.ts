import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { extractFeatures } from "../features/index.js"
import type { MoveEvalInput } from "../features/types.js"
import {
  ANALYSIS_RESULT_VERSION_V1,
  ANALYSIS_RESULT_V1_SCHEMA_PATH,
  buildAnalysisResultV1,
  deserializeAnalysisResultV1,
  isAnalysisResultV1,
  loadAnalysisResultV1Schema,
  parseAnalysisResultV1,
  serializeAnalysisResultV1,
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

describe("AnalysisResultV1 schema file", () => {
  it("is published and requires version", () => {
    const schema = loadAnalysisResultV1Schema()
    expect(ANALYSIS_RESULT_V1_SCHEMA_PATH).toBe(
      "schemas/analysis-result-v1.json",
    )
    expect(schema.title).toBe("AnalysisResultV1")
    expect(schema.required).toContain("version")
    expect(schema.properties.version.const).toBe("v1")
    expect(schema.properties.suspicion.properties.band.enum).toEqual([
      "low",
      "elevated",
      "high",
      "inconclusive",
    ])
    expect(schema.properties.suspicion.properties.band.enum).not.toContain(
      "cheater",
    )
  })
})

describe("buildAnalysisResultV1 + round-trip", () => {
  it("requires version field and round-trips JSON", () => {
    const fixture = loadGate("a1-amateur-blunders.json")
    const features = extractFeatures(fixture.moves)
    const analyzedAt = "2026-11-05T12:00:00.000Z"
    const result = buildAnalysisResultV1({
      features,
      depth: 18,
      analyzedAt,
    })

    expect(result.version).toBe(ANALYSIS_RESULT_VERSION_V1)
    expect(result.version).toBe("v1")
    expect(result.analyzedAt).toBe(analyzedAt)
    expect(result.engine.policyId).toBe("engine-v1")
    expect(result.engine.multiPv).toBe(3)
    expect(result.engine.depth).toBe(18)
    expect(result.calibrationPolicyId).toBe("calibration-v1")
    expect(["low", "elevated", "high", "inconclusive"]).toContain(
      result.suspicion.band,
    )
    expect(result.suspicion.band).not.toBe("cheater")
    expect(JSON.stringify(result).toLowerCase()).not.toContain("cheater")
    expect(result.methodologyNote.length).toBeGreaterThan(0)
    expect(result.falsePositiveWarning.length).toBeGreaterThan(0)

    const json = serializeAnalysisResultV1(result)
    const roundTrip = deserializeAnalysisResultV1(json)
    expect(roundTrip.ok).toBe(true)
    if (!roundTrip.ok) return
    expect(roundTrip.value).toEqual(result)
    expect(isAnalysisResultV1(roundTrip.value)).toBe(true)
  })

  it("round-trips A2 engine-like fixture", () => {
    const fixture = loadGate("a2-engine-like.json")
    const features = extractFeatures(fixture.moves)
    const result = buildAnalysisResultV1({
      features,
      depth: 18,
      threads: 2,
      hashMb: 64,
      analyzedAt: "2026-11-05T12:00:01.000Z",
    })
    expect(result.engine.threads).toBe(2)
    expect(result.engine.hashMb).toBe(64)

    const parsed = parseAnalysisResultV1(JSON.parse(JSON.stringify(result)))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.value).toEqual(result)
  })

  it("rejects missing version", () => {
    const fixture = loadGate("a1-amateur-blunders.json")
    const features = extractFeatures(fixture.moves)
    const result = buildAnalysisResultV1({
      features,
      depth: 18,
      analyzedAt: "2026-11-05T12:00:00.000Z",
    })
    const { version: _version, ...withoutVersion } = result
    const parsed = parseAnalysisResultV1(withoutVersion)
    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.errors.some((e) => e.path === "version")).toBe(true)
  })

  it("rejects cheater band", () => {
    const fixture = loadGate("a1-amateur-blunders.json")
    const features = extractFeatures(fixture.moves)
    const result = buildAnalysisResultV1({
      features,
      depth: 18,
      analyzedAt: "2026-11-05T12:00:00.000Z",
    })
    const poisoned = {
      ...result,
      suspicion: { ...result.suspicion, band: "cheater" },
    }
    const parsed = parseAnalysisResultV1(poisoned)
    expect(parsed.ok).toBe(false)
  })

  it("rejects invalid JSON on deserialize", () => {
    const parsed = deserializeAnalysisResultV1("{not-json")
    expect(parsed.ok).toBe(false)
  })
})
