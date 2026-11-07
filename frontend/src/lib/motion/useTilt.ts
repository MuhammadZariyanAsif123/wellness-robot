"use client";

import { useEffect, type RefObject } from "react";

export const MAX_TILT_DEG = 4;

/** Tilt (degrees) toward the pointer: -max..max on each axis, 0 at the viewport centre. Pure, so it is testable. */
export function tiltFor(x: number, y: number, width: number, height: number, max = MAX_TILT_DEG): { tx: number; ty: number } {
  if (width <= 0 || height <= 0) return { tx: 0, ty: 0 };
  const clamp = (v: number): number => Math.max(-1, Math.min(1, v));
  return {
    tx: clamp((x / width) * 2 - 1) * max,
    ty: clamp((y / height) * 2 - 1) * -max,
  };
}

/**
 * Sets --tilt-x / --tilt-y on the element as the mouse moves (rAF-throttled).
 * Does nothing when `enabled` is false (reduced motion, safe mode) or for touch/pen pointers.
 */
export function useTilt(ref: RefObject<HTMLElement | null>, enabled: boolean): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let frame = 0;
    const reset = (): void => {
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
    };
    const onMove = (e: PointerEvent): void => {
      if (e.pointerType !== "mouse") return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const { tx, ty } = tiltFor(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
        el.style.setProperty("--tilt-x", `${tx.toFixed(2)}deg`);
        el.style.setProperty("--tilt-y", `${ty.toFixed(2)}deg`);
      });
    };
    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", reset);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", reset);
      reset();
    };
  }, [ref, enabled]);
}
