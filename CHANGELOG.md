# Changelog

All notable changes to `@axiomchess/analyzer` are documented in this file.

## [1.0.0] - 2026-11-06

### Added

- Stockfish UCI runner with policy `engine-v1` (MultiPV 3, depth 18/16)
- Feature extraction: match rates, CPL, timing (when clocks exist), opening-book boundary
- Calibration v1 freeze (`docs/calibration-v1.md`) and scoring with uncertainty bands
- `AnalysisResultV1` TypeScript types, JSON Schema, and round-trip helpers
- Structured metrics for engine search duration; acceptance suite A1-A5 report
- NOTICE for Stockfish GPL-3.0-or-later and NNUE CC0; download script (binary not committed)

### Notes

- First-party code: MIT. Band cut points frozen at 0.45 / 0.70 / half-width 0.20 / usable plies 20.
- Never emits a definitive cheater label.
