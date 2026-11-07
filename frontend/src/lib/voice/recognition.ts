/**
 * Push-to-talk over the browser's SpeechRecognition. TypeScript's DOM lib has
 * no types for it, so this is the minimal shape we use (no `any`).
 */
export interface RecognitionResultLike {
  readonly isFinal: boolean;
  readonly [index: number]: { readonly transcript: string };
}
export interface RecognitionEventLike {
  readonly resultIndex: number;
  readonly results: ArrayLike<RecognitionResultLike>;
}
export interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: RecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
export type RecognitionCtor = new () => RecognitionLike;

export function getRecognitionCtor(
  win: unknown = typeof window === "undefined" ? undefined : window,
): RecognitionCtor | undefined {
  const w = win as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor } | undefined;
  return w?.SpeechRecognition ?? w?.webkitSpeechRecognition;
}

export interface RecognizerHandlers {
  onInterim(text: string): void;
  onFinal(text: string): void;
  onError(message: string): void;
  onEnd(): void;
}

export interface Recognizer {
  start(): void;
  stop(): void;
}

/** Returns null when the browser has no speech recognition. */
export function createRecognizer(
  handlers: RecognizerHandlers,
  ctor: RecognitionCtor | undefined = getRecognitionCtor(),
  lang: string = typeof navigator !== "undefined" ? navigator.language : "en-US",
): Recognizer | null {
  if (!ctor) return null;
  const rec = new ctor();
  rec.lang = lang;
  rec.interimResults = true;
  rec.continuous = false;
  let finalText = "";
  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i += 1) {
      const result = e.results[i];
      const text = result[0]?.transcript ?? "";
      if (result.isFinal) finalText += text;
      else interim += text;
    }
    handlers.onInterim((finalText + interim).trim());
  };
  rec.onerror = (e) => handlers.onError(e.error ?? "unknown");
  rec.onend = () => {
    const text = finalText.trim();
    finalText = "";
    if (text) handlers.onFinal(text);
    handlers.onEnd();
  };
  return {
    start: () => {
      finalText = "";
      rec.start();
    },
    stop: () => rec.stop(),
  };
}
