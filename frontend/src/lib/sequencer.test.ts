import { describe, expect, it, vi } from "vitest";
import { playTurn, timedSpeaker, type SequencerIO } from "./sequencer";

const seg = (over: Record<string, unknown> = {}) => ({
  say: "One two three.",
  expression: "warm",
  gesture: "none",
  count: null,
  ...over,
});
const turn = (segments: unknown[], over: Record<string, unknown> = {}) => ({
  risk: "none",
  mode: "normal",
  segments,
  exercise: null,
  resources: [],
  ...over,
});

function makeIO(userSpeaking = false) {
  const log: string[] = [];
  const io: SequencerIO = {
    setExpression: (e) => log.push(`expr:${e}`),
    playGesture: (g, c) => log.push(`gesture:${g}${c ? `:${c}` : ""}`),
    speak: async (t) => {
      log.push(`say:${t}`);
    },
    isUserSpeaking: () => userSpeaking,
  };
  return { io, log };
}

const run = (input: unknown, io: SequencerIO, signal = new AbortController().signal) =>
  playTurn(input, io, signal);

describe("playTurn", () => {
  it("plays segments in order: expression, gesture, speech", async () => {
    const { io, log } = makeIO();
    const res = await run(
      turn([seg({ say: "A", expression: "soft", gesture: "nod" }), seg({ say: "B", gesture: "count", count: 2 })]),
      io,
    );
    expect(res.status).toBe("done");
    expect(log).toEqual(["expr:soft", "gesture:nod", "say:A", "expr:warm", "gesture:count:2", "say:B"]);
  });

  it("plays at most one gesture per segment", async () => {
    const { io, log } = makeIO();
    await run(turn([seg({ gesture: "wave" }), seg({ gesture: "none" }), seg({ gesture: "clap" })]), io);
    expect(log.filter((l) => l.startsWith("gesture:"))).toEqual(["gesture:wave", "gesture:clap"]);
  });

  it("never gestures in safe mode and forces a neutral face", async () => {
    const { io, log } = makeIO();
    const res = await run(
      turn([seg({ expression: "neutral" })], { risk: "high", mode: "safe" }),
      io,
    );
    expect(res.status).toBe("done");
    expect(log.some((l) => l.startsWith("gesture:"))).toBe(false);
    expect(log[0]).toBe("expr:neutral");
  });

  it("only allows a nod while the user is speaking", async () => {
    const { io, log } = makeIO(true);
    await run(turn([seg({ gesture: "wave" }), seg({ gesture: "nod" })]), io);
    expect(log.filter((l) => l.startsWith("gesture:"))).toEqual(["gesture:nod"]);
  });

  it("refuses an invalid Turn before calling anything", async () => {
    const { io, log } = makeIO();
    const res = await run(turn([seg({ gesture: "backflip" })]), io);
    expect(res).toMatchObject({ status: "rejected" });
    expect(log).toEqual([]);
  });

  it("stops when aborted", async () => {
    const { io, log } = makeIO();
    const ctl = new AbortController();
    const speak = vi.fn(async () => ctl.abort());
    const res = await run(turn([seg({ say: "A" }), seg({ say: "B" })]), { ...io, speak }, ctl.signal);
    expect(res.status).toBe("aborted");
    expect(speak).toHaveBeenCalledTimes(1);
    expect(log.filter((l) => l.startsWith("say:"))).toEqual([]);
  });
});

describe("timedSpeaker", () => {
  it("resolves after a time proportional to the words and rejects on abort", async () => {
    vi.useFakeTimers();
    const speak = timedSpeaker(100);
    const done = vi.fn();
    void speak("one two three four five six seven", new AbortController().signal).then(done);
    await vi.advanceTimersByTimeAsync(600);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(200);
    expect(done).toHaveBeenCalled();

    const ctl = new AbortController();
    const p = speak("hello", ctl.signal);
    ctl.abort();
    await expect(p).rejects.toThrow();
    vi.useRealTimers();
  });
});
