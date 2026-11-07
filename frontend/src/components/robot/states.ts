import type { Expression, RobotState } from "@/lib/turn";

export interface StateVisual {
  /** Expression actually drawn (safe mode always forces neutral). */
  expression: Expression;
  gazeX: number;
  gazeY: number;
  glow: "warm" | "calm" | "none";
  /** Idle breath loop. Off everywhere except idle. */
  breathe: boolean;
  /** Mouth movement while speaking. */
  talk: boolean;
  /** Seconds between blinks: [min, max]. */
  blinkEvery: [number, number];
  blinkDuration: number;
  /** Extra motion (gaze shift, entrance, expression morph stagger) allowed. */
  expressive: boolean;
}

export function visualFor(state: RobotState, requested: Expression): StateVisual {
  const base: StateVisual = {
    expression: requested,
    gazeX: 0,
    gazeY: 0,
    glow: "warm",
    breathe: false,
    talk: false,
    blinkEvery: [4, 6],
    blinkDuration: 0.12,
    expressive: true,
  };
  switch (state) {
    case "idle":
      return { ...base, breathe: true };
    case "listening":
      return { ...base, gazeY: 1 };
    case "thinking":
      return { ...base, gazeX: 5, gazeY: -5, glow: "warm" };
    case "speaking":
      // Gaze drifts toward the transcript beside the robot.
      return { ...base, gazeX: 3, talk: true };
    case "exercise":
      return { ...base, glow: "calm" };
    case "safe":
      // Neutral face, no glow, no extra motion, slow blink only.
      return {
        ...base,
        expression: "neutral",
        gazeX: 0,
        gazeY: 0,
        glow: "none",
        blinkEvery: [6, 8],
        blinkDuration: 0.3,
        expressive: false,
      };
  }
}
