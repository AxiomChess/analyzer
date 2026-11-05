import { describe, expect, it } from "vitest"

import { parseUciBestMoveLine, parseUciInfoLine } from "./parse.js"

describe("parseUciInfoLine", () => {
  it("parses MultiPV score cp and pv from official-shaped Stockfish info", () => {
    const info = parseUciInfoLine(
      "info depth 5 seldepth 5 multipv 2 score cp 12 nodes 933 nps 233250 hashfull 0 tbhits 0 time 4 pv b1c3 e7e5 e2e4 c7c6",
    )
    expect(info).toEqual({
      depth: 5,
      seldepth: 5,
      multiPv: 2,
      score: { type: "cp", value: 12 },
      nodes: 933,
      nps: 233250,
      hashfull: 0,
      timeMs: 4,
      pv: ["b1c3", "e7e5", "e2e4", "c7c6"],
    })
  })

  it("parses mate scores and bounds", () => {
    const info = parseUciInfoLine(
      "info depth 12 multipv 1 score mate 3 lowerbound nodes 100 time 10 pv e2e4",
    )
    expect(info?.score).toEqual({ type: "mate", value: 3 })
    expect(info?.bound).toBe("lowerbound")
    expect(info?.pv).toEqual(["e2e4"])
  })

  it("ignores info string lines; currmove lines stop before move tokens", () => {
    expect(parseUciInfoLine("info string Available processors: 1")).toBeNull()
    expect(
      parseUciInfoLine("info depth 3 currmove e2e4 currmovenumber 1"),
    ).toEqual({ depth: 3 })
  })
})

describe("parseUciBestMoveLine", () => {
  it("parses bestmove with optional ponder", () => {
    expect(parseUciBestMoveLine("bestmove e2e4 ponder e7e6")).toEqual({
      bestMove: "e2e4",
      ponderMove: "e7e6",
    })
    expect(parseUciBestMoveLine("bestmove d2d4")).toEqual({
      bestMove: "d2d4",
    })
    expect(parseUciBestMoveLine("readyok")).toBeNull()
  })
})
