# analyzer

Stockfish workers, feature extraction, calibrated scoring library, and analysis JSON schema for AxiomChess.

## Package

`@axiomchess/analyzer` is a TypeScript library/worker scaffold.

Exports:

- `STOCKFISH_ENGINE_PIN` -- pinned Stockfish 19 (`sf_19`) acquisition metadata
- `STOCKFISH_RELEASE_ASSETS` / `stockfishBinaryName` -- official release asset map
- `ENGINE_V1_POLICY` / `ENGINE_POLICY_ID_V1` -- MultiPV 3, depth 18 (standard) / 16 (bullet)
- `UciEngineRunner` -- Stockfish UCI process runner (timeouts + crash isolation)
- `parseUciInfoLine` / `parseUciBestMoveLine` -- UCI line parsers
- `extractFeatures` -- match rates, CPL, timing (if clocks), opening-book boundary
- `OPENING_BOOK_V1` / `findBookBoundary` -- CC0 book snapshot from lichess-org/chess-openings
- `ANALYZER_PACKAGE_NAME` / `ANALYZER_PACKAGE_VERSION`

Calibrated scoring arrives in later roadmap tasks (T14+).

Opening book license and exclusion rules: `docs/opening-book-v1.md`.

## Stockfish acquisition

- Pin: Stockfish 19, GitHub release tag `sf_19`
- License: GPL v3 (see `NOTICE` and upstream `Copying.txt`)
- Default NNUE: `nn-1a298aa575a0.nnue` (CC0; bundled in official release archives)
- Binary is **not** committed (archives are ~75+ MB). Download locally or in CI:

```sh
pnpm engine:download
```

This writes `vendor/stockfish/` (gitignored) with the host binary, `Copying.txt`, and `pin.json`. Source pointer for the exact pin: https://github.com/official-stockfish/Stockfish/tree/sf_19

Verified sources: https://stockfishchess.org/about/ , https://github.com/official-stockfish/Stockfish/releases/tag/sf_19 , https://github.com/official-stockfish/networks

## Scripts

```sh
pnpm install
pnpm engine:download
pnpm lint
pnpm test
pnpm build
```

Optional: set `AXIOMCHESS_STOCKFISH_PATH` to an absolute Stockfish binary path.

Without a binary, unit/parser tests still run; live UCI integration tests are skip-gated.
CI job `engine` downloads the pinned release and runs the full suite.

Requires Node.js 20+ and pnpm 10+.

## License

- First-party TypeScript: MIT (`LICENSE`)
- Stockfish engine when fetched: GPL v3 (`NOTICE`)
- Official Stockfish NNUE nets: CC0-1.0 (`NOTICE`)
- Opening book snapshot `opening-book-v1`: CC0-1.0 from lichess-org/chess-openings (`NOTICE`)
