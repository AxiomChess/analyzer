import type { OpeningBookMeta } from "./types.js"

/**
 * Curated UCI lines from lichess-org/chess-openings (CC0-1.0).
 * License and pin recorded in docs/opening-book-v1.md before use.
 */
export const OPENING_BOOK_V1_META: OpeningBookMeta = {
  id: "opening-book-v1",
  version: "1",
  licenseSpdx: "CC0-1.0",
  source: "lichess-org/chess-openings",
  sourceCommit: "3fd6ce992679e4d991a6bb4dade71f2b826c568a",
  sourceUrl: "https://github.com/lichess-org/chess-openings",
}

/**
 * Full opening lines as space-separated UCI from the standard start position.
 * Prefixes are indexed at load time for boundary detection.
 */
export const OPENING_BOOK_V1_LINES: readonly string[] = [
  // King's Pawn / Open Games
  "e2e4 e7e5",
  "e2e4 e7e5 g1f3",
  "e2e4 e7e5 g1f3 b8c6",
  "e2e4 e7e5 g1f3 b8c6 f1b5",
  "e2e4 e7e5 g1f3 b8c6 f1b5 a7a6",
  "e2e4 e7e5 g1f3 b8c6 f1c4",
  "e2e4 e7e5 g1f3 b8c6 f1c4 g8f6",
  "e2e4 e7e5 g1f3 g8f6",
  "e2e4 e7e5 f2f4",
  // Sicilian
  "e2e4 c7c5",
  "e2e4 c7c5 g1f3",
  "e2e4 c7c5 g1f3 d7d6",
  "e2e4 c7c5 g1f3 d7d6 d2d4",
  "e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4",
  "e2e4 c7c5 g1f3 b8c6",
  "e2e4 c7c5 g1f3 e7e6",
  // French / Caro-Kann / Pirc
  "e2e4 e7e6",
  "e2e4 e7e6 d2d4 d7d5",
  "e2e4 c7c6",
  "e2e4 c7c6 d2d4 d7d5",
  "e2e4 d7d6",
  "e2e4 g8f6",
  // Scandinavian
  "e2e4 d7d5",
  "e2e4 d7d5 e4d5",
  "e2e4 d7d5 e4d5 d8d5",
  // Queen's Pawn
  "d2d4 d7d5",
  "d2d4 d7d5 c2c4",
  "d2d4 d7d5 c2c4 e7e6",
  "d2d4 d7d5 c2c4 c7c6",
  "d2d4 g8f6",
  "d2d4 g8f6 c2c4",
  "d2d4 g8f6 c2c4 e7e6",
  "d2d4 g8f6 c2c4 g7g6",
  "d2d4 f7f5",
  // English / Reti
  "c2c4",
  "c2c4 e7e5",
  "c2c4 g8f6",
  "g1f3",
  "g1f3 d7d5",
  "g1f3 g8f6",
]
