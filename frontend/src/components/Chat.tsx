"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Robot3D } from "@/components/robot/Robot3D";
import type { GestureCommand } from "@/components/robot/gestures";
import { Transcript, type TranscriptEntry } from "@/components/Transcript";
import { postTurn } from "@/lib/api";
import { playTurn } from "@/lib/sequencer";
import { EMPTY_STEP_STATE, describeAge, stepStore } from "@/lib/stepStore";
import type { Expression, HistoryItem, RobotState, Turn } from "@/lib/turn";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { useTilt } from "@/lib/motion/useTilt";
import { Chapters } from "@/components/Chapters";
import { Contours } from "@/components/Contours";
import { TalkPill } from "@/components/TalkPill";
import { MicButton, VoiceSettings } from "@/components/VoiceControls";
import { useVoice } from "@/lib/voice/useVoice";

const HISTORY_LIMIT = 10;
const NEUTRAL_ERROR = "I couldn't get a reply just now. Please try again in a moment.";
// SPEC section 4: shown whenever resources are empty. Not a phone number or organization.
const GENERIC_EMERGENCY_LINE =
  "If you might act on thoughts of harming yourself, contact your local emergency number or go to the nearest emergency department, and tell someone you trust now.";

const HEADLINE = "One small step at a time.";

const STARTERS = ["I feel stressed", "I'm stuck on something", "I need a little motivation"] as const;

const STATE_LABEL: Record<RobotState, string> = {
  idle: "Ready to listen",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
  exercise: "Guiding an exercise",
  safe: "Safe mode",
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
  const [planStep, setPlanStep] = useState<string | null>(null);
  const stepState = useSyncExternalStore(stepStore.subscribe, stepStore.getSnapshot, () => EMPTY_STEP_STATE);

  const history = useRef<HistoryItem[]>([]);
  const log = useRef<TranscriptEntry[]>([]);
  const gestureId = useRef(1);
  const abort = useRef<AbortController | null>(null);
  const safeLocked = safeTurn !== null;
  // A step planned in this visit, or one saved on this device after opt-in.
  const returning = planStep === null && stepState.saved !== null;
  const shownStep = safeLocked ? null : (planStep ?? stepState.saved?.step ?? null);

  const voice = useVoice({
    onInterim: (text) => setDraft(text),
    onFinal: (text) => void send(text),
  });
  // Safe mode stays neutral; otherwise the robot shows it is listening while the mic is held.
  const robotState: RobotState = safeLocked ? "safe" : voice.listening ? "listening" : state;

  // The stage tilts gently toward the mouse; never in safe mode or with reduced motion.
  const reducedMotion = useReducedMotion();
  const tiltRef = useRef<HTMLDivElement>(null);
  useTilt(tiltRef, !safeLocked && !reducedMotion);

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

    const outcome = await postTurn(text, sentHistory, safeLocked, shownStep);
    if (!outcome.ok) {
      addEntries([{ who: "robot", say: NEUTRAL_ERROR }]);
      setState(safeLocked ? "safe" : "idle");
      setBusy(false);
      return;
    }

    const { turn } = outcome;
    const isSafe = turn.mode === "safe";
    if (isSafe) {
      setSafeTurn(turn);
      setPlanStep(null);
    } else if (turn.plan_step) {
      setPlanStep(turn.plan_step);
      stepStore.save(turn.plan_step); // no-op unless the person opted in
    }
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

  /** "I did it" / "That felt too hard": a ready-made message that carries the step along. */
  const reportStep = (outcome: "done" | "hard"): void => {
    if (busy || !shownStep) return;
    const when = stepState.saved && returning ? ` from ${describeAge(stepState.saved.savedOn, new Date())}` : "";
    void send(outcome === "done" ? `I did my step${when}.` : `My step${when} felt too hard.`);
    if (outcome === "done") {
      setPlanStep(null);
      stepStore.forget();
    }
  };

  const forgetStep = (): void => {
    setPlanStep(null);
    stepStore.forget();
  };

  return (
    <>
      {/* Intro curtain: decorative, never blocks input, gone after about 1.5 s (instantly with reduced motion). */}
      <div className="curtain" aria-hidden="true">
        <span>Wellness companion</span>
      </div>
      <main className="page">
        <header className="topbar">
          <span className="wordmark">Wellness companion</span>
          <span className="tagline">One small step at a time.</span>
          <nav className="nav" aria-label="Page">
            <a className="pill" href="#how">How it works</a>
            <a className="pill" href="#privacy">Privacy</a>
            <button type="button" className="pill pill-dark" onClick={() => document.getElementById("message")?.focus()}>
              Start talking
            </button>
          </nav>
        </header>

        <section className="hero" id="top">
          <h1 className="display">
            {HEADLINE.split(" ").map((word, i) => (
              <span key={i}>
                <span className="word" style={{ "--i": i } as React.CSSProperties}>
                  {word}
                </span>{" "}
              </span>
            ))}
          </h1>
          <p className="disclaimer">A wellness companion, not a therapist or a medical service.</p>

          <div className="panel dark-surface" data-state={robotState}>
            <div className="panel-stage">
              <Contours />
              <div className="stage-inner" ref={tiltRef}>
                <Robot3D expression={expression} state={robotState} gesture={gesture} />
              </div>
              <span className="stage-chip" role="status">
                {STATE_LABEL[robotState]}
              </span>
            </div>

        <div className="talk">
          <div className="chat">
            <Transcript segments={entries} activeIndex={active} thinking={state === "thinking" && !voice.listening} emptyText="Tell me how you're doing today." />

            {entries.length === 0 && !safeLocked ? (
              <div className="chips">
                {STARTERS.map((text) => (
                  <button key={text} type="button" className="chip" disabled={busy} onClick={() => void send(text)}>
                    {text}
                  </button>
                ))}
              </div>
            ) : null}

            <form
              className="composer"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <label htmlFor="message" className="visually-hidden">
                Your message
              </label>
              <input
                id="message"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={2000}
                autoComplete="off"
                placeholder="Type a message"
                disabled={busy}
              />
              {voice.micSupported ? (
                <MicButton
                  listening={voice.listening}
                  disabled={state === "thinking"}
                  onStart={() => {
                    stopSpeaking();
                    voice.startListening();
                  }}
                  onStop={voice.stopListening}
                />
              ) : null}
              <button type="submit" className="btn btn-primary send" aria-label="Send" disabled={busy || draft.trim() === ""}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            </form>
          </div>

          {shownStep ? (
            <section aria-label="Your next step" className="card step-card">
              <h2>{returning && stepState.saved ? `Last time you planned (${describeAge(stepState.saved.savedOn, new Date())})` : "Your next step"}</h2>
              <p className="step-text">{shownStep}</p>
              <div className="row">
                <button type="button" className="btn btn-primary" onClick={() => reportStep("done")} disabled={busy}>I did it</button>
                <button type="button" className="btn" onClick={() => reportStep("hard")} disabled={busy}>That felt too hard</button>
                <button type="button" className="btn btn-quiet" onClick={forgetStep}>Forget my step</button>
              </div>
              <label style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start", fontSize: "var(--text-small)", color: "var(--ink-muted)" }}>
                <input
                  type="checkbox"
                  checked={stepState.consent}
                  onChange={(e) => {
                    stepStore.setConsent(e.target.checked);
                    if (e.target.checked && planStep) stepStore.save(planStep);
                  }}
                />
                <span>Remember this step on this device so we can follow up next time. Only the step and date are saved, never our conversation.</span>
              </label>
            </section>
          ) : null}

          {exerciseTurn ? (
            <section aria-label="Exercise" className="card">
              <h2>Exercise</h2>
              <ol style={{ paddingLeft: "var(--space-5)", display: "grid", gap: "var(--space-2)" }}>
                {exerciseTurn.exercise_steps?.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </section>
          ) : null}

          {safeTurn ? (
            <section aria-label="Support contacts" className="card safe-card">
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
              <p style={{ fontSize: "var(--text-small)", color: "var(--ink-muted)" }}>
                Safe mode stays on for this conversation. When you want a fresh start, you can begin a new one.
              </p>
              {/* Deliberate choice by the person; a full reload clears all state (nothing in the text can unlock safe mode). */}
              <button type="button" className="btn btn-primary" style={{ justifySelf: "start", padding: "var(--space-3) var(--space-5)" }} onClick={() => window.location.reload()}>
                Start a new conversation
              </button>
            </section>
          ) : null}

          <VoiceSettings
            preference={voice.preference}
            onPreference={voice.setPreference}
            elevenAvailable={voice.elevenAvailable}
            micError={voice.micError}
            onStopSpeaking={stopSpeaking}
            speaking={state === "speaking" || state === "exercise"}
          />
        </div>
          <div className="marks" aria-hidden="true"><span>+</span><span>Scroll to explore</span><span>+</span></div>
          </div>
        </section>

        <Chapters />
        <TalkPill />
      </main>
    </>
  );
}
