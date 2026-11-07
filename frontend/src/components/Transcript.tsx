interface Props {
  segments: readonly { say: string }[];
  /** Segment being spoken, or null. Shown with a weight shift, not per-letter animation. */
  activeIndex: number | null;
  emptyText?: string;
}

/** Text transcript shown beside the voice. Polite live region so screen readers follow along. */
export function Transcript({ segments, activeIndex, emptyText = "The conversation will appear here." }: Props) {
  return (
    <section
      aria-label="Transcript"
      aria-live="polite"
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-4)",
        boxShadow: "var(--shadow)",
        minHeight: 120,
        display: "grid",
        gap: "var(--space-2)",
        alignContent: "start",
      }}
    >
      {segments.length === 0 ? (
        <p style={{ color: "var(--ink-muted)" }}>{emptyText}</p>
      ) : (
        segments.map((seg, i) => (
          <p
            key={`${i}-${seg.say}`}
            aria-current={i === activeIndex ? "true" : undefined}
            style={{
              fontWeight: i === activeIndex ? 600 : 400,
              color: i === activeIndex || activeIndex === null ? "var(--ink)" : "var(--ink-muted)",
              transition: "color var(--dur-fast) var(--ease-out)",
            }}
          >
            {seg.say}
          </p>
        ))
      )}
    </section>
  );
}
