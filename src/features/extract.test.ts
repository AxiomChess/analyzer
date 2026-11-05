import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import {
  OPENING_BOOK_V1,
  OPENING_BOOK_V1_META,
  centipawnLoss,
  extractFeatures,
  findBookBoundary,
  scoreToCp,
} from "./index.js"
import type { MoveEvalInput } from "./types.js"

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures/features",
)

type FixtureFile = {
  readonly id: string
  readonly moves: MoveEvalInput[]
  readonly expected: {
    readonly bookPlyCount: number
    readonly noveltyPly: number | null
    readonly usablePlies: number
    readonly top1Rate: number
    readonly top3Rate: number
    readonly cplAverage: number
    readonly timingPresent: boolean
  }
}

const loadFixture = (name: string): FixtureFile => {
  const raw = readFileSync(join(fixturesDir, name), "utf8")
  return JSON.parse(raw) as FixtureFile
}

describe("opening-book-v1", () => {
  it("records CC0 source pin before use", () => {
    expect(OPENING_BOOK_V1_META.id).toBe("opening-book-v1")
    expect(OPENING_BOOK_V1_META.licenseSpdx).toBe("CC0-1.0")
    expect(OPENING_BOOK_V1_META.source).toBe("lichess-org/chess-openings")
    expect(OPENING_BOOK_V1_META.sourceCommit).toBe(
      "3fd6ce992679e4d991a6bb4dade71f2b826c568a",
    )
    expect(OPENING_BOOK_V1.prefixes.has("e2e4 e7e5 g1f3 b8c6 f1b5")).toBe(true)
  })

  it("finds novelty ply after leaving a book prefix", () => {
    const boundary = findBookBoundary([
      "e2e4",
      "e7e5",
      "g1f3",
      "b8c6",
      "f1b5",
      "a7a6",
      "b5a4",
    ])
    expect(boundary.bookPlyCount).toBe(6)
    expect(boundary.noveltyPly).toBe(7)
  })
})

describe("score helpers", () => {
  it("converts mate scores to ordered cp-like values", () => {
    expect(scoreToCp({ type: "cp", value: 40 })).toBe(40)
    expect(scoreToCp({ type: "mate", value: 2 })).toBeGreaterThan(
      scoreToCp({ type: "mate", value: 5 }),
    )
    expect(scoreToCp({ type: "mate", value: -1 })).toBeLessThan(
      scoreToCp({ type: "cp", value: -500 }),
    )
  })

  it("computes CPL from MultiPV best vs played", () => {
    const loss = centipawnLoss({
      ply: 1,
      side: "white",
      playedUci: "a2a3",
      lines: [
        { multiPv: 1, moveUci: "e2e4", score: { type: "cp", value: 50 } },
        { multiPv: 2, moveUci: "a2a3", score: { type: "cp", value: 10 } },
      ],
    })
    expect(loss).toBe(40)
  })
})

describe("extractFeatures fixtures", () => {
  const cases = [
    "book-heavy.json",
    "amateur-blunders.json",
    "missing-clocks.json",
  ] as const

  for (const fileName of cases) {
    it(`is deterministic on ${fileName}`, () => {
      const fixture = loadFixture(fileName)
      const first = extractFeatures(fixture.moves)
      const second = extractFeatures(fixture.moves)
      expect(first).toEqual(second)
      expect(first.book.bookPlyCount).toBe(fixture.expected.bookPlyCount)
      expect(first.book.noveltyPly).toBe(fixture.expected.noveltyPly)
      expect(first.match.usablePlies).toBe(fixture.expected.usablePlies)
      expect(first.match.top1Rate).toBe(fixture.expected.top1Rate)
      expect(first.match.top3Rate).toBe(fixture.expected.top3Rate)
      expect(first.cpl.average).toBe(fixture.expected.cplAverage)
      if (fixture.expected.timingPresent) {
        expect(first.timing).not.toBeNull()
      } else {
        expect(first.timing).toBeNull()
      }
    })
  }

  it("excludes book plies from CPL values on book-heavy", () => {
    const fixture = loadFixture("book-heavy.json")
    const features = extractFeatures(fixture.moves)
    expect(features.cpl.values).toEqual([12, 0])
    expect(features.book.bookId).toBe("opening-book-v1")
  })

  it("tracks fast high-match streaks when clocks exist", () => {
    const moves: MoveEvalInput[] = [
      {
        ply: 1,
        side: "white",
        playedUci: "a2a3",
        lines: [
          { multiPv: 1, moveUci: "a2a3", score: { type: "cp", value: 5 } },
        ],
        clockBeforeSec: 100,
        clockAfterSec: 98,
      },
      {
        ply: 2,
        side: "black",
        playedUci: "a7a6",
        lines: [
          { multiPv: 1, moveUci: "a7a6", score: { type: "cp", value: 5 } },
        ],
        clockBeforeSec: 100,
        clockAfterSec: 99,
      },
      {
        ply: 3,
        side: "white",
        playedUci: "h2h3",
        lines: [
          { multiPv: 1, moveUci: "e2e4", score: { type: "cp", value: 40 } },
          { multiPv: 2, moveUci: "h2h3", score: { type: "cp", value: 0 } },
        ],
        clockBeforeSec: 98,
        clockAfterSec: 90,
      },
    ]
    const features = extractFeatures(moves, { fastMoveThresholdSec: 3 })
    expect(features.book.bookPlyCount).toBe(0)
    expect(features.timing?.fastHighMatchStreakMax).toBe(2)
    expect(features.timing?.meanMoveTimeSec).toBeCloseTo((2 + 1 + 8) / 3)
  })
})
