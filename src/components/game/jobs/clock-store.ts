"use client";

import { useSyncExternalStore } from "react";
import {
  clockLevel,
  clockStars,
  formOf,
  makeCalendar,
  makeCustomers,
  customerGender,
  namedHour,
  sameTime,
  turn,
  type Calendar,
  type ClockConfig,
  type ClockLevel,
  type Customer,
  type Time,
  type TimeForm,
} from "@/lib/game/clock";
import { pick, type Line } from "@/lib/game/line";
import type { CharacterLook, Villager } from "@/lib/game/villagers";
import type { VoiceGender } from "@/lib/game/voices";
import type { Observation } from "@/lib/learning/adaptive";
import type { TargetLanguageCode } from "@/lib/learning/languages";
import { sound } from "../audio/sfx";
import { speak, speakLine } from "../audio/speech";
import type { ItemId } from "@/lib/game/wardrobe";
import { emote, setGame } from "../store";
import { finishJob } from "./progress";
import { AISLE_Z, BOUNDS, CUSTOMER_SPOT, DOOR_INSIDE, DOOR_OUTSIDE, PLAYER_SPOT, PLAYER_START } from "./clock-layout";
import { jobPlayer, placePlayer, stepWalker, walker, walkTo, type Walker } from "./walk";

// A day at the clockmaker's. One customer at a time: set their clock to the
// time they ask for, maybe say what time it is, maybe book a collection.

export type ClockStep = "arriving" | "set" | "tell" | "appointment" | "leaving";
export type ClockStatus = "intro" | "running" | "done" | "leaving";

export type ClockState = {
  status: ClockStatus;
  levelIndex: number;
  level: ClockLevel;
  customers: Customer[];
  calendar: Calendar;
  index: number;
  step: ClockStep;
  look: CharacterLook;
  gender: VoiceGender;
  // The hands of the clock on the easel.
  hands: Time;
  revealed: boolean;
  said: { line: Line; by: "customer" | "host"; repeats?: boolean } | null;
  missed: Partial<Record<ClockStep, boolean>>;
  helped: number;
  words: Record<string, [number, number]>;
  levelUp: boolean;
  // Work clothes the host just gave you, if this run earned them.
  gift: ItemId | null;
  late: boolean;
  timeLeft: number;
};

export type ClockSetup = {
  code: TargetLanguageCode;
  host: Villager;
  clock: ClockConfig;
  forms: TimeForm[];
  hours: number[];
  days: string[];
  appointments: boolean;
  weight: (slug: string) => number;
  conceptId: (slug: string) => string | null;
  record: (observation: Observation) => Promise<unknown>;
};

const CUSTOMER_WALK = 2.6;

const skins = ["#f3c9a8", "#eab896", "#c68a62", "#8d5a3b", "#f6d7c0", "#d9a07a", "#5c3a26", "#f1c7a5"];
const hairs = ["#2b1d14", "#5b3a24", "#e9c46a", "#b5542c", "#1f1a17", "#8a6a44", "#d8d8d8", "#6b4a2f"];
const shirts = ["#2f6fb5", "#e76f51", "#3f7d4f", "#8b1e2d", "#f7c948", "#6c5ce7", "#2f8f8f", "#f4a3c1"];
const styles: CharacterLook["hairStyle"][] = ["bob", "braid", "short", "bun", "long", "ponytail", "curly", "spiky", "buzz"];

function guestLook(seed: number): CharacterLook {
  const of = <T,>(list: readonly T[], k: number) => list[(seed * (k + 3) + k) % list.length];
  return { skin: of(skins, 1), hair: of(hairs, 2), hairStyle: of(styles, 3), shirt: of(shirts, 4), pants: of(["#27364f", "#3d3d3d", "#4a3a2e"], 5), accent: of(shirts, 6), top: of(["tee", "knit", "hoodie", "shirt"] as const, 7), hat: seed % 3 === 0 ? "cap" : undefined };
}

let setup: ClockSetup | null = null;
let state: ClockState = blank(0);
const listeners = new Set<() => void>();

function blank(levelIndex: number): ClockState {
  const level = clockLevel(levelIndex);
  return {
    status: "intro", levelIndex, level, customers: [], calendar: {}, index: 0, step: "arriving", look: guestLook(1), gender: "woman",
    hands: { h: 12, m: 0 }, revealed: !level.heard, said: null, missed: {}, helped: 0, words: {}, levelUp: false, gift: null, late: false, timeLeft: 1,
  };
}

function set(patch: Partial<ClockState> | ((s: ClockState) => Partial<ClockState>)) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  listeners.forEach((l) => l());
}

export function getClock() {
  return state;
}

export function clockSetup() {
  return setup;
}

export function useClock<T>(selector: (s: ClockState) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => selector(state),
    () => selector(state),
  );
}

export const clockRuntime = {
  customer: walker(DOOR_OUTSIDE) as Walker,
  customerArrive: null as null | (() => void),
  seconds: 0,
  total: 1,
  // The clock waits while you write or read the calendar.
  paused: false,
};

export function currentCustomer() {
  return state.customers[state.index] ?? null;
}

// ---------- Starting and leaving ----------

export function startClock(next: ClockSetup, levelIndex: number) {
  setup = next;
  const level = clockLevel(levelIndex);
  const seed = Math.floor(Math.random() * 1e9);
  const calendar = makeCalendar(next.clock, seed + 1);
  const customers = makeCustomers(next.clock, calendar, { level, forms: next.forms, hours: next.hours, days: next.days, appointments: next.appointments, weight: next.weight, seed });
  state = { ...blank(levelIndex), customers, calendar };
  placePlayer(DOOR_OUTSIDE, -Math.PI / 2, [DOOR_INSIDE, PLAYER_START], BOUNDS);
  clockRuntime.customer = walker(DOOR_OUTSIDE);
  clockRuntime.customerArrive = null;
  clockRuntime.seconds = level.seconds;
  clockRuntime.total = level.seconds;
  clockRuntime.paused = false;
  setGame({ phase: "job", job: "clock", talkingTo: null, nearby: null });
  listeners.forEach((l) => l());
}

export function beginClock() {
  sound.play("ring");
  set({ status: "running" });
  admit();
}

export function leaveClock() {
  if (state.status === "leaving") return;
  jobPlayer.locked = true;
  clockRuntime.paused = true;
  set({ status: "leaving" });
  walkTo([{ x: jobPlayer.walker.x, z: AISLE_Z }, DOOR_INSIDE, DOOR_OUTSIDE], () => {
    sound.play("close");
    setGame({ phase: "explore", job: null });
  });
}

// ---------- The loop ----------

export function tickClock(delta: number) {
  if (stepWalker(clockRuntime.customer, delta, CUSTOMER_WALK) && clockRuntime.customerArrive) {
    const then = clockRuntime.customerArrive;
    clockRuntime.customerArrive = null;
    then();
  }
  if (state.status !== "running" || clockRuntime.paused) return;
  clockRuntime.seconds = Math.max(0, clockRuntime.seconds - delta);
  if (clockRuntime.seconds <= 0) finish(true);
}

function hostVoice() {
  return { who: setup!.host.id, pitch: setup!.host.voicePitch };
}

function customerSays(line: Line, repeats = false) {
  void speakLine(line, { gender: state.gender });
  set({ said: { line, by: "customer", repeats } });
}

function hostSays(line: Line) {
  void speakLine(line, hostVoice());
  set({ said: { line, by: "host" } });
}

// The line the current step is about, which "pardon?" repeats.
export function stepLine(step: ClockStep = state.step, customer: Customer | null = currentCustomer()): Line | null {
  if (!customer || !setup) return null;
  if (step === "set") return customer.request;
  if (step === "tell") return setup.clock.ask;
  if (step === "appointment") return customer.appointment?.line ?? null;
  return null;
}

export function sayStep(slow = false) {
  const line = stepLine();
  if (line) void speakLine(line, { gender: state.gender, slow });
}

export function pardon() {
  clockRuntime.seconds = Math.max(1, clockRuntime.seconds - 3);
  sound.play("pop");
  set({ revealed: true, said: null });
  sayStep(true);
}

function goTo(step: ClockStep) {
  set({ step, said: null, revealed: !state.level.heard });
  // Reading the calendar or putting a time into words shouldn't be a race.
  clockRuntime.paused = step === "tell" || step === "appointment";
  window.setTimeout(() => sayStep(), 350);
}

function admit() {
  const customer = currentCustomer();
  if (!customer) return;
  const seed = state.index * 7919 + 29;
  // The stopped clock shows some other time.
  const stopped: Time = { h: ((customer.set.h + 4 + (seed % 5)) % 12) + 1, m: ((customer.set.m + 15 * (1 + (seed % 3))) % 60) as Time["m"] };
  set({ step: "arriving", look: guestLook(seed), gender: customerGender(customer.set), hands: stopped, missed: {}, said: null });
  clockRuntime.customer = walker(DOOR_OUTSIDE, -Math.PI / 2, [DOOR_INSIDE, { x: CUSTOMER_SPOT.x, z: AISLE_Z }, CUSTOMER_SPOT]);
  clockRuntime.customerArrive = () => {
    clockRuntime.customer.rot = Math.PI * 0.85;
    walkTo(PLAYER_SPOT, () => undefined);
    goTo("set");
  };
}

// ---------- Setting the clock ----------

export function turnHand(hand: "hour" | "minute", steps: number) {
  if (state.step !== "set") return;
  sound.play("tile");
  set((s) => ({ hands: turn(s.hands, hand, steps) }));
}

export function setHand(hand: "hour" | "minute", value: number) {
  if (state.step !== "set") return;
  set((s) => {
    if (hand === "hour") return s.hands.h === value ? {} : { hands: { h: value, m: s.hands.m } };
    return s.hands.m === value ? {} : { hands: { h: s.hands.h, m: value as Time["m"] } };
  });
}

export function finishSet() {
  const customer = currentCustomer();
  if (state.step !== "set" || !customer || !setup) return;
  const right = sameTime(state.hands, customer.set);
  if (!state.missed.set) heard(customer.set, right, customer.request.t);
  if (right) {
    sound.play("correct");
    emote("player", "happy", 900);
    emote(setup.host.id, "happy", 1200);
    customerSays(setup.clock.lines.thanks[2]);
    window.setTimeout(() => next("set"), 1300);
    return;
  }
  sound.play("wrong");
  clockRuntime.seconds = Math.max(1, clockRuntime.seconds - 6);
  set({ missed: { ...state.missed, set: true } });
  customerSays(setup.clock.wrongTime(customer.set, state.hands), true);
}

// Understanding a time: the way it's said and the hour it's named after.
function heard(time: Time, right: boolean, line: string) {
  const { clock } = setup!;
  observe(clock.forms[formOf(time)], "recognitionAudio", right, state.revealed, "", line, {});
  observe(clock.numbers[namedHour(time) - 1], "recognitionAudio", right, state.revealed, "", line, {});
}

// ---------- What time is it? ----------

export function tellTime(text: string, via: "text" | "speech", hinted: boolean) {
  const customer = currentCustomer();
  if (state.step !== "tell" || !customer?.tell || !setup) return;
  const { clock, code } = setup;
  const parsed = clock.parse(text, code);
  if (parsed === "digits" || parsed === null) {
    sound.play("pop");
    customerSays(parsed === "digits" ? clock.words : setup.clock.lines.repeat);
    return;
  }
  const want = customer.tell;
  const right = sameTime(parsed, want);
  if (!state.missed.tell || right) {
    const extra = { input: via, modality: via === "speech" ? "speech" : "text" };
    observe(clock.forms[formOf(want)], "production", formOf(parsed) === formOf(want), hinted, text, clock.say(want).t, extra);
    observe(clock.numbers[namedHour(want) - 1], "production", namedHour(parsed) === namedHour(want), hinted, text, clock.say(want).t, extra);
  }
  if (right) {
    sound.play("correct");
    customerSays(clock.told(want));
    window.setTimeout(() => next("tell"), 1300);
    return;
  }
  sound.play("wrong");
  set({ missed: { ...state.missed, tell: true } });
  customerSays(clock.toldWrong);
}

// ---------- When can I collect it? ----------

export function answerAppointment(yes: boolean) {
  const customer = currentCustomer();
  if (state.step !== "appointment" || !customer?.appointment || !setup?.clock.appointments) return;
  const { appointment } = customer;
  const right = yes === appointment.free;
  const appointments = setup.clock.appointments;
  if (!state.missed.appointment) {
    observe(appointment.day.slug, "recognitionAudio", right, state.revealed, "", appointment.line.t, {});
    observe(setup.clock.numbers[appointment.hour - 1], "recognitionAudio", right, state.revealed, "", appointment.line.t, {});
  }
  if (right) {
    sound.play("correct");
    void speak((yes ? appointments.yes : appointments.no).line.t, { who: "player" });
    window.setTimeout(() => next("appointment"), 1300);
    return;
  }
  sound.play("wrong");
  set({ missed: { ...state.missed, appointment: true } });
  hostSays(appointments.wrong);
}

// ---------- Between steps ----------

function next(after: ClockStep) {
  const customer = currentCustomer();
  if (!customer || state.status !== "running") return;
  if (after === "set" && customer.tell) return goTo("tell");
  if ((after === "set" || after === "tell") && customer.appointment) return goTo("appointment");
  discharge();
}

function discharge() {
  if (!setup) return;
  clockRuntime.paused = false;
  customerSays(pick(setup.clock.lines.thanks));
  set({ step: "leaving", helped: state.helped + 1 });
  clockRuntime.customer.path = [{ x: CUSTOMER_SPOT.x, z: AISLE_Z }, DOOR_INSIDE, DOOR_OUTSIDE];
  clockRuntime.customerArrive = () => {
    if (state.status !== "running") return;
    const index = state.index + 1;
    set({ index, said: null });
    if (index >= state.customers.length) finish(false);
    else admit();
  };
}

function finish(late: boolean) {
  if (state.status !== "running" || !setup) return;
  const timeLeft = clockRuntime.seconds / clockRuntime.total;
  const stars = clockStars(state.helped, state.customers.length, timeLeft);
  const host = setup.host.id;
  const { levelUp, gift } = finishJob(host, state.levelIndex, stars);
  sound.play(stars >= 2 ? "levelup" : "sparkle");
  emote(host, stars >= 2 ? "happy" : "think", 2000);
  const lines = setup.clock.lines;
  void speak((late ? lines.late : lines.done[stars >= 3 ? 0 : stars >= 2 ? 1 : 2]).t, hostVoice());
  clockRuntime.paused = false;
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
      context: { villager: setup.host.id, source: "clockmaker", level: state.levelIndex, step: state.step, ...extra },
    })
    .catch((cause) => console.error("Could not record observation", cause));
}
