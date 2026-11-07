import { timedSpeaker } from "../sequencer";
import { abortError, type VoiceProvider } from "./types";

/** The slice of `speechSynthesis` we use, so tests can pass a fake. */
export interface SynthLike {
  speak(utterance: SpeechSynthesisUtterance): void;
  cancel(): void;
  getVoices(): SpeechSynthesisVoice[];
}

export interface BrowserVoiceDeps {
  synth?: SynthLike | null;
  makeUtterance?: (text: string) => SpeechSynthesisUtterance;
  lang?: string;
  /** Used when the browser has no speech voices, so the flow never stalls. */
  fallback?: (text: string, signal: AbortSignal) => Promise<void>;
}

function defaultSynth(): SynthLike | null {
  return typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
}

/** Speaks with the browser's own voices (`speechSynthesis`). */
export class BrowserVoice implements VoiceProvider {
  private readonly deps: BrowserVoiceDeps;

  constructor(deps: BrowserVoiceDeps = {}) {
    this.deps = deps;
  }

  private get synth(): SynthLike | null {
    return this.deps.synth === undefined ? defaultSynth() : this.deps.synth;
  }

  speak(text: string, signal: AbortSignal): Promise<void> {
    const synth = this.synth;
    const fallback = this.deps.fallback ?? timedSpeaker();
    if (!synth || synth.getVoices().length === 0) return fallback(text, signal);
    if (signal.aborted) return Promise.reject(abortError());

    const make = this.deps.makeUtterance ?? ((t: string) => new SpeechSynthesisUtterance(t));
    return new Promise<void>((resolve, reject) => {
      const utterance = make(text);
      const lang = this.deps.lang ?? (typeof navigator !== "undefined" ? navigator.language : "en");
      utterance.lang = lang;
      const match = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
      if (match) utterance.voice = match;

      const onAbort = (): void => {
        synth.cancel();
        reject(abortError());
      };
      signal.addEventListener("abort", onAbort, { once: true });
      const done = (): void => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      };
      utterance.onend = done;
      utterance.onerror = done; // a failed utterance must not stall the conversation
      synth.speak(utterance);
    });
  }

  cancel(): void {
    this.synth?.cancel();
  }
}
