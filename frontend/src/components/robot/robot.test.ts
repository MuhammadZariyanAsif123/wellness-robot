import { describe, expect, it } from "vitest";
import schema from "../../../openapi.json";
import { ROBOT_STATES, type Expression } from "@/lib/turn";
import { FACES } from "./expressions";
import { visualFor } from "./states";

// The enum list comes from the schema exported from Pydantic, not a hand copy.
const EXPRESSIONS = schema.components.schemas.Expression.enum as Expression[];

describe("expressions", () => {
  it("covers exactly the Expression enum generated from Pydantic", () => {
    expect(Object.keys(FACES).sort()).toEqual([...EXPRESSIONS].sort());
  });
});

describe("visualFor", () => {
  it("passes the requested expression through outside safe mode", () => {
    for (const state of ROBOT_STATES.filter((s) => s !== "safe")) {
      for (const e of EXPRESSIONS) expect(visualFor(state, e).expression).toBe(e);
    }
  });

  it("forces a neutral, still, glow-free face in safe mode for every expression", () => {
    for (const e of EXPRESSIONS) {
      const v = visualFor("safe", e);
      expect(v.expression).toBe("neutral");
      expect(v.glow).toBe("none");
      expect(v.breathe).toBe(false);
      expect(v.talk).toBe(false);
      expect(v.expressive).toBe(false);
      expect([v.gazeX, v.gazeY]).toEqual([0, 0]);
    }
  });

  it("blinks more slowly in safe mode than in idle", () => {
    const safe = visualFor("safe", "neutral");
    const idle = visualFor("idle", "neutral");
    expect(safe.blinkEvery[0]).toBeGreaterThan(idle.blinkEvery[0]);
    expect(safe.blinkDuration).toBeGreaterThan(idle.blinkDuration);
  });

  it("breathes only when idle and talks only when speaking", () => {
    for (const s of ROBOT_STATES) {
      const v = visualFor(s, "neutral");
      expect(v.breathe).toBe(s === "idle");
      expect(v.talk).toBe(s === "speaking");
    }
  });
});
