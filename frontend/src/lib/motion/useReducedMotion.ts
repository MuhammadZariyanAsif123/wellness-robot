"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const getSnapshot = (): boolean => window.matchMedia(QUERY).matches;
const getServerSnapshot = (): boolean => false;

/**
 * True when the user prefers reduced motion. `override` lets the dev panel
 * force a value; null/undefined follows the system setting.
 */
export function useReducedMotion(override?: boolean | null): boolean {
  const system = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return override ?? system;
}
