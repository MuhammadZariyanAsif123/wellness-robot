import { describe, expect, it, vi } from "vitest";
import { createRecognizer, getRecognitionCtor, type RecognitionLike } from "./recognition";

class FakeRecognition implements RecognitionLike {
  static last: FakeRecognition;
  lang = "";
  interimResults = false;
  continuous = true;
  onresult: RecognitionLike["onresult"] = null;
  onerror: RecognitionLike["onerror"] = null;
  onend: RecognitionLike["onend"] = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  constructor() {
    FakeRecognition.last = this;
  }
}

const result = (transcript: string, isFinal: boolean) => Object.assign([{ transcript }], { isFinal });

function handlers() {
  return { onInterim: vi.fn(), onFinal: vi.fn(), onError: vi.fn(), onEnd: vi.fn() };
}

describe("recognition", () => {
  it("is unsupported when the browser has no SpeechRecognition", () => {
    expect(getRecognitionCtor({})).toBeUndefined();
    expect(createRecognizer(handlers(), undefined)).toBeNull();
  });

  it("finds the prefixed constructor", () => {
    expect(getRecognitionCtor({ webkitSpeechRecognition: FakeRecognition })).toBe(FakeRecognition);
  });

  it("reports interim text and delivers the final text on end", () => {
    const h = handlers();
    const rec = createRecognizer(h, FakeRecognition, "en-US");
    rec?.start();
    const raw = FakeRecognition.last;
    expect(raw.lang).toBe("en-US");
    expect(raw.interimResults).toBe(true);
    raw.onresult?.({ resultIndex: 0, results: [result("I feel", false)] });
    expect(h.onInterim).toHaveBeenLastCalledWith("I feel");
    raw.onresult?.({ resultIndex: 0, results: [result("I feel tired", true)] });
    raw.onend?.();
    expect(h.onFinal).toHaveBeenCalledWith("I feel tired");
    expect(h.onEnd).toHaveBeenCalled();
  });

  it("does not deliver empty speech and surfaces errors", () => {
    const h = handlers();
    createRecognizer(h, FakeRecognition)?.start();
    const raw = FakeRecognition.last;
    raw.onerror?.({ error: "not-allowed" });
    raw.onend?.();
    expect(h.onError).toHaveBeenCalledWith("not-allowed");
    expect(h.onFinal).not.toHaveBeenCalled();
  });
});
