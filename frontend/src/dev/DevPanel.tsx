"use client";

import { useEffect, useRef, useState } from "react";
import { Transcript } from "@/components/Transcript";
import { Robot3D } from "@/components/robot/Robot3D";
import { FACES } from "@/components/robot/expressions";
import { GESTURES, type GestureCommand } from "@/components/robot/gestures";
import { playTurn, timedSpeaker } from "@/lib/sequencer";
import { parseTurn } from "@/lib/turnGuard";
import { ROBOT_STATES, type Expression, type Gesture, type RobotState } from "@/lib/turn";
import { GESTURE_TURN, NORMAL_TURN, SAFE_TURN } from "./fixtures";

type MotionOverride = "system" | "reduce" | "full";

const EXPRESSIONS = Object.keys(FACES) as Expression[];
const GESTURE_NAMES = Object.keys(GESTURES) as Gesture[];

const button: React.CSSProperties = {
  padding: "0 var(--space-4)",
  borderRadius: "var(--radius-pill)",
  border: "1px solid var(--ink)",
  background: "var(--surface)",
  color: "var(--ink)",
  cursor: "pointer",
};

const pressed: React.CSSProperties = {
  ...button,
  background: "var(--accent)",
  color: "var(--accent-ink)",
  border: "1px solid var(--accent)",
};

const row: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "var(--space-2)" };
const legend: React.CSSProperties = { fontWeight: 600, marginBottom: "var(--space-2)" };

export function DevPanel() {
  const [state, setState] = useState<RobotState>("idle");
  const [expression, setExpression] = useState<Expression>("neutral");
  const [motion, setMotion] = useState<MotionOverride>("system");
  const [gesture, setGesture] = useState<GestureCommand | null>(null);
  const [segments, setSegments] = useState<readonly { say: string }[]>([]);
  const [active, setActive] = useState<number | null>(null);

  const nextId = useRef(1);
  const abort = useRef<AbortController | null>(null);

  const safe = state === "safe";
  const override = motion === "system" ? null : motion === "reduce";

  // Safe mode sets the page-level mode so the safe tokens apply.
  useEffect(() => {
    const el = document.documentElement;
    if (safe) el.dataset.mode = "safe";
    else delete el.dataset.mode;
    return () => {
      delete el.dataset.mode;
    };
  }, [safe]);

  const fire = (g: Gesture, c: number | null): void => {
    setGesture({ id: nextId.current++, gesture: g, count: g === "count" ? c : null });
  };

  /** Runs a Turn through the real guard and sequencer (timed stand-in for speech). */
  const play = async (input: unknown, asState: RobotState): Promise<void> => {
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    setActive(null);
    const parsed = parseTurn(input);
    setSegments(parsed.ok ? parsed.turn.segments : []);
    setState(parsed.ok ? asState : "idle");

    await playTurn(
      input,
      {
        setExpression,
        playGesture: fire,
        speak: timedSpeaker(),
        isUserSpeaking: () => false,
      },
      ctl.signal,
      setActive,
    );
    if (ctl.signal.aborted) return;
    setActive(null);
    if (asState !== "safe") setState("idle");
  };

  return (
    <main style={{ padding: "var(--space-6)", maxWidth: 1080, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h2)", fontWeight: 500 }}>
        Robot dev panel
      </h1>
      <p style={{ color: "var(--ink-muted)", fontSize: "var(--text-small)" }}>
        Development only. Drives the robot with hard-coded data; no backend.
      </p>

      <div
        style={{
          display: "grid",
          gap: "var(--space-6)",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          marginTop: "var(--space-5)",
        }}
      >
        <Robot3D expression={expression} state={state} reducedMotionOverride={override} gesture={gesture} />

        <div style={{ display: "grid", gap: "var(--space-5)", alignContent: "start" }}>
          <fieldset style={{ border: 0 }}>
            <legend style={legend}>Play a Turn (through the guard and sequencer)</legend>
            <div style={row}>
              <button type="button" style={button} onClick={() => void play(NORMAL_TURN, "speaking")}>sample Turn</button>
              <button type="button" style={button} onClick={() => void play(GESTURE_TURN, "speaking")}>gesture tour</button>
              <button type="button" style={button} onClick={() => void play(SAFE_TURN, "safe")}>safe-mode Turn</button>
              <button type="button" style={button} onClick={() => { abort.current?.abort(); setActive(null); setState("idle"); }}>stop</button>
            </div>
          </fieldset>

          <fieldset style={{ border: 0 }}>
            <legend style={legend}>Gesture {safe ? "(ignored in safe mode)" : ""}</legend>
            <div style={row}>
              {GESTURE_NAMES.filter((g) => g !== "none").map((g) => (
                <button key={g} type="button" style={button} onClick={() => fire(g, 1)}>{g}</button>
              ))}
            </div>
          </fieldset>

          <fieldset style={{ border: 0 }}>
            <legend style={legend}>State</legend>
            <div style={row}>
              {ROBOT_STATES.map((s) => (
                <button key={s} type="button" aria-pressed={state === s} style={state === s ? pressed : button} onClick={() => setState(s)}>
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset style={{ border: 0 }}>
            <legend style={legend}>Expression {safe ? "(forced to neutral in safe mode)" : ""}</legend>
            <div style={row}>
              {EXPRESSIONS.map((e) => (
                <button key={e} type="button" aria-pressed={expression === e} style={expression === e ? pressed : button} onClick={() => setExpression(e)}>
                  {e}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset style={{ border: 0 }}>
            <legend style={legend}>Motion</legend>
            <div style={row}>
              {(["system", "reduce", "full"] as const).map((m) => (
                <button key={m} type="button" aria-pressed={motion === m} style={motion === m ? pressed : button} onClick={() => setMotion(m)}>
                  {m === "system" ? "follow system" : m === "reduce" ? "reduced" : "full"}
                </button>
              ))}
            </div>
          </fieldset>

          <Transcript segments={segments} activeIndex={active} emptyText="Play a Turn to see its transcript here." />
        </div>
      </div>
    </main>
  );
}
