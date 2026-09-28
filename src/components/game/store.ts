"use client";

import { useSyncExternalStore } from "react";
import type { Line } from "@/lib/game/line";
import type { Experience } from "@/lib/game/placement";
import type { VillagerId } from "@/lib/game/villagers";
import type { TargetLanguageCode } from "@/lib/learning/languages";

export type Interactable = { kind: "villager"; id: VillagerId } | { kind: "discovery"; id: string };
export type Phase = "title" | "arrival" | "explore" | "dialogue";
export type Overlay = null | "ordbok" | "menu";
export type Toast = { id: number; kind: "word" | "level" | "info" | "friend"; line: Line; detail?: Line };

export type SaveData = {
  v: 3;
  name: string | null;
  introDone: boolean;
  discovered: string[];
  outfit: number;
  // Onboarding: what the learner told us, and where the placement check put them.
  experience: Experience | null;
  placedBand: number;
  grammarSeen: string[];
  // English under target-language lines: "auto" shows it to brand-new learners early on.
  english: "auto" | "on" | "off";
};

export type GameState = {
  phase: Phase;
  overlay: Overlay;
  nearby: Interactable | null;
  talkingTo: VillagerId | null;
  toasts: Toast[];
  save: SaveData;
  muted: boolean;
  music: boolean;
  // Bumps whenever a celebration (level up) should play in the world.
  celebration: number;
  loadedFor: string | null;
};

const emptySave: SaveData = {
  v: 3,
  name: null,
  introDone: false,
  discovered: [],
  outfit: 0,
  experience: null,
  placedBand: 0,
  grammarSeen: [],
  english: "auto",
};

let state: GameState = {
  phase: "title",
  overlay: null,
  nearby: null,
  talkingTo: null,
  toasts: [],
  save: emptySave,
  muted: false,
  music: true,
  celebration: 0,
  loadedFor: null,
};

const listeners = new Set<() => void>();
let saveKey: string | null = null;
let currentPlayerKey: string | null = null;

export function getGame() {
  return state;
}

export function setGame(patch: Partial<GameState> | ((current: GameState) => Partial<GameState>)) {
  const next = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...next };
  if ("save" in next && saveKey) {
    try {
      window.localStorage.setItem(saveKey, JSON.stringify(state.save));
      if (currentPlayerKey) window.localStorage.setItem(currentPlayerKey, JSON.stringify({ name: state.save.name, outfit: state.save.outfit }));
    } catch {
      // Storage can be unavailable (private mode); the island still works this session.
    }
  }
  if ("muted" in next || "music" in next) {
    try {
      window.localStorage.setItem("sapling:audio:v2", JSON.stringify({ muted: state.muted, music: state.music }));
    } catch {}
  }
  listeners.forEach((listener) => listener());
}

export function updateSave(patch: Partial<SaveData>) {
  setGame((current) => ({ save: { ...current.save, ...patch } }));
}

export function subscribeGame(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useGame<T>(selector: (state: GameState) => T): T {
  return useSyncExternalStore(
    subscribeGame,
    () => selector(state),
    () => selector(state),
  );
}

// Each island keeps its own save; your name and look travel with you.
export function saveKeyFor(learnerId: string, code: TargetLanguageCode) {
  return `sapling:island:v3:${learnerId}:${code}`;
}
const playerKey = (learnerId: string) => `sapling:player:${learnerId}`;

export function readSave(learnerId: string, code: TargetLanguageCode): SaveData | null {
  try {
    // Swedish saves from before there were other islands.
    const raw = window.localStorage.getItem(saveKeyFor(learnerId, code)) ?? (code === "sv" ? window.localStorage.getItem(`sapling:island:v2:${learnerId}`) : null);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Omit<Partial<SaveData>, "v"> & { v?: number };
    if (parsed.v !== 2 && parsed.v !== 3) return null;
    return {
      ...emptySave,
      ...parsed,
      v: 3,
      discovered: Array.isArray(parsed.discovered) ? parsed.discovered : [],
      grammarSeen: Array.isArray(parsed.grammarSeen) ? parsed.grammarSeen : [],
      // Saves from before onboarding existed already met the host; don't quiz them again.
      experience: parsed.experience ?? (parsed.introDone ? "little" : null),
    };
  } catch {
    return null;
  }
}

export function loadSave(learnerId: string, code: TargetLanguageCode) {
  saveKey = saveKeyFor(learnerId, code);
  currentPlayerKey = playerKey(learnerId);
  let save = readSave(learnerId, code);
  let audio = { muted: false, music: true };
  try {
    if (!save) {
      const player = JSON.parse(window.localStorage.getItem(currentPlayerKey) ?? "{}") as { name?: string | null; outfit?: number };
      save = { ...emptySave, name: player.name ?? null, outfit: player.outfit ?? 0 };
    }
    const audioRaw = window.localStorage.getItem("sapling:audio:v2");
    if (audioRaw) audio = { ...audio, ...JSON.parse(audioRaw) };
  } catch {}
  state = { ...state, phase: "title", overlay: null, nearby: null, talkingTo: null, save: save ?? emptySave, muted: Boolean(audio.muted), music: audio.music !== false, loadedFor: `${learnerId}:${code}` };
  listeners.forEach((listener) => listener());
}

let toastId = 0;
export function toast(kind: Toast["kind"], line: Line, detail?: Line, ms = 3800) {
  const id = ++toastId;
  setGame((current) => ({ toasts: [...current.toasts.slice(-3), { id, kind, line, detail }] }));
  window.setTimeout(() => setGame((current) => ({ toasts: current.toasts.filter((t) => t.id !== id) })), ms);
}

// Per-frame values live outside React so the render loop never re-renders the UI.
export const runtime = {
  player: { x: 0, y: 1, z: 0, rot: Math.PI, speed: 0 },
  walkTarget: null as null | { x: number; z: number; then?: Interactable },
  keys: new Set<string>(),
  cameraYaw: 0,
  cameraDistance: 15,
  speaking: null as null | VillagerId | "player",
  emote: {} as Partial<Record<VillagerId | "player", { kind: "happy" | "think" | "wave"; until: number }>>,
  lastInteraction: 0,
};

export function emote(who: VillagerId | "player", kind: "happy" | "think" | "wave", ms = 1400) {
  runtime.emote[who] = { kind, until: performance.now() + ms };
}
