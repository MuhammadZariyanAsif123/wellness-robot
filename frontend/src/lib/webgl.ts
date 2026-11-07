let cached: boolean | null = null;

/** True when the browser can create a WebGL context. Cached after the first call. */
export function hasWebGL(): boolean {
  if (cached !== null) return cached;
  try {
    const canvas = document.createElement("canvas");
    cached = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    cached = false;
  }
  return cached;
}

/** Test helper: clear the cached result. */
export function resetWebGLCache(): void {
  cached = null;
}
