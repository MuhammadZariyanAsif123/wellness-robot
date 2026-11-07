import { describe, expect, it, vi } from "vitest";
import { BrowserVoice, type SynthLike } from "./browserVoice";

interface FakeUtterance {
  text: string;
  lang: string;
  voice: unknown;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

function setup(voices: { lang: string }[], behaviour: "end" | "error" | "hang" = "end") {
  const cancel = vi.fn();
  const synth = {
    getVoices: () => voices as SpeechSynthesisVoice[],
    cancel,
    speak: (u: SpeechSynthesisUtterance) => {
      const fake = u as unknown as FakeUtterance;
      if (behaviour === "hang") return;
      setTimeout(() => (behaviour === "end" ? fake.onend?.() : fake.onerror?.()), 0);
    },
  } satisfies SynthLike;
  const fallback = vi.fn(async () => undefined);
  const voice = new BrowserVoice({
    synth,
    lang: "en-US",
    fallback,
    makeUtterance: (text) => ({ text, lang: "", voice: null, onend: null, onerror: null }) as unknown as SpeechSynthesisUtterance,
  });
  return { voice, cancel, fallback };
}

describe("BrowserVoice", () => {
  it("resolves when the utterance ends", async () => {
    const { voice, fallback } = setup([{ lang: "en-GB" }]);
    await voice.speak("hello", new AbortController().signal);
    expect(fallback).not.toHaveBeenCalled();
  });

  it("does not stall when an utterance errors", async () => {
    const { voice } = setup([{ lang: "en-GB" }], "error");
    await expect(voice.speak("hello", new AbortController().signal)).resolves.toBeUndefined();
  });

  it("rejects with AbortError and cancels speech when aborted", async () => {
    const { voice, cancel } = setup([{ lang: "en-GB" }], "hang");
    const ctl = new AbortController();
    const pending = voice.speak("hello", ctl.signal);
    ctl.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(cancel).toHaveBeenCalled();
  });

  it("waits for voices that load late instead of falling back", async () => {
    let voices: SpeechSynthesisVoice[] = [];
    let onChange: () => void = () => undefined;
    const spoken: string[] = [];
    const synth = {
      speak: (u: SpeechSynthesisUtterance) => {
        spoken.push(u.text);
        u.onend?.(new Event("end") as SpeechSynthesisEvent);
      },
      cancel: () => undefined,
      getVoices: () => voices,
      addEventListener: (_t: "voiceschanged", l: () => void) => {
        onChange = l;
      },
      removeEventListener: () => undefined,
    };
    const fallback = vi.fn(async () => undefined);
    const voice = new BrowserVoice({
      synth,
      fallback,
      makeUtterance: (t) => ({ text: t }) as SpeechSynthesisUtterance,
    });
    const pending = voice.speak("hello", new AbortController().signal);
    voices = [{ lang: "en-GB" } as SpeechSynthesisVoice];
    onChange();
    await pending;
    expect(spoken).toEqual(["hello"]);
    expect(fallback).not.toHaveBeenCalled();
  });

  it("falls back to timing when the browser has no voices", async () => {
    const { voice, fallback } = setup([]);
    await voice.speak("hello", new AbortController().signal);
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it("falls back to timing when speech synthesis is missing", async () => {
    const fallback = vi.fn(async () => undefined);
    await new BrowserVoice({ synth: null, fallback }).speak("hello", new AbortController().signal);
    expect(fallback).toHaveBeenCalledTimes(1);
  });
});
