/**
 * The strictly-monitored evolutionary lifecycle the promo narrates.
 *
 * Single source of truth shared by the WebGPU scene (visuals), the HUD (labels),
 * the backend (validation), and the database enum. Ripeness in [0,1] drives the
 * stage; every transition is logged (audit-ready by design — charter §X).
 */

export const STAGES = [
  "DORMANT",
  "CHARGING",
  "MUTATING",
  "CRITICAL",
  "ASCENDED",
] as const;

export type Stage = (typeof STAGES)[number];

/** Lower ripeness bound at which each stage begins. */
export const STAGE_FLOOR: Record<Stage, number> = {
  DORMANT: 0,
  CHARGING: 0.15,
  MUTATING: 0.45,
  CRITICAL: 0.8,
  ASCENDED: 1,
};

/** Terminal-HUD copy lifted from the promo's caption language. */
export const STAGE_HUD: Record<Stage, { status: string; line: string; danger: boolean }> = {
  DORMANT: {
    status: "UNRIPE",
    line: "SUBJECT DETECTED. A spatial anomaly stirs in the void.",
    danger: false,
  },
  CHARGING: {
    status: "ABSORBING",
    line: "INJECTING COMPUTATIONAL MASS. Site architecture funnels into the core.",
    danger: false,
  },
  MUTATING: {
    status: "MUTATING",
    line: "PROCEDURAL ROT SPREADING. Neon radiance boils into toxic yellow.",
    danger: false,
  },
  CRITICAL: {
    status: "CRITICAL",
    line: "WARNING — vertices tearing. The entity nears its final evolution.",
    danger: true,
  },
  ASCENDED: {
    status: "ASCENDED",
    line: "ABSOLUTE EVOLUTION. The protocol is open. Feed the code.",
    danger: false,
  },
};

/** Resolve the current stage from a ripeness value in [0,1]. */
export function stageForRipeness(ripeness: number): Stage {
  const r = clamp01(ripeness);
  let current: Stage = "DORMANT";
  for (const stage of STAGES) {
    if (r >= STAGE_FLOOR[stage]) current = stage;
  }
  return current;
}

/** Index of a stage in the ordered lifecycle (0..4). */
export function stageIndex(stage: Stage): number {
  return STAGES.indexOf(stage);
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return value < 0 ? 0 : value > 1 ? 1 : value;
}
