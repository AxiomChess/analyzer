# analyzer

Stockfish workers, feature extraction, calibrated scoring library, and analysis JSON schema for AxiomChess.

## Package

`@axiomchess/analyzer` is a TypeScript library/worker scaffold.

Bootstrap exports:

- `STOCKFISH_ENGINE_PIN` -- pinned Stockfish 19 (`sf_19`) acquisition metadata
- `STOCKFISH_RELEASE_ASSETS` / `stockfishBinaryName` -- official release asset map
- `ANALYZER_PACKAGE_NAME` / `ANALYZER_PACKAGE_VERSION`

UCI runner, features, and scoring arrive in later roadmap tasks (T12+).

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
pnpm lint
pnpm test
pnpm build
pnpm engine:download
```

Requires Node.js 20+ and pnpm 10+.

## License

- First-party TypeScript: MIT (`LICENSE`)
- Stockfish engine when fetched: GPL v3 (`NOTICE`)
- Official Stockfish NNUE nets: CC0-1.0 (`NOTICE`)
