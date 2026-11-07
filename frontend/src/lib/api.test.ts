import { describe, expect, it } from "vitest";
import { postTurn } from "./api";

const goodTurn = {
  risk: "none",
  mode: "normal",
  segments: [{ say: "Hi", expression: "warm", gesture: "none", count: null }],
  exercise: null,
  exercise_steps: [],
  resources: [],
};

const reply = (status: number, body: unknown): typeof fetch =>
  (async () => new Response(JSON.stringify(body), { status })) as typeof fetch;

describe("postTurn", () => {
  it("returns a valid Turn", async () => {
    const out = await postTurn("hi", [], false, null, "http://x", reply(200, goodTurn));
    expect(out.ok).toBe(true);
  });

  it("sends the safe lock and history, and nothing else", async () => {
    let sent = "";
    const spy = (async (_url: string, init?: RequestInit) => {
      sent = String(init?.body);
      return new Response(JSON.stringify(goodTurn));
    }) as unknown as typeof fetch;
    await postTurn("hi", [{ role: "user", text: "a" }], true, null, "http://x", spy);
    expect(JSON.parse(sent)).toEqual({ message: "hi", history: [{ role: "user", text: "a" }], safe_locked: true });
  });

  it("sends current_step only when there is one", async () => {
    const bodies: unknown[] = [];
    const spy = (async (_url: string, init?: RequestInit) => {
      bodies.push(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify(goodTurn));
    }) as unknown as typeof fetch;
    await postTurn("hi", [], false, "Open my notes", "http://x", spy);
    await postTurn("hi", [], false, null, "http://x", spy);
    expect(bodies[0]).toMatchObject({ current_step: "Open my notes" });
    expect(bodies[1]).not.toHaveProperty("current_step");
  });

  it("rejects an invalid Turn from the server", async () => {
    const bad = { ...goodTurn, segments: [{ say: "Hi", expression: "warm", gesture: "backflip", count: null }] };
    const out = await postTurn("hi", [], false, null, "http://x", reply(200, bad));
    expect(out).toMatchObject({ ok: false });
  });

  it("reports HTTP errors, network errors and a missing URL", async () => {
    expect(await postTurn("hi", [], false, null, "http://x", reply(429, {}))).toMatchObject({ ok: false });
    const boom = (async () => {
      throw new Error("down");
    }) as typeof fetch;
    expect(await postTurn("hi", [], false, null, "http://x", boom)).toMatchObject({ ok: false });
    expect(await postTurn("hi", [], false, null, undefined, reply(200, goodTurn))).toMatchObject({ ok: false });
  });

  it("retries once after a network error, then succeeds", async () => {
    let calls = 0;
    const flaky = (async () => {
      calls += 1;
      if (calls === 1) throw new Error("asleep");
      return new Response(JSON.stringify(goodTurn));
    }) as unknown as typeof fetch;
    expect((await postTurn("hi", [], false, null, "http://x", flaky)).ok).toBe(true);
    expect(calls).toBe(2);
  });

  it("does not retry an HTTP error reply", async () => {
    let calls = 0;
    const limited = (async () => {
      calls += 1;
      return new Response("{}", { status: 429 });
    }) as unknown as typeof fetch;
    expect(await postTurn("hi", [], false, null, "http://x", limited)).toMatchObject({ ok: false });
    expect(calls).toBe(1);
  });
});
