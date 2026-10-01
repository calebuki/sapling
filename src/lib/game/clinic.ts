import type { TargetLanguageCode } from "@/lib/learning/languages";
import { foldsFor, normalizeText } from "@/lib/learning/text";
import type { Line } from "./line";
import type { VillagerId } from "./villagers";
import { mulberry32 } from "./world";

// Helping the village doctor through surgery hours. Each patient says what
// hurts and you point to it; then you brew their remedy from the doctor's
// recipe (so many spoons of which colour of herbs, hot or cold water, sugar or
// not); later you also answer how they feel and tell them what to do.

export type BodyPart = "head" | "eye" | "ear" | "nose" | "tooth" | "throat" | "arm" | "hand" | "belly" | "leg" | "foot";
export type HerbColor = "red" | "yellow" | "green" | "blue";
export type Advice = "bed" | "drink" | "rest";
export type Reply = "worry" | "sorry" | "glad";
export type Spoons = 1 | 2 | 3;

// Each part, colour, feeling and piece of advice is a course concept by slug.
export type ClinicPart = { slug: string; part: BodyPart; name: Line };
export type ClinicColor = { slug: string; color: HerbColor; word: Line };
export type ClinicFeeling = { concept: string; line: Line; reply: Reply };
export type ClinicAdvice = { concepts: string[]; say: Line; accept: string[] };

export type Recipe = { herbs: Array<{ color: HerbColor; spoons: Spoons }>; water: "hot" | "cold"; sugar: boolean };
export type Pot = { herbs: Partial<Record<HerbColor, number>>; water: "hot" | "cold" | null; sugar: number };

export type ClinicConfig = {
  host: VillagerId;
  parts: ClinicPart[];
  colors: ClinicColor[];
  // Concepts for one, two and three spoons.
  numbers: Record<Spoons, string>;
  heat: { hot: string; cold: string };
  sugar: string | null;
  feelings: ClinicFeeling[];
  replies: Record<Reply, { concept: string; line: Line }>;
  advice: Partial<Record<Advice, ClinicAdvice>>;
  // "Du musst …": credited only when the learner actually framed advice that way.
  adviceFrame: { concept: string; pattern: string } | null;
  // "Mein Kopf tut weh." in a couple of ways.
  complaint(part: ClinicPart, variant: number): Line;
  wrongPart(want: ClinicPart, got: ClinicPart): Line;
  recipe(recipe: Recipe): Line;
  lines: {
    invite: Line;
    notYet: Line;
    intro: Line[];
    title: Line;
    howTo: Line;
    where: Line;
    brew: Line;
    brewWrong: Line;
    brewRight: Line;
    drink: Line;
    adviceAsk: Line;
    adviceTell: Line;
    adviceWrong: Line;
    replyAsk: Line;
    replyWrong: Line;
    thanks: Line[];
    repeat: Line;
    late: Line;
    done: [Line, Line, Line];
    harder: Line;
    again: Line;
    back: Line;
    clock: Line;
    pot: Line;
    empty: Line;
    ready: Line;
    hot: Line;
    cold: Line;
    sugar: Line;
  };
};

export type ClinicLevel = {
  patients: number;
  herbs: 1 | 2;
  maxSpoons: Spoons;
  sugar: boolean;
  feelings: boolean;
  advice: boolean;
  heard: boolean;
  labels: boolean;
  seconds: number;
};

export const CLINIC_LEVELS: ClinicLevel[] = [
  { patients: 3, herbs: 1, maxSpoons: 2, sugar: false, feelings: false, advice: false, heard: false, labels: true, seconds: 200 },
  { patients: 4, herbs: 2, maxSpoons: 2, sugar: false, feelings: true, advice: false, heard: false, labels: true, seconds: 260 },
  { patients: 4, herbs: 2, maxSpoons: 3, sugar: true, feelings: true, advice: true, heard: false, labels: false, seconds: 300 },
  { patients: 4, herbs: 2, maxSpoons: 3, sugar: true, feelings: true, advice: true, heard: true, labels: false, seconds: 290 },
  { patients: 5, herbs: 2, maxSpoons: 3, sugar: true, feelings: true, advice: true, heard: true, labels: false, seconds: 330 },
];

export function clinicLevel(index: number) {
  return CLINIC_LEVELS[Math.max(0, Math.min(CLINIC_LEVELS.length - 1, index))];
}

export type Patient = {
  part: ClinicPart;
  complaint: Line;
  recipe: Recipe;
  recipeLine: Line;
  feeling: ClinicFeeling | null;
  advice: Advice | null;
};

export type PatientOptions = {
  level: ClinicLevel;
  // What the learner has met; nothing else comes up.
  parts: string[];
  colors: string[];
  spoons: Spoons[];
  heat: boolean;
  sugar: boolean;
  feelings: string[];
  advice: Advice[];
  weight?: (slug: string) => number;
  seed: number;
};

function weightedPick<T>(items: T[], weight: (item: T) => number, random: () => number) {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let roll = random() * total;
  for (const item of items) {
    roll -= weight(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

export function makePatients(config: ClinicConfig, options: PatientOptions): Patient[] {
  const random = mulberry32(options.seed);
  const weight = options.weight ?? (() => 1);
  const { level } = options;
  const parts = config.parts.filter((p) => options.parts.includes(p.slug));
  const colors = config.colors.filter((c) => options.colors.includes(c.slug));
  const spoons = options.spoons.filter((s) => s <= level.maxSpoons);
  const feelings = level.feelings ? config.feelings.filter((f) => options.feelings.includes(f.concept)) : [];
  const advice = level.advice ? options.advice.filter((a) => config.advice[a]) : [];
  const patients: Patient[] = [];
  let lastPart: string | null = null;
  for (let i = 0; i < level.patients && parts.length && colors.length && spoons.length; i++) {
    // A different complaint from the one before.
    const pool = parts.length > 1 ? parts.filter((p) => p.slug !== lastPart) : parts;
    const part = weightedPick(pool, (p) => weight(p.slug), random);
    lastPart = part.slug;
    const herbs: Recipe["herbs"] = [];
    const left = [...colors];
    for (let h = 0; h < Math.min(level.herbs, colors.length); h++) {
      const color = weightedPick(left, (c) => weight(c.slug), random);
      left.splice(left.indexOf(color), 1);
      herbs.push({ color: color.color, spoons: spoons[Math.floor(random() * spoons.length)] });
    }
    // Herbs are always said in the same colour order, so each recipe has one wording.
    const order = config.colors.map((c) => c.color);
    herbs.sort((a, b) => order.indexOf(a.color) - order.indexOf(b.color));
    const recipe: Recipe = {
      herbs,
      water: options.heat && random() < 0.5 ? "cold" : "hot",
      sugar: level.sugar && options.sugar && random() < 0.5,
    };
    patients.push({
      part,
      complaint: config.complaint(part, Math.floor(random() * 2)),
      recipe,
      recipeLine: config.recipe(recipe),
      feeling: feelings.length ? feelings[Math.floor(random() * feelings.length)] : null,
      advice: advice.length ? advice[Math.floor(random() * advice.length)] : null,
    });
  }
  return patients;
}

export function emptyPot(): Pot {
  return { herbs: {}, water: null, sugar: 0 };
}

// What's wrong with the brew, if anything.
export function checkPot(recipe: Recipe, pot: Pot) {
  const problems: string[] = [];
  const wanted = new Map(recipe.herbs.map((h) => [h.color, h.spoons as number]));
  for (const color of new Set([...wanted.keys(), ...(Object.keys(pot.herbs) as HerbColor[])])) {
    if ((pot.herbs[color] ?? 0) !== (wanted.get(color) ?? 0)) problems.push(color);
  }
  if (pot.water !== recipe.water) problems.push("water");
  if ((pot.sugar > 0) !== recipe.sugar || pot.sugar > 1) problems.push("sugar");
  return { ok: problems.length === 0, problems };
}

// Whether a pattern matches what the learner said. Both sides are folded, so
// "maste" matches a pattern written with "måste".
export function saysPattern(pattern: string, text: string, code: TargetLanguageCode) {
  const said = normalizeText(text, code);
  return [(s: string) => s, ...foldsFor(code)].some((f) => new RegExp(f(pattern), "u").test(f(said)));
}

// Whether what the learner told the patient is the advice on the card.
export function judgeAdvice(advice: ClinicAdvice, text: string, code: TargetLanguageCode) {
  return advice.accept.some((pattern) => saysPattern(pattern, text, code));
}

export function clinicStars(helped: number, patients: number, timeLeft: number) {
  if (helped >= patients) return timeLeft >= 0.25 ? 3 : 2;
  return helped >= patients / 2 ? 1 : 0;
}

// Every recipe the doctor can read out.
export function allRecipeLines(config: ClinicConfig): Line[] {
  const lines: Line[] = [];
  const spoons: Spoons[] = [1, 2, 3];
  const finishes = [false, true].flatMap((sugar) => (["hot", "cold"] as const).map((water) => ({ water, sugar })));
  for (const [i, a] of config.colors.entries())
    for (const n of spoons) {
      for (const f of finishes) lines.push(config.recipe({ herbs: [{ color: a.color, spoons: n }], ...f }));
      for (const b of config.colors.slice(i + 1)) for (const m of spoons) for (const f of finishes) lines.push(config.recipe({ herbs: [{ color: a.color, spoons: n }, { color: b.color, spoons: m }], ...f }));
    }
  return lines;
}

// Everything a surgery can say, for the gloss audit and the voice catalog.
export function allClinicLines(config: ClinicConfig): Line[] {
  const lines: Line[] = [];
  for (const part of config.parts) {
    lines.push(config.complaint(part, 0), config.complaint(part, 1));
    const other = config.parts.find((p) => p.slug !== part.slug);
    if (other) lines.push(config.wrongPart(part, other));
  }
  lines.push(...allRecipeLines(config));
  lines.push(...config.feelings.map((f) => f.line), ...Object.values(config.replies).map((r) => r.line));
  lines.push(...Object.values(config.advice).map((a) => a!.say));
  return lines;
}
