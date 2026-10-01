"use client";

import { useSyncExternalStore } from "react";
import type { Line } from "@/lib/game/line";
import { pick } from "@/lib/game/line";
import {
  checkBasket,
  clothesGender,
  makeCustomers,
  marketLevel,
  marketStars,
  type Basket,
  type Customer,
  type MarketConfig,
  type MarketLevel,
  type Payment,
  type RailItem,
} from "@/lib/game/market";
import type { CharacterLook, Villager } from "@/lib/game/villagers";
import type { VoiceGender } from "@/lib/game/voices";
import type { ItemId } from "@/lib/game/wardrobe";
import type { Observation } from "@/lib/learning/adaptive";
import type { TargetLanguageCode } from "@/lib/learning/languages";
import { sound } from "../audio/sfx";
import { speak, speakLine } from "../audio/speech";
import { emote, setGame } from "../store";
import { behind, BEHIND_Z, BOUNDS, CLOTHES_SPOT, COUNTER_SPOT, crateX, GAP_X, HAND_SPOT, hangerX, PLAYER_START, RAIL_FRONT_Z, STREET } from "./market-layout";
import { finishJob } from "./progress";
import { jobPlayer, placePlayer, stepWalker, walker, walkTo, type Point, type Walker } from "./walk";

// Market day at the stall. Produce customers: fill the basket as they ask,
// "Sonst noch etwas?" until that's all, say the price, take cash or card.
// Clothes shoppers: fetch what they describe from the rail, swap the size if
// it's too small or too big, then the price and the payment.

export type MarketStep = "arriving" | "order" | "clothes" | "trying" | "price" | "pay" | "leaving";
export type MarketStatus = "intro" | "running" | "done" | "leaving";

export type MarketState = {
  status: MarketStatus;
  levelIndex: number;
  level: MarketLevel;
  customers: Customer[];
  index: number;
  step: MarketStep;
  look: CharacterLook;
  gender: VoiceGender;
  // The crate under the mouse, whose name shows while the stall is new.
  hover: string | null;
  // How many parts of a produce order the customer has said so far.
  heardParts: number;
  basket: Basket;
  // What you're carrying from the rail, and what they tried on last.
  carrying: RailItem | null;
  tried: RailItem | null;
  revealed: boolean;
  said: { line: Line; by: "customer" | "host" | "player"; repeats?: boolean } | null;
  missed: Partial<Record<MarketStep, boolean>>;
  served: number;
  words: Record<string, [number, number]>;
  levelUp: boolean;
  gift: ItemId | null;
  late: boolean;
  timeLeft: number;
};

export type MarketSetup = {
  code: TargetLanguageCode;
  host: Villager;
  market: MarketConfig;
  produce: string[];
  numbers: number[];
  kilos: boolean;
  price: boolean;
  payment: boolean;
  clothes: string[];
  colours: string[];
  sizes: boolean;
  weight: (slug: string) => number;
  conceptId: (slug: string) => string | null;
  record: (observation: Observation) => Promise<unknown>;
};

const WALK = 2.6;

const skins = ["#f3c9a8", "#eab896", "#c68a62", "#8d5a3b", "#f6d7c0", "#d9a07a", "#5c3a26", "#f1c7a5"];
const hairs = ["#2b1d14", "#5b3a24", "#e9c46a", "#b5542c", "#1f1a17", "#8a6a44", "#d8d8d8", "#6b4a2f"];
const shirts = ["#2f6fb5", "#e76f51", "#3f7d4f", "#8b1e2d", "#f7c948", "#6c5ce7", "#2f8f8f", "#f4a3c1"];

function shopperLook(seed: number, gender: VoiceGender): CharacterLook {
  const of = <T,>(list: readonly T[], k: number) => list[(seed * (k + 3) + k) % list.length];
  return {
    skin: of(skins, 1), hair: of(hairs, 2), hairStyle: gender === "woman" ? of(["bob", "bun", "long", "ponytail", "curly"] as const, 3) : of(["short", "buzz", "curly", "spiky"] as const, 3),
    shirt: of(shirts, 4), pants: of(["#27364f", "#3d3d3d", "#4a3a2e"], 5), accent: of(shirts, 6), top: of(["tee", "knit", "shirt", "stripes"] as const, 7), beard: gender === "man" && seed % 3 === 0, scale: 1,
  };
}

let setup: MarketSetup | null = null;
let state: MarketState = blank(0);
const listeners = new Set<() => void>();

function blank(levelIndex: number): MarketState {
  const level = marketLevel(levelIndex);
  return {
    status: "intro", levelIndex, level, customers: [], index: 0, step: "arriving", look: shopperLook(1, "woman"), gender: "woman", hover: null, heardParts: 0, basket: {},
    carrying: null, tried: null, revealed: !level.heard, said: null, missed: {}, served: 0, words: {}, levelUp: false, gift: null, late: false, timeLeft: 1,
  };
}

function set(patch: Partial<MarketState> | ((s: MarketState) => Partial<MarketState>)) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  listeners.forEach((l) => l());
}

export function getMarket() {
  return state;
}

export function marketSetup() {
  return setup;
}

export function useMarket<T>(selector: (s: MarketState) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => selector(state),
    () => selector(state),
  );
}

export const marketRuntime = {
  customer: walker(STREET) as Walker,
  arrive: null as null | (() => void),
  seconds: 0,
  total: 1,
  // The clock waits while you type the price.
  paused: false,
};

export function currentCustomer() {
  return state.customers[state.index] ?? null;
}

// ---------- Starting and leaving ----------

export function startMarket(next: MarketSetup, levelIndex: number) {
  setup = next;
  const level = marketLevel(levelIndex);
  const customers = makeCustomers(next.market, {
    level,
    produce: next.produce,
    numbers: next.numbers,
    kilos: next.kilos,
    price: next.price,
    payment: next.payment,
    clothes: next.clothes,
    colours: next.colours,
    sizes: next.sizes,
    weight: next.weight,
    seed: Math.floor(Math.random() * 1e9),
  });
  state = { ...blank(levelIndex), customers };
  placePlayer({ x: PLAYER_START.x - 4, z: BEHIND_Z }, Math.PI / 2, [PLAYER_START], BOUNDS);
  jobPlayer.arrive = () => (jobPlayer.walker.rot = 0);
  marketRuntime.customer = walker(STREET);
  marketRuntime.arrive = null;
  marketRuntime.seconds = level.seconds;
  marketRuntime.total = level.seconds;
  marketRuntime.paused = false;
  setGame({ phase: "job", job: "market", talkingTo: null, nearby: null });
  listeners.forEach((l) => l());
}

export function beginMarket() {
  sound.play("ring");
  set({ status: "running" });
  admit();
}

export function leaveMarket() {
  if (state.status === "leaving") return;
  jobPlayer.locked = true;
  marketRuntime.paused = true;
  set({ status: "leaving" });
  sound.play("close");
  setGame({ phase: "explore", job: null });
}

// ---------- The loop ----------

export function tickMarket(delta: number) {
  if (stepWalker(marketRuntime.customer, delta, WALK) && marketRuntime.arrive) {
    const then = marketRuntime.arrive;
    marketRuntime.arrive = null;
    then();
  }
  if (state.status !== "running" || marketRuntime.paused) return;
  marketRuntime.seconds = Math.max(0, marketRuntime.seconds - delta);
  if (marketRuntime.seconds <= 0) finish(true);
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

function playerSays(line: Line) {
  void speakLine(line, { who: "player" });
  set({ said: { line, by: "player" } });
}

const joined = (lines: Line[]): Line => ({ t: lines.map((l) => l.t).join(" "), en: lines.map((l) => l.en).join(" "), parts: lines.flatMap((l) => l.parts ?? [l.t]) });

// What the customer has asked for so far, which "pardon?" repeats.
export function stepLine(step: MarketStep = state.step, customer: Customer | null = currentCustomer(), heard = state.heardParts): Line | null {
  if (!customer || !setup) return null;
  if (step === "order" && customer.kind === "produce") return joined(customer.parts.slice(0, heard).map((p) => p.line));
  if ((step === "clothes" || step === "trying") && customer.kind === "clothes") return customer.line;
  if (step === "pay") return setup.market.pay(customer.payment);
  return null;
}

export function sayStep(slow = false) {
  const line = stepLine();
  if (line) void speakLine(line, { gender: state.gender, slow });
}

export function pardon() {
  marketRuntime.seconds = Math.max(1, marketRuntime.seconds - 3);
  sound.play("pop");
  set({ revealed: true, said: null });
  sayStep(true);
}

function goTo(step: MarketStep) {
  marketRuntime.paused = step === "price";
  set({ step, revealed: !state.level.heard });
}

// The next customer comes up the square.
function admit() {
  const customer = currentCustomer();
  if (!customer || !setup) return;
  const seed = state.index * 7919 + 31;
  const gender: VoiceGender = customer.kind === "clothes" ? clothesGender(customer.wish.item, customer.wish.colour) : seed % 2 ? "woman" : "man";
  set({ step: "arriving", look: shopperLook(seed, gender), gender, heardParts: 0, basket: {}, carrying: null, tried: null, missed: {}, said: null });
  const spot = customer.kind === "clothes" ? CLOTHES_SPOT : COUNTER_SPOT;
  marketRuntime.customer = walker(STREET, Math.PI / 2, [{ x: spot.x - 1.5, z: STREET.z }, spot]);
  marketRuntime.arrive = () => {
    marketRuntime.customer.rot = Math.PI;
    const hello = pick(setup!.market.lines.hello, (seed % 97) / 97);
    if (customer.kind === "produce") {
      goTo("order");
      set({ heardParts: 1 });
      void speakLine(joined([hello, customer.parts[0].line]), { gender: state.gender });
      set({ said: { line: hello, by: "customer" } });
    } else {
      goTo("clothes");
      void speakLine(joined([hello, customer.line]), { gender: state.gender });
      set({ said: { line: hello, by: "customer" } });
    }
  };
}

// ---------- Produce ----------

export function addProduce(slug: string) {
  if (state.step !== "order" || !setup) return;
  const i = setup.market.produce.findIndex((p) => p.slug === slug);
  if (i < 0) return;
  walkTo(behind(crateX(i)), () => {
    if (state.step !== "order") return;
    jobPlayer.walker.rot = 0;
    sound.play("tile");
    set((s) => ({ basket: { ...s.basket, [slug]: (s.basket[slug] ?? 0) + 1 } }));
  });
}

export function hoverCrate(slug: string | null) {
  if (state.hover !== slug) set({ hover: slug });
}

export function emptyBasket() {
  if (state.step !== "order") return;
  sound.play("whoosh");
  set({ basket: {} });
}

// "Sonst noch etwas?" — the rest of the order, or "that's all" and the check.
export function anythingElse() {
  const customer = currentCustomer();
  if (state.step !== "order" || customer?.kind !== "produce" || !setup) return;
  const { market } = setup;
  observe(market.frames.anythingElse, "exposure", true, true, market.lines.anythingElse.t, market.lines.anythingElse.t, {});
  playerSays(market.lines.anythingElse);
  window.setTimeout(() => {
    if (state.step !== "order" || currentCustomer() !== customer) return;
    if (state.heardParts < customer.parts.length) {
      const next = customer.parts[state.heardParts];
      set({ heardParts: state.heardParts + 1, revealed: !state.level.heard });
      void speakLine(joined([market.lines.yes, next.line]), { gender: state.gender });
      set({ said: { line: market.lines.yes, by: "customer" } });
      return;
    }
    checkOrder(customer);
  }, 1100);
}

function checkOrder(customer: Extract<Customer, { kind: "produce" }>) {
  if (!setup) return;
  const { market } = setup;
  const asked = customer.parts.map((p) => p.amount);
  const problems = checkBasket(asked, state.basket);
  if (!state.missed.order) {
    const heard = joined(customer.parts.map((p) => p.line)).t;
    for (const { amount } of customer.parts) {
      const right = !problems.includes(amount.produce.slug);
      observe(amount.produce.slug, "recognitionAudio", right, state.revealed, "", heard, {});
      if (amount.produce.by === "piece") observe(market.numbers[amount.n], "recognitionAudio", right, state.revealed, "", heard, {});
      else observe(amount.n === 1 && market.halfKilo ? market.halfKilo : market.kilo, "recognitionAudio", right, state.revealed, "", heard, {});
    }
  }
  if (problems.length) {
    sound.play("wrong");
    marketRuntime.seconds = Math.max(1, marketRuntime.seconds - 5);
    set({ missed: { ...state.missed, order: true }, revealed: true });
    // "Hmm, das stimmt nicht. Ich nehme drei Äpfel. Ich nehme ein Kilo Kirschen."
    customerSays(joined([market.lines.wrongBasket, ...customer.parts.map((p) => market.order(p.amount, 0))]), true);
    return;
  }
  sound.play("correct");
  emote("player", "happy", 900);
  customerSays(market.lines.thatsAll);
  window.setTimeout(() => afterGoods(customer), 1500);
}

// ---------- Clothes ----------

export function takeFromRail(index: number) {
  const customer = currentCustomer();
  if ((state.step !== "clothes" && state.step !== "trying") || customer?.kind !== "clothes" || state.carrying) return;
  const item = customer.rail[index];
  const x = hangerX(index, customer.rail.length);
  walkTo([{ x: GAP_X, z: BEHIND_Z }, { x: GAP_X, z: 0.9 }, { x, z: RAIL_FRONT_Z }], () => {
    sound.play("tile");
    set({ carrying: item });
    walkTo(HAND_SPOT, () => handOver(item));
  });
}

function handOver(item: RailItem) {
  const customer = currentCustomer();
  if (customer?.kind !== "clothes" || !setup || state.status !== "running") return;
  const { market } = setup;
  const { wish } = customer;
  jobPlayer.walker.rot = 0;
  const rightItem = item.item.slug === wish.item.slug;
  const rightColour = item.colour.slug === wish.colour.slug;
  const heard = customer.line.t;
  if (!state.missed.clothes) {
    observe(wish.item.slug, "recognitionAudio", rightItem, state.revealed, "", heard, {});
    observe(wish.colour.slug, "recognitionAudio", rightColour, state.revealed, "", heard, {});
  }
  if (!rightItem || !rightColour) {
    sound.play("wrong");
    marketRuntime.seconds = Math.max(1, marketRuntime.seconds - 4);
    set({ carrying: null, missed: { ...state.missed, clothes: true }, revealed: true });
    customerSays(joined([market.lines.notThat, customer.line]), true);
    return;
  }
  // They try it on. After "zu klein", the bigger one is the answer; after "zu groß", the smaller.
  const before = state.tried;
  if (before && before.size !== wish.size && state.step === "trying") {
    const fixed = item.size === wish.size;
    observe(before.size === "small" ? market.frames.tooSmall : market.frames.tooBig, "recognitionAudio", fixed, false, "", market.wrongSize(wish.item, before.size).t, {});
  }
  set({ carrying: null, tried: item, step: "trying" });
  if (item.item.sized && item.size !== wish.size) {
    sound.play("pop");
    emote("player", "think", 900);
    customerSays(market.wrongSize(wish.item, item.size));
    return;
  }
  sound.play("correct");
  emote("player", "happy", 900);
  customerSays(market.fits(wish.item));
  window.setTimeout(() => afterGoods(customer), 2200);
}

// ---------- The price and the payment ----------

function afterGoods(customer: Customer) {
  if (state.status !== "running" || currentCustomer() !== customer || !setup) return;
  if (state.level.price && setup.price) {
    goTo("price");
    customerSays(setup.market.lines.whatCosts);
  } else if (state.level.payment && setup.payment) askPayment(customer);
  else farewell(customer);
}

export function tellPrice(text: string, via: "text" | "speech", hinted: boolean) {
  const customer = currentCustomer();
  if (state.step !== "price" || !customer || !setup) return;
  const { market } = setup;
  const said = market.parsePrice(text, setup.code);
  if (said === "digits") {
    sound.play("wrong");
    hostSays(market.lines.words);
    return;
  }
  const right = said === customer.cents;
  const expected = market.price(customer.cents);
  if (!state.missed.price || right) {
    const extra = { input: via, modality: via === "speech" ? "speech" : "text" };
    const euros = Math.floor(customer.cents / 100);
    const cents = customer.cents % 100;
    for (const n of [euros, cents].filter((n) => n > 0)) if (market.numbers[n]) observe(market.numbers[n], "production", right, hinted, text, expected.t, extra);
    if (/\bkostet\b/i.test(text)) observe(market.frames.costs, "production", right, hinted, text, expected.t, extra);
  }
  if (!right) {
    sound.play("wrong");
    set({ missed: { ...state.missed, price: true } });
    hostSays(market.lines.priceWrong);
    return;
  }
  sound.play("correct");
  playerSays(expected);
  marketRuntime.paused = false;
  window.setTimeout(() => (state.level.payment && setup?.payment ? askPayment(customer) : farewell(customer)), 1900);
}

function askPayment(customer: Customer) {
  if (state.status !== "running" || currentCustomer() !== customer || !setup) return;
  goTo("pay");
  window.setTimeout(() => sayStep(), 200);
}

export function takePayment(how: Payment) {
  const customer = currentCustomer();
  if (state.step !== "pay" || !customer || !setup) return;
  const { market } = setup;
  const right = how === customer.payment;
  if (!state.missed.pay) observe(customer.payment === "cash" ? market.frames.cash : market.frames.card, "recognitionAudio", right, state.revealed, "", market.pay(customer.payment).t, {});
  if (!right) {
    sound.play("wrong");
    set({ missed: { ...state.missed, pay: true } });
    customerSays(market.wrongPay(customer.payment), true);
    return;
  }
  sound.play("ring");
  farewell(customer);
}

// ---------- Off they go ----------

function farewell(customer: Customer) {
  if (!setup) return;
  emote("player", "happy", 1000);
  customerSays(pick(setup.market.lines.thanks));
  set({ step: "leaving", served: state.served + 1, basket: {} });
  const from = customer.kind === "clothes" ? CLOTHES_SPOT : COUNTER_SPOT;
  marketRuntime.customer.path = [{ x: from.x, z: STREET.z }, { x: 9, z: STREET.z + 0.5 }];
  if (customer.kind === "clothes") walkTo([{ x: GAP_X, z: 0.9 }, { x: GAP_X, z: BEHIND_Z }, PLAYER_START] as Point[], () => (jobPlayer.walker.rot = 0));
  window.setTimeout(() => {
    if (state.status !== "running") return;
    const index = state.index + 1;
    set({ index, said: null });
    if (index >= state.customers.length) finish(false);
    else admit();
  }, 1800);
}

function finish(late: boolean) {
  if (state.status !== "running" || !setup) return;
  const timeLeft = marketRuntime.seconds / marketRuntime.total;
  const stars = marketStars(state.served, state.customers.length, timeLeft);
  const host = setup.host.id;
  const { levelUp, gift } = finishJob(host, state.levelIndex, stars);
  sound.play(stars >= 2 ? "levelup" : "sparkle");
  emote(host, stars >= 2 ? "happy" : "think", 2000);
  const lines = setup.market.lines;
  void speak((late ? lines.late : lines.done[stars >= 3 ? 0 : stars >= 2 ? 1 : 2]).t, hostVoice());
  marketRuntime.paused = false;
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
      context: { villager: setup.host.id, source: "market", level: state.levelIndex, step: state.step, ...extra },
    })
    .catch((cause) => console.error("Could not record observation", cause));
}
