import { beforeEach, describe, expect, it, vi } from "vitest";
import { ElevenLabsVoice, type AudioLike } from "./elevenLabsVoice";
import type { VoiceProvider } from "./types";

function fakeFallback() {
  const spoken: string[] = [];
  const voice: VoiceProvider = {
    speak: async (text) => {
      spoken.push(text);
    },
    cancel: () => undefined,
  };
  return { voice, spoken };
}

/** Audio that "plays" and ends on the next tick, or fails if asked to. */
function audioFactory(mode: "ok" | "error" | "hang" = "ok") {
  return (): AudioLike => {
    const audio: AudioLike = {
      onended: null,
      onerror: null,
      pause: vi.fn(),
      play: async () => {
        if (mode === "hang") return;
        setTimeout(() => (mode === "ok" ? audio.onended?.(new Event("ended")) : audio.onerror?.(new Event("error"))), 0);
      },
    };
    return audio;
  };
}

const reply = (status: number): typeof fetch =>
  vi.fn(async () => new Response(status === 200 ? new Blob(["audio"]) : "nope", { status })) as unknown as typeof fetch;

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:fake");
  URL.revokeObjectURL = vi.fn();
});

describe("ElevenLabsVoice", () => {
  it("plays server audio and does not touch the fallback", async () => {
    const { voice, spoken } = fakeFallback();
    const fetchImpl = reply(200);
    const v = new ElevenLabsVoice({ baseUrl: "http://api", fallback: voice, fetchImpl, makeAudio: audioFactory() });
    await v.speak("hello", new AbortController().signal);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(spoken).toEqual([]);
  });

  it.each([503, 429, 502])("falls back to the browser voice on HTTP %i and stays there", async (status) => {
    const { voice, spoken } = fakeFallback();
    const fetchImpl = reply(status);
    const v = new ElevenLabsVoice({ baseUrl: "http://api", fallback: voice, fetchImpl, makeAudio: audioFactory() });
    const signal = new AbortController().signal;
    await v.speak("one", signal);
    await v.speak("two", signal);
    expect(spoken).toEqual(["one", "two"]);
    expect(fetchImpl).toHaveBeenCalledTimes(1); // no more attempts after the first failure
  });

  it("falls back on a network error", async () => {
    const { voice, spoken } = fakeFallback();
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("network down");
    }) as unknown as typeof fetch;
    const v = new ElevenLabsVoice({ baseUrl: "http://api", fallback: voice, fetchImpl });
    await v.speak("hi", new AbortController().signal);
    expect(spoken).toEqual(["hi"]);
  });

  it("falls back when playback fails", async () => {
    const { voice, spoken } = fakeFallback();
    const v = new ElevenLabsVoice({ baseUrl: "http://api", fallback: voice, fetchImpl: reply(200), makeAudio: audioFactory("error") });
    await v.speak("hi", new AbortController().signal);
    expect(spoken).toEqual(["hi"]);
  });

  it("uses the fallback when no API URL is configured", async () => {
    const { voice, spoken } = fakeFallback();
    const fetchImpl = reply(200);
    await new ElevenLabsVoice({ baseUrl: undefined, fallback: voice, fetchImpl }).speak("hi", new AbortController().signal);
    expect(spoken).toEqual(["hi"]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("stops asking the server after the per-session cap", async () => {
    const { voice, spoken } = fakeFallback();
    const fetchImpl = reply(200);
    const v = new ElevenLabsVoice({ baseUrl: "http://api", fallback: voice, fetchImpl, makeAudio: audioFactory(), cap: 2 });
    const signal = new AbortController().signal;
    for (const t of ["a", "b", "c"]) await v.speak(t, signal);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(spoken).toEqual(["c"]);
  });

  it("rejects with AbortError when cancelled during playback, without using the fallback", async () => {
    const { voice, spoken } = fakeFallback();
    const v = new ElevenLabsVoice({ baseUrl: "http://api", fallback: voice, fetchImpl: reply(200), makeAudio: audioFactory("hang") });
    const ctl = new AbortController();
    const pending = v.speak("hi", ctl.signal);
    setTimeout(() => ctl.abort(), 5);
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(spoken).toEqual([]);
  });
});
