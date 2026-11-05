# Calibration v1 (frozen)

Language: English only. No emoji.

Policy id: `calibration-v1`
Paired engine policy: `engine-v1` (MultiPV 3, depth 18 standard / 16 bullet)

This document freezes priors, features, and band cut points **before** the
evaluative fixture suite for roadmap T14. Do not change cut points to make
fixtures pass. If priors prove wrong later, cut `calibration-v2`.

## Status of priors

These are **planning priors** for policy `calibration-v1`, chosen so scoring is
deterministic and reviewable. They are **not** fitted post-hoc on the A1-A5
acceptance fixtures, and they are **not** claimed as empirical population
estimates from a labeled cheat corpus. Changing them requires a new policy id.

## Features used

From `GameFeatures` (book plies already excluded by feature extraction):

| Feature | Role |
| --- | --- |
| `match.top1Rate` | Primary engine-likeness signal |
| `match.top3Rate` | Secondary match signal |
| `cpl.average` | Low average CPL raises suspicion |
| `match.usablePlies` | Sample size for uncertainty and inconclusive gate |
| `timing.fastHighMatchStreakMax` | Optional boost when clocks exist |
| `timing` null vs present | Widens uncertainty when clocks are missing |

## Planning prior anchors

Used only to shape continuous transforms (documented for reproducibility):

| Anchor | Value | Meaning in formula |
| --- | --- | --- |
| `PRIOR_TOP1` | 0.42 | Reference top-1 rate for the CPL/match blend scale |
| `PRIOR_TOP3` | 0.68 | Reference top-3 rate for the blend scale |
| `CPL_SOFT_CAP` | 200 | Average CPL at or above this maps to zero CPL signal |
| `TIMING_STREAK_CAP` | 12 | Streak length that saturates the timing boost |
| `TIMING_BOOST_MAX` | 0.12 | Maximum additive timing contribution |
| `UNCERTAINTY_K` | 0.75 | Half-width scale: `K / sqrt(usablePlies)` |
| `MISSING_CLOCK_EXTRA_HW` | 0.05 | Added to half-width when timing is absent |

## Score formula (deterministic)

All arithmetic is IEEE-754 float64. Clamp `x` to `[0, 1]` as `max(0, min(1, x))`.

1. `cplSignal = 1 - clamp(cpl.average / CPL_SOFT_CAP, 0, 1)`
2. `matchSignal = 0.55 * match.top1Rate + 0.20 * match.top3Rate + 0.25 * cplSignal`
3. If `timing` is present:
   `timingBoost = TIMING_BOOST_MAX * clamp(timing.fastHighMatchStreakMax / TIMING_STREAK_CAP, 0, 1)`
   Else `timingBoost = 0`
4. `score S = clamp(matchSignal + timingBoost, 0, 1)`

`PRIOR_TOP1` / `PRIOR_TOP3` are recorded as design anchors for this policy version;
the v1 blend uses raw rates directly so the score stays monotone in match rates.

## Uncertainty

1. If `usablePlies <= 0`: `halfWidth = 0.5`, interval `[0, 1]`
2. Else:
   - `baseHw = UNCERTAINTY_K / sqrt(usablePlies)`
   - `halfWidth = min(0.5, baseHw + (timing ? 0 : MISSING_CLOCK_EXTRA_HW))`
3. Equal-tailed interval: `low = max(0, S - halfWidth)`, `high = min(1, S + halfWidth)`

## Band cut points (frozen from PROJECT_SPEC.md)

Let `S` be the score in `[0, 1]` and `H` the uncertainty half-width.

1. If `H > 0.20` OR `usablePlies < 20` => band `inconclusive`
2. Else if `S < 0.45` => band `low`
3. Else if `S < 0.70` => band `elevated`
4. Else => band `high`

Bands are only: `low`, `elevated`, `high`, `inconclusive`.
Never emit a `cheater` label.

## Mandatory notes (every result)

- Methodology note naming `calibration-v1` and `engine-v1`
- False-positive warning (education-first; not a tribunal)
- Sample-size caveats when `usablePlies < 20`, book boundary present, or timing absent

## Fixture gates (PROJECT_SPEC.md)

| ID | Expectation |
| --- | --- |
| A1 | Amateur blunders: band `low` or `inconclusive` |
| A2 | Engine-like sample: `S >= 0.45` with usable sample; no `cheater` label |
| A3 | Book-heavy: book plies excluded; book boundary reported |
| A4 | Missing clocks: timing null; half-width wider than clocked peer of similar length |
| A5 | Idempotence: same features => same score within 1e-9 |

Numeric gates must not be edited after the first suite run under this policy id.
