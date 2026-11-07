import { timedSpeaker } from "../sequencer";
import { abortError, type VoiceProvider } from "./types";

/** The slice of `speechSynthesis` we use, so tests can pass a fake. */
export interface SynthLike {
  speak(utterance: SpeechSynthesisUtterance): void;
  cancel(): void;
  getVoices(): SpeechSynthesisVoice[];
  addEventListener?(type: "voiceschanged", listener: () => void): void;
  removeEventListener?(type: "voiceschanged", listener: () => void): void;
}

const VOICES_WAIT_MS = 1500;

/** Browsers load voices lazily, so the first call often sees an empty list. Wait briefly for them. */
function voicesReady(synth: SynthLike, signal: AbortSignal): Promise<void> {
  if (synth.getVoices().length > 0 || !synth.addEventListener) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const finish = (): void => {
      clearTimeout(timer);
      synth.removeEventListener?.("voiceschanged", finish);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timer = setTimeout(finish, VOICES_WAIT_MS);
    synth.addEventListener?.("voiceschanged", finish);
    signal.addEventListener("abort", finish, { once: true });
  });
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
    this.synth?.getVoices(); // starts the browser loading its voices early
  }

  private get synth(): SynthLike | null {
    return this.deps.synth === undefined ? defaultSynth() : this.deps.synth;
  }

  async speak(text: string, signal: AbortSignal): Promise<void> {
    const synth = this.synth;
    const fallback = this.deps.fallback ?? timedSpeaker();
    if (synth) await voicesReady(synth, signal);
    if (!synth || synth.getVoices().length === 0) return fallback(text, signal);
    if (signal.aborted) {
      synth.cancel();
      throw abortError();
    }

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
