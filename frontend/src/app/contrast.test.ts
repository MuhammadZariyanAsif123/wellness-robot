import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Reads the real tokens from globals.css so the doc, the CSS and this check cannot drift apart. */
const css = readFileSync(join(__dirname, "globals.css"), "utf8");

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`missing block: ${selector}`);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) out[m[1]] = m[2];
  return out;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const light = block(":root");
const dark = { ...light, ...block(':root[data-theme="dark"]') };
const panel = { ...light, ...block(".dark-surface") };
const safeLight = { ...light, ...block(':root[data-mode="safe"]') };
const safeDark = { ...dark, ...block(':root[data-mode="safe"][data-theme="dark"]') };
const safePanel = { ...panel, ...block(':root[data-mode="safe"] .dark-surface') };

const PAIRS: ReadonlyArray<[string, string]> = [
  ["ink", "bg"],
  ["ink", "surface"],
  ["ink", "surface-muted"],
  ["ink-muted", "bg"],
  ["ink-muted", "surface"],
  ["ink-muted", "surface-muted"],
  ["accent-text", "bg"],
  ["accent-text", "surface"],
  ["accent-ink", "accent"],
  ["focus", "bg"],
];

describe("token contrast (WCAG AA, at least 4.5:1)", () => {
  const sets: Array<[string, Record<string, string>]> = [
    ["light", light],
    ["dark", dark],
    ["black panel", panel],
    ["safe light", safeLight],
    ["safe dark", safeDark],
    ["safe panel", safePanel],
  ];
  for (const [name, tokens] of sets) {
    for (const [fg, bg] of PAIRS) {
      it(`${name}: ${fg} on ${bg}`, () => {
        expect(tokens[fg], `${fg} defined`).toBeTruthy();
        expect(ratio(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
