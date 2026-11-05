/**
 * Fixed engine search policy `engine-v1` from PROJECT_SPEC.md section 7.3.
 * Change only by cutting a new versioned policy id.
 *
 * UCI options verified against Stockfish docs:
 * https://official-stockfish.github.io/docs/stockfish-wiki/UCI-Protocol-and-Stockfish-Commands.html
 */

export const ENGINE_POLICY_ID_V1 = "engine-v1" as const

export type EnginePolicyId = typeof ENGINE_POLICY_ID_V1

export type EngineTimeControlClass = "standard" | "bullet"

export type EngineV1Policy = {
  readonly id: typeof ENGINE_POLICY_ID_V1
  readonly multiPv: 3
  readonly depthStandard: 18
  readonly depthBullet: 16
  readonly threads: number
  readonly hashMb: number
}

/** Default worker sizing for a single analysis process. */
export const ENGINE_V1_POLICY: EngineV1Policy = {
  id: ENGINE_POLICY_ID_V1,
  multiPv: 3,
  depthStandard: 18,
  depthBullet: 16,
  threads: 1,
  hashMb: 16,
}

export const depthForTimeControl = (
  policy: EngineV1Policy,
  timeControl: EngineTimeControlClass,
): number => {
  if (timeControl === "bullet") {
    return policy.depthBullet
  }
  return policy.depthStandard
}
