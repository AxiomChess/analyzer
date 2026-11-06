# Analyzer observability (v1)

Language: English only. No emoji.

Structured JSON logs and in-process metrics for `@axiomchess/analyzer`.

## Structured logs

Each log line is one JSON object on stdout:

| Field | Meaning |
| --- | --- |
| `ts` | ISO-8601 timestamp |
| `level` | `debug` / `info` / `warn` / `error` |
| `service` | `axiomchess-analyzer` |
| `message` | Event name (e.g. `engine_search_complete`) |
| `requestId` | Optional correlation id from the caller |
| `pgnContentHash` | Optional SHA-256 when the caller supplies it |

Hard rule: default `info` logs never include full PGN bodies. Callers must pass hashes, not PGN text, at info level. Keys named `pgn` / `normalizedPgn` / `pgnBody` / `rawPgn` are stripped from info records.

## Metrics

| Name | Type | Meaning |
| --- | --- | --- |
| `engine_search_duration_ms` | duration | Wall time of one `UciEngineRunner.analyzePosition` call |
| `engine_search_total` | counter | Successful position searches |
| `engine_search_errors_total` | counter | Failed position searches (timeout/crash) |

Read via `rootMetrics.snapshot()`.

## Engine duration vs API job duration

- **Analyzer** `engine_search_duration_ms`: one UCI MultiPV search at a position.
- **API** `engine_job_duration_ms`: full worker job wall time around `analyzePgn` (may cover many positions once the full game loop lands).

Both are required for capacity planning; do not treat them as interchangeable.
