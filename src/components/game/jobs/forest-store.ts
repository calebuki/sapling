"use client";

import { useSyncExternalStore } from "react";
import { forestLevel, forestStars, judgeWeather, makeMap, mismatch, type ForestConfig, type ForestLevel, type ForestTask, type Terrain, type Tile, type Weather } from "@/lib/game/forest";
import { pick, type Line } from "@/lib/game/line";
import type { Villager } from "@/lib/game/villagers";
import type { ItemId } from "@/lib/game/wardrobe";
import type { Observation } from "@/lib/learning/adaptive";
import type { TargetLanguageCode } from "@/lib/learning/languages";
import { sound } from "../audio/sfx";
import { speak, speakLine } from "../audio/speech";
import { emote, setGame } from "../store";
import { stationOf } from "./forest-layout";
import { finishJob } from "./progress";
import { jobPlayer, placePlayer } from "./walk";

// The mountain rescue with the forester: hikers radio in to say where they
// are, you point to the place on the map, and now and then you tell him what
// the weather is like where he's driving.

export type ForestStatus = "intro" | "running" | "done" | "leaving";

export type ForestState = {
  status: ForestStatus;
  levelIndex: number;
  level: ForestLevel;
  tiles: Tile[];
  tasks: ForestTask[];
  index: number;
  // Heard-only calls show their words after "pardon?".
  revealed: boolean;
  // The forester's last words, over his head.
  said: Line | null;
  // Misses on the current task; the first try is the evidence.
  misses: number;
  // Tiles where someone has been found, and the last one you got wrong.
  rescued: number[];
  wrongTile: { id: number; at: number } | null;
  done: number;
  words: Record<string, [number, number]>;
  levelUp: boolean;
  gift: ItemId | null;
  late: boolean;
  timeLeft: number;
};

export type ForestSetup = {
  code: TargetLanguageCode;
  host: Villager;
  forest: ForestConfig;
  places: Terrain[];
  weathers: Weather[];
  animals: string[];
  weight: (slug: string) => number;
  conceptId: (slug: string) => string | null;
  record: (observation: Observation) => Promise<unknown>;
};

let setup: ForestSetup | null = null;
let state: ForestState = blank(0);
const listeners = new Set<() => void>();

function blank(levelIndex: number): ForestState {
  const level = forestLevel(levelIndex);
  return { status: "intro", levelIndex, level, tiles: [], tasks: [], index: 0, revealed: !level.heard, said: null, misses: 0, rescued: [], wrongTile: null, done: 0, words: {}, levelUp: false, gift: null, late: false, timeLeft: 1 };
}

function set(patch: Partial<ForestState> | ((s: ForestState) => Partial<ForestState>)) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  listeners.forEach((l) => l());
}

export function getForest() {
  return state;
}

export function forestSetup() {
  return setup;
}

export function useForest<T>(selector: (s: ForestState) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => selector(state),
    () => selector(state),
  );
}

export const forestRuntime = {
  seconds: 0,
  total: 1,
  // The clock waits while you answer the forester.
  paused: false,
  // When the radio last crackled, for the light on it.
  calledAt: -10,
};

export function currentTask() {
  return state.tasks[state.index] ?? null;
}

export function tileOf(id: number) {
  return state.tiles.find((t) => t.id === id) ?? null;
}

// ---------- Starting and leaving ----------

export function startForest(next: ForestSetup, levelIndex: number) {
  setup = next;
  const level = forestLevel(levelIndex);
  const map = makeMap(next.forest, { level, places: next.places, weathers: next.weathers, animals: next.animals, weight: next.weight, seed: Math.floor(Math.random() * 1e9) });
  state = { ...blank(levelIndex), tiles: map.tiles, tasks: map.tasks };
  // You stand at the radio, looking over the map.
  const { player } = stationOf(map.tiles.length);
  placePlayer(player, -Math.PI / 2 - 0.4, [], { minX: player.x, maxX: player.x, minZ: player.z, maxZ: player.z });
  jobPlayer.locked = true;
  forestRuntime.seconds = level.seconds;
  forestRuntime.total = level.seconds;
  forestRuntime.paused = false;
  setGame({ phase: "job", job: "forest", talkingTo: null, nearby: null });
  listeners.forEach((l) => l());
}

export function beginForest() {
  sound.play("ring");
  set({ status: "running" });
  startTask();
}

export function leaveForest() {
  if (state.status === "leaving") return;
  forestRuntime.paused = true;
  set({ status: "leaving" });
  sound.play("close");
  setGame({ phase: "explore", job: null });
}

// ---------- The loop ----------

export function tickForest(delta: number) {
  if (state.status !== "running" || forestRuntime.paused) return;
  forestRuntime.seconds = Math.max(0, forestRuntime.seconds - delta);
  if (forestRuntime.seconds <= 0) finish(true);
}

function hostVoice() {
  return { who: setup!.host.id, pitch: setup!.host.voicePitch };
}

function hostSays(line: Line) {
  void speakLine(line, hostVoice());
  set({ said: line });
}

export function sayTask(slow = false) {
  const task = currentTask();
  if (!task) return;
  if (task.kind === "call") {
    forestRuntime.calledAt = performance.now() / 1000;
    void speakLine(task.line, { gender: task.caller.gender, slow });
  } else void speakLine(task.line, { ...hostVoice(), slow });
}

// "Pardon?": slowly again, and the words show. Costs a little time.
export function pardon() {
  forestRuntime.seconds = Math.max(1, forestRuntime.seconds - 3);
  sound.play("pop");
  set({ revealed: true });
  sayTask(true);
}

function startTask() {
  const task = currentTask();
  if (!task || !setup) return;
  set({ misses: 0, revealed: !state.level.heard || task.kind === "weather", wrongTile: null });
  forestRuntime.paused = task.kind === "weather";
  if (task.kind === "call") {
    // The radio crackles, then the caller speaks.
    sound.play("ring");
    window.setTimeout(() => {
      if (currentTask() === task) {
        set({ said: null });
        sayTask();
      }
    }, 700);
  } else {
    set({ said: task.line });
    window.setTimeout(() => currentTask() === task && sayTask(), 300);
  }
}

function nextTask() {
  if (state.status !== "running") return;
  const index = state.index + 1;
  set({ index, done: state.done + 1 });
  if (index >= state.tasks.length) {
    window.setTimeout(() => finish(false), 1600);
    return;
  }
  window.setTimeout(startTask, 2000);
}

// ---------- Pointing at the map ----------

export function pointAt(id: number) {
  const task = currentTask();
  if (state.status !== "running" || !setup) return;
  if (task?.kind !== "call") {
    sound.play("pop");
    return;
  }
  const want = tileOf(task.tile)!;
  const got = tileOf(id);
  if (!got || state.rescued.includes(id)) return;
  const { forest } = setup;
  const place = forest.places.find((p) => p.id === want.terrain)!;
  if (!state.misses) {
    // Each thing the caller said counts for its word: right if the place you chose fits it.
    const assisted = state.revealed;
    const heard = { heardOnly: !assisted, clues: task.clues.join(",") };
    if (task.clues.includes("place")) observe(place.concept, "recognitionAudio", got.terrain === want.terrain, assisted, "", task.line.t, heard);
    if (task.clues.includes("weather")) {
      const weather = forest.weathers.find((w) => w.id === want.weather);
      if (weather) observe(weather.concepts[0], "recognitionAudio", got.weather === want.weather, assisted, "", task.line.t, heard);
    }
    if (task.clues.includes("animal") && want.animal) observe(want.animal.slug, "recognitionAudio", got.animal?.slug === want.animal.slug, assisted, "", task.line.t, heard);
  }
  const clue = got.id === want.id ? null : mismatch(want, got, task.clues);
  if (!clue) {
    // Right, or a place that fits everything they said just as well.
    sound.play("correct");
    emote(setup.host.id, "happy", 1400);
    emote("player", "happy", 1000);
    set((s) => ({ rescued: [...s.rescued, got.id] }));
    hostSays(pick(forest.lines.found));
    nextTask();
    return;
  }
  sound.play("wrong");
  emote(setup.host.id, "think", 1400);
  forestRuntime.seconds = Math.max(1, forestRuntime.seconds - 5);
  set({ misses: state.misses + 1, wrongTile: { id, at: performance.now() / 1000 } });
  hostSays(forest.wrong(task.caller, want, got, clue));
}

// ---------- Telling the forester the weather ----------

export function answer(text: string, via: "text" | "speech", hinted: boolean) {
  const task = currentTask();
  if (state.status !== "running" || task?.kind !== "weather" || !setup) return;
  const { forest } = setup;
  const tile = tileOf(task.tile)!;
  const { ok, word } = judgeWeather(forest, tile.weather, text, setup.code);
  if (!state.misses || ok) observe(word.concepts[0], "production", ok, hinted, text, word.say.t, { input: via, modality: via === "speech" ? "speech" : "text" });
  if (ok) {
    sound.play("correct");
    emote(setup.host.id, "happy", 1400);
    hostSays(forest.gear(tile.weather));
    forestRuntime.paused = false;
    nextTask();
    return;
  }
  sound.play("wrong");
  set({ misses: state.misses + 1 });
  if (state.misses >= 2) {
    // Twice wrong: he looks himself, says it, and off he goes.
    hostSays(word.say);
    forestRuntime.paused = false;
    nextTask();
  } else hostSays(forest.lines.weatherWrong);
}

function finish(late: boolean) {
  if (state.status !== "running" || !setup) return;
  const timeLeft = forestRuntime.seconds / forestRuntime.total;
  const stars = forestStars(state.done, state.tasks.length, timeLeft);
  const host = setup.host.id;
  const { levelUp, gift } = finishJob(host, state.levelIndex, stars);
  sound.play(stars >= 2 ? "levelup" : "sparkle");
  emote(host, stars >= 2 ? "happy" : "think", 2000);
  const lines = setup.forest.lines;
  void speak((late ? lines.late : lines.done[stars >= 3 ? 0 : stars >= 2 ? 1 : 2]).t, hostVoice());
  forestRuntime.paused = false;
  set({ status: "done", levelUp, gift, late, timeLeft, said: null });
}

// Developer checks: skip straight to one of the shift's tasks.
export function jumpToTask(index: number) {
  if (state.status !== "running" || !state.tasks[index]) return;
  set({ index, done: index });
  startTask();
}

// ---------- Evidence ----------

function observe(
  slug: string,
  dimension: Observation["dimension"],
  successful: boolean,
  assisted: boolean,
  response: string,
  expected: string,
  extra: Record<string, string | number | boolean | null>,
) {
  if (!setup) return;
  const conceptId = setup.conceptId(slug);
  if (!conceptId) return;
  set((s) => {
    const [right, total] = s.words[slug] ?? [0, 0];
    return { words: { ...s.words, [slug]: [right + (successful ? 1 : 0), total + 1] } };
  });
  void setup
    .record({
      attemptId: crypto.randomUUID(),
      conceptId,
      dimension,
      successful,
      assisted,
      latencyMs: null,
      response,
      expected,
      context: { villager: setup.host.id, source: "forest-rescue", level: state.levelIndex, task: currentTask()?.kind ?? null, ...extra },
    })
    .catch((cause) => console.error("Could not record observation", cause));
}
