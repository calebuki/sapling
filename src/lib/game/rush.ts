import type { TargetLanguageCode } from "@/lib/learning/languages";
import { normalizeText } from "@/lib/learning/text";
import type { CafeConfig, CafeItem } from "./cafe";
import type { Line } from "./line";
import { mulberry32 } from "./world";

// A rush at the café counter. Customers queue up and order out loud; you fill
// their trays from the stations behind the counter and ask the host for
// anything from the kitchen. The language does the work: once you know the
// room the stations carry no names, later orders are only heard, and the
// kitchen only bakes what you actually ask for.

export type OrderPart = { item: string; count: 1 | 2; with?: string };

export type Order = {
  parts: OrderPart[];
  // What the customer says. A change of mind replaces the first thing ordered.
  line: Line;
  // Slugs the tray must hold, repeats included.
  tray: string[];
  changed: boolean;
};

// One rung of the ladder. Each shift that goes well moves you up one.
export type RushLevel = {
  guests: number;
  // How many customers can wait at the counter at once.
  together: number;
  // Seconds a one-thing order waits; each extra thing adds a little.
  patience: number;
  maxParts: number;
  quantities: boolean;
  modifiers: boolean;
  // Chance that a one-thing order changes its mind halfway.
  change: number;
  // Orders are heard first; the words only show after asking "pardon?".
  heard: boolean;
  // Station names float over the stations while the room is new.
  labels: boolean;
};

export const RUSH_LEVELS: RushLevel[] = [
  { guests: 4, together: 1, patience: 75, maxParts: 1, quantities: false, modifiers: false, change: 0, heard: false, labels: true },
  { guests: 5, together: 2, patience: 65, maxParts: 2, quantities: false, modifiers: true, change: 0, heard: false, labels: true },
  { guests: 6, together: 2, patience: 55, maxParts: 2, quantities: true, modifiers: true, change: 0, heard: false, labels: false },
  { guests: 6, together: 3, patience: 50, maxParts: 2, quantities: true, modifiers: true, change: 0.3, heard: true, labels: false },
  { guests: 7, together: 3, patience: 42, maxParts: 2, quantities: true, modifiers: true, change: 0.35, heard: true, labels: false },
];

export function rushLevel(index: number) {
  return RUSH_LEVELS[Math.max(0, Math.min(RUSH_LEVELS.length - 1, index))];
}

export function patienceFor(level: RushLevel, order: Order) {
  return level.patience + (order.tray.length - 1) * 9 + (order.changed ? 6 : 0);
}

// A template with {x} for the ordered things, or {X} at the start of a sentence.
export type Template = { t: string; en: string };

export type RushConfig = {
  // Things the host makes in the kitchen; everything else is at a station.
  kitchen: string[];
  // "mit Milch": an item that rides along with some drinks.
  modifier: { item: string; concept: string; on: string[] };
  // "zwei": the number word that doubles a part.
  quantity: { concept: string; words: string[] };
  and: Line;
  // How one part of an order is said ("einen Kaffee mit Milch").
  phrase(part: OrderPart): Line;
  openers: Template[];
  // {X} is what they first said, {y} what they want instead.
  changeMind: Template;
  lines: {
    // The player's offer to help, on the host's menu.
    invite: Line;
    notYet: Line;
    intro: Line[];
    title: Line;
    guests: Line;
    till: Line;
    tips: Line;
    howTo: Line;
    kitchenAsk: Line;
    kitchenHuh: Line;
    kitchenNotHere: Line;
    repeat: Line;
    thanks: Line[];
    angry: Line;
    // The words a shift ends on, best first.
    done: [Line, Line, Line];
    harder: Line;
    again: Line;
    back: Line;
    trash: Line;
    ask: Line;
  };
  // The host hands over what you asked for, saying it back properly.
  kitchenGive(parts: OrderPart[]): Line;
  wrong(want: CafeItem, got: CafeItem): Line;
  missing(want: CafeItem): Line;
  extra(got: CafeItem): Line;
};

export function fill(template: Template, x: Line, y?: Line): Line {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const put = (text: string, a: string, b?: string) =>
    text.replace("{X}", cap(a)).replace("{x}", a).replace("{y}", b ?? "");
  return { t: put(template.t, x.t, y?.t), en: put(template.en, x.en, y?.en) };
}

export function joinParts(rush: RushConfig, parts: OrderPart[]): Line {
  const lines = parts.map((p) => rush.phrase(p));
  const join = (key: "t" | "en", and: string) =>
    lines.length < 2 ? lines[0][key] : `${lines.slice(0, -1).map((l) => l[key]).join(", ")} ${and} ${lines[lines.length - 1][key]}`;
  return { t: join("t", rush.and.t), en: join("en", rush.and.en) };
}

export function trayFor(rush: RushConfig, parts: OrderPart[]) {
  return parts.flatMap((p) => [...Array<string>(p.count).fill(p.item), ...(p.with ? [p.with] : [])]);
}

// Parts are always said in menu order, so each order has one wording (and one voice clip).
function sortParts(config: CafeConfig, parts: OrderPart[]) {
  const index = (slug: string) => config.menu.findIndex((m) => m.slug === slug);
  return [...parts].sort((a, b) => index(a.item) - index(b.item));
}

export type OrderOptions = {
  level: RushLevel;
  // Menu items the learner has met; nothing else is ordered.
  items: string[];
  quantities: boolean;
  modifiers: boolean;
  // Higher weight, more often: weak words come up more.
  weight?: (slug: string) => number;
  seed: number;
};

function weightedPick(slugs: string[], weight: (slug: string) => number, random: () => number) {
  const total = slugs.reduce((sum, s) => sum + weight(s), 0);
  let roll = random() * total;
  for (const slug of slugs) {
    roll -= weight(slug);
    if (roll <= 0) return slug;
  }
  return slugs[slugs.length - 1];
}

export function makeOrder(config: CafeConfig, rush: RushConfig, options: OrderOptions): Order {
  const random = mulberry32(options.seed);
  const weight = options.weight ?? (() => 1);
  const { level } = options;
  // Milk rides along with drinks, so it isn't ordered on its own once "with milk" is in play.
  const modifiers = level.modifiers && options.modifiers && options.items.includes(rush.modifier.item);
  const pool = options.items.filter((s) => !(modifiers && s === rush.modifier.item));
  const size = Math.min(pool.length, 1 + Math.floor(random() * level.maxParts));
  const parts: OrderPart[] = [];
  const left = [...pool];
  for (let i = 0; i < size; i++) {
    const item = weightedPick(left, weight, random);
    left.splice(left.indexOf(item), 1);
    parts.push({ item, count: 1 });
  }
  if (modifiers) {
    const target = parts.find((p) => rush.modifier.on.includes(p.item));
    if (target && random() < 0.45) target.with = rush.modifier.item;
  }
  if (level.quantities && options.quantities) {
    const target = parts.find((p) => !p.with);
    if (target && random() < 0.4) target.count = 2;
  }
  const sorted = sortParts(config, parts);
  const opener = rush.openers[Math.floor(random() * rush.openers.length)];
  // Changing your mind: "a tea, please… oh no, a coffee after all!"
  if (sorted.length === 1 && left.length && random() < level.change) {
    const first: OrderPart = { item: weightedPick(left, weight, random), count: 1 };
    return { parts: sorted, line: fill(rush.changeMind, rush.phrase(first), joinParts(rush, sorted)), tray: trayFor(rush, sorted), changed: true };
  }
  return { parts: sorted, line: fill(opener, joinParts(rush, sorted)), tray: trayFor(rush, sorted), changed: false };
}

// What's wrong with a tray, if anything.
export function checkTray(order: Order, tray: readonly string[]) {
  const want = [...order.tray];
  const extra: string[] = [];
  for (const slug of tray) {
    const at = want.indexOf(slug);
    if (at >= 0) want.splice(at, 1);
    else extra.push(slug);
  }
  return { ok: want.length === 0 && extra.length === 0, missing: want, extra };
}

// What the learner asked the kitchen for: "zwei Brezeln und ein Stück Kuchen".
// `formOk` says whether each part was said the way the host says it back.
export function partsIn(config: CafeConfig, rush: RushConfig, text: string, code: TargetLanguageCode) {
  const words = normalizeText(text, code).split(" ").filter(Boolean);
  const normalized = ` ${words.join(" ")} `;
  const found: Array<OrderPart & { formOk: boolean }> = [];
  words.forEach((word, i) => {
    // Plurals stretch or bend the end of a word: Brezeln, kanelbullar.
    const item = config.menu.find((m) => {
      const name = normalizeText(m.name, code);
      const stem = name.length > 4 ? name.slice(0, -1) : name;
      return name === word || (word.startsWith(stem) && Math.abs(word.length - name.length) <= 2);
    });
    if (!item || found.some((f) => f.item === item.slug)) return;
    const before = words.slice(Math.max(0, i - 3), i);
    const count: 1 | 2 = before.some((w) => rush.quantity.words.includes(w)) ? 2 : 1;
    const part = { item: item.slug, count } as OrderPart;
    const said = normalizeText(rush.phrase(part).t, code);
    found.push({ ...part, formOk: normalized.includes(` ${said} `) });
  });
  return found;
}

// One voice per order (a man's or a woman's), so each line is only ever made once.
export function orderVoice(text: string): "man" | "woman" {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0) % 2 ? "woman" : "man";
}

// Stars for a shift: everyone served, most of them, or at least half.
export function starsFor(served: number, guests: number) {
  const share = guests ? served / guests : 0;
  return share >= 0.99 ? 3 : share >= 0.7 ? 2 : share >= 0.5 ? 1 : 0;
}

// Every order the rush can produce, for the gloss audit and the voice catalog.
export function allOrders(config: CafeConfig, rush: RushConfig): Line[] {
  const slugs = config.menu.map((m) => m.slug);
  const singles: OrderPart[][] = [];
  for (const item of slugs) {
    singles.push([{ item, count: 1 }], [{ item, count: 2 }]);
    if (rush.modifier.on.includes(item)) singles.push([{ item, count: 1, with: rush.modifier.item }]);
  }
  const pairs: OrderPart[][] = [];
  for (let a = 0; a < slugs.length; a++)
    for (let b = a + 1; b < slugs.length; b++) {
      if (slugs[a] === rush.modifier.item || slugs[b] === rush.modifier.item) continue;
      for (const [ca, cb] of [[1, 1], [2, 1], [1, 2]] as const) pairs.push([{ item: slugs[a], count: ca }, { item: slugs[b], count: cb }]);
      for (const [x, y] of [[a, b], [b, a]]) {
        if (rush.modifier.on.includes(slugs[x])) pairs.push(sortParts(config, [{ item: slugs[x], count: 1, with: rush.modifier.item }, { item: slugs[y], count: 1 }]));
      }
    }
  const lines: Line[] = [];
  for (const parts of [...singles, ...pairs]) for (const opener of rush.openers) lines.push(fill(opener, joinParts(rush, parts)));
  for (const parts of singles)
    for (const first of slugs) if (first !== parts[0].item) lines.push(fill(rush.changeMind, rush.phrase({ item: first, count: 1 }), joinParts(rush, parts)));
  return lines;
}
