import { Robot3D } from "@/components/robot/Robot3D";

export default function Home() {
  return (
    <main
      style={{
        display: "grid",
        gap: "var(--space-7)",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        alignItems: "center",
        maxWidth: 1080,
        margin: "0 auto",
        padding: "var(--space-7) var(--space-5)",
      }}
    >
      <Robot3D expression="warm" state="idle" />

      <div style={{ display: "grid", gap: "var(--space-5)" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-display)",
            lineHeight: 1.2,
            fontWeight: 500,
          }}
        >
          I&apos;m a wellness companion, not a therapist or a medical service.
        </h1>

        <section
          aria-label="Transcript"
          aria-live="polite"
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
            boxShadow: "var(--shadow)",
            minHeight: 120,
            color: "var(--ink-muted)",
          }}
        >
          The conversation will appear here.
        </section>
      </div>
    </main>
  );
}
