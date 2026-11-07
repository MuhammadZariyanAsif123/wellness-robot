import type { Gesture } from "@/lib/turn";

/**
 * Joint targets in radians. Arm joints use the rig in RobotModel:
 * shoulder.x swings the arm forward (negative) / back, shoulder.z swings it
 * out to the side (positive = away from the body for the right arm, mirrored
 * for the left), elbow.x bends the forearm forward (negative).
 */
export interface ArmPose {
  shoulderX: number;
  shoulderZ: number;
  elbowX: number;
}

export interface Pose {
  right: ArmPose;
  left: ArmPose;
  /** Head pitch (positive looks down). */
  headX: number;
}

/** A request to play one gesture. `id` changes each time so the same gesture can replay. */
export interface GestureCommand {
  id: number;
  gesture: Gesture;
  count: number | null;
}

export const REST_POSE: Pose = {
  right: { shoulderX: 0, shoulderZ: 0.12, elbowX: -0.1 },
  left: { shoulderX: 0, shoulderZ: 0.12, elbowX: -0.1 },
  headX: 0,
};

export interface GestureDef {
  /** Pose held at the peak of the gesture. */
  peak: Pose;
  /** Seconds: anticipation, sweep (<= 0.4), hold, return. */
  anticipation: number;
  sweep: number;
  hold: number;
  /** Optional repeated motion at the peak (wave, clap, nod). */
  repeat?: { joint: "rightForearm" | "bothElbows" | "head"; amount: number; times: number; period: number };
  showsThumb?: boolean;
}

const arm = (shoulderX: number, shoulderZ: number, elbowX: number): ArmPose => ({
  shoulderX,
  shoulderZ,
  elbowX,
});
const both = (a: ArmPose): Pick<Pose, "right" | "left"> => ({ right: a, left: a });
const rest = REST_POSE;

const timing = { anticipation: 0.06, sweep: 0.38, hold: 0.8 } as const;

/** Typed as Record<Gesture, ...> so a missing or extra entry fails to compile. */
export const GESTURES: Record<Gesture, GestureDef> = {
  none: { peak: rest, anticipation: 0, sweep: 0, hold: 0 },
  wave: {
    peak: { ...rest, right: arm(-0.1, 2.5, -0.9) },
    ...timing,
    hold: 0.2,
    repeat: { joint: "rightForearm", amount: 0.4, times: 3, period: 0.28 },
  },
  nod: {
    peak: { ...rest, headX: 0.22 },
    anticipation: 0,
    sweep: 0.18,
    hold: 0.05,
    repeat: { joint: "head", amount: 0.22, times: 2, period: 0.34 },
  },
  hand_on_chest: { peak: { ...rest, right: arm(-0.85, -0.35, -1.5) }, ...timing },
  open_palms: { peak: { ...rest, ...both(arm(-0.55, 0.75, -0.9)) }, ...timing },
  count: { peak: { ...rest, right: arm(-0.5, 0.55, -1.6) }, ...timing },
  point_to_light: { peak: { ...rest, right: arm(-1.25, 0.55, -0.15) }, ...timing },
  thumbs_up: { peak: { ...rest, right: arm(-0.55, 0.5, -1.55) }, ...timing, showsThumb: true },
  palm_out: { peak: { ...rest, right: arm(-1.45, 0.25, -1.25) }, ...timing },
  clap: {
    peak: { ...rest, ...both(arm(-0.9, -0.05, -1.35)) },
    ...timing,
    hold: 0.2,
    repeat: { joint: "bothElbows", amount: 0.25, times: 3, period: 0.24 },
  },
  open_arms: { peak: { ...rest, ...both(arm(-0.2, 1.35, -0.35)) }, ...timing },
};

/** Linear blend between two arm poses (t = 0 gives `a`, t = 1 gives `b`; negative t overshoots away from `b`). */
export function lerpArm(a: ArmPose, b: ArmPose, t: number): ArmPose {
  return {
    shoulderX: a.shoulderX + (b.shoulderX - a.shoulderX) * t,
    shoulderZ: a.shoulderZ + (b.shoulderZ - a.shoulderZ) * t,
    elbowX: a.elbowX + (b.elbowX - a.elbowX) * t,
  };
}

/** Reduced motion: a brief pose change instead of a sweeping, repeating motion. */
export const REDUCED_MOTION_SECONDS = 0.1;
export const REDUCED_HOLD_SECONDS = 0.6;
