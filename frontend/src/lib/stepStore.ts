/**
 * Optional on-device memory of the person's ONE next step.
 *
 * Privacy rules (CLAUDE.md): nothing is written unless the person opted in.
 * Only the step text and its date are saved, never messages, replies or risk
 * levels. Every storage access is guarded, so a blocked storage just means
 * the step lasts for this page view. Entries expire after 14 days.
 */

const STEP_KEY = "nextStep";
const CONSENT_KEY = "rememberStep";
export const STEP_TTL_DAYS = 14;
const MAX_STEP_CHARS = 160;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface SavedStep {
  step: string;
  /** Local calendar date, YYYY-MM-DD. */
  savedOn: string;
}

export interface StepState {
  consent: boolean;
  saved: SavedStep | null;
}

const EMPTY: StepState = { consent: false, saved: null };

export function localDate(now: Date): string {
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** "today", "yesterday" or "3 days ago". */
export function describeAge(savedOn: string, now: Date): string {
  const days = daysBetween(savedOn, localDate(now));
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function parseSaved(raw: string | null, now: Date): SavedStep | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const { step, savedOn } = value as Record<string, unknown>;
    if (typeof step !== "string" || typeof savedOn !== "string") return null;
    if (step.trim() === "" || step.length > MAX_STEP_CHARS) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(savedOn)) return null;
    const age = daysBetween(savedOn, localDate(now));
    if (Number.isNaN(age) || age > STEP_TTL_DAYS) return null;
    return { step, savedOn };
  } catch {
    return null;
  }
}

export class StepStore {
  private snapshot: StepState | null = null;
  private readonly listeners = new Set<() => void>();
  private readonly getStorage: () => StorageLike | null;
  private readonly clock: () => Date;

  constructor(getStorage?: () => StorageLike | null, clock: () => Date = () => new Date()) {
    this.getStorage =
      getStorage ??
      (() => {
        try {
          return typeof window === "undefined" ? null : window.localStorage;
        } catch {
          return null;
        }
      });
    this.clock = clock;
  }

  private read(): StepState {
    const store = this.getStorage();
    if (!store) return EMPTY;
    try {
      const consent = store.getItem(CONSENT_KEY) === "yes";
      if (!consent) return EMPTY;
      const saved = parseSaved(store.getItem(STEP_KEY), this.clock());
      if (!saved) store.removeItem(STEP_KEY); // expired or corrupt
      return { consent: true, saved };
    } catch {
      return EMPTY;
    }
  }

  private publish(next: StepState): void {
    this.snapshot = next;
    this.listeners.forEach((l) => l());
  }

  /** Stable between changes, as React's external-store contract requires. */
  getSnapshot = (): StepState => {
    if (this.snapshot === null) this.snapshot = this.read();
    return this.snapshot;
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Turning consent off also deletes any saved step. */
  setConsent(value: boolean): void {
    const store = this.getStorage();
    try {
      if (value) store?.setItem(CONSENT_KEY, "yes");
      else {
        store?.removeItem(CONSENT_KEY);
        store?.removeItem(STEP_KEY);
      }
    } catch {
      // Storage blocked: consent lasts for this page view only.
    }
    this.publish(value ? { consent: true, saved: this.getSnapshot().saved } : EMPTY);
  }

  /** Saves the step only if the person opted in. Returns whether it was saved. */
  save(step: string): boolean {
    if (!this.getSnapshot().consent) return false;
    const trimmed = step.trim();
    if (trimmed === "" || trimmed.length > MAX_STEP_CHARS) return false;
    const saved: SavedStep = { step: trimmed, savedOn: localDate(this.clock()) };
    try {
      this.getStorage()?.setItem(STEP_KEY, JSON.stringify(saved));
    } catch {
      // Storage blocked or full: the step still shows for this page view.
    }
    this.publish({ consent: true, saved });
    return true;
  }

  /** Deletes the saved step but keeps the consent choice. */
  forget(): void {
    try {
      this.getStorage()?.removeItem(STEP_KEY);
    } catch {
      // Nothing to do if storage is blocked.
    }
    this.publish({ consent: this.getSnapshot().consent, saved: null });
  }
}

export const stepStore = new StepStore();
export const EMPTY_STEP_STATE = EMPTY;
