import { describe, expect, it } from "vitest";
import { parseTurn } from "./turnGuard";

const seg = (over: Record<string, unknown> = {}) => ({
  say: "Hello there.",
  expression: "warm",
  gesture: "none",
  count: null,
  ...over,
});
const turn = (over: Record<string, unknown> = {}) => ({
  risk: "none",
  mode: "normal",
  segments: [seg()],
  exercise: null,
  resources: [],
  ...over,
});

const reason = (input: unknown): string => {
  const r = parseTurn(input);
  if (r.ok) throw new Error("expected rejection");
  return r.reason;
};

describe("parseTurn", () => {
  it("accepts a valid Turn", () => {
    expect(parseTurn(turn()).ok).toBe(true);
  });

  it("accepts every gesture in the enum, with a count for 'count'", () => {
    for (const g of ["wave", "nod", "hand_on_chest", "open_palms", "point_to_light", "thumbs_up", "palm_out", "clap", "open_arms"]) {
      expect(parseTurn(turn({ segments: [seg({ gesture: g })] })).ok).toBe(true);
    }
    expect(parseTurn(turn({ segments: [seg({ gesture: "count", count: 3 })] })).ok).toBe(true);
  });

  it("rejects an unknown gesture (the whole Turn)", () => {
    expect(reason(turn({ segments: [seg(), seg({ gesture: "backflip" })] }))).toMatch(/unknown gesture/);
  });

  it("rejects unknown expression, risk, mode and exercise", () => {
    expect(reason(turn({ segments: [seg({ expression: "angry" })] }))).toMatch(/expression/);
    expect(reason(turn({ risk: "extreme" }))).toMatch(/risk/);
    expect(reason(turn({ mode: "turbo" }))).toMatch(/mode/);
    expect(reason(turn({ exercise: "meditation" }))).toMatch(/exercise/);
  });

  it("enforces the count rule", () => {
    expect(reason(turn({ segments: [seg({ gesture: "count" })] }))).toMatch(/count/);
    expect(reason(turn({ segments: [seg({ gesture: "count", count: 6 })] }))).toMatch(/count/);
    expect(reason(turn({ segments: [seg({ gesture: "wave", count: 2 })] }))).toMatch(/count/);
  });

  it("enforces 1 to 5 segments and non-empty text", () => {
    expect(reason(turn({ segments: [] }))).toMatch(/segments/);
    expect(reason(turn({ segments: Array.from({ length: 6 }, () => seg()) }))).toMatch(/segments/);
    expect(reason(turn({ segments: [seg({ say: "  " })] }))).toMatch(/empty/);
  });

  it("rejects non-objects and malformed shapes", () => {
    for (const bad of [null, undefined, 42, "turn", [], { risk: "none" }]) {
      expect(parseTurn(bad).ok).toBe(false);
    }
    expect(reason(turn({ segments: "nope" }))).toMatch(/segments/);
    expect(reason(turn({ resources: [{ name: "x" }] }))).toMatch(/resource/);
  });

  it("enforces safe-mode invariants", () => {
    const safe = { risk: "high", mode: "safe" };
    expect(parseTurn(turn({ ...safe, segments: [seg({ expression: "neutral" })] })).ok).toBe(true);
    expect(reason(turn({ ...safe, segments: [seg({ expression: "neutral", gesture: "wave" })] }))).toMatch(/safe mode/);
    expect(reason(turn({ ...safe, segments: [seg({ expression: "warm" })] }))).toMatch(/safe mode/);
    expect(reason(turn({ ...safe, segments: [seg({ expression: "neutral" })], exercise: "box_breathing" }))).toMatch(/safe mode/);
  });
});
