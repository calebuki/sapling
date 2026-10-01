"use client";

import { useSyncExternalStore } from "react";
import { pick, type Line } from "@/lib/game/line";
import {
  forward,
  inTown,
  makeTravellers,
  sameNode,
  START,
  stationLevel,
  stationStars,
  turn,
  type Heading,
  type Landmark,
  type Node,
  type StationConfig,
  type StationLevel,
  type TicketKind,
  type Traveller,
} from "@/lib/game/station";
import type { CharacterLook, Villager } from "@/lib/game/villagers";
import type { VoiceGender } from "@/lib/game/voices";
import type { ItemId } from "@/lib/game/wardrobe";
import type { Observation } from "@/lib/learning/adaptive";
import type { TargetLanguageCode } from "@/lib/learning/languages";
import { sound } from "../audio/sfx";
import { speak, speakLine } from "../audio/speech";
import { emote, setGame } from "../store";
import { finishJob } from "./progress";
import { ARRIVAL, BOUNDS, headingRot, nodePoint, PLATFORM_EXIT, PLAYER_SPOT, TO_TOWN, TRAVELLER_SPOT } from "./station-layout";
import { jobPlayer, placePlayer, stepWalker, walker, walkTo, type Point, type Walker } from "./walk";

// The station with its master. At the window: where to, one way or return,
// which platform. Asked the way: carry the suitcase through town by the
// directions you're given, turn by turn.

export type StationStep = "arriving" | "ticket" | "platform" | "way" | "leaving";
export type StationStatus = "intro" | "running" | "done" | "leaving";

export type StationState = {
  status: StationStatus;
  levelIndex: number;
  level: StationLevel;
  travellers: Traveller[];
  index: number;
  step: StationStep;
  look: CharacterLook;
  gender: VoiceGender;
  // The ticket being made up, and whether you've asked "one way or return?".
  ticket: { destination: string | null; kind: TicketKind | null; asked: boolean };
  // Walking the town: where you are, which way you face, whether you're there yet.
  town: { at: Node; heading: Heading; walking: boolean; inTown: boolean };
  revealed: boolean;
  said: { line: Line; by: "traveller" | "host" | "player"; repeats?: boolean } | null;
  missed: Partial<Record<StationStep, boolean>>;
  helped: number;
  words: Record<string, [number, number]>;
  levelUp: boolean;
  gift: ItemId | null;
  late: boolean;
  timeLeft: number;
};

export type StationSetup = {
  code: TargetLanguageCode;
  host: Villager;
  station: StationConfig;
  destinations: string[];
  landmarks: string[];
  ways: boolean;
  platform: boolean;
  weight: (slug: string) => number;
  conceptId: (slug: string) => string | null;
  record: (observation: Observation) => Promise<unknown>;
};

const WALK = 2.6;

const skins = ["#f3c9a8", "#eab896", "#c68a62", "#8d5a3b", "#f6d7c0", "#d9a07a", "#5c3a26", "#f1c7a5"];
const hairs = ["#2b1d14", "#5b3a24", "#e9c46a", "#b5542c", "#1f1a17", "#8a6a44", "#d8d8d8", "#6b4a2f"];
const shirts = ["#2f6fb5", "#e76f51", "#3f7d4f", "#8b1e2d", "#f7c948", "#6c5ce7", "#2f8f8f", "#f4a3c1"];

function travellerLook(seed: number, gender: VoiceGender): CharacterLook {
  const of = <T,>(list: readonly T[], k: number) => list[(seed * (k + 3) + k) % list.length];
  return {
    skin: of(skins, 1), hair: of(hairs, 2), hairStyle: gender === "woman" ? of(["bob", "bun", "long", "ponytail"] as const, 3) : of(["short", "buzz", "curly"] as const, 3),
    shirt: of(shirts, 4), pants: of(["#27364f", "#3d3d3d", "#4a3a2e"], 5), accent: of(shirts, 6), top: of(["raincoat", "knit", "shirt", "hoodie"] as const, 7), hat: of(["cap", "sunhat", undefined] as const, 8), scale: 1,
  };
}

let setup: StationSetup | null = null;
let state: StationState = blank(0);
const listeners = new Set<() => void>();

function blank(levelIndex: number): StationState {
  const level = stationLevel(levelIndex);
  return {
    status: "intro", levelIndex, level, travellers: [], index: 0, step: "arriving", look: travellerLook(1, "woman"), gender: "woman",
    ticket: { destination: null, kind: null, asked: false }, town: { at: START, heading: 0, walking: false, inTown: false },
    revealed: !level.heard, said: null, missed: {}, helped: 0, words: {}, levelUp: false, gift: null, late: false, timeLeft: 1,
  };
}

function set(patch: Partial<StationState> | ((s: StationState) => Partial<StationState>)) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  listeners.forEach((l) => l());
}

export function getStation() {
  return state;
}

export function stationSetup() {
  return setup;
}

export function useStation<T>(selector: (s: StationState) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => selector(state),
    () => selector(state),
  );
}

export const stationRuntime = {
  traveller: walker(ARRIVAL) as Walker,
  arrive: null as null | (() => void),
  seconds: 0,
  total: 1,
  // The clock waits while you type the platform.
  paused: false,
  // Moves made at each crossing of the way, to check against the directions.
  moves: new Map<string, Node>(),
  wrongClicks: 0,
};

export function currentTraveller() {
  return state.travellers[state.index] ?? null;
}

// ---------- Starting and leaving ----------

export function startStation(next: StationSetup, levelIndex: number) {
  setup = next;
  const level = stationLevel(levelIndex);
  const travellers = makeTravellers(next.station, { level, destinations: next.destinations, landmarks: next.landmarks, ways: next.ways, weight: next.weight, seed: Math.floor(Math.random() * 1e9) });
  state = { ...blank(levelIndex), travellers };
  placePlayer({ x: PLAYER_SPOT.x + 1.6, z: PLAYER_SPOT.z + 0.6 }, -Math.PI / 2, [PLAYER_SPOT], BOUNDS);
  jobPlayer.arrive = () => (jobPlayer.walker.rot = -Math.PI / 2);
  stationRuntime.traveller = walker(ARRIVAL);
  stationRuntime.arrive = null;
  stationRuntime.seconds = level.seconds;
  stationRuntime.total = level.seconds;
  stationRuntime.paused = false;
  setGame({ phase: "job", job: "station", talkingTo: null, nearby: null });
  listeners.forEach((l) => l());
}

export function beginStation() {
  sound.play("ring");
  set({ status: "running" });
  admit();
}

export function leaveStation() {
  if (state.status === "leaving") return;
  jobPlayer.locked = true;
  stationRuntime.paused = true;
  set({ status: "leaving" });
  sound.play("close");
  setGame({ phase: "explore", job: null });
}

// ---------- The loop ----------

export function tickStation(delta: number) {
  if (stepWalker(stationRuntime.traveller, delta, WALK) && stationRuntime.arrive) {
    const then = stationRuntime.arrive;
    stationRuntime.arrive = null;
    then();
  }
  if (state.status !== "running" || stationRuntime.paused) return;
  stationRuntime.seconds = Math.max(0, stationRuntime.seconds - delta);
  if (stationRuntime.seconds <= 0) finish(true);
}

function hostVoice() {
  return { who: setup!.host.id, pitch: setup!.host.voicePitch };
}

function travellerSays(line: Line, repeats = false) {
  void speakLine(line, { gender: state.gender });
  set({ said: { line, by: "traveller", repeats } });
}

function hostSays(line: Line, repeats = false) {
  void speakLine(line, hostVoice());
  set({ said: { line, by: "host", repeats } });
}

const joined = (lines: Line[]): Line => ({ t: lines.map((l) => l.t).join(" "), en: lines.map((l) => l.en).join(" "), parts: lines.flatMap((l) => l.parts ?? [l.t]) });

// What the current step is about, which "pardon?" repeats.
export function stepLine(step: StationStep = state.step, traveller: Traveller | null = currentTraveller(), asked = state.ticket.asked): { line: Line; by: "traveller" | "host" } | null {
  if (!traveller || !setup) return null;
  if (step === "ticket" && traveller.kind === "ticket") {
    return { line: asked ? joined([traveller.line, setup.station.kindAnswer(traveller.ticket)]) : traveller.line, by: "traveller" };
  }
  if (step === "platform") return { line: setup.station.lines.askPlatform, by: "traveller" };
  if (step === "way" && traveller.kind === "way") return { line: traveller.directions, by: "host" };
  return null;
}

export function sayStep(slow = false) {
  const current = stepLine();
  if (!current) return;
  void speakLine(current.line, current.by === "host" ? { ...hostVoice(), slow } : { gender: state.gender, slow });
}

export function pardon() {
  stationRuntime.seconds = Math.max(1, stationRuntime.seconds - 3);
  sound.play("pop");
  set({ revealed: true, said: null });
  sayStep(true);
}

function goTo(step: StationStep) {
  stationRuntime.paused = step === "platform";
  set({ step, revealed: !state.level.heard });
}

// The next traveller comes off the platform to the window.
function admit() {
  const traveller = currentTraveller();
  if (!traveller || !setup) return;
  const seed = state.index * 7919 + 37;
  const gender: VoiceGender = seed % 2 ? "woman" : "man";
  set({ step: "arriving", look: travellerLook(seed, gender), gender, ticket: { destination: null, kind: null, asked: false }, missed: {}, said: null });
  stationRuntime.traveller = walker(ARRIVAL, Math.PI / 2, [{ x: TRAVELLER_SPOT.x - 1.4, z: TRAVELLER_SPOT.z - 0.8 }, TRAVELLER_SPOT]);
  stationRuntime.arrive = () => {
    stationRuntime.traveller.rot = Math.PI / 2;
    const hello = pick(setup!.station.lines.hello, (seed % 89) / 89);
    void speakLine(joined([hello, traveller.line]), { gender: state.gender });
    set({ said: { line: hello, by: "traveller" } });
    if (traveller.kind === "ticket") goTo("ticket");
    else window.setTimeout(() => startWay(traveller), 2600);
  };
}

// ---------- Tickets ----------

export function chooseDestination(slug: string) {
  if (state.step !== "ticket") return;
  sound.play("tile");
  set((s) => ({ ticket: { ...s.ticket, destination: slug } }));
}

export function askKind() {
  const traveller = currentTraveller();
  if (state.step !== "ticket" || traveller?.kind !== "ticket" || !setup) return;
  const { station } = setup;
  for (const concept of [station.concepts.single, station.concepts.return]) observe(concept, "exposure", true, true, station.lines.whichKind.t, station.lines.whichKind.t, {});
  void speakLine(station.lines.whichKind, { who: "player" });
  set((s) => ({ said: { line: station.lines.whichKind, by: "player" }, ticket: { ...s.ticket, asked: true } }));
  window.setTimeout(() => {
    if (currentTraveller() === traveller && state.step === "ticket") travellerSays(station.kindAnswer(traveller.ticket));
  }, 1500);
}

export function chooseKind(kind: TicketKind) {
  if (state.step !== "ticket" || !state.ticket.asked) return;
  sound.play("tile");
  set((s) => ({ ticket: { ...s.ticket, kind } }));
}

export function printTicket() {
  const traveller = currentTraveller();
  if (state.step !== "ticket" || traveller?.kind !== "ticket" || !setup) return;
  const { station } = setup;
  const { destination, kind } = state.ticket;
  const right = destination === traveller.destination.slug && kind === traveller.ticket;
  if (!state.missed.ticket) {
    const heard = joined([traveller.line, station.kindAnswer(traveller.ticket)]).t;
    observe(traveller.ticket === "single" ? station.concepts.single : station.concepts.return, "recognitionAudio", kind === traveller.ticket, state.revealed, "", heard, {});
    observe(station.concepts.ticket, "recognitionAudio", destination === traveller.destination.slug, state.revealed, "", heard, {});
  }
  if (!right) {
    sound.play("wrong");
    stationRuntime.seconds = Math.max(1, stationRuntime.seconds - 4);
    set((s) => ({ missed: { ...s.missed, ticket: true }, revealed: true, ticket: { ...s.ticket, destination: null, kind: null } }));
    travellerSays(station.wrongTicket(traveller.destination, traveller.ticket), true);
    return;
  }
  sound.play("ring");
  emote("player", "happy", 800);
  if (state.level.platform && setup.platform) {
    goTo("platform");
    window.setTimeout(() => travellerSays(station.lines.askPlatform), 600);
  } else goodbye(traveller);
}

export function tellPlatform(text: string, via: "text" | "speech", hinted: boolean) {
  const traveller = currentTraveller();
  if (state.step !== "platform" || traveller?.kind !== "ticket" || !setup) return;
  const { station } = setup;
  const n = station.parsePlatform(text, setup.code);
  if (n === "digits") {
    sound.play("wrong");
    hostSays(station.lines.words);
    return;
  }
  const want = traveller.destination.platform;
  const right = n === want;
  if (!state.missed.platform || right) {
    const extra = { input: via, modality: via === "speech" ? "speech" : "text" };
    const concept = station.numbers[want];
    if (concept) observe(concept, "production", right, hinted, text, station.platform(want).t, extra);
    if (/gleis/i.test(text)) observe(station.concepts.platform, "production", right, hinted, text, station.platform(want).t, extra);
  }
  if (!right) {
    sound.play("wrong");
    set({ missed: { ...state.missed, platform: true } });
    hostSays(station.lines.platformWrong);
    return;
  }
  sound.play("correct");
  void speakLine(station.platform(want), { who: "player" });
  set({ said: { line: station.platform(want), by: "player" } });
  stationRuntime.paused = false;
  window.setTimeout(() => goodbye(traveller), 1400);
}

function goodbye(traveller: Traveller) {
  if (!setup) return;
  travellerSays(pick(setup.station.lines.thanks));
  set({ step: "leaving", helped: state.helped + 1 });
  stationRuntime.traveller.path = [{ x: TRAVELLER_SPOT.x - 1, z: TRAVELLER_SPOT.z + 1.2 }, PLATFORM_EXIT];
  window.setTimeout(() => next(traveller), 1700);
}

function next(traveller: Traveller) {
  if (state.status !== "running" || currentTraveller() !== traveller) return;
  const index = state.index + 1;
  set({ index, said: null });
  if (index >= state.travellers.length) finish(false);
  else admit();
}

// ---------- The way into town ----------

function startWay(traveller: Extract<Traveller, { kind: "way" }>) {
  if (state.status !== "running" || currentTraveller() !== traveller || !setup) return;
  goTo("way");
  stationRuntime.moves = new Map();
  stationRuntime.wrongClicks = 0;
  hostSays(setup.station.lines.carry);
  window.setTimeout(() => {
    if (currentTraveller() === traveller) void speakLine(traveller.directions, hostVoice());
  }, 2200);
  // Out from behind the kiosk to the first crossing, facing north.
  set({ town: { at: START, heading: 0, walking: true, inTown: true } });
  jobPlayer.locked = true;
  walkTo([...TO_TOWN, nodePoint(START)], () => {
    jobPlayer.walker.rot = headingRot(0);
    set((s) => ({ town: { ...s.town, walking: false } }));
  });
  follow([...TO_TOWN, nodePoint(START)]);
}

// The traveller trails along behind you with the suitcase's owner's patience.
function follow(points: Point[]) {
  stationRuntime.traveller.path = [...stationRuntime.traveller.path, ...points];
}

export function move(action: "forward" | "left" | "right") {
  const traveller = currentTraveller();
  if (state.step !== "way" || traveller?.kind !== "way" || state.town.walking) return;
  const { at } = state.town;
  const heading = action === "forward" ? state.town.heading : turn(state.town.heading, action);
  const to = forward(at, heading);
  if (!inTown(to)) {
    sound.play("wrong");
    set((s) => ({ town: { ...s.town, heading } }));
    jobPlayer.walker.rot = headingRot(heading);
    return;
  }
  // Remember the first move made at each crossing, for the evidence.
  const key = `${at.c},${at.r}`;
  if (!stationRuntime.moves.has(key)) stationRuntime.moves.set(key, to);
  sound.play("step");
  set({ town: { at: to, heading, walking: true, inTown: true } });
  walkTo(nodePoint(to), () => set((s) => ({ town: { ...s.town, walking: false } })));
  follow([nodePoint(at)]);
}

// Lost: back to the first crossing and start again.
export function restartWay() {
  const traveller = currentTraveller();
  if (state.step !== "way" || traveller?.kind !== "way" || !setup) return;
  stationRuntime.seconds = Math.max(1, stationRuntime.seconds - 5);
  hostSays(setup.station.lines.lost);
  set({ town: { at: START, heading: 0, walking: true, inTown: true } });
  walkTo(nodePoint(START), () => {
    jobPlayer.walker.rot = headingRot(0);
    set((s) => ({ town: { ...s.town, walking: false } }));
  });
}

// Clicking a building: is this where they wanted to go?
export function deliver(landmark: Landmark) {
  const traveller = currentTraveller();
  if (state.step !== "way" || traveller?.kind !== "way" || !setup || state.town.walking) return;
  const { station } = setup;
  if (!sameNode(state.town.at, landmark.node)) return;
  const right = landmark.slug === traveller.landmark.slug;
  if (!right) {
    sound.play("wrong");
    stationRuntime.wrongClicks++;
    travellerSays(station.wrongBuilding(landmark));
    return;
  }
  judgeWay(traveller);
  sound.play("correct");
  emote("player", "happy", 1200);
  travellerSays(station.lines.arrived);
  set({ step: "leaving", helped: state.helped + 1 });
  // The traveller goes in; you walk back to the window.
  window.setTimeout(() => {
    if (state.status !== "running") return;
    stationRuntime.traveller.path = [];
    const back: Point[] = [];
    let n = state.town.at;
    // Straight back down to the bottom row, then across to the station.
    while (n.r > 0) {
      n = { c: n.c, r: n.r - 1 };
      back.push(nodePoint(n));
    }
    back.push(nodePoint(START), ...[...TO_TOWN].reverse(), PLAYER_SPOT);
    set((s) => ({ town: { ...s.town, inTown: false, walking: true } }));
    walkTo(back, () => {
      jobPlayer.walker.rot = -Math.PI / 2;
      jobPlayer.locked = false;
      set((s) => ({ town: { ...s.town, walking: false } }));
    });
    next(traveller);
  }, 1600);
}

// Each turn of the directions counts by whether you took it.
function judgeWay(traveller: Extract<Traveller, { kind: "way" }>) {
  if (!setup) return;
  const { concepts } = setup.station;
  const heard = traveller.directions.t;
  const assisted = state.revealed;
  const route = traveller.route.nodes;
  const took = (i: number) => {
    const from = route[i];
    const went = stationRuntime.moves.get(`${from.c},${from.r}`);
    return Boolean(went && route[i + 1] && sameNode(went, route[i + 1]));
  };
  for (const s of traveller.steps) {
    if (s.kind === "straight") observe(concepts.straight, "recognitionAudio", took(0), assisted, "", heard, {});
    else if (s.kind === "turn") {
      const i = route.findIndex((n) => sameNode(n, s.at));
      const ok = took(i);
      observe(s.way === "left" ? concepts.left : concepts.right, "recognitionAudio", ok, assisted, "", heard, {});
      if (s.ref.type === "landmark") observe(s.ref.landmark.slug, "recognitionAudio", ok, assisted, "", heard, {});
      else if (s.ref.type === "light") observe(concepts.light, "recognitionAudio", ok, assisted, "", heard, {});
      else observe([concepts.first, concepts.second, concepts.third][s.ref.n - 1] ?? concepts.first, "recognitionAudio", ok, assisted, "", heard, {});
    } else observe(s.landmark.slug, "recognitionAudio", stationRuntime.wrongClicks === 0, assisted, "", heard, {});
  }
}

function finish(late: boolean) {
  if (state.status !== "running" || !setup) return;
  const timeLeft = stationRuntime.seconds / stationRuntime.total;
  const stars = stationStars(state.helped, state.travellers.length, timeLeft);
  const host = setup.host.id;
  const { levelUp, gift } = finishJob(host, state.levelIndex, stars);
  sound.play(stars >= 2 ? "levelup" : "sparkle");
  emote(host, stars >= 2 ? "happy" : "think", 2000);
  const lines = setup.station.lines;
  void speak((late ? lines.late : lines.done[stars >= 3 ? 0 : stars >= 2 ? 1 : 2]).t, hostVoice());
  stationRuntime.paused = false;
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
      context: { villager: setup.host.id, source: "station", level: state.levelIndex, step: state.step, ...extra },
    })
    .catch((cause) => console.error("Could not record observation", cause));
}
