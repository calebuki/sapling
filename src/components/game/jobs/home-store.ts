"use client";

import { useSyncExternalStore } from "react";
import { arrange, homeLevel, homeStars, placeIn, type HomeConfig, type HomeLevel, type Placement, type Spot, type Task } from "@/lib/game/home";
import { pick, type Line } from "@/lib/game/line";
import type { Villager } from "@/lib/game/villagers";
import type { Observation } from "@/lib/learning/adaptive";
import type { TargetLanguageCode } from "@/lib/learning/languages";
import { sound } from "../audio/sfx";
import { speak, speakLine } from "../audio/speech";
import type { ItemId } from "@/lib/game/wardrobe";
import { emote, setGame } from "../store";
import { finishJob } from "./progress";
import { BOUNDS, DOOR_INSIDE, DOOR_OUTSIDE, HAND_OVER, HOST_SPOT, PLAYER_START, route, standFor } from "./home-layout";
import { jobPlayer, placePlayer, stepWalker, walker, walkTo, type Walker } from "./walk";

// Helping the host find their things before the family comes. React sees the
// room, the current job and the score; the clock and the host's walk tick in
// `homeRuntime` every frame.

export type HomeStatus = "intro" | "running" | "done" | "leaving";

export type HomeState = {
  status: HomeStatus;
  levelIndex: number;
  level: HomeLevel;
  // What's still lying about the room.
  room: Placement[];
  tasks: Task[];
  index: number;
  carrying: Placement | null;
  // Heard-only requests show their words after "pardon?".
  revealed: boolean;
  // The host's last reaction, shown over their head.
  said: Line | null;
  // The reaction already repeats the request, so the bubble needn't.
  reminded: boolean;
  // The host is off looking somewhere you told them.
  searching: boolean;
  found: number;
  // A wrong try already counted against this job.
  missed: boolean;
  words: Record<string, [number, number]>;
  levelUp: boolean;
  // Work clothes the host just gave you, if this run earned them.
  gift: ItemId | null;
  late: boolean;
  timeLeft: number;
};

export type HomeSetup = {
  code: TargetLanguageCode;
  host: Villager;
  home: HomeConfig;
  anchors: string[];
  things: string[];
  spots: Spot[];
  weight: (slug: string) => number;
  conceptId: (slug: string) => string | null;
  record: (observation: Observation) => Promise<unknown>;
};

const HOST_WALK = 4.2;

let setup: HomeSetup | null = null;
let state: HomeState = blank(0);
const listeners = new Set<() => void>();

function blank(levelIndex: number): HomeState {
  const level = homeLevel(levelIndex);
  return { status: "intro", levelIndex, level, room: [], tasks: [], index: 0, carrying: null, revealed: !level.heard, said: null, reminded: false, searching: false, found: 0, missed: false, words: {}, levelUp: false, gift: null, late: false, timeLeft: 1 };
}

function set(patch: Partial<HomeState> | ((s: HomeState) => Partial<HomeState>)) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  listeners.forEach((l) => l());
}

export function getHome() {
  return state;
}

export function homeSetup() {
  return setup;
}

export function useHome<T>(selector: (s: HomeState) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => selector(state),
    () => selector(state),
  );
}

export const homeRuntime = {
  host: walker(HOST_SPOT) as Walker,
  hostArrive: null as null | (() => void),
  seconds: 0,
  total: 1,
};

export function currentTask() {
  return state.tasks[state.index] ?? null;
}

// ---------- Starting and leaving ----------

export function startHome(next: HomeSetup, levelIndex: number) {
  setup = next;
  const level = homeLevel(levelIndex);
  const { placements, tasks } = arrange(next.home, { level, anchors: next.anchors, things: next.things, spots: next.spots, weight: next.weight, seed: Math.floor(Math.random() * 1e9) });
  state = { ...blank(levelIndex), room: placements, tasks };
  // In through the front door, up to the middle of the room.
  placePlayer(DOOR_OUTSIDE, Math.PI / 2, [DOOR_INSIDE, PLAYER_START], BOUNDS);
  homeRuntime.host = walker(HOST_SPOT, 0);
  homeRuntime.hostArrive = null;
  homeRuntime.seconds = level.seconds;
  homeRuntime.total = level.seconds;
  setGame({ phase: "job", job: "home", talkingTo: null, nearby: null });
  listeners.forEach((l) => l());
}

export function beginHome() {
  sound.play("ring");
  set({ status: "running" });
  sayTask();
}

export function leaveHome() {
  if (state.status === "leaving") return;
  jobPlayer.locked = true;
  set({ status: "leaving" });
  walkTo([...route(jobPlayer.walker, DOOR_INSIDE), DOOR_OUTSIDE], () => {
    sound.play("close");
    setGame({ phase: "explore", job: null });
  });
}

// ---------- The loop ----------

export function tickHome(delta: number) {
  const host = homeRuntime.host;
  if (stepWalker(host, delta, HOST_WALK) && homeRuntime.hostArrive) {
    const then = homeRuntime.hostArrive;
    homeRuntime.hostArrive = null;
    then();
  }
  // The clock waits while the host is off looking where you said: that's her time, not yours.
  if (state.status !== "running" || state.searching) return;
  homeRuntime.seconds = Math.max(0, homeRuntime.seconds - delta);
  if (homeRuntime.seconds <= 0) finish(true);
}

function hostVoice() {
  return { who: setup!.host.id, pitch: setup!.host.voicePitch };
}

function hostSays(line: Line, reminded = false) {
  void speakLine(line, hostVoice());
  set({ said: line, reminded });
}

export function sayTask(slow = false) {
  const task = currentTask();
  if (!task || !setup) return;
  void speakLine(task.line, { ...hostVoice(), slow });
}

// "Pardon?": slowly again, and the words show. Costs a little time.
export function pardon() {
  homeRuntime.seconds = Math.max(1, homeRuntime.seconds - 3);
  sound.play("pop");
  set({ revealed: true, said: null, reminded: false });
  sayTask(true);
}

function nextTask() {
  const index = state.index + 1;
  // The thanks stay up until the next request is spoken.
  set({ index, carrying: null, missed: false, revealed: !state.level.heard, searching: false, found: state.found + 1 });
  if (index >= state.tasks.length) {
    finish(false);
    return;
  }
  window.setTimeout(() => {
    if (state.index !== index || state.status !== "running") return;
    set({ said: null, reminded: false });
    sayTask();
  }, 1400);
}

function finish(late: boolean) {
  if (state.status !== "running" || !setup) return;
  const timeLeft = homeRuntime.seconds / homeRuntime.total;
  const stars = homeStars(state.found, state.tasks.length, timeLeft);
  const host = setup.host.id;
  const { levelUp, gift } = finishJob(host, state.levelIndex, stars);
  sound.play(stars >= 2 ? "levelup" : "sparkle");
  emote(host, stars >= 2 ? "happy" : "think", 2000);
  const lines = setup.home.lines;
  void speak((late ? lines.late : lines.done[stars >= 3 ? 0 : stars >= 2 ? 1 : 2]).t, hostVoice());
  set({ status: "done", levelUp, gift, late, timeLeft, carrying: null, said: null });
}

// ---------- Fetching ----------

// Click a thing: you walk over, pick it up and bring it to the host.
export function take(placement: Placement) {
  if (state.status !== "running" || state.carrying || !setup) return;
  const task = currentTask();
  if (task?.kind === "tell") {
    // When asked where something is, the answer is in words, not legwork.
    sound.play("wrong");
    hostSays(setup.home.lines.tell);
    return;
  }
  const stand = standFor(placement.anchor.model, placement.spot);
  walkTo(route(jobPlayer.walker, stand), () => {
    if (state.status !== "running" || !state.room.includes(placement)) return;
    sound.play("tile");
    set((s) => ({ carrying: placement, room: s.room.filter((p) => p !== placement) }));
    walkTo(route(jobPlayer.walker, HAND_OVER), () => handOver(placement));
  });
}

function handOver(got: Placement) {
  const task = currentTask();
  if (!task || !setup || state.status !== "running") return;
  const want = task.target;
  const assisted = state.revealed;
  if (got === want) {
    sound.play("correct");
    emote(setup.host.id, "happy", 1400);
    emote("player", "happy", 1000);
    hostSays(pick(setup.home.lines.thanks));
    if (!state.missed) understood(want, true, assisted);
    nextTask();
    return;
  }
  // Wrong one: the host says which it is and which she meant, and it goes back.
  sound.play("wrong");
  emote(setup.host.id, "think", 1600);
  homeRuntime.seconds = Math.max(1, homeRuntime.seconds - 8);
  if (!state.missed) understood(want, false, assisted);
  hostSays(setup.home.wrong(want, got), true);
  set((s) => ({ carrying: null, room: [...s.room, got], missed: true }));
}

function understood(want: Placement, right: boolean, assisted: boolean) {
  const prep = setup!.home.prepositions[want.spot].concept;
  const line = currentTask()?.line.t ?? "";
  for (const slug of [want.thing.slug, prep, want.anchor.slug]) observe(slug, "recognitionAudio", right, assisted, "", line, { heardOnly: !assisted });
}

// ---------- Telling ----------

// The learner says where it is; the host goes and looks exactly there.
export function tell(text: string, via: "text" | "speech", hinted: boolean) {
  const task = currentTask();
  if (!task || task.kind !== "tell" || !setup || state.searching) return;
  const { home, code } = setup;
  const said = placeIn(home, text, code);
  const want = task.target;
  if (!said.spot || !said.anchor || !said.anchor.spots.includes(said.spot)) {
    sound.play("pop");
    emote(setup.host.id, "think", 1400);
    hostSays(home.lines.repeat);
    return;
  }
  const right = said.spot === want.spot && said.anchor.slug === want.anchor.slug;
  const where = home.where(said.spot, said.anchor);
  const expected = home.where(want.spot, want.anchor).t;
  const extra = { formOk: said.formOk, input: via, modality: via === "speech" ? "speech" : "text" };
  if (!state.missed || right) {
    observe(home.prepositions[want.spot].concept, "production", said.spot === want.spot, hinted, text, expected, extra);
    observe(want.anchor.slug, "production", said.anchor.slug === want.anchor.slug, hinted, text, expected, extra);
  }
  set({ searching: true, said: null });
  sound.play("click");
  // Off she goes to look where you said.
  const back = { x: HOST_SPOT.x, z: HOST_SPOT.z };
  const stand = standFor(said.anchor.model, said.spot);
  homeRuntime.host.path = route(homeRuntime.host, stand);
  homeRuntime.hostArrive = () => {
    if (state.status !== "running") return;
    if (right) {
      sound.play("correct");
      emote(setup!.host.id, "happy", 1400);
      // Said back properly, whatever article you used.
      hostSays(home.found(home.where(want.spot, want.anchor)));
      set((s) => ({ room: s.room.filter((p) => p !== want) }));
    } else {
      sound.play("wrong");
      emote(setup!.host.id, "think", 1600);
      homeRuntime.seconds = Math.max(1, homeRuntime.seconds - 5);
      hostSays(home.notThere(want.thing, where));
      set({ missed: true });
    }
    homeRuntime.host.path = route(homeRuntime.host, back);
    homeRuntime.hostArrive = () => {
      homeRuntime.host.rot = 0;
      if (right) nextTask();
      else set({ searching: false });
    };
  };
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
      context: { villager: setup.host.id, source: "home-search", level: state.levelIndex, mode: dimension === "production" ? "tell" : "fetch", ...extra },
    })
    .catch((cause) => console.error("Could not record observation", cause));
}
