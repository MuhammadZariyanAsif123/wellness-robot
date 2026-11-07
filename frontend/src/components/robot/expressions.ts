import type { Expression } from "@/lib/turn";

/** Numeric face parameters; GSAP tweens between these. Units are SVG user units. */
export interface Face {
  eyeRx: number;
  eyeRy: number;
  browTilt: number; // degrees; positive raises the inner end
  browLift: number; // upward offset
  mouthWidth: number;
  mouthCurve: number; // positive = smile, negative = frown
  blush: number; // 0..1
}

/** Typed as Record<Expression, Face> so a missing or extra entry fails to compile. */
export const FACES: Record<Expression, Face> = {
  neutral: { eyeRx: 9, eyeRy: 11, browTilt: 0, browLift: 0, mouthWidth: 26, mouthCurve: 0, blush: 0 },
  warm: { eyeRx: 9, eyeRy: 10, browTilt: 4, browLift: 1, mouthWidth: 30, mouthCurve: 9, blush: 0.6 },
  soft: { eyeRx: 9, eyeRy: 8, browTilt: 9, browLift: 0, mouthWidth: 24, mouthCurve: 4, blush: 0.3 },
  curious: { eyeRx: 9, eyeRy: 13, browTilt: 5, browLift: 7, mouthWidth: 18, mouthCurve: -1, blush: 0 },
  happy: { eyeRx: 10, eyeRy: 6, browTilt: 2, browLift: 3, mouthWidth: 34, mouthCurve: 13, blush: 0.6 },
  calm: { eyeRx: 9, eyeRy: 4, browTilt: 3, browLift: 0, mouthWidth: 22, mouthCurve: 5, blush: 0 },
};

export const EXPRESSION_LABELS: Record<Expression, string> = {
  neutral: "neutral",
  warm: "warm",
  soft: "soft",
  curious: "curious",
  happy: "happy",
  calm: "calm",
};
