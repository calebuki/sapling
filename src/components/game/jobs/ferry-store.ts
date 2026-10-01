"use client";

import { useSyncExternalStore } from "react";
import {
  checkEntry,
  emptyEntry,
  farewellFor,
  ferryLevel,
  ferryStars,
  judgeAskName,
  judgeFarewell,
  judgeGreeting,
  makeRun,
  timeGreeting,
  type DayTime,
  type Entry,
  type FerryConfig,
  type FerryField,
  type FerryLevel,
  type Passenger,
} from "@/lib/game/ferry";
import type { Line } from "@/lib/game/line";
import type { CharacterLook, Villager } from "@/lib/game/villagers";
import type { ItemId } from "@/lib/game/wardrobe";
import type { Observation } from "@/lib/learning/adaptive";
import type { TargetLanguageCode } from "@/lib/learning/languages";
import { sound } from "../audio/sfx";
import { speak, speakLine } from "../audio/speech";
import { emote, setGame } from "../store";
import { boardingPath, BOUNDS, PASSENGER_SPOT, PLAYER_SPOT, QUEUE, SPAWN } from "./ferry-layout";
import { finishJob } from "./progress";
import { jobPlayer, placePlayer, stepWalker, walker, type Walker } from "./walk";

// The ferry with its keeper. One passenger at a time at the lectern: greet
// them, ask their name (du or Sie), put them on the list from what they say,
// say goodbye; then they walk round to the gangway while the next steps up.

export type FerryStep = "arriving" | "greet" | "ask" | "list" | "farewell" | "boarding";
export type FerryStatus = "intro" | "running" | "done" | "leaving";
export type Repair = "again" | "slower" | "spell";

export type FerryState = {
  status: FerryStatus;
  levelIndex: number;
  level: FerryLevel;
  time: DayTime;
  askName: boolean;
  passengers: Passenger[];
  index: number;
  step: FerryStep;
  // Heard-only introductions show their words after "pardon?".
  revealed: boolean;
  // The name spelled out, which helps with the list.
  spelled: boolean;
  said: { line: Line; by: "passenger" | "host" | "player"; repeats?: boolean } | null;
  entry: Entry;
  // Each step only counts the first try as evidence.
  missed: Partial<Record<FerryStep, boolean>>;
  boarded: number;
  words: Record<string, [number, number]>;
  levelUp: boolean;
  gift: ItemId | null;
  late: boolean;
  timeLeft: number;
};

export type FerrySetup = {
  code: TargetLanguageCode;
  host: Villager;
  ferry: FerryConfig;
  // Fields whose sentence frame ("Ich komme aus …") the learner has met.
  fields: FerryField[];
  askName: boolean;
  weight: (slug: string) => number;
  conceptId: (slug: string) => string | null;
  record: (observation: Observation) => Promise<unknown>;
};

const WALK = 2.4;

// ---------- Passengers' looks ----------

const skins = ["#f3c9a8", "#eab896", "#c68a62", "#8d5a3b", "#f6d7c0", "#d9a07a", "#5c3a26", "#f1c7a5"];
const hairs = ["#2b1d14", "#5b3a24", "#e9c46a", "#b5542c", "#1f1a17", "#8a6a44", "#d8d8d8", "#6b4a2f"];
const shirts = ["#2f6fb5", "#e76f51", "#3f7d4f", "#8b1e2d", "#f7c948", "#6c5ce7", "#2f8f8f", "#f4a3c1"];

// Children are small and wear bright tees and hoodies; adults dress up for the trip.
export function lookOf(passenger: Passenger): CharacterLook {
  const seed = [...passenger.person.id].reduce((n, c) => n * 31 + c.charCodeAt(0), 7) >>> 0;
  const of = <T,>(list: readonly T[], k: number) => list[(seed >>> k) % list.length];
  const woman = passenger.person.gender === "woman";
  if (passenger.person.register === "du") {
    return {
      skin: of(skins, 1), hair: of(hairs.slice(0, 6), 3), hairStyle: woman ? of(["ponytail", "spacebuns", "braid", "bob"] as const, 5) : of(["spiky", "short", "curly"] as const, 5),
      shirt: of(shirts, 7), pants: of(["#27364f", "#3f7fd1", "#4a3a2e"], 9), accent: of(shirts, 11), top: of(["tee", "hoodie", "stripes", "print"] as const, 13), bottom: of(["shorts", "trousers", "overalls"] as const, 15), scale: 0.78,
    };
  }
  return {
    skin: of(skins, 2), hair: of(hairs, 4), hairStyle: woman ? of(["bob", "bun", "long", "curly"] as const, 6) : of(["short", "buzz", "curly"] as const, 6), beard: !woman && (seed & 4) > 0,
    shirt: of(shirts, 8), pants: of(["#27364f", "#3d3d3d", "#4a3a2e", "#2c3e50"], 10), accent: of(shirts, 12), top: of(["shirt", "knit", "raincoat", "longsleeve"] as const, 14),
    hat: of(["sunhat", "cap", undefined, undefined, "beanie"] as const, 16), glasses: (seed & 8) > 0, scale: 1,
  };
}

let setup: FerrySetup | null = null;
let state: FerryState = blank(0);
const listeners = new Set<() => void>();

function blank(levelIndex: number): FerryState {
  const level = ferryLevel(levelIndex);
  return {
    status: "intro", levelIndex, level, time: level.times[0], askName: level.askName, passengers: [], index: 0, step: "arriving", revealed: !level.heard, spelled: false,
    said: null, entry: emptyEntry(), missed: {}, boarded: 0, words: {}, levelUp: false, gift: null, late: false, timeLeft: 1,
  };
}

function set(patch: Partial<FerryState> | ((s: FerryState) => Partial<FerryState>)) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  listeners.forEach((l) => l());
}

export function getFerry() {
  return state;
}

export function ferrySetup() {
  return setup;
}

export function useFerry<T>(selector: (s: FerryState) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => selector(state),
    () => selector(state),
  );
}

export const ferryRuntime = {
  // One walker per passenger, from the shore to the lectern to a seat on deck.
  walkers: [] as Walker[],
  arrive: [] as Array<null | (() => void)>,
  seated: [] as boolean[],
  seconds: 0,
  total: 1,
  // The clock waits while you type: saying it shouldn't be a race.
  paused: false,
  // How far the steamer has pulled away once it leaves.
  departed: 0,
};

export function currentPassenger() {
  return state.passengers[state.index] ?? null;
}

// ---------- Starting and leaving ----------

export function startFerry(next: FerrySetup, levelIndex: number) {
  setup = next;
  const level = ferryLevel(levelIndex);
  const run = makeRun(next.ferry, { level, fields: next.fields, askName: next.askName, weight: next.weight, seed: Math.floor(Math.random() * 1e9) });
  state = { ...blank(levelIndex), time: run.time, askName: run.askName, passengers: run.passengers };
  placePlayer({ x: PLAYER_SPOT.x + 1.6, z: 0.9 }, -Math.PI / 2, [PLAYER_SPOT], BOUNDS);
  jobPlayer.arrive = () => (jobPlayer.walker.rot = -Math.PI / 2);
  ferryRuntime.walkers = run.passengers.map((_, i) => walker(i < QUEUE.length ? QUEUE[i] : SPAWN, Math.PI / 2));
  ferryRuntime.arrive = run.passengers.map(() => null);
  ferryRuntime.seated = run.passengers.map(() => false);
  ferryRuntime.seconds = level.seconds;
  ferryRuntime.total = level.seconds;
  ferryRuntime.paused = false;
  ferryRuntime.departed = 0;
  setGame({ phase: "job", job: "ferry", talkingTo: null, nearby: null });
  listeners.forEach((l) => l());
}

export function beginFerry() {
  sound.play("ring");
  set({ status: "running" });
  admit();
}

export function leaveFerry() {
  if (state.status === "leaving") return;
  jobPlayer.locked = true;
  ferryRuntime.paused = true;
  set({ status: "leaving" });
  sound.play("close");
  setGame({ phase: "explore", job: null });
}

// ---------- The loop ----------

export function tickFerry(delta: number) {
  ferryRuntime.walkers.forEach((w, i) => {
    if (stepWalker(w, delta, WALK) && ferryRuntime.arrive[i]) {
      const then = ferryRuntime.arrive[i]!;
      ferryRuntime.arrive[i] = null;
      then();
    }
  });
  if (state.status === "done") ferryRuntime.departed = Math.min(40, ferryRuntime.departed + delta * Math.min(4, 0.5 + ferryRuntime.departed));
  if (state.status !== "running" || ferryRuntime.paused) return;
  ferryRuntime.seconds = Math.max(0, ferryRuntime.seconds - delta);
  if (ferryRuntime.seconds <= 0) finish(true);
}

function hostVoice() {
  return { who: setup!.host.id, pitch: setup!.host.voicePitch };
}

function passengerVoice(slow = false) {
  return { gender: currentPassenger()?.person.gender ?? "woman", slow };
}

function passengerSays(line: Line, repeats = false) {
  void speakLine(line, passengerVoice());
  set({ said: { line, by: "passenger", repeats } });
}

function hostSays(line: Line) {
  void speakLine(line, hostVoice());
  set({ said: { line, by: "host" } });
}

// The line the current step is about, which "pardon?" repeats.
export function stepLine(step: FerryStep = state.step, passenger: Passenger | null = currentPassenger()): Line | null {
  if (!passenger) return null;
  return step === "list" ? passenger.intro : null;
}

function goTo(step: FerryStep) {
  // Typing isn't a race; listening and filling in the list are.
  ferryRuntime.paused = step === "greet" || step === "ask" || step === "farewell";
  set({ step, said: null, revealed: !state.level.heard, spelled: false });
}

// The next passenger steps up from the queue, and everyone behind moves along.
function admit() {
  const i = state.index;
  if (!currentPassenger()) return;
  set({ step: "arriving", entry: emptyEntry(), missed: {}, said: null });
  ferryRuntime.walkers[i].path = [PASSENGER_SPOT];
  ferryRuntime.arrive[i] = () => {
    ferryRuntime.walkers[i].rot = Math.PI / 2;
    goTo("greet");
  };
  for (let j = i + 1; j < ferryRuntime.walkers.length && j - i - 1 < QUEUE.length; j++) ferryRuntime.walkers[j].path = [QUEUE[j - i - 1]];
}

// ---------- Hello ----------

export function greet(text: string, via: "text" | "speech", hinted: boolean) {
  const passenger = currentPassenger();
  if (state.step !== "greet" || !passenger || !setup) return;
  const { ferry } = setup;
  const { said, ok } = judgeGreeting(ferry, text, state.time, setup.code);
  const right = timeGreeting(ferry, state.time);
  const extra = { input: via, modality: via === "speech" ? "speech" : "text", time: state.time };
  if (!said) {
    if (!state.missed.greet) observe(right.concept, "production", false, hinted, text, right.reply.t, extra);
    sound.play("wrong");
    set({ missed: { ...state.missed, greet: true } });
    passengerSays(ferry.lines.pardon);
    return;
  }
  if (!state.missed.greet || ok) observe(said.concept, "production", ok, hinted, text, ok ? said.reply.t : right.reply.t, extra);
  if (ok) {
    sound.play("correct");
    emote("player", "happy", 900);
    passengerSays(said.reply);
  } else {
    // "Guten Abend? Es ist doch noch Morgen! Guten Morgen!" — and on we go.
    sound.play("wrong");
    set({ missed: { ...state.missed, greet: true } });
    passengerSays(ferry.wrongTime(said, state.time, right), true);
  }
  window.setTimeout(() => (state.askName ? goTo("ask") : introduce()), ok ? 1400 : 3200);
}

// ---------- What's your name? ----------

export function askName(text: string, via: "text" | "speech", hinted: boolean) {
  const passenger = currentPassenger();
  if (state.step !== "ask" || !passenger || !setup) return;
  const { ferry } = setup;
  const register = passenger.person.register;
  const asked = judgeAskName(ferry, text, setup.code);
  const want = ferry.askName[register];
  const extra = { input: via, modality: via === "speech" ? "speech" : "text", register };
  if (!state.missed.ask || asked === register) observe(want.concept, "production", asked === register, hinted, text, want.say.t, extra);
  if (!asked) {
    sound.play("wrong");
    set({ missed: { ...state.missed, ask: true } });
    passengerSays(ferry.lines.pardon);
    return;
  }
  if (asked === register) {
    sound.play("correct");
    introduce();
    return;
  }
  // Du to an adult, or Sie to a child: they say so, then tell you anyway.
  sound.play("wrong");
  set({ missed: { ...state.missed, ask: true } });
  introduce(ferry.wrongRegister(passenger.person));
}

// They say who they are; the list opens.
function introduce(before?: Line) {
  const passenger = currentPassenger();
  if (!passenger || state.status !== "running") return;
  goTo("list");
  if (before) {
    const line = { t: `${before.t} ${passenger.intro.t}`, en: `${before.en} ${passenger.intro.en}`, parts: [before.t, ...(passenger.intro.parts ?? [passenger.intro.t])] };
    void speakLine(line, passengerVoice());
    set({ said: { line: before, by: "passenger" } });
  } else window.setTimeout(() => void speakLine(passenger.intro, passengerVoice()), 250);
}

// ---------- Pardon? Slower, please. How do you spell that? ----------

export async function repair(kind: Repair) {
  const passenger = currentPassenger();
  if (state.step !== "list" || !passenger || !setup) return;
  const { ferry } = setup;
  const ask = ferry.repairs[kind];
  ferryRuntime.seconds = Math.max(1, ferryRuntime.seconds - (kind === "again" ? 3 : 2));
  observe(ask.concept, "exposure", true, true, ask.say[passenger.person.register].t, ask.say[passenger.person.register].t, { repair: kind });
  sound.play("pop");
  const line = ask.say[passenger.person.register];
  set({ said: { line, by: "player" }, ...(kind === "again" ? { revealed: true } : {}) });
  await speakLine(line, { who: "player" });
  if (state.step !== "list" || currentPassenger() !== passenger) return;
  if (kind === "spell") {
    set({ spelled: true });
    passengerSays(ferry.spell(passenger.person));
  } else {
    set({ said: null });
    void speakLine(passenger.intro, passengerVoice(kind === "slower"));
  }
}

export function replay() {
  const passenger = currentPassenger();
  if (passenger && state.step === "list") void speakLine(passenger.intro, passengerVoice());
}

// ---------- The list ----------

export function fill(field: FerryField, value: string) {
  if (state.step !== "list") return;
  sound.play("tile");
  set((s) => {
    const entry = { ...s.entry };
    if (field === "speaks") entry.speaks = entry.speaks.includes(value) ? entry.speaks.filter((v) => v !== value) : [...entry.speaks, value];
    else entry[field] = entry[field] === value ? null : value;
    return { entry };
  });
}

export function submitEntry() {
  const passenger = currentPassenger();
  if (state.step !== "list" || !passenger || !setup) return;
  const { ferry } = setup;
  const problems = checkEntry(passenger, state.entry);
  if (!state.missed.list) {
    const heard = passenger.intro.t;
    const assisted = state.revealed;
    for (const field of passenger.fields) {
      const right = !problems.includes(field);
      // Seeing the name spelled out helps with the name, not with the rest.
      observe(ferry.frames[field], "recognitionAudio", right, assisted || (field === "name" && state.spelled), "", heard, { field });
      if (field === "from" && passenger.from.concept) observe(passenger.from.concept, "recognitionAudio", right, assisted, "", heard, { field });
      if (field === "speaks") {
        for (const language of passenger.speaks) if (language.concept) observe(language.concept, "recognitionAudio", right, assisted, "", heard, { field });
        if (passenger.aLittle && ferry.aLittle) observe(ferry.aLittle, "exposure", true, true, "", heard, { field });
      }
    }
  }
  if (problems.length) {
    sound.play("wrong");
    emote(setup.host.id, "think", 1200);
    ferryRuntime.seconds = Math.max(1, ferryRuntime.seconds - 4);
    set((s) => {
      const entry = { ...s.entry };
      for (const field of problems) {
        if (field === "speaks") entry.speaks = [];
        else entry[field] = null;
      }
      return { entry, missed: { ...s.missed, list: true } };
    });
    hostSays(ferry.lines.listWrong);
    return;
  }
  sound.play("correct");
  emote(setup.host.id, "happy", 1200);
  hostSays(ferry.lines.listRight);
  window.setTimeout(() => {
    if (state.status === "running" && currentPassenger() === passenger) goTo("farewell");
  }, 1500);
}

// ---------- Goodbye ----------

export function farewell(text: string, via: "text" | "speech", hinted: boolean) {
  const passenger = currentPassenger();
  if (state.step !== "farewell" || !passenger || !setup) return;
  const { ferry } = setup;
  const { said, ok } = judgeFarewell(ferry, text, state.time, setup.code);
  const usual = farewellFor(ferry, passenger.person.register);
  const extra = { input: via, modality: via === "speech" ? "speech" : "text", time: state.time };
  if (!said) {
    if (!state.missed.farewell) observe(usual.concept, "production", false, hinted, text, usual.reply.t, extra);
    sound.play("wrong");
    set({ missed: { ...state.missed, farewell: true } });
    passengerSays(ferry.lines.pardon);
    return;
  }
  if (!state.missed.farewell || ok) observe(said.concept, "production", ok, hinted, text, ok ? said.reply.t : usual.reply.t, extra);
  if (ok) {
    sound.play("correct");
    passengerSays(said.reply);
  } else {
    sound.play("wrong");
    passengerSays(ferry.wrongTime(said, state.time, usual), true);
  }
  board(passenger);
}

// Off round to the gangway; the next one steps up meanwhile.
function board(passenger: Passenger) {
  const i = state.index;
  const seat = state.boarded;
  emote("player", "happy", 900);
  ferryRuntime.paused = false;
  set({ step: "boarding", boarded: state.boarded + 1 });
  window.setTimeout(() => {
    if (state.status !== "running" || currentPassenger() !== passenger) return;
    ferryRuntime.walkers[i].path = boardingPath(seat);
    ferryRuntime.arrive[i] = () => {
      ferryRuntime.walkers[i].rot = 0;
      ferryRuntime.seated[i] = true;
    };
    const index = i + 1;
    set({ index, said: null });
    if (index >= state.passengers.length) window.setTimeout(() => finish(false), 2600);
    else admit();
  }, 1200);
}

function finish(late: boolean) {
  if (state.status !== "running" || !setup) return;
  const timeLeft = ferryRuntime.seconds / ferryRuntime.total;
  const stars = ferryStars(state.boarded, state.passengers.length, timeLeft);
  const host = setup.host.id;
  const { levelUp, gift } = finishJob(host, state.levelIndex, stars);
  sound.play(stars >= 2 ? "levelup" : "sparkle");
  emote(host, stars >= 2 ? "happy" : "think", 2000);
  const lines = setup.ferry.lines;
  void speak((late ? lines.late : lines.done[stars >= 3 ? 0 : stars >= 2 ? 1 : 2]).t, hostVoice());
  ferryRuntime.paused = false;
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
  if (dimension !== "exposure") {
    set((s) => {
      const [right, total] = s.words[slug] ?? [0, 0];
      return { words: { ...s.words, [slug]: [right + (successful ? 1 : 0), total + 1] } };
    });
  }
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
      context: { villager: setup.host.id, source: "ferry", level: state.levelIndex, step: state.step, ...extra },
    })
    .catch((cause) => console.error("Could not record observation", cause));
}
