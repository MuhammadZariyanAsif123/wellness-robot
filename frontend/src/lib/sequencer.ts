import { parseTurn } from "./turnGuard";
import type { Expression, Gesture } from "./turn";

/** Everything the sequencer needs from the outside world. */
export interface SequencerIO {
  setExpression(expression: Expression): void;
  playGesture(gesture: Gesture, count: number | null): void;
  /** Speaks one segment and resolves when it finishes (slice 4 plugs in real voice). */
  speak(text: string, signal: AbortSignal): Promise<void>;
  /** True while the user is talking; only `nod` may start then. */
  isUserSpeaking(): boolean;
}

export type PlayResult =
  | { status: "done" }
  | { status: "rejected"; reason: string }
  | { status: "aborted" };

/**
 * Plays a Turn segment by segment: expression, then at most one gesture, then
 * speech, then the next segment. Validates the Turn first and refuses invalid
 * ones before calling anything. Safe mode never gestures, whatever the data says.
 */
export async function playTurn(
  input: unknown,
  io: SequencerIO,
  signal: AbortSignal,
  onSegment?: (index: number) => void,
): Promise<PlayResult> {
  const parsed = parseTurn(input);
  if (!parsed.ok) return { status: "rejected", reason: parsed.reason };
  const { turn } = parsed;

  for (const [index, seg] of turn.segments.entries()) {
    if (signal.aborted) return { status: "aborted" };
    onSegment?.(index);
    io.setExpression(turn.mode === "safe" ? "neutral" : seg.expression);

    const allowed =
      turn.mode !== "safe" &&
      seg.gesture !== "none" &&
      (!io.isUserSpeaking() || seg.gesture === "nod");
    if (allowed) io.playGesture(seg.gesture, seg.count ?? null);

    try {
      await io.speak(seg.say, signal);
    } catch {
      if (signal.aborted) return { status: "aborted" };
      throw new Error("speech failed");
    }
  }
  return signal.aborted ? { status: "aborted" } : { status: "done" };
}

/** Stand-in speaker until slice 4: waits in proportion to the word count. */
export function timedSpeaker(msPerWord = 280): SequencerIO["speak"] {
  return (text, signal) =>
    new Promise<void>((resolve, reject) => {
      const words = text.trim().split(/\s+/).length;
      const timer = setTimeout(resolve, Math.max(600, words * msPerWord));
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          reject(new DOMException("aborted", "AbortError"));
        },
        { once: true },
      );
    });
}
