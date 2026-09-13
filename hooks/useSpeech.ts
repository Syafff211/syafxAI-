"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ── Speech-to-text (browser Web Speech API) ─────────────────── */
type RecState = "idle" | "recording" | "processing" | "error";

export function useSpeechToText(onResult: (text: string) => void) {
  const [state, setState] = useState<RecState>("idle");
  const [supported, setSupported] = useState(false);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition)) ||
      null;
    setSupported(Boolean(SR));
  }, []);

  const start = useCallback(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      setState("error");
      return;
    }
    const rec = new SR();
    rec.lang = "id-ID";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interim += t;
      }
      onResult(finalText || interim);
    };
    rec.onerror = () => setState("error");
    rec.onend = () => setState("idle");
    rec.start();
    recRef.current = rec;
    setState("recording");
  }, [onResult]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setState("processing");
  }, []);

  return { state, supported, start, stop };
}

/* ── Text-to-speech (browser SpeechSynthesis) ────────────────── */
export function useTextToSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "id-ID";
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }, []);

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { speaking, supported, speak, stop };
}
