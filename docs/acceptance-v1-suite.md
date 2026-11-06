# AxiomChess analyzer acceptance suite v1

Language: English only. No emoji.

Generated: 2026-11-06T08:00:21.415Z
Policy: calibration-v1 / engine-v1
Thresholds (frozen; unchanged by this run): low < 0.45; elevated [0.45, 0.70); high >= 0.70; inconclusive if halfWidth > 0.20 or usablePlies < 20.
Live network: none (fixtures only).

## Gates A1-A5

| ID | Status | Measured |
| --- | --- | --- |
| A1 | PASS | score=0.375 band=inconclusive halfWidth=0.425 usablePlies=4 top1=0.5 |
| A2 | PASS | score=1 band=high halfWidth=0.15309310892394865 usablePlies=24 top1=1 |
| A3 | PASS | bookPlyCount=6 noveltyPly=7 usablePlies=2 band=inconclusive |
| A4 | PASS | missingHw=0.20309310892394866 clockedHw=0.15309310892394865 usablePlies=24 |
| A5 | PASS | scoreDelta=0 halfWidthDelta=0 epsilon=1e-9 |

Overall gates: PASS

## Cut points verified

- bandLowMax = 0.45
- bandElevatedMax = 0.7
- inconclusiveHalfWidth = 0.2
- minUsablePlies = 20

## Analyzer package checks (T28 operator run)

| Check | Status | Measured |
| --- | --- | --- |
| lint (eslint + tsc --noEmit) | PASS | 0 warnings |
| test (vitest) | PASS | 35/35 passed + 1 skip-gated engine timeout path covered when binary present |
| build (tsc) | PASS | 0 warnings |
| acceptance:v1 | PASS | A1-A5 all PASS; cut points unchanged |

## Companion package suites (same task)

- adapters: lint PASS (0 warnings); test 42/42 PASS; build PASS (0 warnings). Offline fixtures only. See `adapters/docs/acceptance-v1-suite.md`.
- api: lint PASS (0 warnings); test 34/34 PASS + 4 skip (no local DATABASE_URL); build PASS (0 warnings). Fixture adapters; no live Chess.com/Lichess. See `api/docs/acceptance-v1-suite.md`.

## Failures

None.
