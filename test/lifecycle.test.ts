import { describe, expect, it } from "bun:test";
import {
  STAGES,
  STAGE_FLOOR,
  stageForRipeness,
  stageIndex,
  clamp01,
} from "../src/protocol/lifecycle";

describe("lifecycle FSM", () => {
  it("maps boundary ripeness to the right stage", () => {
    expect(stageForRipeness(0)).toBe("DORMANT");
    expect(stageForRipeness(1)).toBe("ASCENDED");
    expect(stageForRipeness(0.5)).toBe("MUTATING");
  });

  it("never regresses as ripeness rises", () => {
    let prev = -1;
    for (let r = 0; r <= 1.0001; r += 0.02) {
      const idx = stageIndex(stageForRipeness(r));
      expect(idx).toBeGreaterThanOrEqual(prev);
      prev = idx;
    }
  });

  it("has strictly increasing stage floors in order", () => {
    for (let i = 1; i < STAGES.length; i += 1) {
      const lo = STAGE_FLOOR[STAGES[i - 1]!];
      const hi = STAGE_FLOOR[STAGES[i]!];
      expect(hi).toBeGreaterThan(lo);
    }
  });

  it("clamps and sanitizes input", () => {
    expect(clamp01(-5)).toBe(0);
    expect(clamp01(5)).toBe(1);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(Number.NaN)).toBe(0);
  });
});
