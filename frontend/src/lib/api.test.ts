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
    const out = await postTurn("hi", [], false, "http://x", reply(200, goodTurn));
    expect(out.ok).toBe(true);
  });

  it("sends the safe lock and history, and nothing else", async () => {
    let sent = "";
    const spy = (async (_url: string, init?: RequestInit) => {
      sent = String(init?.body);
      return new Response(JSON.stringify(goodTurn));
    }) as unknown as typeof fetch;
    await postTurn("hi", [{ role: "user", text: "a" }], true, "http://x", spy);
    expect(JSON.parse(sent)).toEqual({ message: "hi", history: [{ role: "user", text: "a" }], safe_locked: true });
  });

  it("rejects an invalid Turn from the server", async () => {
    const bad = { ...goodTurn, segments: [{ say: "Hi", expression: "warm", gesture: "backflip", count: null }] };
    const out = await postTurn("hi", [], false, "http://x", reply(200, bad));
    expect(out).toMatchObject({ ok: false });
  });

  it("reports HTTP errors, network errors and a missing URL", async () => {
    expect(await postTurn("hi", [], false, "http://x", reply(429, {}))).toMatchObject({ ok: false });
    const boom = (async () => {
      throw new Error("down");
    }) as typeof fetch;
    expect(await postTurn("hi", [], false, "http://x", boom)).toMatchObject({ ok: false });
    expect(await postTurn("hi", [], false, undefined, reply(200, goodTurn))).toMatchObject({ ok: false });
  });
});
