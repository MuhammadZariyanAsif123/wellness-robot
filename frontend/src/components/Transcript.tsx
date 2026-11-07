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
    <section ref={box} tabIndex={0} aria-label="Transcript" aria-live="polite" className="messages">
      {segments.length === 0 && !thinking ? (
        <p style={{ color: "var(--ink-muted)" }}>{emptyText}</p>
      ) : (
        segments.map((seg, i) => (
          <p
            key={`${i}-${seg.say}`}
            aria-current={i === activeIndex ? "true" : undefined}
            className={`bubble ${seg.who === "you" ? "bubble-you" : "bubble-robot"}${i === activeIndex ? " bubble-active" : ""}`}
          >
            {seg.who ? <span className="who">{seg.who === "you" ? "You" : "Robot"}</span> : null}
            {seg.say}
          </p>
        ))
      )}
      {thinking ? (
        <p role="status" className="bubble bubble-robot" style={{ fontStyle: "italic" }}>
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
