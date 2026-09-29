"use client";

import { getSpeechAudioUrl } from "@/lib/learning/course";
import { getTargetLanguage } from "@/lib/learning/languages";
import { clipPath, publicClipUrl } from "@/lib/speech/clips";
import { genderOf, passerVoices, playerVoice, type VoiceGender } from "@/lib/game/voices";
import type { VillagerId } from "@/lib/game/villagers";
import { island } from "../island";
import { runtime } from "../store";
import { sound } from "./sfx";

// Every line is spoken by a natural neural voice from /api/speech, one voice
// per villager. If that is unavailable: the recorded course clip, the device's
// voice for the island's language, the Azure/OpenAI neural fallback, and
// finally the browser's default voice. Each source reports whether it actually
// started so a silent failure moves on to the next one.

// `gender` says how a speaker without a voice of their own should sound;
// without it, a low pitch means a man.
export type SpeakOptions = { clipId?: string; slow?: boolean; who?: VillagerId | "player"; pitch?: number; gender?: VoiceGender };

let neuralAvailable = true;
const neuralCache = new Map<string, Promise<string | null>>();

function locale() {
  return getTargetLanguage(island().code).locale;
}

// The voice a villager always speaks with; passers-by sound like a man or a woman.
function voiceFor({ who, pitch = 1, gender }: Pick<SpeakOptions, "who" | "pitch" | "gender">) {
  if (who === "player") return playerVoice;
  const villager = who ? island().villagers.find((v) => v.id === who) : undefined;
  return villager?.voice ?? passerVoices[gender ?? (pitch < 1 ? "man" : "woman")];
}

function neuralClipUrl(text: string, voice: string, slow: boolean) {
  const code = island().code;
  const key = `${code}|${voice}|${slow ? 1 : 0}|${text}`;
  const cached = neuralCache.get(key);
  if (cached) return cached;
  const query = new URLSearchParams({ l: code, t: text, v: voice, s: slow ? "1" : "0" });
  const pending = (async () => {
    // Every line anyone has heard before is already in the shared bucket;
    // only a line nobody has asked for yet goes to Gemini (via /api/speech).
    const path = await clipPath({ language: code, voice, slow, text });
    const stored = path ? publicClipUrl(path) : null;
    if (stored) {
      const response = await fetch(stored).catch(() => null);
      if (response?.ok) return URL.createObjectURL(await response.blob());
    }
    if (!neuralAvailable) throw new Error("neural speech unavailable");
    const response = await fetch(`/api/speech?${query}`);
    if (response.status === 503) neuralAvailable = false;
    if (!response.ok) throw new Error(String(response.status));
    return URL.createObjectURL(await response.blob());
  })().catch(() => {
    neuralCache.delete(key);
    return null;
  });
  neuralCache.set(key, pending);
  if (neuralCache.size > SERVER_CACHE_LIMIT) {
    const [oldestKey, oldest] = neuralCache.entries().next().value!;
    neuralCache.delete(oldestKey);
    void oldest.then((url) => url && URL.revokeObjectURL(url));
  }
  return pending;
}

/** Warm the cache for lines that are about to be spoken. */
export function prefetchSpeech(text: string, options: Omit<SpeakOptions, "clipId"> = {}) {
  if (!text.trim()) return;
  void neuralClipUrl(text.trim(), voiceFor(options), Boolean(options.slow));
}

const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
const SYNTH_START_TIMEOUT_MS = 2500;
const SERVER_CACHE_LIMIT = 80;

let player: HTMLAudioElement | null = null;
let generation = 0;
let abortCurrent: (() => void) | null = null;
// Chrome garbage-collects in-flight utterances and then never fires onend.
let liveUtterance: SpeechSynthesisUtterance | null = null;
let lastCancelAt = 0;
const serverAudio = new Map<string, Promise<string | null>>();

function hasSynth() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function voices() {
  return hasSynth() ? window.speechSynthesis.getVoices() : [];
}

function sharedPlayer() {
  player ??= new Audio();
  return player;
}

// Safari only lets audio start from a tap. Playing silence through the shared
// element and the synthesizer on the first gesture unlocks both, so lines that
// start after a network reply or a timer are not blocked.
if (typeof window !== "undefined") {
  const unlock = () => {
    window.removeEventListener("pointerdown", unlock, true);
    window.removeEventListener("keydown", unlock, true);
    const audio = sharedPlayer();
    if (!audio.src) {
      audio.src = SILENT_WAV;
      void audio.play().catch(() => {});
    }
    if (hasSynth() && !window.speechSynthesis.speaking) {
      const primer = new SpeechSynthesisUtterance(" ");
      primer.volume = 0;
      window.speechSynthesis.speak(primer);
    }
  };
  window.addEventListener("pointerdown", unlock, true);
  window.addEventListener("keydown", unlock, true);
  if (hasSynth()) window.speechSynthesis.addEventListener?.("voiceschanged", voices);
}

const MALE_VOICE = /mattias|conrad|stefan|killian|florian|jeppe|\bmale\b|\bman\b|mann/i;
const FEMALE_VOICE = /sofie|hillevi|katja|hedda|amala|seraphina|anna|christel|female|kvinna|frau|google/i;

// A man keeps a man's voice even when the only natural-sounding voice on the
// device is a woman's (Chrome's Google voices), and the other way round.
function deviceVoice(gender: VoiceGender) {
  const code = island().code;
  const own = voices().filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(code));
  if (own.length === 0) return null;
  const natural = (v: SpeechSynthesisVoice) => /natural|online|neural|google/i.test(v.name);
  const matching = own.filter((v) => (gender === "man" ? MALE_VOICE.test(v.name) : FEMALE_VOICE.test(v.name) && !MALE_VOICE.test(v.name)));
  return matching.find(natural) ?? matching[0] ?? own.find(natural) ?? own[0];
}

export function stopSpeaking() {
  generation++;
  abortCurrent?.();
  abortCurrent = null;
  player?.pause();
  if (hasSynth() && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
    window.speechSynthesis.cancel();
    lastCancelAt = Date.now();
  }
  runtime.speaking = null;
}

export function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  stopSpeaking();
  sound.ensure();
  const id = generation;
  const who = options.who ?? null;
  const slow = options.slow ?? false;
  const pitch = options.pitch ?? 1;
  const voice = voiceFor(options);
  // Every fallback keeps the speaker's gender.
  const gender = genderOf(voice);
  const steps = [
    async () => {
      if (!text.trim()) return false;
      // Slow lines are generated slowly rather than played back slowed down.
      const url = await neuralClipUrl(text.trim(), voice, slow);
      return id === generation ? playUrl(url, false) : true;
    },
    () => playUrl(options.clipId ? getSpeechAudioUrl(island().code, options.clipId) : null, slow),
    () => speakOnDevice(text, { slow, pitch, gender, anyVoice: false }),
    async () => {
      const url = await serverSpeechUrl(text, pitch, gender);
      return id === generation ? playUrl(url, slow) : true;
    },
    () => speakOnDevice(text, { slow, pitch, gender, anyVoice: true }),
  ];
  return (async () => {
    runtime.speaking = who;
    for (const step of steps) {
      if (id !== generation) return;
      if (await step()) break;
    }
    if (id === generation && runtime.speaking === who) runtime.speaking = null;
  })();
}

// Resolves true once the clip has played (or was interrupted after starting),
// false when it could not start at all so the caller can try another source.
function playUrl(url: string | null, slow: boolean): Promise<boolean> {
  if (!url) return Promise.resolve(false);
  return new Promise((resolve) => {
    const audio = sharedPlayer();
    const listeners = new AbortController();
    let started = false;
    const finish = (played: boolean) => {
      if (listeners.signal.aborted) return;
      listeners.abort();
      if (abortCurrent === interrupt) abortCurrent = null;
      resolve(played);
    };
    const interrupt = () => finish(true);
    abortCurrent = interrupt;
    audio.addEventListener("ended", () => finish(true), { signal: listeners.signal });
    audio.addEventListener("error", () => finish(started), { signal: listeners.signal });
    audio.src = url;
    audio.defaultPlaybackRate = audio.playbackRate = slow ? 0.75 : 1;
    audio
      .play()
      .then(() => {
        started = true;
        sound.duck((audio.duration || 2) * 1000 + 400);
      })
      .catch(() => finish(false));
  });
}

function speakOnDevice(text: string, options: { slow: boolean; pitch: number; gender: VoiceGender; anyVoice: boolean }): Promise<boolean> {
  if (!hasSynth()) return Promise.resolve(false);
  const voice = deviceVoice(options.gender);
  if (!voice && !options.anyVoice) return Promise.resolve(false);
  const synth = window.speechSynthesis;
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? locale();
    utterance.rate = options.slow ? 0.7 : 0.92;
    utterance.pitch = Math.min(1.6, Math.max(0.6, options.pitch));
    let started = false;
    let settled = false;
    const timers: number[] = [];
    const finish = (played: boolean) => {
      if (settled) return;
      settled = true;
      timers.forEach((t) => window.clearTimeout(t));
      if (liveUtterance === utterance) liveUtterance = null;
      if (abortCurrent === interrupt) abortCurrent = null;
      if (!played) synth.cancel();
      resolve(played);
    };
    const interrupt = () => finish(true);
    abortCurrent = interrupt;
    utterance.onstart = () => {
      started = true;
      const expectedMs = (text.length * 110) / utterance.rate + 3000;
      sound.duck(Math.max(1500, text.length * 90));
      // Some engines never fire onend; don't let the conversation hang on it.
      timers.push(window.setTimeout(() => finish(true), expectedMs));
    };
    utterance.onend = () => finish(true);
    utterance.onerror = () => finish(started);
    // Online voices and locked Safari sessions can accept an utterance yet never start it.
    timers.push(window.setTimeout(() => finish(started), SYNTH_START_TIMEOUT_MS));
    liveUtterance = utterance;
    const start = () => {
      if (settled) return;
      synth.resume();
      synth.speak(utterance);
    };
    // Chrome drops an utterance queued right after cancel().
    const sinceCancel = Date.now() - lastCancelAt;
    if (sinceCancel < 120) timers.push(window.setTimeout(start, 120 - sinceCancel));
    else start();
  });
}

function serverSpeechUrl(text: string, pitch: number, gender: VoiceGender): Promise<string | null> {
  const voice = gender === "man" ? "male" : "female";
  const language = island().code;
  const key = `${language}\u0000${voice}\u0000${pitch}\u0000${text}`;
  const cached = serverAudio.get(key);
  if (cached) return cached;
  const request = fetch("/api/speech/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, text, voice, pitch }),
  })
    .then((response) => (response.ok ? response.blob() : null))
    .then((blob) => (blob && blob.size > 0 ? URL.createObjectURL(blob) : null))
    .catch(() => null);
  serverAudio.set(key, request);
  void request.then((url) => {
    if (!url) serverAudio.delete(key);
  });
  if (serverAudio.size > SERVER_CACHE_LIMIT) {
    const [oldestKey, oldest] = serverAudio.entries().next().value!;
    serverAudio.delete(oldestKey);
    void oldest.then((url) => url && URL.revokeObjectURL(url));
  }
  return request;
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

export function listen(onInterim?: (text: string) => void): Promise<{ transcript: string; alternatives: string[] }> {
  return new Promise((resolve, reject) => {
    const w = window as RecognitionWindow;
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return reject(new Error("unsupported"));
    stopSpeaking();
    active?.abort();
    const recognition = new Ctor();
    active = recognition;
    recognition.lang = locale();
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
