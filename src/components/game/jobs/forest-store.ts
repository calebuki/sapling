"use client";

import { useSyncExternalStore } from "react";
import {
  forestLevel,
  forestStars,
  judgeHobby,
  judgeWeather,
  makeSurvey,
  type ForestConfig,
  type ForestLevel,
  type ForestTask,
  type Habitat,
  type Sighting,
  type Weather,
} from "@/lib/game/forest";
import { pick, type Line } from "@/lib/game/line";
import type { Villager } from "@/lib/game/villagers";
import type { ItemId } from "@/lib/game/wardrobe";
import type { Observation } from "@/lib/learning/adaptive";
import type { TargetLanguageCode } from "@/lib/learning/languages";
import { sound } from "../audio/sfx";
import { speak, speakLine } from "../audio/speech";
import { emote, setGame } from "../store";
import { BOUNDS, HIKER_PATH, HIKER_SPOT, PLAYER_SPOT } from "./forest-layout";
import { finishJob } from "./progress";
import { jobPlayer, placePlayer, stepWalker, walker, type Walker } from "./walk";

// The wildlife survey with the forester: photograph the animal he names,
// count a herd, write the weather in the logbook as it turns, and now and
// then answer a hiker who asks what you like doing.

export type ForestStatus = "intro" | "running" | "done" | "leaving";

export type ForestState = {
  status: ForestStatus;
  levelIndex: number;
  level: ForestLevel;
  sightings: Sighting[];
  tasks: ForestTask[];
  index: number;
  weather: Weather;
  // Heard-only requests show their words after "pardon?".
  revealed: boolean;
  said: { line: Line; by: "host" | "hiker" | "player"; repeats?: boolean } | null;
  // Misses on the current task; the first try is the evidence.
  misses: number;
  // The animal under the mouse, named while the survey is new.
  hover: number | null;
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
  animals: string[];
  places: Habitat[];
  weathers: Weather[];
  numbers: number[];
  hobbies: boolean;
  weight: (slug: string) => number;
  conceptId: (slug: string) => string | null;
  record: (observation: Observation) => Promise<unknown>;
};

let setup: ForestSetup | null = null;
let state: ForestState = blank(0);
const listeners = new Set<() => void>();

function blank(levelIndex: number): ForestState {
  const level = forestLevel(levelIndex);
  return { status: "intro", levelIndex, level, sightings: [], tasks: [], index: 0, weather: "sun", revealed: !level.heard, said: null, misses: 0, hover: null, done: 0, words: {}, levelUp: false, gift: null, late: false, timeLeft: 1 };
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
  hiker: walker(HIKER_PATH[0]) as Walker,
  hikerArrive: null as null | (() => void),
  seconds: 0,
  total: 1,
  // The clock waits while you write in the logbook.
  paused: false,
  // When the last photo was taken, for the flash.
  flashAt: -10,
};

export function currentTask() {
  return state.tasks[state.index] ?? null;
}

// ---------- Starting and leaving ----------

export function startForest(next: ForestSetup, levelIndex: number) {
  setup = next;
  const level = forestLevel(levelIndex);
  const survey = makeSurvey(next.forest, { level, animals: next.animals, places: next.places, weathers: next.weathers, numbers: next.numbers, hobbies: next.hobbies, weight: next.weight, seed: Math.floor(Math.random() * 1e9) });
  state = { ...blank(levelIndex), sightings: survey.sightings, tasks: survey.tasks, weather: survey.start };
  placePlayer({ x: PLAYER_SPOT.x, z: PLAYER_SPOT.z + 1.5 }, Math.PI, [PLAYER_SPOT], BOUNDS);
  jobPlayer.arrive = () => (jobPlayer.walker.rot = Math.PI);
  forestRuntime.hiker = walker(HIKER_PATH[0]);
  forestRuntime.hikerArrive = null;
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
  jobPlayer.locked = true;
  forestRuntime.paused = true;
  set({ status: "leaving" });
  sound.play("close");
  setGame({ phase: "explore", job: null });
}

// ---------- The loop ----------

export function tickForest(delta: number) {
  if (stepWalker(forestRuntime.hiker, delta, 2.2) && forestRuntime.hikerArrive) {
    const then = forestRuntime.hikerArrive;
    forestRuntime.hikerArrive = null;
    then();
  }
  if (state.status !== "running" || forestRuntime.paused) return;
  forestRuntime.seconds = Math.max(0, forestRuntime.seconds - delta);
  if (forestRuntime.seconds <= 0) finish(true);
}

function hostVoice() {
  return { who: setup!.host.id, pitch: setup!.host.voicePitch };
}

function hostSays(line: Line, repeats = false) {
  void speakLine(line, hostVoice());
  set({ said: { line, by: "host", repeats } });
}

function hikerSays(line: Line) {
  void speakLine(line, { gender: "man" });
  set({ said: { line, by: "hiker" } });
}

// What the current task asks, which "pardon?" repeats.
export function taskLine(task: ForestTask | null = currentTask()): { line: Line; by: "host" | "hiker" } | null {
  if (!task) return null;
  return { line: task.line, by: task.kind === "hobby" ? "hiker" : "host" };
}

export function sayTask(slow = false) {
  const current = taskLine();
  if (!current) return;
  void speakLine(current.line, current.by === "hiker" ? { gender: "man", slow } : { ...hostVoice(), slow });
}

export function pardon() {
  forestRuntime.seconds = Math.max(1, forestRuntime.seconds - 3);
  sound.play("pop");
  set({ revealed: true, said: null });
  sayTask(true);
}

export function hoverAnimal(id: number | null) {
  if (state.hover !== id) set({ hover: id });
}

function startTask() {
  const task = currentTask();
  if (!task || !setup) return;
  set({ misses: 0, said: null, revealed: !state.level.heard });
  forestRuntime.paused = task.kind !== "photo";
  if (task.kind === "weather") {
    // The sky turns first; then the forester asks.
    sound.play("whoosh");
    set({ weather: task.weather });
    window.setTimeout(() => sayTask(), 1600);
  } else if (task.kind === "hobby") {
    forestRuntime.hiker = walker(HIKER_PATH[0], -Math.PI / 2, [...HIKER_PATH.slice(1), HIKER_SPOT]);
    forestRuntime.hikerArrive = () => {
      forestRuntime.hiker.rot = Math.PI / 2;
      const { lines } = setup!.forest;
      void speakLine({ t: `${lines.hikerHello.t} ${lines.hikerAsk.t}`, en: `${lines.hikerHello.en} ${lines.hikerAsk.en}`, parts: [lines.hikerHello.t, lines.hikerAsk.t] }, { gender: "man" });
      set({ said: { line: lines.hikerHello, by: "hiker" } });
    };
  } else window.setTimeout(() => sayTask(), 300);
}

function nextTask() {
  if (state.status !== "running") return;
  const index = state.index + 1;
  set({ index, done: state.done + 1 });
  if (index >= state.tasks.length) {
    window.setTimeout(() => finish(false), 1500);
    return;
  }
  window.setTimeout(startTask, 1700);
}

// ---------- Photos ----------

export function photograph(id: number) {
  const task = currentTask();
  if (state.status !== "running" || task?.kind !== "photo" || !setup) return;
  const got = state.sightings.find((s) => s.id === id);
  if (!got) return;
  forestRuntime.flashAt = performance.now() / 1000;
  sound.play("pop");
  emote("player", "happy", 600);
  const { forest } = setup;
  const want = task.target;
  const sameAnimal = got.animal.slug === want.animal.slug;
  const twin = state.sightings.some((s) => s !== want && s.animal === want.animal);
  const place = forest.places.find((p) => p.id === want.habitat);
  if (!state.misses) {
    observe(want.animal.slug, "recognitionAudio", sameAnimal, state.revealed, "", task.line.t, {});
    if (twin && place) observe(place.concept, "recognitionAudio", got === want, state.revealed, "", task.line.t, {});
  }
  if (got === want || (sameAnimal && !twin)) {
    sound.play("correct");
    hostSays(pick(forest.lines.nice));
    nextTask();
    return;
  }
  sound.play("wrong");
  forestRuntime.seconds = Math.max(1, forestRuntime.seconds - 4);
  set({ misses: state.misses + 1 });
  hostSays(sameAnimal && place ? forest.wrongPlace(place) : forest.wrongAnimal(got.animal));
}

// ---------- The logbook: counts, weather, hobbies ----------

export function answer(text: string, via: "text" | "speech", hinted: boolean) {
  const task = currentTask();
  if (state.status !== "running" || !task || task.kind === "photo" || !setup) return;
  const { forest } = setup;
  const extra = { input: via, modality: via === "speech" ? "speech" : "text" };
  if (task.kind === "count") {
    const n = forest.parseNumber(text, setup.code);
    if (n === "digits") {
      sound.play("wrong");
      hostSays(forest.lines.words);
      return;
    }
    if (n === null) {
      sound.play("wrong");
      hostSays(forest.lines.countHow);
      return;
    }
    const right = n === task.target.count;
    if (!state.misses) {
      const concept = forest.numbers[task.target.count];
      if (concept) observe(concept, "production", right, hinted, text, String(task.target.count), extra);
    }
    // Right or not, he says how many there are, and on we go.
    sound.play(right ? "correct" : "wrong");
    hostSays(right ? forest.counted(task.target.animal, task.target.count) : forest.miscounted(task.target.animal, task.target.count), true);
    forestRuntime.paused = false;
    nextTask();
    return;
  }
  if (task.kind === "weather") {
    const { ok, word } = judgeWeather(forest, task.weather, text, setup.code);
    if (!state.misses || ok) observe(word.concepts[0], "production", ok, hinted, text, word.say.t, extra);
    if (ok) {
      sound.play("correct");
      void speakLine(word.say, { who: "player" });
      set({ said: { line: word.say, by: "player" } });
      window.setTimeout(() => hostSays(forest.lines.weatherRight), 1400);
      forestRuntime.paused = false;
      nextTask();
      return;
    }
    sound.play("wrong");
    set({ misses: state.misses + 1 });
    if (state.misses >= 2) {
      // Twice wrong: he says it, and it goes in the logbook anyway.
      hostSays(word.say, true);
      forestRuntime.paused = false;
      nextTask();
    } else hostSays(forest.lines.weatherWrong);
    return;
  }
  // The hiker: anything you like doing, said with a hobby the course teaches.
  const { hobbies, framed } = judgeHobby(forest, text, setup.code);
  const ok = hobbies.length > 0;
  if (!state.misses || ok) {
    for (const h of hobbies) observe(h.concept, "production", true, hinted, text, text, extra);
    observe(forest.likeFrame.concept, "production", ok && framed, hinted, text, text, extra);
  }
  if (ok || state.misses >= 1) {
    if (ok) sound.play("correct");
    hikerSays(forest.lines.hikerReply);
    forestRuntime.hiker.path = [HIKER_PATH[HIKER_PATH.length - 1], { x: 12, z: HIKER_PATH[HIKER_PATH.length - 1].z }];
    forestRuntime.paused = false;
    nextTask();
    return;
  }
  sound.play("wrong");
  set({ misses: state.misses + 1 });
  hikerSays(forest.lines.hikerHuh);
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
      context: { villager: setup.host.id, source: "forest", level: state.levelIndex, task: currentTask()?.kind ?? null, ...extra },
    })
    .catch((cause) => console.error("Could not record observation", cause));
}
