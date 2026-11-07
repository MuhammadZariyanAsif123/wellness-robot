import { describe, expect, it } from "vitest";
import { FACES } from "./expressions";
import { FACE_H, FACE_W, faceLayout, type Live } from "./face";

const live = (over: Partial<Live> = {}): Live => ({
  ...FACES.neutral,
  gazeX: 0,
  gazeY: 0,
  mouthOpen: 0,
  blink: 0,
  ...over,
});

describe("faceLayout", () => {
  it("places two symmetric eyes inside the visor", () => {
    const [l, r] = faceLayout(live()).eyes;
    expect(l.cx + r.cx).toBeCloseTo(FACE_W);
    expect(l.cy).toBe(r.cy);
    for (const e of [l, r]) {
      expect(e.cx - e.rx).toBeGreaterThan(0);
      expect(e.cx + e.rx).toBeLessThan(FACE_W);
      expect(e.cy + e.ry).toBeLessThan(FACE_H);
    }
  });

  it("closes the eyes almost fully on a blink and never below 1px", () => {
    const open = faceLayout(live()).eyes[0].ry;
    const shut = faceLayout(live({ blink: 1 })).eyes[0].ry;
    expect(shut).toBeLessThan(open * 0.15);
    expect(shut).toBeGreaterThanOrEqual(1);
  });

  it("moves both eyes with the gaze", () => {
    const a = faceLayout(live()).eyes;
    const b = faceLayout(live({ gazeX: 5, gazeY: -5 })).eyes;
    expect(b[0].cx).toBeGreaterThan(a[0].cx);
    expect(b[1].cx).toBeGreaterThan(a[1].cx);
    expect(b[0].cy).toBeLessThan(a[0].cy);
  });

  it("curves the mouth up for happy and keeps it flat for neutral", () => {
    const n = faceLayout(live()).mouth;
    const h = faceLayout(live({ ...FACES.happy })).mouth;
    expect(n.cpY).toBe(n.y);
    expect(h.cpY).toBeGreaterThan(h.y); // canvas y grows downward: control below = smile
  });

  it("only shows the open mouth when it is open", () => {
    expect(faceLayout(live()).mouthOpen.ry).toBe(0);
    expect(faceLayout(live({ mouthOpen: 1 })).mouthOpen.ry).toBeGreaterThan(0);
  });

  it("shows blush only for expressions that define it", () => {
    const alpha = (e: keyof typeof FACES): number => faceLayout(live({ ...FACES[e] })).blush[0].alpha;
    expect(alpha("neutral")).toBe(0);
    expect(alpha("warm")).toBeGreaterThan(0);
    expect(alpha("happy")).toBeGreaterThan(0);
  });
});
