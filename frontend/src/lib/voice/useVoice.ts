"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { timedSpeaker } from "../sequencer";
import { BrowserVoice } from "./browserVoice";
import { ElevenLabsVoice } from "./elevenLabsVoice";
import {
  getPreferenceSnapshot,
  setPreference,
  subscribePreference,
  type VoicePreference,
} from "./preference";
import { createRecognizer, getRecognitionCtor, type Recognizer } from "./recognition";

interface Handlers {
  onInterim(text: string): void;
  onFinal(text: string): void;
}

const subscribeNever = (): (() => void) => () => undefined;

/** Reasons the microphone can fail, in plain words for the UI. */
function describeMicError(code: string): string {
  if (code === "not-allowed" || code === "service-not-allowed") return "Microphone permission was denied.";
  if (code === "no-speech") return "I didn't hear anything. Try again.";
  if (code === "audio-capture") return "No microphone was found.";
  return "Voice input isn't working right now. You can type instead.";
}

/** Voice output (browser or ElevenLabs, with automatic fallback) and push-to-talk input. */
export function useVoice(handlers: Handlers) {
  const preference = useSyncExternalStore<VoicePreference>(
    subscribePreference,
    getPreferenceSnapshot,
    () => "browser",
  );
  const micSupported = useSyncExternalStore(subscribeNever, () => getRecognitionCtor() !== undefined, () => false);

  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [elevenAvailable, setElevenAvailable] = useState(false);

  const prefRef = useRef(preference);
  const handlersRef = useRef(handlers);
  const listeningRef = useRef(false);
  const providers = useRef<{ browser: BrowserVoice; eleven: ElevenLabsVoice } | null>(null);
  const recognizer = useRef<Recognizer | null>(null);

  useEffect(() => {
    prefRef.current = preference;
    handlersRef.current = handlers;
  });

  // Ask the backend (once) whether ElevenLabs is configured. It never returns a key.
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) return;
    const ctl = new AbortController();
    fetch(`${base}/tts/status`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { elevenlabs?: boolean } | null) => setElevenAvailable(body?.elevenlabs === true))
      .catch(() => setElevenAvailable(false));
    return () => ctl.abort();
  }, []);

  const getProviders = useCallback(() => {
    if (!providers.current) {
      const browser = new BrowserVoice();
      providers.current = {
        browser,
        eleven: new ElevenLabsVoice({ baseUrl: process.env.NEXT_PUBLIC_API_URL, fallback: browser }),
      };
    }
    return providers.current;
  }, []);

  /** Speaks one segment. "Off" is text only: silent, paced by word count. */
  const speak = useCallback(
    (text: string, signal: AbortSignal): Promise<void> => {
      const pref = prefRef.current;
      if (pref === "off") return timedSpeaker()(text, signal);
      const { browser, eleven } = getProviders();
      return (pref === "elevenlabs" ? eleven : browser).speak(text, signal);
    },
    [getProviders],
  );

  const cancelSpeech = useCallback((): void => {
    providers.current?.eleven.cancel();
    providers.current?.browser.cancel();
  }, []);

  const startListening = useCallback((): void => {
    if (listeningRef.current) return;
    setMicError(null);
    if (!recognizer.current) {
      recognizer.current = createRecognizer({
        onInterim: (t) => handlersRef.current.onInterim(t),
        onFinal: (t) => handlersRef.current.onFinal(t),
        onError: (code) => setMicError(describeMicError(code)),
        onEnd: () => {
          listeningRef.current = false;
          setListening(false);
        },
      });
    }
    if (!recognizer.current) return;
    try {
      recognizer.current.start();
      listeningRef.current = true;
      setListening(true);
    } catch {
      setMicError(describeMicError("unknown"));
    }
  }, []);

  const stopListening = useCallback((): void => {
    recognizer.current?.stop();
  }, []);

  useEffect(() => () => cancelSpeech(), [cancelSpeech]);

  return {
    preference,
    setPreference,
    elevenAvailable,
    micSupported,
    listening,
    isListening: () => listeningRef.current,
    micError,
    speak,
    cancelSpeech,
    startListening,
    stopListening,
  };
}
