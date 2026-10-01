"use client";

import { useSyncExternalStore } from "react";
import {
  checkPot,
  clinicLevel,
  clinicStars,
  emptyPot,
  judgeAdvice,
  makePatients,
  saysPattern,
  type Advice,
  type BodyPart,
  type ClinicConfig,
  type ClinicLevel,
  type HerbColor,
  type Patient,
  type Pot,
  type Reply,
  type Spoons,
} from "@/lib/game/clinic";
import { pick, type Line } from "@/lib/game/line";
import type { CharacterLook, Villager } from "@/lib/game/villagers";
import type { VoiceGender } from "@/lib/game/voices";
import type { Observation } from "@/lib/learning/adaptive";
import type { TargetLanguageCode } from "@/lib/learning/languages";
import { sound } from "../audio/sfx";
import { speak } from "../audio/speech";
import { emote, getGame, setGame, updateSave } from "../store";
import { AISLE_Z, BOUNDS, BREW_SPOT, counterSpot, DOOR_INSIDE, DOOR_OUTSIDE, HAND_SPOT, JARS, JUG_X, KETTLE_X, PATIENT_SPOT, PLAYER_START, SUGAR_X } from "./clinic-layout";
import { jobPlayer, placePlayer, stepWalker, walker, walkTo, type Walker } from "./walk";

// Surgery hours with the village doctor. One patient at a time: how they
// feel, where it hurts, the remedy from the recipe, and what they should do.

export type ClinicStep = "arriving" | "feeling" | "where" | "brew" | "carry" | "advice" | "leaving";
export type ClinicStatus = "intro" | "running" | "done" | "leaving";

export type ClinicState = {
  status: ClinicStatus;
  levelIndex: number;
  level: ClinicLevel;
  patients: Patient[];
  index: number;
  step: ClinicStep;
  look: CharacterLook;
  gender: VoiceGender;
  // Heard-only lines show their words after "pardon?".
  revealed: boolean;
  // `repeats`: the reaction already says the line it's about.
  said: { line: Line; by: "patient" | "host"; repeats?: boolean } | null;
  pot: Pot;
  // Each step only counts the first try as evidence.
  missed: Partial<Record<ClinicStep, boolean>>;
  helped: number;
  words: Record<string, [number, number]>;
  levelUp: boolean;
  late: boolean;
  timeLeft: number;
};

export type ClinicSetup = {
  code: TargetLanguageCode;
  host: Villager;
  clinic: ClinicConfig;
  parts: string[];
  colors: string[];
  spoons: Spoons[];
  heat: boolean;
  sugar: boolean;
  feelings: string[];
  advice: Advice[];
  weight: (slug: string) => number;
  conceptId: (slug: string) => string | null;
  record: (observation: Observation) => Promise<unknown>;
};

const PATIENT_WALK = 2.6;

// ---------- Patients' looks ----------

const skins = ["#f3c9a8", "#eab896", "#c68a62", "#8d5a3b", "#f6d7c0", "#d9a07a", "#5c3a26", "#f1c7a5"];
const hairs = ["#2b1d14", "#5b3a24", "#e9c46a", "#b5542c", "#1f1a17", "#8a6a44", "#d8d8d8", "#6b4a2f"];
const shirts = ["#2f6fb5", "#e76f51", "#3f7d4f", "#8b1e2d", "#f7c948", "#6c5ce7", "#2f8f8f", "#f4a3c1"];
const styles: CharacterLook["hairStyle"][] = ["bob", "braid", "short", "bun", "long", "ponytail", "curly", "spiky", "buzz"];

function guestLook(seed: number): CharacterLook {
  const of = <T,>(list: readonly T[], k: number) => list[(seed * (k + 3) + k) % list.length];
  return { skin: of(skins, 1), hair: of(hairs, 2), hairStyle: of(styles, 3), shirt: of(shirts, 4), pants: of(["#27364f", "#3d3d3d", "#4a3a2e"], 5), accent: of(shirts, 6), top: of(["tee", "knit", "hoodie", "shirt"] as const, 7), scale: 1 };
}

let setup: ClinicSetup | null = null;
let state: ClinicState = blank(0);
const listeners = new Set<() => void>();

function blank(levelIndex: number): ClinicState {
  const level = clinicLevel(levelIndex);
  return {
    status: "intro", levelIndex, level, patients: [], index: 0, step: "arriving", look: guestLook(1), gender: "woman",
    revealed: !level.heard, said: null, pot: emptyPot(), missed: {}, helped: 0, words: {}, levelUp: false, late: false, timeLeft: 1,
  };
}

function set(patch: Partial<ClinicState> | ((s: ClinicState) => Partial<ClinicState>)) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  listeners.forEach((l) => l());
}

export function getClinic() {
  return state;
}

export function clinicSetup() {
  return setup;
}

export function useClinic<T>(selector: (s: ClinicState) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => selector(state),
    () => selector(state),
  );
}

export const clinicRuntime = {
  patient: walker(DOOR_OUTSIDE) as Walker,
  patientArrive: null as null | (() => void),
  seconds: 0,
  total: 1,
  // The clock waits while you write advice: saying it shouldn't be a race.
  paused: false,
};

export function currentPatient() {
  return state.patients[state.index] ?? null;
}

// ---------- Starting and leaving ----------

export function startClinic(next: ClinicSetup, levelIndex: number) {
  setup = next;
  const level = clinicLevel(levelIndex);
  const patients = makePatients(next.clinic, { level, parts: next.parts, colors: next.colors, spoons: next.spoons, heat: next.heat, sugar: next.sugar, feelings: next.feelings, advice: next.advice, weight: next.weight, seed: Math.floor(Math.random() * 1e9) });
  state = { ...blank(levelIndex), patients };
  placePlayer(DOOR_OUTSIDE, -Math.PI / 2, [DOOR_INSIDE, PLAYER_START], BOUNDS);
  clinicRuntime.patient = walker(DOOR_OUTSIDE);
  clinicRuntime.patientArrive = null;
  clinicRuntime.seconds = level.seconds;
  clinicRuntime.total = level.seconds;
  clinicRuntime.paused = false;
  setGame({ phase: "job", job: "clinic", talkingTo: null, nearby: null });
  listeners.forEach((l) => l());
}

export function beginClinic() {
  sound.play("ring");
  set({ status: "running" });
  admit();
}

export function leaveClinic() {
  if (state.status === "leaving") return;
  jobPlayer.locked = true;
  clinicRuntime.paused = true;
  set({ status: "leaving" });
  walkTo([{ x: jobPlayer.walker.x, z: AISLE_Z }, DOOR_INSIDE, DOOR_OUTSIDE], () => {
    sound.play("close");
    setGame({ phase: "explore", job: null });
  });
}

// ---------- The loop ----------

export function tickClinic(delta: number) {
  if (stepWalker(clinicRuntime.patient, delta, PATIENT_WALK) && clinicRuntime.patientArrive) {
    const then = clinicRuntime.patientArrive;
    clinicRuntime.patientArrive = null;
    then();
  }
  if (state.status !== "running" || clinicRuntime.paused) return;
  clinicRuntime.seconds = Math.max(0, clinicRuntime.seconds - delta);
  if (clinicRuntime.seconds <= 0) finish(true);
}

function hostVoice() {
  return { who: setup!.host.id, pitch: setup!.host.voicePitch };
}

function patientSays(line: Line, repeats = false) {
  void speak(line.t, { gender: state.gender });
  set({ said: { line, by: "patient", repeats } });
}

function hostSays(line: Line) {
  void speak(line.t, hostVoice());
  set({ said: { line, by: "host" } });
}

// The line the current step is about, which "pardon?" repeats.
export function stepLine(step: ClinicStep = state.step, patient: Patient | null = currentPatient()): { line: Line; by: "patient" | "host" } | null {
  if (!patient || !setup) return null;
  switch (step) {
    case "feeling":
      return patient.feeling ? { line: patient.feeling.line, by: "patient" } : null;
    case "where":
      return { line: patient.complaint, by: "patient" };
    case "brew":
      return { line: patient.recipeLine, by: "host" };
    case "advice":
      return { line: setup.clinic.lines.adviceAsk, by: "patient" };
    default:
      return null;
  }
}

export function sayStep(slow = false) {
  const current = stepLine();
  if (!current) return;
  if (current.by === "patient") void speak(current.line.t, { gender: state.gender, slow });
  else void speak(current.line.t, { ...hostVoice(), slow });
}

export function pardon() {
  clinicRuntime.seconds = Math.max(1, clinicRuntime.seconds - 3);
  sound.play("pop");
  set({ revealed: true, said: null });
  sayStep(true);
}

function goTo(step: ClinicStep) {
  set({ step, said: null, revealed: !state.level.heard });
  window.setTimeout(() => sayStep(), 350);
}

// The next patient comes in from the waiting room.
function admit() {
  const patient = currentPatient();
  if (!patient) return;
  const seed = state.index * 7919 + 13;
  set({ step: "arriving", look: guestLook(seed), gender: seed % 2 ? "woman" : "man", pot: emptyPot(), missed: {}, said: null });
  clinicRuntime.patient = walker(DOOR_OUTSIDE, -Math.PI / 2, [DOOR_INSIDE, { x: PATIENT_SPOT.x, z: AISLE_Z }, PATIENT_SPOT]);
  clinicRuntime.patientArrive = () => {
    clinicRuntime.patient.rot = 0;
    goTo(patient.feeling ? "feeling" : "where");
  };
}

// ---------- How they feel ----------

export function reply(choice: Reply) {
  const patient = currentPatient();
  if (state.step !== "feeling" || !patient?.feeling || !setup) return;
  const right = choice === patient.feeling.reply;
  if (!state.missed.feeling) observe(patient.feeling.concept, "recognitionAudio", right, state.revealed, "", patient.feeling.line.t, {});
  if (right) {
    sound.play("correct");
    emote("player", "happy", 900);
    void speak(setup.clinic.replies[choice].line.t, { who: "player" });
    window.setTimeout(() => goTo("where"), 1300);
    return;
  }
  sound.play("wrong");
  set({ missed: { ...state.missed, feeling: true } });
  hostSays(setup.clinic.lines.replyWrong);
}

// ---------- Where it hurts ----------

export function point(part: BodyPart) {
  const patient = currentPatient();
  if (state.step !== "where" || !patient || !setup) return;
  // A toothache is pointed at the mouth.
  const right = part === patient.part.part;
  if (!state.missed.where) observe(patient.part.slug, "recognitionAudio", right, state.revealed, "", patient.complaint.t, {});
  if (right) {
    sound.play("correct");
    emote("player", "happy", 900);
    goTo("brew");
    return;
  }
  sound.play("wrong");
  clinicRuntime.seconds = Math.max(1, clinicRuntime.seconds - 5);
  const got = setup.clinic.parts.find((p) => p.part === part);
  set({ missed: { ...state.missed, where: true } });
  patientSays(got ? setup.clinic.wrongPart(patient.part, got) : patient.complaint, true);
}

// ---------- Brewing ----------

function atCounter(x: number, then: () => void) {
  if (state.status !== "running" || state.step !== "brew") return;
  walkTo(counterSpot(x), () => {
    if (state.status !== "running" || state.step !== "brew") return;
    then();
  });
}

export function addHerb(color: HerbColor) {
  atCounter(JARS[color], () => {
    sound.play("tile");
    set((s) => ({ pot: { ...s.pot, herbs: { ...s.pot.herbs, [color]: (s.pot.herbs[color] ?? 0) + 1 } } }));
  });
}

export function addWater(heat: "hot" | "cold") {
  atCounter(heat === "hot" ? KETTLE_X : JUG_X, () => {
    sound.play("pop");
    set((s) => ({ pot: { ...s.pot, water: heat } }));
  });
}

export function addSugar() {
  atCounter(SUGAR_X, () => {
    sound.play("tile");
    set((s) => ({ pot: { ...s.pot, sugar: s.pot.sugar + 1 } }));
  });
}

export function emptyCauldron() {
  if (state.step !== "brew") return;
  sound.play("whoosh");
  set({ pot: emptyPot() });
}

// Stir and taste: the doctor checks the brew against her recipe.
export function finishBrew() {
  const patient = currentPatient();
  if (state.step !== "brew" || !patient || !setup) return;
  walkTo(BREW_SPOT, () => {
    if (state.step !== "brew" || !setup) return;
    const { ok, problems } = checkPot(patient.recipe, state.pot);
    if (!state.missed.brew) {
      const { clinic } = setup;
      const line = patient.recipeLine.t;
      for (const herb of patient.recipe.herbs) {
        const right = !problems.includes(herb.color);
        const color = clinic.colors.find((c) => c.color === herb.color);
        if (color) observe(color.slug, "recognitionAudio", right, state.revealed, "", line, {});
        observe(clinic.numbers[herb.spoons], "recognitionAudio", right, state.revealed, "", line, {});
      }
      observe(patient.recipe.water === "hot" ? clinic.heat.hot : clinic.heat.cold, "recognitionAudio", !problems.includes("water"), state.revealed, "", line, {});
      if (clinic.sugar && (patient.recipe.sugar || state.pot.sugar > 0)) observe(clinic.sugar, "recognitionAudio", !problems.includes("sugar"), state.revealed, "", line, {});
    }
    if (ok) {
      sound.play("sparkle");
      emote(setup.host.id, "happy", 1400);
      hostSays(setup.clinic.lines.brewRight);
      set({ step: "carry", pot: emptyPot() });
      // You carry the potion over to the patient.
      walkTo([{ x: BREW_SPOT.x, z: 0.9 }, HAND_SPOT], handOver);
      return;
    }
    sound.play("wrong");
    emote(setup.host.id, "think", 1400);
    clinicRuntime.seconds = Math.max(1, clinicRuntime.seconds - 6);
    set({ pot: emptyPot(), missed: { ...state.missed, brew: true } });
    hostSays(setup.clinic.lines.brewWrong);
    window.setTimeout(() => sayStep(), 1800);
  });
}

function handOver() {
  const patient = currentPatient();
  if (!patient || !setup || state.status !== "running") return;
  sound.play("correct");
  emote("player", "happy", 900);
  void speak(setup.clinic.lines.drink.t, { who: "player" });
  set({ said: { line: setup.clinic.lines.drink, by: "host" } });
  window.setTimeout(() => {
    if (state.status !== "running") return;
    if (patient.advice) {
      clinicRuntime.paused = true;
      goTo("advice");
    } else discharge();
  }, 1500);
}

// ---------- Advice ----------

export function giveAdvice(text: string, via: "text" | "speech", hinted: boolean) {
  const patient = currentPatient();
  if (state.step !== "advice" || !patient?.advice || !setup) return;
  const advice = setup.clinic.advice[patient.advice]!;
  const right = judgeAdvice(advice, text, setup.code);
  if (!state.missed.advice || right) {
    const extra = { input: via, modality: via === "speech" ? "speech" : "text" };
    for (const concept of advice.concepts) observe(concept, "production", right, hinted, text, advice.say.t, extra);
    const frame = setup.clinic.adviceFrame;
    if (frame && saysPattern(frame.pattern, text, setup.code)) observe(frame.concept, "production", right, hinted, text, advice.say.t, extra);
  }
  if (right) {
    sound.play("correct");
    clinicRuntime.paused = false;
    discharge();
    return;
  }
  sound.play("wrong");
  set({ missed: { ...state.missed, advice: true } });
  patientSays(setup.clinic.lines.adviceWrong);
}

// ---------- Off they go ----------

function discharge() {
  if (!setup) return;
  const line = pick(setup.clinic.lines.thanks);
  emote("player", "happy", 1000);
  patientSays(line);
  set({ step: "leaving", helped: state.helped + 1 });
  clinicRuntime.patient.path = [{ x: PATIENT_SPOT.x, z: AISLE_Z }, DOOR_INSIDE, DOOR_OUTSIDE];
  clinicRuntime.patientArrive = () => {
    if (state.status !== "running") return;
    const index = state.index + 1;
    set({ index, said: null });
    if (index >= state.patients.length) finish(false);
    else admit();
  };
  // Back toward the middle for the next one.
  walkTo(PLAYER_START, () => undefined);
}

function finish(late: boolean) {
  if (state.status !== "running" || !setup) return;
  const timeLeft = clinicRuntime.seconds / clinicRuntime.total;
  const stars = clinicStars(state.helped, state.patients.length, timeLeft);
  const host = setup.host.id;
  const saved = getGame().save.shifts[host] ?? { level: 0, stars: [] };
  const best = [...saved.stars];
  best[state.levelIndex] = Math.max(best[state.levelIndex] ?? 0, stars);
  const levelUp = stars >= 2 && state.levelIndex === saved.level && saved.level < 4;
  updateSave({ shifts: { ...getGame().save.shifts, [host]: { level: levelUp ? saved.level + 1 : saved.level, stars: best } } });
  sound.play(stars >= 2 ? "levelup" : "sparkle");
  emote(host, stars >= 2 ? "happy" : "think", 2000);
  const lines = setup.clinic.lines;
  void speak((late ? lines.late : lines.done[stars >= 3 ? 0 : stars >= 2 ? 1 : 2]).t, hostVoice());
  clinicRuntime.paused = false;
  set({ status: "done", levelUp, late, timeLeft, said: null });
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
      context: { villager: setup.host.id, source: "clinic", level: state.levelIndex, step: state.step, ...extra },
    })
    .catch((cause) => console.error("Could not record observation", cause));
}
