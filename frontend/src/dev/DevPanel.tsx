"use client";

import { useEffect, useState } from "react";
import { Robot3D } from "@/components/robot/Robot3D";
import { FACES } from "@/components/robot/expressions";
import { ROBOT_STATES, type Expression, type RobotState } from "@/lib/turn";
import { NORMAL_TURN, SAFE_TURN } from "./fixtures";

type MotionOverride = "system" | "reduce" | "full";

const EXPRESSIONS = Object.keys(FACES) as Expression[];

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

export function DevPanel() {
  const [state, setState] = useState<RobotState>("idle");
  const [expression, setExpression] = useState<Expression>("neutral");
  const [motion, setMotion] = useState<MotionOverride>("system");

  const safe = state === "safe";
  const turn = safe ? SAFE_TURN : NORMAL_TURN;
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

  return (
    <main style={{ padding: "var(--space-6)", maxWidth: 1080, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h2)", fontWeight: 500 }}>
        Robot dev panel
      </h1>
      <p style={{ color: "var(--ink-muted)", fontSize: "var(--text-small)" }}>
        Development only. Drives the robot with hard-coded states; no backend.
      </p>

      <div
        style={{
          display: "grid",
          gap: "var(--space-6)",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          marginTop: "var(--space-5)",
        }}
      >
        <Robot3D expression={expression} state={state} reducedMotionOverride={override} />

        <div style={{ display: "grid", gap: "var(--space-5)", alignContent: "start" }}>
          <fieldset style={{ border: 0 }}>
            <legend style={{ fontWeight: 600, marginBottom: "var(--space-2)" }}>State</legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {ROBOT_STATES.map((s) => (
                <button key={s} type="button" aria-pressed={state === s} style={state === s ? pressed : button} onClick={() => setState(s)}>
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset style={{ border: 0 }}>
            <legend style={{ fontWeight: 600, marginBottom: "var(--space-2)" }}>
              Expression {safe ? "(forced to neutral in safe mode)" : ""}
            </legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {EXPRESSIONS.map((e) => (
                <button key={e} type="button" aria-pressed={expression === e} style={expression === e ? pressed : button} onClick={() => setExpression(e)}>
                  {e}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset style={{ border: 0 }}>
            <legend style={{ fontWeight: 600, marginBottom: "var(--space-2)" }}>Motion</legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {(["system", "reduce", "full"] as const).map((m) => (
                <button key={m} type="button" aria-pressed={motion === m} style={motion === m ? pressed : button} onClick={() => setMotion(m)}>
                  {m === "system" ? "follow system" : m === "reduce" ? "reduced" : "full"}
                </button>
              ))}
            </div>
          </fieldset>

          <section aria-label="Transcript preview" style={{ background: "var(--surface)", borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--shadow)" }}>
            <h2 style={{ fontSize: "var(--text-small)", color: "var(--ink-muted)", fontWeight: 500 }}>
              Transcript preview ({turn.mode} mode)
            </h2>
            {turn.segments.map((seg) => (
              <p key={seg.say} style={{ marginTop: "var(--space-2)" }}>{seg.say}</p>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
