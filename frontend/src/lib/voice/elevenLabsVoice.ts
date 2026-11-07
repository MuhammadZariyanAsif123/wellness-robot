import { abortError, type VoiceProvider } from "./types";

/** The slice of `HTMLAudioElement` we use, so tests can pass a fake. */
export interface AudioLike {
  play(): Promise<void>;
  pause(): void;
  onended: ((ev: Event) => unknown) | null;
  onerror: ((ev: Event | string) => unknown) | null;
}

export interface ElevenLabsDeps {
  baseUrl: string | undefined;
  fallback: VoiceProvider;
  fetchImpl?: typeof fetch;
  makeAudio?: (url: string) => AudioLike;
  /** Per-session request cap; afterwards the browser voice takes over. */
  cap?: number;
}

const DEFAULT_CAP = 30;

/**
 * Speaks through the backend's POST /tts (the key never reaches the browser).
 * Any failure (no key, quota, network, playback) switches to the fallback
 * voice automatically, and it stays on the fallback for the rest of the session.
 */
export class ElevenLabsVoice implements VoiceProvider {
  private failed = false;
  private requests = 0;
  private current: AudioLike | null = null;
  private readonly deps: ElevenLabsDeps;

  constructor(deps: ElevenLabsDeps) {
    this.deps = deps;
  }

  speak(text: string, signal: AbortSignal): Promise<void> {
    const cap = this.deps.cap ?? DEFAULT_CAP;
    if (this.failed || !this.deps.baseUrl || this.requests >= cap) {
      return this.deps.fallback.speak(text, signal);
    }
    this.requests += 1;
    return this.play(text, signal).catch((err: unknown) => {
      if (signal.aborted || (err instanceof DOMException && err.name === "AbortError")) throw abortError();
      this.failed = true;
      return this.deps.fallback.speak(text, signal);
    });
  }

  private async play(text: string, signal: AbortSignal): Promise<void> {
    const doFetch = this.deps.fetchImpl ?? fetch;
    const res = await doFetch(`${this.deps.baseUrl}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal,
    });
    if (!res.ok) throw new Error(`tts ${res.status}`);
    const url = URL.createObjectURL(await res.blob());
    const audio = (this.deps.makeAudio ?? ((u: string) => new Audio(u)))(url);
    this.current = audio;
    try {
      await new Promise<void>((resolve, reject) => {
        const onAbort = (): void => {
          audio.pause();
          reject(abortError());
        };
        signal.addEventListener("abort", onAbort, { once: true });
        audio.onended = () => {
          signal.removeEventListener("abort", onAbort);
          resolve();
        };
        audio.onerror = () => {
          signal.removeEventListener("abort", onAbort);
          reject(new Error("playback failed"));
        };
        audio.play().catch(reject);
      });
    } finally {
      this.current = null;
      URL.revokeObjectURL(url);
    }
  }

  cancel(): void {
    this.current?.pause();
    this.deps.fallback.cancel();
  }
}
