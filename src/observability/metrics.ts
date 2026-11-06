export type CounterSnapshot = {
  readonly name: string
  readonly value: number
}

export type GaugeSnapshot = {
  readonly name: string
  readonly value: number
}

export type DurationSnapshot = {
  readonly name: string
  readonly count: number
  readonly sumMs: number
  readonly lastMs: number | null
}

export type MetricsSnapshot = {
  readonly counters: readonly CounterSnapshot[]
  readonly gauges: readonly GaugeSnapshot[]
  readonly durations: readonly DurationSnapshot[]
}

type DurationState = {
  count: number
  sumMs: number
  lastMs: number | null
}

export type MetricsRegistry = {
  increment: (name: string, by?: number) => void
  setGauge: (name: string, value: number) => void
  observeDurationMs: (name: string, durationMs: number) => void
  snapshot: () => MetricsSnapshot
  reset: () => void
}

export const METRIC_NAMES = {
  engineSearchDurationMs: "engine_search_duration_ms",
  engineSearchTotal: "engine_search_total",
  engineSearchErrorsTotal: "engine_search_errors_total",
} as const

export const createMetricsRegistry = (): MetricsRegistry => {
  const counters = new Map<string, number>()
  const gauges = new Map<string, number>()
  const durations = new Map<string, DurationState>()

  return {
    increment: (name, by = 1) => {
      counters.set(name, (counters.get(name) ?? 0) + by)
    },
    setGauge: (name, value) => {
      gauges.set(name, value)
    },
    observeDurationMs: (name, durationMs) => {
      const safe =
        Number.isFinite(durationMs) && durationMs >= 0 ? durationMs : 0
      const current = durations.get(name) ?? {
        count: 0,
        sumMs: 0,
        lastMs: null,
      }
      durations.set(name, {
        count: current.count + 1,
        sumMs: current.sumMs + safe,
        lastMs: safe,
      })
    },
    snapshot: () => ({
      counters: [...counters.entries()].map(([name, value]) => ({
        name,
        value,
      })),
      gauges: [...gauges.entries()].map(([name, value]) => ({ name, value })),
      durations: [...durations.entries()].map(([name, state]) => ({
        name,
        count: state.count,
        sumMs: state.sumMs,
        lastMs: state.lastMs,
      })),
    }),
    reset: () => {
      counters.clear()
      gauges.clear()
      durations.clear()
    },
  }
}

export const rootMetrics = createMetricsRegistry()
