import type { Turn } from "@/lib/turn";

/**
 * Hard-coded Turns for the dev panel only (no backend needed). Fixture wording
 * is placeholder text, not reviewed product copy, and the safe-mode text is the
 * SPEC draft that the author will rewrite.
 */
export const NORMAL_TURN: Turn = {
  risk: "none",
  mode: "normal",
  segments: [
    { say: "Thanks for telling me. That sounds like a lot to carry.", expression: "soft", gesture: "hand_on_chest", count: null },
    { say: "You don't have to fix the whole day. Let's find one small thing.", expression: "warm", gesture: "open_palms", count: null },
    { say: "Pick just one step. Even one counts.", expression: "curious", gesture: "count", count: 1 },
    { say: "Would a slow breath together help right now?", expression: "calm", gesture: "none", count: null },
  ],
  exercise: null,
  resources: [],
};

/** Shows a variety of gestures in one Turn. */
export const GESTURE_TURN: Turn = {
  risk: "none",
  mode: "normal",
  segments: [
    { say: "Hi, I'm glad you're here.", expression: "happy", gesture: "wave", count: null },
    { say: "Here are the three things we could try.", expression: "curious", gesture: "count", count: 3 },
    { say: "Look at that, you finished the first one.", expression: "happy", gesture: "clap", count: null },
    { say: "Good. Your next small step is right here.", expression: "warm", gesture: "point_to_light", count: null },
    { say: "You're welcome back any time.", expression: "warm", gesture: "open_arms", count: null },
  ],
  exercise: null,
  resources: [],
};

export const SAFE_TURN: Turn = {
  risk: "high",
  mode: "safe",
  segments: [
    {
      say: "I'm really glad you told me. What you're describing sounds serious, and you deserve support from a real person right now.",
      expression: "neutral",
      gesture: "none",
      count: null,
    },
  ],
  exercise: null,
  resources: [],
};
