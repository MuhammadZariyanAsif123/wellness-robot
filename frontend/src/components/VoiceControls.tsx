"use client";

import type { VoicePreference } from "@/lib/voice/preference";

interface Props {
  preference: VoicePreference;
  onPreference(value: VoicePreference): void;
  elevenAvailable: boolean;
  micSupported: boolean;
  listening: boolean;
  micError: string | null;
  onMicStart(): void;
  onMicStop(): void;
  onStopSpeaking(): void;
  speaking: boolean;
  disabled: boolean;
}

const pill: React.CSSProperties = {
  padding: "var(--space-2) var(--space-4)",
  borderRadius: "var(--radius-pill)",
  border: "1px solid var(--ink)",
  background: "var(--surface)",
  color: "var(--ink)",
  cursor: "pointer",
};

const micOn: React.CSSProperties = {
  ...pill,
  background: "var(--accent)",
  color: "var(--accent-ink)",
  border: "1px solid var(--accent)",
};

export function VoiceControls(p: Props) {
  return (
    <section aria-label="Voice" style={{ display: "grid", gap: "var(--space-2)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "center" }}>
        <label htmlFor="voice-choice">Voice</label>
        <select
          id="voice-choice"
          value={p.preference}
          onChange={(e) => p.onPreference(e.target.value as VoicePreference)}
          style={{ ...pill, padding: "var(--space-2) var(--space-3)" }}
        >
          <option value="browser">Browser voice</option>
          {p.elevenAvailable ? <option value="elevenlabs">ElevenLabs voice</option> : null}
          <option value="off">Off (text only)</option>
        </select>

        {p.micSupported ? (
          <button
            type="button"
            aria-pressed={p.listening}
            disabled={p.disabled}
            style={p.listening ? micOn : pill}
            onPointerDown={p.onMicStart}
            onPointerUp={p.onMicStop}
            onPointerLeave={() => p.listening && p.onMicStop()}
            onKeyDown={(e) => {
              if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                e.preventDefault();
                p.onMicStart();
              }
            }}
            onKeyUp={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                p.onMicStop();
              }
            }}
          >
            {p.listening ? "Listening… release to send" : "Hold to talk"}
          </button>
        ) : null}

        {p.speaking && p.preference !== "off" ? (
          <button type="button" style={pill} onClick={p.onStopSpeaking}>
            Stop speaking
          </button>
        ) : null}
      </div>

      {p.micError ? (
        <p role="alert" style={{ fontSize: "var(--text-small)" }}>
          {p.micError}
        </p>
      ) : null}

      <p style={{ fontSize: "var(--text-small)", color: "var(--ink-muted)" }}>
        Your browser&apos;s speech recognition may send your voice to the browser vendor&apos;s cloud service. If you
        choose the ElevenLabs voice, the robot&apos;s reply text is sent to ElevenLabs. Choose &quot;Off&quot; to keep
        everything as text.
      </p>
    </section>
  );
}
