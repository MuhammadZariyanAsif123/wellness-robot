"use client";

import { useEffect, useRef, useState } from "react";
import { Robot3D } from "@/components/robot/Robot3D";
import type { GestureCommand } from "@/components/robot/gestures";
import { Transcript, type TranscriptEntry } from "@/components/Transcript";
import { postTurn } from "@/lib/api";
import { playTurn } from "@/lib/sequencer";
import type { Expression, HistoryItem, RobotState, Turn } from "@/lib/turn";
import { VoiceControls } from "@/components/VoiceControls";
import { useVoice } from "@/lib/voice/useVoice";

const HISTORY_LIMIT = 10;
const NEUTRAL_ERROR = "I couldn't get a reply just now. Please try again in a moment.";
// SPEC section 4: shown whenever resources are empty. Not a phone number or organization.
const GENERIC_EMERGENCY_LINE =
  "If you might act on thoughts of harming yourself, contact your local emergency number or go to the nearest emergency department, and tell someone you trust now.";

const field: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "var(--space-3) var(--space-4)",
  borderRadius: "var(--radius-pill)",
  border: "1px solid var(--ink)",
  background: "var(--surface)",
  color: "var(--ink)",
};

const sendButton: React.CSSProperties = {
  padding: "0 var(--space-5)",
  borderRadius: "var(--radius-pill)",
  border: "1px solid var(--accent)",
  background: "var(--accent)",
  color: "var(--accent-ink)",
  cursor: "pointer",
};

/** Conversation: the robot reacts to each reply by playing its Turn. Nothing is stored. */
export function Chat() {
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [state, setState] = useState<RobotState>("idle");
  const [expression, setExpression] = useState<Expression>("warm");
  const [gesture, setGesture] = useState<GestureCommand | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [safeTurn, setSafeTurn] = useState<Turn | null>(null);
  const [exerciseTurn, setExerciseTurn] = useState<Turn | null>(null);

  const history = useRef<HistoryItem[]>([]);
  const log = useRef<TranscriptEntry[]>([]);
  const gestureId = useRef(1);
  const abort = useRef<AbortController | null>(null);
  const safeLocked = safeTurn !== null;

  const voice = useVoice({
    onInterim: (text) => setDraft(text),
    onFinal: (text) => void send(text),
  });
  // Safe mode stays neutral; otherwise the robot shows it is listening while the mic is held.
  const robotState: RobotState = safeLocked ? "safe" : voice.listening ? "listening" : state;

  // Safe mode switches the page tokens; reload is the only way out (SPEC section 4).
  useEffect(() => {
    if (safeLocked) document.documentElement.dataset.mode = "safe";
    return () => {
      delete document.documentElement.dataset.mode;
    };
  }, [safeLocked]);

  useEffect(() => () => abort.current?.abort(), []);

  /** Appends to the transcript and returns the index of the first new entry. */
  const addEntries = (items: TranscriptEntry[]): number => {
    const first = log.current.length;
    log.current = [...log.current, ...items];
    setEntries(log.current);
    return first;
  };

  const remember = (item: HistoryItem): void => {
    history.current = [...history.current, item].slice(-HISTORY_LIMIT);
  };

  /** Stops the robot mid-speech (Stop button, or the user starts talking). */
  const stopSpeaking = (): void => {
    abort.current?.abort();
    voice.cancelSpeech();
  };

  const send = async (override?: string): Promise<void> => {
    const text = (override ?? draft).trim();
    if (!text || busy) return;
    setDraft("");
    setBusy(true);
    setExerciseTurn(null);
    addEntries([{ who: "you", say: text }]);
    setState("thinking");
    const sentHistory = history.current;
    remember({ role: "user", text });

    const outcome = await postTurn(text, sentHistory, safeLocked);
    if (!outcome.ok) {
      addEntries([{ who: "robot", say: NEUTRAL_ERROR }]);
      setState(safeLocked ? "safe" : "idle");
      setBusy(false);
      return;
    }

    const { turn } = outcome;
    const isSafe = turn.mode === "safe";
    if (isSafe) setSafeTurn(turn);
    remember({ role: "robot", text: turn.segments.map((s) => s.say).join(" ") });

    const base = addEntries(turn.segments.map((s) => ({ who: "robot" as const, say: s.say })));
    setState(isSafe ? "safe" : "speaking");

    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    await playTurn(
      turn,
      {
        setExpression,
        playGesture: (g, count) => setGesture({ id: gestureId.current++, gesture: g, count }),
        speak: voice.speak,
        isUserSpeaking: voice.isListening,
      },
      ctl.signal,
      (i) => setActive(base + i),
    );
    setActive(null);
    if (ctl.signal.aborted) {
      // Stopped by the user: back to rest, ready for the next message.
      setState(isSafe ? "safe" : "idle");
      setBusy(false);
      return;
    }
    if (!isSafe && turn.exercise) {
      setExerciseTurn(turn);
      setState("exercise");
    } else {
      setState(isSafe ? "safe" : "idle");
    }
    setBusy(false);
  };

  return (
    <main
      style={{
        display: "grid",
        gap: "var(--space-7)",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        alignItems: "start",
        maxWidth: 1080,
        margin: "0 auto",
        padding: "var(--space-7) var(--space-5)",
      }}
    >
      <Robot3D expression={expression} state={robotState} gesture={gesture} />

      <div style={{ display: "grid", gap: "var(--space-5)" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-display)", lineHeight: 1.2, fontWeight: 500 }}>
          I&apos;m a wellness companion, not a therapist or a medical service.
        </h1>

        <Transcript segments={entries} activeIndex={active} thinking={state === "thinking" && !voice.listening} emptyText="Tell me how you're doing today." />

        {exerciseTurn ? (
          <section aria-label="Exercise" style={{ background: "var(--surface)", borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--shadow)" }}>
            <ol style={{ paddingLeft: "var(--space-5)", display: "grid", gap: "var(--space-2)" }}>
              {exerciseTurn.exercise_steps?.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </section>
        ) : null}

        {safeTurn ? (
          <section aria-label="Support contacts" style={{ background: "var(--surface)", borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--shadow)", display: "grid", gap: "var(--space-2)" }}>
            {(safeTurn.resources ?? []).length > 0 ? (
              <ul style={{ display: "grid", gap: "var(--space-2)" }}>
                {(safeTurn.resources ?? []).map((r) => (
                  <li key={`${r.name}-${r.contact}`}>
                    <strong>{r.name}</strong>: {r.contact} ({r.country}, checked {r.verifiedOn})
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <p>{GENERIC_EMERGENCY_LINE}</p>
                <p role="alert" style={{ fontSize: "var(--text-small)", color: "var(--ink-muted)" }}>
                  Developer warning: no crisis contacts are configured yet (backend/app/config/resources.py).
                </p>
              </>
            )}
          </section>
        ) : null}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          style={{ display: "flex", gap: "var(--space-2)" }}
        >
          <label htmlFor="message" style={{ position: "absolute", left: -9999 }}>
            Your message
          </label>
          <input
            id="message"
            style={field}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            autoComplete="off"
            placeholder="Type a message"
            disabled={busy}
          />
          <button type="submit" style={sendButton} disabled={busy || draft.trim() === ""}>
            Send
          </button>
        </form>

        <VoiceControls
          preference={voice.preference}
          onPreference={voice.setPreference}
          elevenAvailable={voice.elevenAvailable}
          micSupported={voice.micSupported}
          listening={voice.listening}
          micError={voice.micError}
          onMicStart={() => {
            stopSpeaking();
            voice.startListening();
          }}
          onMicStop={voice.stopListening}
          onStopSpeaking={stopSpeaking}
          speaking={state === "speaking" || state === "exercise"}
          disabled={state === "thinking"}
        />
      </div>
    </main>
  );
}
