"use client";

import { useSyncExternalStore } from "react";
import { cafeItem, type CafeConfig } from "@/lib/game/cafe";
import { pick, type Line } from "@/lib/game/line";
import { checkTray, makeOrder, orderVoice, partsIn, patienceFor, rushLevel, starsFor, type Order, type OrderPart, type RushConfig, type RushLevel } from "@/lib/game/rush";
import type { CharacterLook, Villager } from "@/lib/game/villagers";
import type { VoiceGender } from "@/lib/game/voices";
import { mulberry32 } from "@/lib/game/world";
import type { Observation } from "@/lib/learning/adaptive";
import type { TargetLanguageCode } from "@/lib/learning/languages";
import { sound } from "../audio/sfx";
import { speakLine } from "../audio/speech";
import type { ItemId } from "@/lib/game/wardrobe";
import { emote, setGame } from "../store";
import { finishJob } from "./progress";
import { COUNTER_SPOTS, DOOR, KITCHEN_SPOT, serveSpot, STAFF, STAFF_DOOR, STAFF_ENTRY, STAFF_START, stationSlugs, stationSpot, TRASH_SPOT } from "./cafe-layout";
import { jobPlayer, placePlayer, stepWalker, walkTo, type Walker } from "./walk";

// One shift behind the café counter. React sees the coarse state (who is
// waiting, what's on the tray, the score); positions and patience tick in
// `shiftRuntime` every frame so the room never re-renders the UI.

export type Customer = {
  id: number;
  order: Order;
  look: CharacterLook;
  gender: VoiceGender;
  spot: number;
  status: "entering" | "waiting" | "happy" | "angry";
  // Heard-only orders show their words after "pardon?".
  revealed: boolean;
  // What they last said, when it isn't their order.
  said: Line | null;
  // A wrong tray already counted against understanding them.
  missed: boolean;
};

// "leaving" is the walk out through the staff door.
export type ShiftStatus = "intro" | "running" | "done" | "leaving";

export type ShiftState = {
  status: ShiftStatus;
  levelIndex: number;
  level: RushLevel;
  customers: Customer[];
  // Guests still to come through the door.
  coming: number;
  served: number;
  lost: number;
  tips: number;
  tray: string[];
  kitchen: { open: boolean; reply: Line | null };
  // Words practised this shift: slug → [right, total].
  words: Record<string, [number, number]>;
  levelUp: boolean;
  // Work clothes the host just gave you, if this run earned them.
  gift: ItemId | null;
};

export type ShiftSetup = {
  code: TargetLanguageCode;
  host: Villager;
  cafe: CafeConfig;
  rush: RushConfig;
  // Menu items the learner has met, and whether "two" and "with milk" are known.
  items: string[];
  quantities: boolean;
  modifiers: boolean;
  weight: (slug: string) => number;
  conceptId: (slug: string) => string | null;
  record: (observation: Observation) => Promise<unknown>;
};

export const TRAY_LIMIT = 6;
const GUEST_WALK = 2.6;

let setup: ShiftSetup | null = null;
let state: ShiftState = blank(0);
const listeners = new Set<() => void>();

function blank(levelIndex: number): ShiftState {
  return {
    status: "intro",
    levelIndex,
    level: rushLevel(levelIndex),
    customers: [],
    coming: rushLevel(levelIndex).guests,
    served: 0,
    lost: 0,
    tips: 0,
    tray: [],
    kitchen: { open: false, reply: null },
    words: {},
    levelUp: false, gift: null,
  };
}

function set(patch: Partial<ShiftState> | ((s: ShiftState) => Partial<ShiftState>)) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  listeners.forEach((l) => l());
}

export function getShift() {
  return state;
}

export function useShift<T>(selector: (s: ShiftState) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => selector(state),
    () => selector(state),
  );
}

export function shiftSetup() {
  return setup;
}

// ---------- Per-frame state ----------

export const shiftRuntime = {
  guests: new Map<number, Walker & { waited: number; patience: number; leftAt: number | null }>(),
  nextGuestIn: 0,
  // The clock stops while the kitchen hatch is open.
  paused: false,
};

// ---------- Starting and leaving ----------

export function startShift(next: ShiftSetup, levelIndex: number) {
  setup = next;
  state = blank(levelIndex);
  // You come in through the staff door and walk up to the counter while the host explains.
  placePlayer({ x: STAFF_ENTRY.x + 0.9, z: STAFF_ENTRY.z }, -Math.PI / 2, [STAFF_ENTRY, STAFF_START], STAFF);
  shiftRuntime.guests.clear();
  shiftRuntime.nextGuestIn = 0.6;
  shiftRuntime.paused = false;
  setGame({ phase: "job", job: "cafe", talkingTo: null, nearby: null });
  listeners.forEach((l) => l());
}

export function beginRush() {
  sound.play("ring");
  set({ status: "running" });
}

// You walk out through the staff door, then you're back outside where you went in.
export function leaveShift() {
  if (state.status === "leaving") return;
  shiftRuntime.paused = true;
  jobPlayer.locked = true;
  set({ status: "leaving", kitchen: { open: false, reply: null } });
  walkTo([{ x: STAFF_ENTRY.x, z: STAFF_DOOR.z }, { x: STAFF_DOOR.x + 0.4, z: STAFF_DOOR.z }], () => {
    sound.play("close");
    shiftRuntime.guests.clear();
    setGame({ phase: "explore", job: null });
  });
}

// ---------- The loop ----------

let nextId = 1;

function spawn() {
  if (!setup) return;
  const taken = new Set(state.customers.filter((c) => c.status !== "happy" && c.status !== "angry").map((c) => c.spot));
  const free = COUNTER_SPOTS.map((_, i) => i).filter((i) => !taken.has(i) && i < Math.max(state.level.together, 1));
  if (!free.length) return;
  const seed = Math.floor(Math.random() * 1e9);
  const random = mulberry32(seed);
  const order = makeOrder(setup.cafe, setup.rush, { level: state.level, items: setup.items, quantities: setup.quantities, modifiers: setup.modifiers, weight: setup.weight, seed });
  const gender: VoiceGender = orderVoice(order.line.t);
  const spot = free[Math.floor(random() * free.length)];
  const id = nextId++;
  const customer: Customer = { id, order, look: guestLook(random), gender, spot, status: "entering", revealed: !state.level.heard, said: null, missed: false };
  const at = COUNTER_SPOTS[spot];
  shiftRuntime.guests.set(id, {
    x: DOOR.x,
    z: DOOR.z,
    rot: -Math.PI / 2,
    speed: 0,
    path: [{ x: at.x, z: DOOR.z }, { x: at.x, z: at.z }],
    waited: 0,
    patience: patienceFor(state.level, order),
    leftAt: null,
  });
  set((s) => ({ customers: [...s.customers, customer], coming: s.coming - 1 }));
}

export function tickShift(delta: number) {
  const run = shiftRuntime;
  if (state.status !== "running") return;
  const clock = run.paused ? 0 : delta;
  for (const customer of state.customers) {
    const guest = run.guests.get(customer.id);
    if (!guest) continue;
    const arrived = stepWalker(guest, delta, GUEST_WALK);
    if (customer.status === "entering" && arrived) {
      guest.rot = Math.PI;
      update(customer.id, { status: "waiting" });
      sayOrder(customer, false);
    } else if (customer.status === "waiting") {
      guest.waited += clock;
      if (guest.waited >= guest.patience) giveUp(customer);
    } else if ((customer.status === "happy" || customer.status === "angry") && arrived && guest.leftAt === null) {
      guest.leftAt = performance.now();
      run.guests.delete(customer.id);
      set((s) => ({ customers: s.customers.filter((c) => c.id !== customer.id) }));
      finishIfDone();
    }
  }
  // New guests, one at a time, while there's room at the counter.
  const waiting = state.customers.filter((c) => c.status === "entering" || c.status === "waiting").length;
  if (state.coming > 0 && waiting < state.level.together) {
    run.nextGuestIn -= clock;
    if (run.nextGuestIn <= 0) {
      run.nextGuestIn = waiting === 0 ? 1.2 : 4.5;
      spawn();
    }
  }
}

function update(id: number, patch: Partial<Customer>) {
  set((s) => ({ customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
}

function leave(customer: Customer, status: "happy" | "angry", said: Line) {
  const guest = shiftRuntime.guests.get(customer.id);
  if (guest) guest.path = [{ x: COUNTER_SPOTS[customer.spot].x, z: DOOR.z }, { x: DOOR.x + 1.5, z: DOOR.z }];
  update(customer.id, { status, said });
}

function giveUp(customer: Customer) {
  if (!setup) return;
  sound.play("wrong");
  void speakLine(setup.rush.lines.angry, { gender: customer.gender });
  leave(customer, "angry", setup.rush.lines.angry);
  set((s) => ({ lost: s.lost + 1 }));
}

function finishIfDone() {
  if (state.status !== "running" || state.coming > 0 || state.customers.length > 0 || !setup) return;
  const stars = starsFor(state.served, state.level.guests);
  const host = setup.host.id;
  const { levelUp, gift } = finishJob(host, state.levelIndex, stars);
  sound.play(stars >= 2 ? "levelup" : "sparkle");
  emote(host, "happy", 2000);
  const line = setup.rush.lines.done[stars >= 3 ? 0 : stars >= 2 ? 1 : 2];
  void speakLine(line, { who: host, pitch: setup.host.voicePitch });
  set({ status: "done", levelUp, gift });
}

// ---------- What the customer says ----------

export function sayOrder(customer: Customer, slow: boolean) {
  void speakLine(customer.order.line, { gender: customer.gender, slow });
}

// "Pardon?": they say it again, slowly, and the words show. Costs a little patience.
export function pardon(customer: Customer) {
  const guest = shiftRuntime.guests.get(customer.id);
  if (guest) guest.waited = Math.min(guest.patience - 1, guest.waited + 3);
  sound.play("pop");
  update(customer.id, { revealed: true, said: null });
  sayOrder(customer, true);
}

// ---------- Working the counter ----------

export function grab(slug: string) {
  if (state.status !== "running" || !setup) return;
  walkTo(stationSpot(stationSlugs(setup.cafe, setup.rush), slug), () => {
    if (state.tray.length >= TRAY_LIMIT) {
      sound.play("wrong");
      return;
    }
    sound.play("tile");
    set((s) => ({ tray: [...s.tray, slug] }));
  });
}

export function dropFromTray(index: number) {
  sound.play("pop");
  set((s) => ({ tray: s.tray.filter((_, i) => i !== index) }));
}

export function emptyTray() {
  if (state.status !== "running") return;
  walkTo(TRASH_SPOT, () => {
    sound.play("whoosh");
    set({ tray: [] });
  });
}

export function goToKitchen() {
  if (state.status !== "running") return;
  walkTo(KITCHEN_SPOT, () => {
    if (!setup) return;
    shiftRuntime.paused = true;
    jobPlayer.locked = true;
    sound.play("open");
    emote(setup.host.id, "wave", 1000);
    void speakLine(setup.rush.lines.kitchenAsk, { who: setup.host.id, pitch: setup.host.voicePitch });
    set({ kitchen: { open: true, reply: null } });
  });
}

export function closeKitchen() {
  shiftRuntime.paused = false;
  jobPlayer.locked = false;
  set({ kitchen: { open: false, reply: null } });
}

// What the waiting guests still need from the kitchen, for the hint.
export function kitchenNeeds(): OrderPart[] {
  if (!setup) return [];
  const { kitchen } = setup.rush;
  const counts = new Map<string, number>();
  for (const c of state.customers) if (c.status === "waiting") for (const slug of c.order.tray) if (kitchen.includes(slug)) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  for (const slug of state.tray) if (counts.has(slug)) counts.set(slug, counts.get(slug)! - 1);
  return [...counts].filter(([, n]) => n > 0).map(([item, n]) => ({ item, count: n >= 2 ? 2 : 1 }));
}

// The learner asks the host for something. The host bakes exactly what was
// asked for, and says it back the right way.
export async function askKitchen(text: string, via: "text" | "speech", hinted: boolean) {
  if (!setup) return;
  const { rush, host, code, cafe } = setup;
  const found = partsIn(cafe, rush, text, code);
  const baked = found.filter((p) => rush.kitchen.includes(p.item));
  const voice = { who: host.id, pitch: host.voicePitch };
  if (!baked.length) {
    const reply = found.length ? rush.lines.kitchenNotHere : rush.lines.kitchenHuh;
    sound.play("wrong");
    emote(host.id, "think", 1400);
    void speakLine(reply, voice);
    set({ kitchen: { open: true, reply } });
    return;
  }
  const room = TRAY_LIMIT - state.tray.length;
  const handed = baked.flatMap((p) => Array<string>(p.count).fill(p.item)).slice(0, Math.max(0, room));
  const reply = rush.kitchenGive(baked);
  sound.play("correct");
  emote(host.id, "happy", 1400);
  void speakLine(reply, voice);
  set((s) => ({ tray: [...s.tray, ...handed], kitchen: { open: true, reply } }));
  // Saying a kitchen item is producing the word; saying it the way the host
  // says it back is the whole phrase.
  for (const part of baked) {
    observe(part.item, "production", true, hinted, text, rush.phrase(part).t, { formOk: part.formOk, input: via, modality: via === "speech" ? "speech" : "text" });
    if (part.count === 2) observe(rush.quantity.concept, "production", true, hinted, text, rush.phrase(part).t, { input: via });
  }
  window.setTimeout(() => {
    if (state.kitchen.reply === reply) closeKitchen();
  }, 1600);
}

export function serve(customer: Customer) {
  if (state.status !== "running") return;
  if (customer.status !== "waiting" || !state.tray.length) {
    if (customer.status === "waiting") sayOrder(customer, false);
    return;
  }
  walkTo(serveSpot(customer.spot), () => {
    const current = state.customers.find((c) => c.id === customer.id);
    if (!current || current.status !== "waiting" || !setup) return;
    const result = checkTray(current.order, state.tray);
    const guest = shiftRuntime.guests.get(current.id);
    const heardOnly = state.level.heard && !current.revealed;
    if (result.ok) {
      const quick = guest ? guest.waited < guest.patience * 0.5 : false;
      const line = pick(setup.rush.lines.thanks);
      sound.play("correct");
      emote("player", "happy", 1000);
      void speakLine(line, { gender: current.gender });
      set((s) => ({ tray: [], served: s.served + 1, tips: s.tips + (quick ? 1 : 0) }));
      leave(current, "happy", line);
      if (!current.missed) understood(current, true, !heardOnly);
      return;
    }
    // They hand it back and say what's wrong, the way people do.
    const { cafe, rush } = setup;
    const item = (slug: string) => cafeItem(cafe, slug)!;
    const line =
      result.missing.length && result.extra.length
        ? rush.wrong(item(result.missing[0]), item(result.extra[0]))
        : result.missing.length
          ? rush.missing(item(result.missing[0]))
          : rush.extra(item(result.extra[0]));
    sound.play("wrong");
    if (guest) guest.waited = Math.min(guest.patience - 1, guest.waited + 6);
    void speakLine(line, { gender: current.gender });
    if (!current.missed) understood(current, false, !heardOnly);
    update(current.id, { said: line, missed: true });
  });
}

// Understanding an order is evidence for every word in it. Orders read off
// the bubble only count as exposure; orders understood by ear count for real.
function understood(customer: Customer, right: boolean, assisted: boolean) {
  if (!setup) return;
  const { rush } = setup;
  for (const part of customer.order.parts) {
    observe(part.item, "recognitionAudio", right, assisted, "", customer.order.line.t, { heardOnly: !assisted });
    if (part.with) observe(rush.modifier.concept, "recognitionAudio", right, assisted, "", customer.order.line.t, {});
    if (part.count === 2) observe(rush.quantity.concept, "recognitionAudio", right, assisted, "", customer.order.line.t, {});
  }
}

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
      context: { villager: setup.host.id, source: "cafe-rush", level: state.levelIndex, mode: dimension === "production" ? "kitchen" : "order", ...extra },
    })
    .catch((cause) => console.error("Could not record observation", cause));
}

// ---------- Looks ----------

const skins = ["#f3c9a8", "#eab896", "#c68a62", "#8d5a3b", "#f6d7c0", "#d9a07a", "#5c3a26", "#f1c7a5"];
const hairs = ["#2b1d14", "#5b3a24", "#e9c46a", "#b5542c", "#1f1a17", "#8a6a44", "#d8d8d8", "#6b4a2f"];
const shirts = ["#2f6fb5", "#e76f51", "#3f7d4f", "#8b1e2d", "#f7c948", "#6c5ce7", "#2f8f8f", "#f4a3c1", "#4d6a8a"];
const styles: CharacterLook["hairStyle"][] = ["bob", "braid", "short", "bun", "long", "ponytail", "curly", "spiky", "buzz"];
const tops: NonNullable<CharacterLook["top"]>[] = ["tee", "longsleeve", "hoodie", "knit", "shirt", "stripes"];

function guestLook(random: () => number): CharacterLook {
  const of = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length)];
  return {
    skin: of(skins),
    hair: of(hairs),
    hairStyle: of(styles),
    shirt: of(shirts),
    pants: of(["#27364f", "#3d3d3d", "#4a3a2e", "#2c3e50"]),
    accent: of(shirts),
    top: of(tops),
    hat: random() < 0.2 ? of(["cap", "beanie", "sunhat"] as const) : undefined,
    glasses: random() < 0.2,
    scale: 0.92 + random() * 0.12,
  };
}
