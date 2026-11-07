import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasWebGL, resetWebGLCache } from "./webgl";

beforeEach(() => resetWebGLCache());
afterEach(() => vi.restoreAllMocks());

function stubContext(impl: (type: string) => unknown): void {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    impl as unknown as HTMLCanvasElement["getContext"],
  );
}

describe("hasWebGL", () => {
  it("is true when a context can be created", () => {
    stubContext(() => ({}));
    expect(hasWebGL()).toBe(true);
  });

  it("falls back to webgl1 when webgl2 is missing", () => {
    stubContext((type) => (type === "webgl" ? {} : null));
    expect(hasWebGL()).toBe(true);
  });

  it("is false when no context is available", () => {
    stubContext(() => null);
    expect(hasWebGL()).toBe(false);
  });

  it("is false when context creation throws", () => {
    stubContext(() => {
      throw new Error("blocked");
    });
    expect(hasWebGL()).toBe(false);
  });
});
