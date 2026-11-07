export type VoicePreference = "off" | "browser" | "elevenlabs";

const KEY = "voicePreference";
const VALID: readonly string[] = ["off", "browser", "elevenlabs"];
export const DEFAULT_PREFERENCE: VoicePreference = "browser";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

/** The only localStorage use in the app (CLAUDE.md). Every access is guarded. */
export function readPreference(storage?: StorageLike): VoicePreference {
  try {
    const store = storage ?? window.localStorage;
    const value = store.getItem(KEY);
    return value !== null && VALID.includes(value) ? (value as VoicePreference) : DEFAULT_PREFERENCE;
  } catch {
    return DEFAULT_PREFERENCE;
  }
}

export function writePreference(value: VoicePreference, storage?: StorageLike): void {
  try {
    (storage ?? window.localStorage).setItem(KEY, value);
  } catch {
    // Storage blocked or full: the preference simply lasts for this page view.
  }
}

// A tiny external store so React can read the preference without effects.
let current: VoicePreference | null = null;
const listeners = new Set<() => void>();

export function getPreferenceSnapshot(): VoicePreference {
  if (current === null) current = readPreference();
  return current;
}

export function subscribePreference(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setPreference(value: VoicePreference): void {
  current = value;
  writePreference(value);
  listeners.forEach((l) => l());
}
