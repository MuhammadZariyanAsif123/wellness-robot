/** A way of speaking one segment aloud (SPEC section 7). */
export interface VoiceProvider {
  /** Resolves when speech ends. Rejects with an AbortError when cancelled. */
  speak(text: string, signal: AbortSignal): Promise<void>;
  cancel(): void;
}

export const abortError = (): DOMException => new DOMException("aborted", "AbortError");
