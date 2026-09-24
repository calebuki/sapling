"use client";

import { getSpeechAudioUrl } from "@/lib/learning/course";
import { runtime } from "../store";
import { sound } from "./sfx";
import type { VillagerId } from "@/lib/game/villagers";

// Recorded neural voice clips are preferred; the browser's Swedish voice fills
// in for everything else (villager chatter, found objects, new lines).

let current: HTMLAudioElement | null = null;
let voices: SpeechSynthesisVoice[] = [];

function loadVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  voices = window.speechSynthesis.getVoices();
}
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
}

function swedishVoice(pitchHint: number) {
  const sv = voices.filter((v) => v.lang.toLowerCase().startsWith("sv"));
  if (sv.length === 0) return null;
  const natural = sv.filter((v) => /natural|online|neural|google/i.test(v.name));
  const pool = natural.length ? natural : sv;
  const male = pool.find((v) => /mattias|male|man/i.test(v.name));
  const female = pool.find((v) => /sofie|hillevi|female|kvinna/i.test(v.name));
  return (pitchHint < 1 ? male ?? pool[0] : female ?? pool[0]) ?? null;
}

export function hasSwedishVoice() {
  return voices.some((v) => v.lang.toLowerCase().startsWith("sv"));
}

export function stopSpeaking() {
  current?.pause();
  current = null;
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  runtime.speaking = null;
}

function recordedClipUrl(clipId?: string) {
  return clipId ? getSpeechAudioUrl(clipId) : null;
}

export function speakSwedish(
  text: string,
  options: { clipId?: string; slow?: boolean; who?: VillagerId | "player"; pitch?: number } = {},
): Promise<void> {
  stopSpeaking();
  sound.ensure();
  const who = options.who ?? null;
  return new Promise((resolve) => {
    const done = () => {
      if (runtime.speaking === who) runtime.speaking = null;
      resolve();
    };
    const url = recordedClipUrl(options.clipId);
    if (url) {
      const audio = new Audio(url);
      audio.playbackRate = options.slow ? 0.75 : 1;
      current = audio;
      audio.onended = done;
      audio.onerror = () => synthesize(text, options, done);
      runtime.speaking = who;
      audio
        .play()
        .then(() => sound.duck((audio.duration || 2) * 1000 + 400))
        .catch(() => synthesize(text, options, done));
      return;
    }
    synthesize(text, options, done);
  });
}

function synthesize(text: string, options: { slow?: boolean; who?: VillagerId | "player"; pitch?: number }, done: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return done();
  const voice = swedishVoice(options.pitch ?? 1);
  if (!voice) return done();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = options.slow ? 0.7 : 0.92;
  utterance.pitch = Math.min(1.6, Math.max(0.6, options.pitch ?? 1));
  utterance.onend = done;
  utterance.onerror = done;
  runtime.speaking = options.who ?? null;
  sound.duck(Math.max(1500, text.length * 90));
  window.speechSynthesis.speak(utterance);
}

// --- Listening to the learner -------------------------------------------------

type RecognitionResultList = ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }>;
type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: { results: RecognitionResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type RecognitionWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

export function canRecognizeSpeech() {
  if (typeof window === "undefined") return false;
  const w = window as RecognitionWindow;
  return Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition);
}

let active: Recognition | null = null;

export function stopListening() {
  active?.stop();
}

export function listenSwedish(onInterim?: (text: string) => void): Promise<{ transcript: string; alternatives: string[] }> {
  return new Promise((resolve, reject) => {
    const w = window as RecognitionWindow;
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return reject(new Error("unsupported"));
    stopSpeaking();
    active?.abort();
    const recognition = new Ctor();
    active = recognition;
    recognition.lang = "sv-SE";
    recognition.interimResults = true;
    recognition.maxAlternatives = 4;
    recognition.continuous = false;
    let finalText = "";
    let alternatives: string[] = [];
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText = result[0].transcript;
          alternatives = Array.from({ length: result.length }, (_, j) => result[j].transcript).slice(1);
        } else interim += result[0].transcript;
      }
      onInterim?.(finalText || interim);
    };
    recognition.onerror = (event) => {
      active = null;
      reject(new Error(event.error));
    };
    recognition.onend = () => {
      active = null;
      resolve({ transcript: finalText.trim(), alternatives });
    };
    recognition.start();
  });
}
