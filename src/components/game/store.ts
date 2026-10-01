"use client";

import { readShifts } from "@/lib/game/jobs";
import { useSyncExternalStore } from "react";
import type { Line } from "@/lib/game/line";
import type { Experience } from "@/lib/game/placement";
import type { VillagerId } from "@/lib/game/villagers";
import type { TargetLanguageCode } from "@/lib/learning/languages";

export type Interactable = { kind: "villager"; id: VillagerId } | { kind: "discovery"; id: string };
export type Phase = "title" | "arrival" | "explore" | "dialogue" | "job";
// Mini-games played indoors with your own character: the café rush, Hilde's farmhouse.
export type JobId = "cafe" | "home" | "clinic" | "clock" | "ferry" | "market" | "forest" | "station";
export type Overlay = null | "ordbok" | "menu" | "wardrobe";
export type Toast = { id: number; kind: "word" | "level" | "info" | "friend" | "gift"; line: Line; detail?: Line };

export type SaveData = {
  v: 3;
  name: string | null;
  introDone: boolean;
  discovered: string[];
  // The look before the wardrobe; kept so older saves still read. See wardrobe/store.
  outfit: number;
  // Earned wardrobe pieces a villager here has already complimented.
  noticed: string[];
  // Onboarding: what the learner told us, and where the placement check put them.
  experience: Experience | null;
  placedBand: number;
  grammarSeen: string[];
  // English under target-language lines: "auto" shows it to brand-new learners early on.
  english: "auto" | "on" | "off";
  // Jobs per host (café shifts, Hilde's farmhouse): the hardest rung opened so far, and the best stars on each.
  shifts: Record<string, { level: number; stars: number[] }>;
};

export type GameState = {
  phase: Phase;
  overlay: Overlay;
  nearby: Interactable | null;
  talkingTo: VillagerId | null;
  // Which job's room is open while the phase is "job".
  job: JobId | null;
  toasts: Toast[];
  save: SaveData;
  muted: boolean;
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
  noticed: [],
  experience: null,
  placedBand: 0,
  grammarSeen: [],
  english: "auto",
  shifts: {},
};

let state: GameState = {
  phase: "title",
  overlay: null,
  nearby: null,
  talkingTo: null,
  job: null,
  toasts: [],
  save: emptySave,
  muted: false,
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
  if ("muted" in next) {
    try {
      window.localStorage.setItem("sapling:audio:v2", JSON.stringify({ muted: state.muted }));
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
      shifts: readShifts(parsed.shifts),
      noticed: Array.isArray(parsed.noticed) ? parsed.noticed.filter((id): id is string => typeof id === "string") : [],
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
  let audio = { muted: false };
  try {
    if (!save) {
      const player = JSON.parse(window.localStorage.getItem(currentPlayerKey) ?? "{}") as { name?: string | null; outfit?: number };
      save = { ...emptySave, name: player.name ?? null, outfit: player.outfit ?? 0 };
    }
    const audioRaw = window.localStorage.getItem("sapling:audio:v2");
    if (audioRaw) audio = { ...audio, ...JSON.parse(audioRaw) };
  } catch {}
  state = { ...state, phase: "title", overlay: null, nearby: null, talkingTo: null, save: save ?? emptySave, muted: Boolean(audio.muted), loadedFor: `${learnerId}:${code}` };
  listeners.forEach((listener) => listener());
}

let toastId = 0;
export function toast(kind: Toast["kind"], line: Line, detail?: Line, ms = 3800) {
  const id = ++toastId;
  setGame((current) => ({ toasts: [...current.toasts.slice(-3), { id, kind, line, detail }] }));
  window.setTimeout(() => setGame((current) => ({ toasts: current.toasts.filter((t) => t.id !== id) })), ms);
}

// Per-frame values live outside React so the render loop never re-renders the UI.
function readCameraSnap() {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem("sapling:camera") === "snap";
  } catch {
    return false;
  }
}

export function setCameraSnap(on: boolean) {
  runtime.cameraSnap = on;
  runtime.cameraYawTarget = Math.round(runtime.cameraYaw / (Math.PI / 2)) * (Math.PI / 2);
  try {
    window.localStorage.setItem("sapling:camera", on ? "snap" : "free");
  } catch {
    // Private windows can refuse storage; the toggle still works for this visit.
  }
}

export const runtime = {
  player: { x: 0, y: 1, z: 0, rot: Math.PI, speed: 0 },
  walkTarget: null as null | { x: number; z: number; then?: Interactable },
  // The spawn point last applied, so returning from a shift doesn't send you back to it.
  spawnedAt: null as unknown,
  keys: new Set<string>(),
  cameraYaw: 0,
  cameraDistance: 15,
  // Snap mode: a fixed diorama angle that turns in 90° steps (toggle with V).
  cameraSnap: readCameraSnap(),
  cameraYawTarget: 0,
  speaking: null as null | VillagerId | "player",
  emote: {} as Partial<Record<VillagerId | "player", { kind: "happy" | "think" | "wave"; until: number }>>,
  lastInteraction: 0,
};

export function emote(who: VillagerId | "player", kind: "happy" | "think" | "wave", ms = 1400) {
  runtime.emote[who] = { kind, until: performance.now() + ms };
}
