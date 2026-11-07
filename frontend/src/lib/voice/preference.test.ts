import { describe, expect, it } from "vitest";
import { readPreference, writePreference } from "./preference";

const memory = (initial: Record<string, string> = {}) => {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
  };
};

const blocked = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
};

describe("voice preference", () => {
  it("defaults to the browser voice when nothing is stored", () => {
    expect(readPreference(memory())).toBe("browser");
  });

  it("round-trips a stored value", () => {
    const store = memory();
    writePreference("off", store);
    expect(readPreference(store)).toBe("off");
  });

  it("ignores an invalid stored value", () => {
    expect(readPreference(memory({ voicePreference: "robot-scream" }))).toBe("browser");
  });

  it("does not throw when storage is blocked", () => {
    expect(readPreference(blocked)).toBe("browser");
    expect(() => writePreference("off", blocked)).not.toThrow();
  });
});
