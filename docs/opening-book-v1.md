# Opening book v1 (book exclusion)

Language: English only. No emoji.

This document records the opening-book source and license **before** the
snapshot is used for feature extraction (roadmap T13).

## Purpose

Feature extraction excludes book plies from match-rate and CPL aggregates.
The book boundary is the first ply whose UCI path from the start position is
not a prefix of any line in the pinned snapshot.

## Source

| Field | Value |
| --- | --- |
| Dataset | lichess-org/chess-openings |
| Upstream URL | https://github.com/lichess-org/chess-openings |
| Upstream license | CC0 1.0 Universal (SPDX: `CC0-1.0`) |
| Upstream COPYING | https://github.com/lichess-org/chess-openings/blob/master/COPYING.txt |
| Pinned commit | `3fd6ce992679e4d991a6bb4dade71f2b826c568a` (2026-11-03) |
| Book id | `opening-book-v1` |

Verified: GitHub lists the repository license as Creative Commons Zero v1.0
Universal; README states the curated opening-name dataset is released under
CC0. That permits commercial use and redistribution.

## Snapshot policy

`opening-book-v1` is a **curated subset** of well-known opening UCI move
sequences taken from that dataset (not the full TSV dump). Lines are stored
as space-separated UCI moves from the standard start position. All proper
prefixes of each line are treated as in-book.

Changing lines or cut behavior requires a new book id (`opening-book-v2`, ...).
Do not silently expand the snapshot to force fixture outcomes.

## Exclusion rules

1. Walk played UCI moves from ply 1.
2. While the path `move_1 ... move_k` is an indexed book prefix, ply `k` is
   in book.
3. The first ply that leaves the book is the novelty ply (1-based).
4. Match rates and CPL averages count only non-book plies.
5. If clocks are missing, timing features are absent (`null`); book and match
   / CPL still compute.

## SPDX

- Opening book snapshot data: `CC0-1.0` (upstream dedication).
- First-party TypeScript that loads the snapshot: MIT (repository LICENSE).
