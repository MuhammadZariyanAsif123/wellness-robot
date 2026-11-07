import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReducedMotion } from "./useReducedMotion";

function mockMatchMedia(matches: boolean): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

afterEach(() => vi.unstubAllGlobals());

describe("useReducedMotion", () => {
  it("follows the system preference", () => {
    mockMatchMedia(true);
    expect(renderHook(() => useReducedMotion()).result.current).toBe(true);
    mockMatchMedia(false);
    expect(renderHook(() => useReducedMotion()).result.current).toBe(false);
  });

  it("lets an explicit override win either way", () => {
    mockMatchMedia(true);
    expect(renderHook(() => useReducedMotion(false)).result.current).toBe(false);
    mockMatchMedia(false);
    expect(renderHook(() => useReducedMotion(true)).result.current).toBe(true);
  });
});
