"use client";

import type { VoicePreference } from "@/lib/voice/preference";

interface MicProps {
  listening: boolean;
  disabled: boolean;
  onStart(): void;
  onStop(): void;
}

/** Hold-to-talk. Works with pointer, and with Space/Enter for keyboard users. */
export function MicButton({ listening, disabled, onStart, onStop }: MicProps) {
  return (
    <button
      type="button"
      className="mic"
      aria-pressed={listening}
      aria-label={listening ? "Listening, release to send" : "Hold to talk"}
      title={listening ? "Listening… release to send" : "Hold to talk"}
      disabled={disabled}
      onPointerDown={onStart}
      onPointerUp={onStop}
      onPointerLeave={() => listening && onStop()}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          onStart();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onStop();
        }
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="9" y="3" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </svg>
    </button>
  );
}

interface SettingsProps {
  preference: VoicePreference;
  onPreference(value: VoicePreference): void;
  elevenAvailable: boolean;
  micError: string | null;
  onStopSpeaking(): void;
  speaking: boolean;
}

/** Stop button, voice choice and the privacy note (collapsed by default, wording unchanged). */
export function VoiceSettings(p: SettingsProps) {
  return (
    <section aria-label="Voice" style={{ display: "grid", gap: "var(--space-2)" }}>
      {p.speaking && p.preference !== "off" ? (
        <div className="row">
          <button type="button" className="btn" onClick={p.onStopSpeaking}>
            Stop speaking
          </button>
        </div>
      ) : null}

      {p.micError ? (
        <p role="alert" style={{ fontSize: "var(--text-small)" }}>
          {p.micError}
        </p>
      ) : null}

      <details className="settings">
        <summary>Voice settings and privacy</summary>
        <div style={{ display: "grid", gap: "var(--space-2)", paddingTop: "var(--space-2)" }}>
          <div className="row">
            <label htmlFor="voice-choice">Voice</label>
            <select
              id="voice-choice"
              className="btn"
              value={p.preference}
              onChange={(e) => p.onPreference(e.target.value as VoicePreference)}
              style={{ padding: "var(--space-2) var(--space-3)" }}
            >
              <option value="browser">Browser voice</option>
              {p.elevenAvailable ? <option value="elevenlabs">ElevenLabs voice</option> : null}
              <option value="off">Off (text only)</option>
            </select>
          </div>
        </div>
      </details>
    </section>
  );
}
