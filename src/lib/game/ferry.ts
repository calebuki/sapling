import type { TargetLanguageCode } from "@/lib/learning/languages";
import { saysPattern } from "./clinic";
import type { Line } from "./line";
import type { VillagerId } from "./villagers";
import { mulberry32 } from "./world";

// Checking passengers onto the ferry with the ferry keeper. Each passenger is
// greeted for the time of day, asked their name (du for children, Sie for
// adults), introduces themselves, goes on the passenger list exactly as they
// said it, and gets a goodbye as they board. "Pardon?", "slower, please" and
// "how do you spell that?" are how you get things said again.

export type DayTime = "morning" | "day" | "evening";
export type Register = "du" | "Sie";
export type FerryField = "name" | "from" | "lives" | "speaks";

export const FERRY_FIELDS: FerryField[] = ["name", "from", "lives", "speaks"];

// Children are du, adults you don't know are Sie. `decoys` sound a bit alike
// and stand next to the real name on the list.
export type FerryPerson = { id: string; name: string; decoys: [string, string]; gender: "man" | "woman"; register: Register };
export type FerryPlace = { id: string; name: Line; concept: string | null };
export type FerryCountry = FerryPlace & { languages: string[] };
export type FerryLanguage = { id: string; name: Line; concept: string | null };

// Something the learner types, matched by patterns (folded, so "gruss gott" passes).
export type Phrase = { concept: string; accept: string[] };
// `times`: when it fits; null means any time. `reply` is what a passenger says back.
export type Greeting = Phrase & { times: DayTime[] | null; reply: Line };

export type FerryConfig = {
  host: VillagerId;
  people: FerryPerson[];
  countries: FerryCountry[];
  cities: FerryPlace[];
  languages: FerryLanguage[];
  // The sentence frame each field is heard in: "Ich heiße …", "Ich komme aus …".
  frames: Record<FerryField, string>;
  aLittle: string | null;
  greetings: Greeting[];
  farewells: Greeting[];
  // The goodbye to suggest (and recast with) for children and for adults.
  farewellFor: Record<Register, string>;
  askName: Record<Register, Phrase & { say: Line }>;
  // What you say to hear it again (normal, slowly) or to see the name written.
  repairs: Record<"again" | "slower" | "spell", { concept: string; say: Record<Register, Line> }>;
  times: Record<DayTime, Line>;
  introduce(person: FerryPerson): Line;
  from(country: FerryCountry): Line;
  lives(city: FerryPlace): Line;
  speaks(languages: FerryLanguage[], aLittle: FerryLanguage | null): Line;
  spell(person: FerryPerson): Line;
  // "Guten Abend? Es ist doch Morgen! Guten Morgen!"
  wrongTime(said: Greeting, time: DayTime, right: Greeting): Line;
  // A child called Sie, or an adult called du.
  wrongRegister(person: FerryPerson): Line;
  lines: {
    invite: Line;
    notYet: Line;
    intro: Line[];
    registerIntro: Line;
    title: Line;
    clock: Line;
    greet: Line;
    ask: Line;
    listen: Line;
    farewell: Line;
    pardon: Line;
    listWrong: Line;
    listRight: Line;
    list: Line;
    fields: Record<FerryField, Line>;
    enter: Line;
    late: Line;
    done: [Line, Line, Line];
    harder: Line;
    again: Line;
    back: Line;
  };
};

export type FerryLevel = {
  passengers: number;
  times: DayTime[];
  askName: boolean;
  fields: FerryField[];
  // Passengers' words only show after "pardon?".
  heard: boolean;
  seconds: number;
};

export const FERRY_LEVELS: FerryLevel[] = [
  { passengers: 3, times: ["day"], askName: false, fields: ["name"], heard: false, seconds: 120 },
  { passengers: 4, times: ["morning"], askName: true, fields: ["name", "from"], heard: false, seconds: 150 },
  { passengers: 4, times: ["evening"], askName: true, fields: ["name", "from", "lives"], heard: true, seconds: 170 },
  { passengers: 5, times: ["morning", "day", "evening"], askName: true, fields: ["name", "from", "lives", "speaks"], heard: true, seconds: 210 },
  { passengers: 6, times: ["morning", "day", "evening"], askName: true, fields: ["name", "from", "lives", "speaks"], heard: true, seconds: 220 },
];

export function ferryLevel(index: number) {
  return FERRY_LEVELS[Math.max(0, Math.min(FERRY_LEVELS.length - 1, index))];
}

export type Passenger = {
  person: FerryPerson;
  from: FerryCountry;
  lives: FerryPlace;
  speaks: FerryLanguage[];
  aLittle: FerryLanguage | null;
  fields: FerryField[];
  // Everything they say about themselves, one sentence per field.
  intro: Line;
  // What the list offers for each field, in order.
  options: { name: string[]; from: FerryCountry[]; lives: FerryPlace[]; speaks: FerryLanguage[] };
};

export type Entry = { name: string | null; from: string | null; lives: string | null; speaks: string[] };
export const emptyEntry = (): Entry => ({ name: null, from: null, lives: null, speaks: [] });

export type FerryOptions = {
  level: FerryLevel;
  // Fields whose sentence frame the learner has met.
  fields: FerryField[];
  askName: boolean;
  weight?: (slug: string) => number;
  seed: number;
};

function shuffle<T>(items: T[], random: () => number) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const some = <T>(items: T[], n: number, random: () => number) => shuffle(items, random).slice(0, n);

export function makeRun(config: FerryConfig, options: FerryOptions): { time: DayTime; askName: boolean; passengers: Passenger[] } {
  const random = mulberry32(options.seed);
  const { level } = options;
  const time = level.times[Math.floor(random() * level.times.length)];
  const fields = level.fields.filter((f) => f === "name" || options.fields.includes(f));
  const askName = level.askName && options.askName;
  // Children and adults mixed, never the same person twice.
  const kids = shuffle(config.people.filter((p) => p.register === "du"), random);
  const adults = shuffle(config.people.filter((p) => p.register === "Sie"), random);
  // Roughly a third to a half children, and at least one of each once there are two.
  const n = level.passengers;
  const wantKids = n >= 2 ? Math.min(n - 1, Math.max(1, Math.round(n * (0.3 + random() * 0.25)))) : random() < 0.5 ? 1 : 0;
  const chosen = [...kids.slice(0, wantKids), ...adults.slice(0, n - wantKids)];
  const people: FerryPerson[] = shuffle(chosen, random);
  const passengers = people.map((person): Passenger => {
    const from = config.countries[Math.floor(random() * config.countries.length)];
    const lives = config.cities[Math.floor(random() * config.cities.length)];
    const native = config.languages.filter((l) => from.languages.includes(l.id));
    const german = config.languages.find((l) => l.id === "deutsch") ?? null;
    // Visitors speak their own language and a little German; Germans sometimes English too.
    const aLittle = german && !native.includes(german) && random() < 0.7 ? german : null;
    const extra = !aLittle && random() < 0.35 ? config.languages.find((l) => !native.includes(l) && l.id === "englisch") : undefined;
    const speaks = extra ? [...native, extra] : native;
    const parts: Line[] = [config.introduce(person)];
    if (fields.includes("from")) parts.push(config.from(from));
    if (fields.includes("lives")) parts.push(config.lives(lives));
    if (fields.includes("speaks")) parts.push(config.speaks(speaks, aLittle));
    const intro: Line = { t: parts.map((p) => p.t).join(" "), en: parts.map((p) => p.en).join(" "), parts: parts.map((p) => p.t) };
    const spoken = aLittle ? [...speaks, aLittle] : speaks;
    return {
      person,
      from,
      lives,
      speaks: spoken,
      aLittle,
      fields,
      intro,
      options: {
        name: shuffle([person.name, ...person.decoys], random),
        from: shuffle([from, ...some(config.countries.filter((c) => c.id !== from.id), 2, random)], random),
        lives: shuffle([lives, ...some(config.cities.filter((c) => c.id !== lives.id), 2, random)], random),
        speaks: shuffle([...spoken, ...some(config.languages.filter((l) => !spoken.includes(l)), Math.max(1, 4 - spoken.length), random)], random),
      },
    };
  });
  return { time, askName, passengers };
}

// ---------- Judging what the learner typed ----------

export function matchPhrase<T extends Phrase>(phrases: T[], text: string, code: TargetLanguageCode): T | null {
  return phrases.find((p) => p.accept.some((pattern) => saysPattern(pattern, text, code))) ?? null;
}

const fits = (g: Greeting, time: DayTime) => !g.times || g.times.includes(time);

// The greeting the time calls for, for hints and recasts.
export function timeGreeting(config: FerryConfig, time: DayTime) {
  return config.greetings.find((g) => g.times?.length === 1 && g.times[0] === time) ?? config.greetings[0];
}

export function judgeGreeting(config: FerryConfig, text: string, time: DayTime, code: TargetLanguageCode) {
  const said = matchPhrase(config.greetings, text, code);
  return { said, ok: Boolean(said && fits(said, time)) };
}

export function farewellFor(config: FerryConfig, register: Register) {
  return config.farewells.find((f) => f.concept === config.farewellFor[register]) ?? config.farewells[0];
}

export function judgeFarewell(config: FerryConfig, text: string, time: DayTime, code: TargetLanguageCode) {
  const said = matchPhrase(config.farewells, text, code);
  return { said, ok: Boolean(said && fits(said, time)) };
}

// Which way the learner asked for a name, if they did.
export function judgeAskName(config: FerryConfig, text: string, code: TargetLanguageCode): Register | null {
  for (const register of ["Sie", "du"] as Register[]) if (matchPhrase([config.askName[register]], text, code)) return register;
  return null;
}

// The fields the list has wrong.
export function checkEntry(passenger: Passenger, entry: Entry): FerryField[] {
  const problems: FerryField[] = [];
  for (const field of passenger.fields) {
    if (field === "name" && entry.name !== passenger.person.name) problems.push(field);
    if (field === "from" && entry.from !== passenger.from.id) problems.push(field);
    if (field === "lives" && entry.lives !== passenger.lives.id) problems.push(field);
    if (field === "speaks") {
      const want = passenger.speaks.map((l) => l.id).sort().join();
      if ([...entry.speaks].sort().join() !== want) problems.push(field);
    }
  }
  return problems;
}

export function ferryStars(boarded: number, passengers: number, timeLeft: number) {
  if (boarded >= passengers) return timeLeft >= 0.2 ? 3 : 2;
  return boarded >= passengers / 2 ? 1 : 0;
}

// Everything the landing stage can say, for the gloss audit and the voice catalog.
export function allFerryLines(config: FerryConfig): Line[] {
  const lines: Line[] = [];
  for (const person of config.people) lines.push(config.introduce(person), config.spell(person), config.wrongRegister(person));
  for (const country of config.countries) lines.push(config.from(country));
  for (const city of config.cities) lines.push(config.lives(city));
  for (const country of config.countries) {
    const native = config.languages.filter((l) => country.languages.includes(l.id));
    const german = config.languages.find((l) => l.id === "deutsch") ?? null;
    const english = config.languages.find((l) => l.id === "englisch");
    lines.push(config.speaks(native, null));
    if (german && !native.includes(german)) lines.push(config.speaks(native, german));
    if (english && !native.includes(english)) lines.push(config.speaks([...native, english], null));
  }
  for (const time of ["morning", "day", "evening"] as DayTime[]) {
    const right = timeGreeting(config, time);
    for (const g of config.greetings) if (!fits(g, time)) lines.push(config.wrongTime(g, time, right));
  }
  for (const time of ["morning", "day", "evening"] as DayTime[]) {
    for (const g of config.farewells) if (!fits(g, time)) for (const register of ["du", "Sie"] as Register[]) lines.push(config.wrongTime(g, time, farewellFor(config, register)));
  }
  lines.push(...config.greetings.map((g) => g.reply), ...config.farewells.map((g) => g.reply));
  lines.push(config.askName.du.say, config.askName.Sie.say);
  for (const repair of Object.values(config.repairs)) lines.push(repair.say.du, repair.say.Sie);
  return lines;
}
