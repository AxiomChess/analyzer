/**
 * Offline A1-A5 acceptance runner for policy calibration-v1 / engine-v1.
 * Writes docs/acceptance-v1-suite.md with measured values. Does not change thresholds.
 */
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const fixturesDir = join(root, "fixtures", "v1")
const reportPath = join(root, "docs", "acceptance-v1-suite.md")

const { extractFeatures, calibrateSuspicion, CALIBRATION_V1 } = await import(
  "../dist/index.js"
)

const loadGate = (name) =>
  JSON.parse(readFileSync(join(fixturesDir, name), "utf8"))

const EPSILON = 1e-9
const failures = []
const assert = (ok, message) => {
  if (!ok) failures.push(message)
}

const a1Moves = loadGate("a1-amateur-blunders.json").moves
const a1Features = extractFeatures(a1Moves)
const a1 = calibrateSuspicion(a1Features)
assert(
  a1.band === "low" || a1.band === "inconclusive",
  `A1 band expected low|inconclusive, got ${a1.band}`,
)
assert(!JSON.stringify(a1).toLowerCase().includes("cheater"), "A1 must not say cheater")

const a2Moves = loadGate("a2-engine-like.json").moves
const a2Features = extractFeatures(a2Moves)
const a2 = calibrateSuspicion(a2Features)
assert(
  a2Features.match.usablePlies >= 20,
  `A2 usablePlies expected >=20, got ${a2Features.match.usablePlies}`,
)
assert(
  a2.score >= CALIBRATION_V1.bandLowMax,
  `A2 score expected >= ${CALIBRATION_V1.bandLowMax}, got ${a2.score}`,
)
assert(!JSON.stringify(a2).toLowerCase().includes("cheater"), "A2 must not say cheater")

const a3Moves = loadGate("a3-book-heavy.json").moves
const a3Features = extractFeatures(a3Moves)
const a3 = calibrateSuspicion(a3Features)
assert(a3Features.book.bookPlyCount > 0, "A3 bookPlyCount expected >0")
assert(a3Features.book.noveltyPly !== null, "A3 noveltyPly expected")
assert(
  a3Features.match.usablePlies === a3Moves.length - a3Features.book.bookPlyCount,
  "A3 usable plies must exclude book",
)
assert(
  a3.sampleSizeCaveats.some((c) => c.toLowerCase().includes("book")),
  "A3 caveats must mention book",
)

const a4Missing = extractFeatures(loadGate("a4-missing-clocks.json").moves)
const a4Clocked = extractFeatures(loadGate("a4-clocked-peer.json").moves)
const a4MissingResult = calibrateSuspicion(a4Missing)
const a4ClockedResult = calibrateSuspicion(a4Clocked)
assert(a4Missing.timing === null, "A4 missing timing expected null")
assert(a4Clocked.timing !== null, "A4 clocked timing expected present")
assert(
  a4Missing.match.usablePlies === a4Clocked.match.usablePlies,
  "A4 peers must share usablePlies",
)
assert(
  a4MissingResult.uncertainty.halfWidth > a4ClockedResult.uncertainty.halfWidth,
  "A4 missing clocks must widen halfWidth",
)

const a5FirstFeatures = extractFeatures(a2Moves)
const a5SecondFeatures = extractFeatures(a2Moves)
const a5First = calibrateSuspicion(a5FirstFeatures)
const a5Second = calibrateSuspicion(a5SecondFeatures)
const a5ScoreDelta = Math.abs(a5First.score - a5Second.score)
const a5HwDelta = Math.abs(
  a5First.uncertainty.halfWidth - a5Second.uncertainty.halfWidth,
)
assert(
  JSON.stringify(a5FirstFeatures) === JSON.stringify(a5SecondFeatures),
  "A5 features must be identical",
)
assert(a5ScoreDelta <= EPSILON, `A5 score delta ${a5ScoreDelta} exceeds 1e-9`)
assert(a5HwDelta <= EPSILON, `A5 halfWidth delta ${a5HwDelta} exceeds 1e-9`)
assert(a5First.band === a5Second.band, "A5 bands must match")

assert(CALIBRATION_V1.bandLowMax === 0.45, "cut point lowMax drifted")
assert(CALIBRATION_V1.bandElevatedMax === 0.7, "cut point elevatedMax drifted")
assert(CALIBRATION_V1.inconclusiveHalfWidth === 0.2, "cut point halfWidth drifted")
assert(CALIBRATION_V1.minUsablePlies === 20, "cut point minUsablePlies drifted")

const runAt = new Date().toISOString()
const gateRows = [
  {
    id: "A1",
    status: a1.band === "low" || a1.band === "inconclusive" ? "PASS" : "FAIL",
    detail: `score=${a1.score} band=${a1.band} halfWidth=${a1.uncertainty.halfWidth} usablePlies=${a1Features.match.usablePlies} top1=${a1Features.match.top1Rate}`,
  },
  {
    id: "A2",
    status:
      a2.score >= CALIBRATION_V1.bandLowMax && a2Features.match.usablePlies >= 20
        ? "PASS"
        : "FAIL",
    detail: `score=${a2.score} band=${a2.band} halfWidth=${a2.uncertainty.halfWidth} usablePlies=${a2Features.match.usablePlies} top1=${a2Features.match.top1Rate}`,
  },
  {
    id: "A3",
    status: a3Features.book.bookPlyCount > 0 ? "PASS" : "FAIL",
    detail: `bookPlyCount=${a3Features.book.bookPlyCount} noveltyPly=${a3Features.book.noveltyPly} usablePlies=${a3Features.match.usablePlies} band=${a3.band}`,
  },
  {
    id: "A4",
    status:
      a4MissingResult.uncertainty.halfWidth > a4ClockedResult.uncertainty.halfWidth
        ? "PASS"
        : "FAIL",
    detail: `missingHw=${a4MissingResult.uncertainty.halfWidth} clockedHw=${a4ClockedResult.uncertainty.halfWidth} usablePlies=${a4Missing.match.usablePlies}`,
  },
  {
    id: "A5",
    status: a5ScoreDelta <= EPSILON && a5HwDelta <= EPSILON ? "PASS" : "FAIL",
    detail: `scoreDelta=${a5ScoreDelta} halfWidthDelta=${a5HwDelta} epsilon=1e-9`,
  },
]

const allPass = failures.length === 0 && gateRows.every((row) => row.status === "PASS")

const report = `# AxiomChess analyzer acceptance suite v1

Language: English only. No emoji.

Generated: ${runAt}
Policy: calibration-v1 / engine-v1
Thresholds (frozen; unchanged by this run): low < 0.45; elevated [0.45, 0.70); high >= 0.70; inconclusive if halfWidth > 0.20 or usablePlies < 20.
Live network: none (fixtures only).

## Gates A1-A5

| ID | Status | Measured |
| --- | --- | --- |
${gateRows.map((row) => `| ${row.id} | ${row.status} | ${row.detail} |`).join("\n")}

Overall gates: ${allPass ? "PASS" : "FAIL"}

## Cut points verified

- bandLowMax = ${CALIBRATION_V1.bandLowMax}
- bandElevatedMax = ${CALIBRATION_V1.bandElevatedMax}
- inconclusiveHalfWidth = ${CALIBRATION_V1.inconclusiveHalfWidth}
- minUsablePlies = ${CALIBRATION_V1.minUsablePlies}

## Analyzer package checks

Recorded by the operator after lint/test/build (this script only evaluates A1-A5).

## Companion package suites

- adapters: see `adapters/docs/acceptance-v1-suite.md` (offline fixtures only)
- api: see `api/docs/acceptance-v1-suite.md` (fixture adapters; no live Chess.com/Lichess)

## Failures

${failures.length === 0 ? "None." : failures.map((f) => `- ${f}`).join("\n")}
`

writeFileSync(reportPath, report, "utf8")
process.stdout.write(report)

if (!allPass) {
  process.stderr.write(`\nacceptance-v1 FAILED (${failures.length} assertion(s))\n`)
  process.exit(1)
}

process.stdout.write("\nacceptance-v1 PASS\n")
