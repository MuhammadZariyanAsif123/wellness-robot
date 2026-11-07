import { describe, expect, it } from "vitest";
import { StepStore, describeAge, localDate } from "./stepStore";

const memory = () => {
  const data: Record<string, string> = {};
  return {
    data,
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
    removeItem: (k: string) => {
      delete data[k];
    },
  };
};

const day = (s: string) => new Date(`${s}T12:00:00`);

describe("StepStore", () => {
  it("writes nothing without consent", () => {
    const mem = memory();
    const store = new StepStore(() => mem, () => day("2026-11-07"));
    expect(store.save("Open my notes")).toBe(false);
    expect(mem.data).toEqual({});
    expect(store.getSnapshot()).toEqual({ consent: false, saved: null });
  });

  it("saves and reloads the step after consent, and stores nothing else", () => {
    const mem = memory();
    const clock = () => day("2026-11-07");
    const store = new StepStore(() => mem, clock);
    store.setConsent(true);
    expect(store.save("  Open my notes  ")).toBe(true);
    expect(JSON.parse(mem.data.nextStep)).toEqual({ step: "Open my notes", savedOn: "2026-11-07" });
    expect(Object.keys(mem.data).sort()).toEqual(["nextStep", "rememberStep"]);

    const fresh = new StepStore(() => mem, clock); // a new page view
    expect(fresh.getSnapshot()).toEqual({ consent: true, saved: { step: "Open my notes", savedOn: "2026-11-07" } });
  });

  it("returns a stable snapshot until something changes", () => {
    const store = new StepStore(() => memory());
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });

  it("expires entries older than 14 days and removes them", () => {
    const mem = memory();
    mem.data.rememberStep = "yes";
    mem.data.nextStep = JSON.stringify({ step: "Old step", savedOn: "2026-10-01" });
    const store = new StepStore(() => mem, () => day("2026-11-07"));
    expect(store.getSnapshot().saved).toBeNull();
    expect(mem.data.nextStep).toBeUndefined();
  });

  it("ignores corrupt data", () => {
    const mem = memory();
    mem.data.rememberStep = "yes";
    mem.data.nextStep = "{not json";
    expect(new StepStore(() => mem, () => day("2026-11-07")).getSnapshot().saved).toBeNull();
    mem.data.nextStep = JSON.stringify({ step: 5, savedOn: "today" });
    expect(new StepStore(() => mem, () => day("2026-11-07")).getSnapshot().saved).toBeNull();
  });

  it("forget() deletes the step but keeps consent; turning consent off deletes everything", () => {
    const mem = memory();
    const store = new StepStore(() => mem, () => day("2026-11-07"));
    store.setConsent(true);
    store.save("Step");
    store.forget();
    expect(mem.data.nextStep).toBeUndefined();
    expect(store.getSnapshot()).toEqual({ consent: true, saved: null });
    store.save("Step again");
    store.setConsent(false);
    expect(mem.data).toEqual({});
    expect(store.getSnapshot()).toEqual({ consent: false, saved: null });
  });

  it("works when storage is blocked or missing", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    const store = new StepStore(() => blocked);
    expect(store.getSnapshot()).toEqual({ consent: false, saved: null });
    expect(() => store.setConsent(true)).not.toThrow();
    expect(store.save("Step")).toBe(true); // shows for this page view
    expect(new StepStore(() => null).getSnapshot()).toEqual({ consent: false, saved: null });
  });

  it("notifies subscribers on change", () => {
    const store = new StepStore(() => memory());
    let calls = 0;
    const off = store.subscribe(() => (calls += 1));
    store.setConsent(true);
    off();
    store.setConsent(false);
    expect(calls).toBe(1);
  });
});

describe("describeAge", () => {
  it("describes how long ago a step was saved", () => {
    const now = day("2026-11-07");
    expect(describeAge("2026-11-07", now)).toBe("today");
    expect(describeAge("2026-11-06", now)).toBe("yesterday");
    expect(describeAge("2026-11-04", now)).toBe("3 days ago");
    expect(localDate(now)).toBe("2026-11-07");
  });
});
