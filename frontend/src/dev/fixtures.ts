import type { Turn } from "@/lib/turn";

/**
 * Hard-coded Turns for the dev panel only (slice 1 works without a backend).
 * Fixture wording is placeholder text, not reviewed product copy, and the
 * safe-mode text is the SPEC draft that the author will rewrite.
 */
export const NORMAL_TURN: Turn = {
  risk: "none",
  mode: "normal",
  segments: [
    { say: "Thanks for telling me. That sounds like a lot to carry.", expression: "soft", gesture: "none", count: null },
    { say: "Would a slow breath together help right now?", expression: "warm", gesture: "none", count: null },
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
