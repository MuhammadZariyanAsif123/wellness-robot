import schema from "../../openapi.json";
import type { Turn } from "./turn";

/**
 * Defensive runtime check of every Turn received from the backend.
 * Enum lists come from the exported OpenAPI document (generated from Pydantic),
 * never hand-copied. Any violation rejects the whole Turn.
 */

const S = schema.components.schemas;
const RISKS: readonly string[] = S.RiskLevel.enum;
const EXPRESSIONS: readonly string[] = S.Expression.enum;
const GESTURES: readonly string[] = S.Gesture.enum;
const EXERCISES: readonly string[] = S.ExerciseId.enum;
const MODES: readonly string[] = S.Turn.properties.mode.enum;
const MAX_SEGMENTS = S.Turn.properties.segments.maxItems;
const MIN_SEGMENTS = S.Turn.properties.segments.minItems;
const MAX_STEPS = S.Turn.properties.exercise_steps.maxItems;

export type ParseResult = { ok: true; turn: Turn } | { ok: false; reason: string };

const fail = (reason: string): ParseResult => ({ ok: false, reason });

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function checkSegment(seg: unknown, i: number): string | null {
  if (!isRecord(seg)) return `segment ${i} is not an object`;
  if (typeof seg.say !== "string" || seg.say.trim() === "") return `segment ${i} has empty text`;
  if (typeof seg.expression !== "string" || !EXPRESSIONS.includes(seg.expression)) {
    return `segment ${i} has an unknown expression`;
  }
  if (typeof seg.gesture !== "string" || !GESTURES.includes(seg.gesture)) {
    return `segment ${i} has an unknown gesture`;
  }
  const count = seg.count ?? null;
  if (seg.gesture === "count") {
    if (typeof count !== "number" || !Number.isInteger(count) || count < 1 || count > 5) {
      return `segment ${i} needs a count from 1 to 5 for the count gesture`;
    }
  } else if (count !== null) {
    return `segment ${i} has a count but its gesture is not "count"`;
  }
  return null;
}

function checkResource(r: unknown, i: number): string | null {
  if (!isRecord(r)) return `resource ${i} is not an object`;
  for (const key of ["name", "contact", "country", "verifiedOn"] as const) {
    if (typeof r[key] !== "string" || r[key] === "") return `resource ${i} is missing ${key}`;
  }
  return null;
}

export function parseTurn(input: unknown): ParseResult {
  if (!isRecord(input)) return fail("Turn is not an object");
  if (typeof input.risk !== "string" || !RISKS.includes(input.risk)) return fail("unknown risk level");
  if (typeof input.mode !== "string" || !MODES.includes(input.mode)) return fail("unknown mode");

  const { segments } = input;
  if (!Array.isArray(segments)) return fail("segments is not a list");
  if (segments.length < MIN_SEGMENTS || segments.length > MAX_SEGMENTS) {
    return fail(`a Turn needs ${MIN_SEGMENTS} to ${MAX_SEGMENTS} segments, got ${segments.length}`);
  }
  for (const [i, seg] of segments.entries()) {
    const problem = checkSegment(seg, i);
    if (problem) return fail(problem);
  }

  const exercise = input.exercise ?? null;
  if (exercise !== null && (typeof exercise !== "string" || !EXERCISES.includes(exercise))) {
    return fail("unknown exercise");
  }

  const steps = input.exercise_steps ?? [];
  if (!Array.isArray(steps) || steps.some((x) => typeof x !== "string" || x === "")) {
    return fail("exercise_steps must be a list of text");
  }
  if (steps.length > MAX_STEPS) return fail("too many exercise steps");

  const resources = input.resources ?? [];
  if (!Array.isArray(resources)) return fail("resources is not a list");
  for (const [i, r] of resources.entries()) {
    const problem = checkResource(r, i);
    if (problem) return fail(problem);
  }

  if (input.mode === "safe") {
    if (exercise !== null || steps.length > 0) return fail("safe mode allows no exercise");
    for (const seg of segments as Record<string, unknown>[]) {
      if (seg.gesture !== "none" || seg.expression !== "neutral") {
        return fail("safe mode requires a neutral face and no gesture");
      }
    }
  }

  // Shape verified above; the cast narrows the validated unknown to Turn.
  return { ok: true, turn: { ...(input as unknown as Turn), exercise: exercise as Turn["exercise"], resources: resources as Turn["resources"] } };
}
