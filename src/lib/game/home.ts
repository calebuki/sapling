import type { TargetLanguageCode } from "@/lib/learning/languages";
import { foldsFor, normalizeText } from "@/lib/learning/text";
import type { Line } from "./line";
import type { VillagerId } from "./villagers";
import { mulberry32 } from "./world";

// Helping at someone's home: their family comes for dinner and they can't find
// their things. Things lie on, under, next to and in the furniture, often
// several of the same, so which one they mean is in the words: "the cup on the
// table", not the one under the chair. Sometimes they ask where something is,
// and you tell them; they look exactly where you said.

export type Spot = "on" | "under" | "next" | "in";
export type FurnitureModel = "table" | "chair" | "bed" | "sofa" | "cupboard" | "stove" | "fridge" | "window" | "door" | "lamp";
export type ThingModel = "cat" | "dog" | "key" | "cup" | "bag" | "book" | "clock" | "flower";

// Each anchor and thing is a course concept, by slug.
export type HomeAnchor = { slug: string; model: FurnitureModel; spots: Spot[]; name: Line; match: string[] };
export type HomeThing = { slug: string; model: ThingModel; name: Line };

export type Placement = { id: number; thing: HomeThing; anchor: HomeAnchor; spot: Spot };
export type Task = { kind: "fetch" | "tell"; target: Placement; line: Line };

export type HomeLevel = {
  tasks: number;
  // How many of the same thing can lie about, so the place decides which.
  copies: number;
  // How many times you tell the host where something is.
  tells: number;
  heard: boolean;
  labels: boolean;
  seconds: number;
};

export const HOME_LEVELS: HomeLevel[] = [
  { tasks: 4, copies: 1, tells: 0, heard: false, labels: true, seconds: 150 },
  { tasks: 5, copies: 2, tells: 0, heard: false, labels: true, seconds: 150 },
  { tasks: 5, copies: 2, tells: 1, heard: false, labels: false, seconds: 140 },
  { tasks: 6, copies: 3, tells: 2, heard: true, labels: false, seconds: 140 },
  { tasks: 6, copies: 3, tells: 3, heard: true, labels: false, seconds: 120 },
];

export function homeLevel(index: number) {
  return HOME_LEVELS[Math.max(0, Math.min(HOME_LEVELS.length - 1, index))];
}

export type HomeConfig = {
  host: VillagerId;
  anchors: HomeAnchor[];
  things: HomeThing[];
  prepositions: Record<Spot, { concept: string; words: string[] }>;
  // "auf dem Tisch" / "on the table".
  where(spot: Spot, anchor: HomeAnchor): Line;
  // Asking for one particular thing; `variant` picks a wording.
  fetch(thing: HomeThing, where: Line, variant: number): Line;
  ask(thing: HomeThing): Line;
  notThere(thing: HomeThing, where: Line): Line;
  found(where: Line): Line;
  // Handed the wrong thing, or the right thing from the wrong place.
  wrong(want: Placement, got: Placement): Line;
  lines: {
    invite: Line;
    notYet: Line;
    intro: Line[];
    // Said before the first shift that has "where is …?" questions.
    tellIntro: Line;
    title: Line;
    howTo: Line;
    tell: Line;
    clock: Line;
    repeat: Line;
    thanks: Line[];
    late: Line;
    done: [Line, Line, Line];
    harder: Line;
    again: Line;
    back: Line;
  };
};

export type ArrangeOptions = {
  level: HomeLevel;
  // What the learner has met; nothing else turns up.
  anchors: string[];
  things: string[];
  spots: Spot[];
  weight?: (slug: string) => number;
  seed: number;
};

function shuffled<T>(items: T[], random: () => number) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function weightedOrder<T>(items: T[], weight: (item: T) => number, random: () => number) {
  return items
    .map((item) => ({ item, key: Math.pow(random(), 1 / Math.max(0.05, weight(item))) }))
    .sort((a, b) => b.key - a.key)
    .map((x) => x.item);
}

// Lay out the room and the jobs to do in it. Every thing sits in its own
// place, so "the cup on the table" always means exactly one cup.
export function arrange(config: HomeConfig, options: ArrangeOptions) {
  const random = mulberry32(options.seed);
  const weight = options.weight ?? (() => 1);
  const { level } = options;
  const anchors = config.anchors.filter((a) => options.anchors.includes(a.slug));
  const things = config.things.filter((t) => options.things.includes(t.slug));
  const slots = shuffled(
    anchors.flatMap((anchor) => anchor.spots.filter((s) => options.spots.includes(s)).map((spot) => ({ anchor, spot }))),
    random,
  );
  // Weak places come up first, so they're the ones asked about.
  const free = weightedOrder(slots, (s) => (weight(s.anchor.slug) + weight(config.prepositions[s.spot].concept)) / 2, random);
  const placements: Placement[] = [];
  let id = 1;
  const place = (thing: HomeThing) => {
    const slot = free.shift();
    if (slot) placements.push({ id: id++, thing, ...slot });
    return Boolean(slot);
  };
  // Single things to ask "where is …?" about, then things with look-alikes.
  const order = weightedOrder(things, (t) => weight(t.slug), random);
  const singles = order.slice(0, Math.min(level.tells, Math.max(0, order.length - 1)));
  for (const thing of singles) place(thing);
  for (const [k, thing] of order.slice(singles.length).entries()) {
    // The first two always have a look-alike when the level has them.
    const least = level.copies > 1 && k < 2 ? 2 : 1;
    const copies = least + Math.floor(random() * (level.copies - least + 1));
    for (let c = 0; c < copies; c++) place(thing);
    if (placements.length >= level.tasks + 2) break;
  }

  // The jobs, in order, as things leave the room.
  const room = [...placements];
  const tasks: Task[] = [];
  let tellsLeft = level.tells;
  for (let i = 0; i < level.tasks && room.length; i++) {
    const remaining = level.tasks - i;
    const countOf = (p: Placement) => room.filter((r) => r.thing.slug === p.thing.slug).length;
    const lone = room.filter((p) => countOf(p) === 1);
    const tell = tellsLeft > 0 && lone.length > 0 && random() < tellsLeft / remaining;
    // Prefer things with look-alikes for fetching, so the place matters.
    const pool = tell ? lone : room.some((p) => countOf(p) > 1) && level.copies > 1 ? room.filter((p) => countOf(p) > 1) : room;
    const target = pool[Math.floor(random() * pool.length)];
    room.splice(room.indexOf(target), 1);
    if (tell) tellsLeft--;
    const where = config.where(target.spot, target.anchor);
    tasks.push({ kind: tell ? "tell" : "fetch", target, line: tell ? config.ask(target.thing) : config.fetch(target.thing, where, Math.floor(random() * 2)) });
  }
  return { placements, tasks };
}

// Where the learner said something is: "Unter dem Bett", "Er ist im Schrank".
export function placeIn(config: HomeConfig, text: string, code: TargetLanguageCode) {
  const words = normalizeText(text, code).split(" ").filter(Boolean);
  const folds = [(s: string) => s, ...foldsFor(code)];
  const same = (a: string, b: string) => folds.some((f) => f(a) === f(b));
  const spot = (Object.keys(config.prepositions) as Spot[]).find((s) => words.some((w) => config.prepositions[s].words.some((p) => same(w, p)))) ?? null;
  const anchor = config.anchors.find((a) => words.some((w) => a.match.some((m) => same(w, m)))) ?? null;
  const said = ` ${words.join(" ")} `;
  const formOk = Boolean(spot && anchor) && folds.some((f) => f(said).includes(` ${f(normalizeText(config.where(spot!, anchor!).t, code))} `));
  return { spot, anchor, formOk };
}

export function homeStars(done: number, tasks: number, timeLeft: number) {
  if (done >= tasks) return timeLeft >= 0.3 ? 3 : 2;
  return done >= tasks / 2 ? 1 : 0;
}

// Everything the host can say in a shift, for the gloss audit and the voice catalog.
export function allHomeLines(config: HomeConfig): Line[] {
  const lines: Line[] = [];
  const places = config.anchors.flatMap((anchor) => anchor.spots.map((spot) => ({ anchor, spot, where: config.where(spot, anchor) })));
  for (const thing of config.things) {
    lines.push(config.ask(thing));
    for (const p of places) lines.push(config.fetch(thing, p.where, 0), config.fetch(thing, p.where, 1), config.notThere(thing, p.where));
  }
  for (const p of places) lines.push(config.found(p.where));
  const [a, b] = config.things;
  const [x, y] = places;
  if (a && b && x && y) {
    lines.push(config.wrong({ id: 1, thing: a, ...x }, { id: 2, thing: a, ...y }), config.wrong({ id: 1, thing: a, ...x }, { id: 2, thing: b, ...y }));
  }
  return lines;
}
