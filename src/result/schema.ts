import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

/** Repo-relative path to the published AnalysisResultV1 JSON Schema. */
export const ANALYSIS_RESULT_V1_SCHEMA_PATH = "schemas/analysis-result-v1.json"

/**
 * Absolute path to the schema file from this package layout
 * (`src/result` -> `../../schemas/...`).
 */
export const resolveAnalysisResultV1SchemaPath = (): string =>
  join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    ANALYSIS_RESULT_V1_SCHEMA_PATH,
  )

export type AnalysisResultV1JsonSchema = {
  readonly $schema: string
  readonly $id: string
  readonly title: string
  readonly type: string
  readonly required: readonly string[]
  readonly properties: {
    readonly version: { readonly const: "v1" }
    readonly suspicion: {
      readonly properties: {
        readonly band: { readonly enum: readonly string[] }
      }
    }
  }
}

export const loadAnalysisResultV1Schema = (): AnalysisResultV1JsonSchema => {
  const raw = readFileSync(resolveAnalysisResultV1SchemaPath(), "utf8")
  return JSON.parse(raw) as AnalysisResultV1JsonSchema
}
