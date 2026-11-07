import type { components } from "@/types/api";

/** Types come from the generated OpenAPI schema (Pydantic is the source of truth). */
export type Expression = components["schemas"]["Expression"];
export type Gesture = components["schemas"]["Gesture"];
export type ExerciseId = components["schemas"]["ExerciseId"];
export type RiskLevel = components["schemas"]["RiskLevel"];
export type Segment = components["schemas"]["Segment"];
export type Resource = components["schemas"]["Resource"];
export type Turn = components["schemas"]["Turn"];
export type TurnRequest = components["schemas"]["TurnRequest"];
export type HistoryItem = components["schemas"]["HistoryItem"];

export type RobotState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "exercise"
  | "safe";

export const ROBOT_STATES: readonly RobotState[] = [
  "idle",
  "listening",
  "thinking",
  "speaking",
  "exercise",
  "safe",
];
