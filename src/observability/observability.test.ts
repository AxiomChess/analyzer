import { describe, expect, it } from "vitest"

import { createLogger } from "./logger.js"
import { createMetricsRegistry, METRIC_NAMES } from "./metrics.js"

describe("analyzer structured logger", () => {
  it("includes requestId and strips PGN at info", () => {
    const lines: string[] = []
    const logger = createLogger({
      write: (line) => lines.push(line),
    })

    logger.info("engine_search_complete", {
      requestId: "an-1",
      pgnContentHash: "deadbeef",
      pgn: "1. e4 e5",
      durationMs: 42,
    })

    const record = JSON.parse(lines[0] ?? "{}") as Record<string, unknown>
    expect(record.service).toBe("axiomchess-analyzer")
    expect(record.requestId).toBe("an-1")
    expect(record.pgnContentHash).toBe("deadbeef")
    expect(record.pgn).toBeUndefined()
    expect(JSON.stringify(record)).not.toContain("1. e4 e5")
  })
})

describe("analyzer metrics", () => {
  it("records engine search duration", () => {
    const metrics = createMetricsRegistry()
    metrics.observeDurationMs(METRIC_NAMES.engineSearchDurationMs, 18)
    metrics.increment(METRIC_NAMES.engineSearchTotal)

    const snap = metrics.snapshot()
    expect(
      snap.counters.find((c) => c.name === METRIC_NAMES.engineSearchTotal)
        ?.value,
    ).toBe(1)
    expect(
      snap.durations.find((d) => d.name === METRIC_NAMES.engineSearchDurationMs)
        ?.lastMs,
    ).toBe(18)
  })
})
