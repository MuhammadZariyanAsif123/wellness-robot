"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { hasWebGL } from "@/lib/webgl";
import type { Expression, RobotState } from "@/lib/turn";
import type { GestureCommand } from "./gestures";
import { visualFor } from "./states";

interface Props {
  expression: Expression;
  state: RobotState;
  /** Dev panel override; null/undefined follows the system setting. */
  reducedMotionOverride?: boolean | null;
  /** Gesture to play (ignored in safe mode). */
  gesture?: GestureCommand | null;
}

const frame: React.CSSProperties = {
  width: "100%",
  maxWidth: "min(100%, var(--robot-max, 68dvh))",
  aspectRatio: "1 / 1.1",
  display: "grid",
  placeItems: "center",
};

// three.js is large: load the 3D scene only on the client, after first paint.
const RobotScene = dynamic(() => import("./RobotScene").then((m) => m.RobotScene), {
  ssr: false,
  loading: () => <Placeholder text="Loading the robot…" />,
});

function Placeholder({ text }: { text: string }) {
  return (
    <div
      style={{
        ...frame,
        background: "var(--surface-muted)",
        borderRadius: "var(--radius-lg)",
        color: "var(--ink-muted)",
        fontSize: "var(--text-small)",
        textAlign: "center",
        padding: "var(--space-4)",
      }}
    >
      {text}
    </div>
  );
}

const subscribeNever = (): (() => void) => () => undefined;

export function Robot3D({ expression, state, reducedMotionOverride, gesture }: Props) {
  // null on the server, a boolean on the client, without setState in an effect.
  const webgl = useSyncExternalStore<boolean | null>(subscribeNever, hasWebGL, () => null);
  const visual = visualFor(state, expression);
  const label = `Robot, ${state}, ${visual.expression} expression`;

  return (
    <div
      role="img"
      aria-label={label}
      data-state={state}
      data-expression={visual.expression}
      style={frame}
    >
      {webgl === null ? (
        <Placeholder text="Loading the robot…" />
      ) : webgl ? (
        <RobotScene
          expression={expression}
          state={state}
          reducedMotionOverride={reducedMotionOverride}
          gesture={gesture}
        />
      ) : (
        <Placeholder text="Your browser can't show the 3D robot (WebGL is unavailable). Everything else still works as text." />
      )}
    </div>
  );
}
