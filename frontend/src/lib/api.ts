import { parseTurn } from "./turnGuard";
import type { HistoryItem, Turn, TurnRequest } from "./turn";

export type TurnOutcome = { ok: true; turn: Turn } | { ok: false; reason: string };

const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Sends one message to POST /turn. The reply goes through the same runtime
 * check as every Turn; a network error, a non-200 status or an invalid Turn
 * all come back as `{ ok: false }` so the UI can show a neutral line instead.
 * Nothing is stored: the history is passed in from browser memory.
 */
export async function postTurn(
  message: string,
  history: readonly HistoryItem[],
  safeLocked: boolean,
  baseUrl: string | undefined = process.env.NEXT_PUBLIC_API_URL,
  fetchImpl: typeof fetch = fetch,
): Promise<TurnOutcome> {
  if (!baseUrl) return { ok: false, reason: "API URL is not configured" };
  const body: TurnRequest = { message, history: [...history], safe_locked: safeLocked };
  try {
    const res = await fetchImpl(`${baseUrl}/turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) return { ok: false, reason: `server returned ${res.status}` };
    const parsed = parseTurn(await res.json());
    return parsed.ok ? { ok: true, turn: parsed.turn } : { ok: false, reason: parsed.reason };
  } catch {
    return { ok: false, reason: "could not reach the server" };
  }
}
