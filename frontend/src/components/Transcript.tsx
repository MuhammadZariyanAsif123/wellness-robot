"use client";

import { useEffect, useRef } from "react";

export interface TranscriptEntry {
  say: string;
  /** Who said it. Omit to show plain lines (dev panel). */
  who?: "you" | "robot";
}

interface Props {
  segments: readonly TranscriptEntry[];
  /** Entry being spoken, or null. Shown with a weight shift, not per-letter animation. */
  activeIndex: number | null;
  emptyText?: string;
  /** True while waiting for the robot's reply. */
  thinking?: boolean;
}

/** Text transcript shown beside the voice. Polite live region so screen readers follow along. */
export function Transcript({ segments, activeIndex, emptyText = "The conversation will appear here.", thinking = false }: Props) {
  const box = useRef<HTMLElement>(null);

  // Keep the newest line in view as the conversation grows.
  useEffect(() => {
    const el = box.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [segments.length, thinking]);

  return (
    <section
      ref={box}
      tabIndex={0}
      aria-label="Transcript"
      aria-live="polite"
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-4)",
        boxShadow: "var(--shadow)",
        minHeight: 120,
        maxHeight: "min(50vh, 420px)",
        overflowY: "auto",
        display: "grid",
        gap: "var(--space-2)",
        alignContent: "start",
      }}
    >
      {segments.length === 0 && !thinking ? (
        <p style={{ color: "var(--ink-muted)" }}>{emptyText}</p>
      ) : (
        segments.map((seg, i) => (
          <p
            key={`${i}-${seg.say}`}
            aria-current={i === activeIndex ? "true" : undefined}
            style={{
              fontWeight: i === activeIndex ? 600 : 400,
              color: seg.who === "you" ? "var(--ink-muted)" : "var(--ink)",
              transition: "color var(--dur-fast) var(--ease-out)",
            }}
          >
            {seg.who ? (
              <span style={{ fontSize: "var(--text-small)", marginRight: "var(--space-2)", opacity: 0.8 }}>
                {seg.who === "you" ? "You:" : "Robot:"}
              </span>
            ) : null}
            {seg.say}
          </p>
        ))
      )}
      {thinking ? (
        <p role="status" style={{ color: "var(--ink-muted)", fontStyle: "italic" }}>
          Robot is thinking
          <span aria-hidden="true">
            <span className="thinking-dot" />
            <span className="thinking-dot" />
            <span className="thinking-dot" />
          </span>
        </p>
      ) : null}
    </section>
  );
}
