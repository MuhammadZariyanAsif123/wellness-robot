import { describe, expect, it } from "vitest";
import schema from "../../../openapi.json";
import { GESTURES, REST_POSE, type ArmPose } from "./gestures";

const ENUM = schema.components.schemas.Gesture.enum;

const joints = (a: ArmPose): number[] => [a.shoulderX, a.shoulderZ, a.elbowX];

describe("gestures", () => {
  it("cover exactly the Gesture enum generated from Pydantic", () => {
    expect(Object.keys(GESTURES).sort()).toEqual([...ENUM].sort());
  });

  it("keep every joint target within a sane range", () => {
    for (const [name, def] of Object.entries(GESTURES)) {
      for (const v of [...joints(def.peak.right), ...joints(def.peak.left)]) {
        expect(Math.abs(v), name).toBeLessThanOrEqual(3);
      }
      expect(Math.abs(def.peak.headX), name).toBeLessThanOrEqual(0.5);
    }
  });

  it("keep the sweep within the 400 ms ceiling", () => {
    for (const [name, def] of Object.entries(GESTURES)) {
      expect(def.sweep, name).toBeLessThanOrEqual(0.4);
    }
  });

  it("'none' is the rest pose and every other gesture moves something", () => {
    expect(GESTURES.none.peak).toEqual(REST_POSE);
    for (const [name, def] of Object.entries(GESTURES)) {
      if (name === "none") continue;
      expect(def.peak, name).not.toEqual(REST_POSE);
    }
  });

  it("only 'thumbs_up' shows the thumb", () => {
    for (const [name, def] of Object.entries(GESTURES)) {
      expect(Boolean(def.showsThumb), name).toBe(name === "thumbs_up");
    }
  });
});
