import type { TargetLanguageCode } from "@/lib/learning/languages";
import { saysPattern } from "./clinic";
import type { Line } from "./line";
import type { VillagerId } from "./villagers";
import { mulberry32 } from "./world";

// The forester's wildlife survey. From the lookout over a clearing, the
// forester whispers which animal to photograph (later: which one, by where it
// is), asks how many there are of something, and as the weather turns, has
// you write it in the logbook. On later levels a passing hiker asks what you
// like doing.

export type AnimalModel = "deer" | "fox" | "hedgehog" | "squirrel" | "bird" | "duck" | "cow" | "horse" | "sheep";
export type Habitat = "lake" | "meadow" | "forest" | "tree";
export type Weather = "sun" | "clouds" | "rain" | "snow" | "fog" | "wind" | "storm";

export type ForestAnimal = { slug: string; model: AnimalModel; name: Line; habitats: Habitat[]; herd: boolean };
export type ForestPlace = { id: Habitat; concept: string; at: Line };
// What the learner can write for a weather, and the model sentence.
export type WeatherWord = { id: Weather; concepts: string[]; accept: string[]; say: Line; alsoOk?: Weather[] };
export type Hobby = { concept: string; accept: string[] };

export type ForestConfig = {
  host: VillagerId;
  animals: ForestAnimal[];
  places: ForestPlace[];
  weathers: WeatherWord[];
  numbers: Record<number, string>;
  hobbies: Hobby[];
  // "Ich … gern": credited when the answer is framed that way.
  likeFrame: { concept: string; pattern: string };
  photo(animal: ForestAnimal, place: ForestPlace | null, variant: number): Line;
  count(animal: ForestAnimal, place: ForestPlace): Line;
  counted(animal: ForestAnimal, n: number): Line;
  miscounted(animal: ForestAnimal, n: number): Line;
  // "Nein, das ist ein Fuchs." and the request again.
  wrongAnimal(got: ForestAnimal): Line;
  wrongPlace(want: ForestPlace): Line;
  parseNumber(text: string, code: TargetLanguageCode): number | "digits" | null;
  lines: {
    invite: Line;
    notYet: Line;
    intro: Line[];
    title: Line;
    clock: Line;
    nice: Line[];
    weatherAsk: Line;
    weatherWrong: Line;
    weatherRight: Line;
    countHow: Line;
    words: Line;
    hikerHello: Line;
    hikerAsk: Line;
    hikerReply: Line;
    hikerHuh: Line;
    // A model answer for the hint.
    hobbyHint: Line;
    logbook: Line;
    repeat: Line;
    late: Line;
    done: [Line, Line, Line];
    harder: Line;
    again: Line;
    back: Line;
  };
};

export type ForestLevel = {
  tasks: number;
  // Which kinds of task come up, and whether photos name the place.
  counting: boolean;
  weather: number;
  places: boolean;
  hikers: number;
  heard: boolean;
  seconds: number;
};

export const FOREST_LEVELS: ForestLevel[] = [
  { tasks: 4, counting: false, weather: 0, places: false, hikers: 0, heard: false, seconds: 120 },
  { tasks: 6, counting: true, weather: 1, places: false, hikers: 0, heard: false, seconds: 170 },
  { tasks: 7, counting: true, weather: 2, places: true, hikers: 0, heard: true, seconds: 190 },
  { tasks: 8, counting: true, weather: 2, places: true, hikers: 1, heard: true, seconds: 220 },
  { tasks: 9, counting: true, weather: 3, places: true, hikers: 1, heard: true, seconds: 230 },
];

export function forestLevel(index: number) {
  return FOREST_LEVELS[Math.max(0, Math.min(FOREST_LEVELS.length - 1, index))];
}

// One animal (or a herd) out in the clearing.
export type Sighting = { id: number; animal: ForestAnimal; habitat: Habitat; count: number };

export type ForestTask =
  | { kind: "photo"; target: Sighting; line: Line }
  | { kind: "count"; target: Sighting; line: Line }
  | { kind: "weather"; weather: Weather; line: Line }
  | { kind: "hobby"; line: Line };

export type ForestOptions = {
  level: ForestLevel;
  // What the learner has met; nothing else comes up.
  animals: string[];
  places: string[];
  weathers: Weather[];
  numbers: number[];
  hobbies: boolean;
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

function weightedPick<T>(items: T[], weight: (item: T) => number, random: () => number) {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let roll = random() * total;
  for (const item of items) {
    roll -= weight(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

export function makeSurvey(config: ForestConfig, options: ForestOptions): { sightings: Sighting[]; tasks: ForestTask[]; start: Weather } {
  const random = mulberry32(options.seed);
  const weight = options.weight ?? (() => 1);
  const { level } = options;
  const animals = config.animals.filter((a) => options.animals.includes(a.slug));
  const places = config.places.filter((p) => options.places.includes(p.id));
  const placeOf = (h: Habitat) => places.find((p) => p.id === h) ?? null;
  const counts = options.numbers.filter((n) => n >= 2 && n <= 6);
  const sightings: Sighting[] = [];
  let id = 0;
  // Everyone the learner knows is out there; herds come in twos to sixes.
  for (const animal of animals) {
    const habitat = animal.habitats[Math.floor(random() * animal.habitats.length)];
    const count = animal.herd && counts.length ? counts[Math.floor(random() * counts.length)] : 1;
    sightings.push({ id: id++, animal, habitat, count });
  }
  // With places, some animals turn up twice, so "which one" matters.
  if (level.places && places.length >= 2) {
    for (const animal of shuffle(animals.filter((a) => !a.herd && a.habitats.filter((h) => placeOf(h)).length >= 2), random).slice(0, 2)) {
      const first = sightings.find((s) => s.animal === animal)!;
      const other = animal.habitats.filter((h) => h !== first.habitat && placeOf(h));
      if (other.length && placeOf(first.habitat)) sightings.push({ id: id++, animal, habitat: other[Math.floor(random() * other.length)], count: 1 });
    }
  }
  const tasks: ForestTask[] = [];
  const weathers = shuffle(options.weathers.filter((w) => w !== "sun"), random);
  const weatherTasks = Math.min(level.weather, weathers.length);
  const hikerTasks = options.hobbies ? level.hikers : 0;
  const herds = sightings.filter((s) => s.count > 1 && placeOf(s.habitat));
  let lastAnimal: string | null = null;
  // Each sighting is asked about once before any comes round again.
  const used = new Set<string>();
  const fresh = <T extends Sighting>(list: T[], kind: string) => {
    const unused = list.filter((s) => !used.has(`${kind}${s.id}`));
    return unused.length ? unused : list;
  };
  for (let i = 0; tasks.length < level.tasks - weatherTasks - hikerTasks && i < 50; i++) {
    const counting = level.counting && herds.length && random() < 0.35;
    if (counting) {
      const options = fresh(herds, "count");
      const target = options[Math.floor(random() * options.length)];
      if (target.animal.slug === lastAnimal) continue;
      lastAnimal = target.animal.slug;
      used.add(`count${target.id}`);
      tasks.push({ kind: "count", target, line: config.count(target.animal, placeOf(target.habitat)!) });
      continue;
    }
    const pool = fresh(sightings, "photo").filter((s) => s.animal.slug !== lastAnimal);
    if (!pool.length) break;
    const target = weightedPick(pool, (s) => weight(s.animal.slug), random);
    lastAnimal = target.animal.slug;
    used.add(`photo${target.id}`);
    const twin = sightings.some((s) => s !== target && s.animal === target.animal);
    const place = twin ? placeOf(target.habitat) : null;
    tasks.push({ kind: "photo", target, line: config.photo(target.animal, place, Math.floor(random() * 2)) });
  }
  // Weather changes and hikers come in between, never first.
  for (let w = 0; w < weatherTasks; w++) tasks.splice(1 + Math.floor(random() * tasks.length), 0, { kind: "weather", weather: weathers[w], line: config.lines.weatherAsk });
  for (let h = 0; h < hikerTasks; h++) tasks.splice(1 + Math.floor(random() * tasks.length), 0, { kind: "hobby", line: config.lines.hikerAsk });
  return { sightings, tasks, start: "sun" };
}

export function judgeWeather(config: ForestConfig, weather: Weather, text: string, code: TargetLanguageCode) {
  const word = config.weathers.find((w) => w.id === weather)!;
  const said = config.weathers.find((w) => w.accept.some((p) => saysPattern(p, text, code))) ?? null;
  return { ok: Boolean(said && (said.id === weather || word.alsoOk?.includes(said.id))), said, word };
}

// Which hobbies the answer names, and whether it's framed "Ich … gern".
export function judgeHobby(config: ForestConfig, text: string, code: TargetLanguageCode) {
  const hobbies = config.hobbies.filter((h) => h.accept.some((p) => saysPattern(p, text, code)));
  return { hobbies, framed: saysPattern(config.likeFrame.pattern, text, code) };
}

export function forestStars(done: number, tasks: number, timeLeft: number) {
  if (done >= tasks) return timeLeft >= 0.2 ? 3 : 2;
  return done >= tasks / 2 ? 1 : 0;
}

// Everything the forest can say, for the gloss audit and the voice catalog.
export function allForestLines(config: ForestConfig): Line[] {
  const lines: Line[] = [];
  for (const animal of config.animals) {
    lines.push(config.photo(animal, null, 0), config.photo(animal, null, 1), config.wrongAnimal(animal));
    for (const h of animal.habitats) {
      const place = config.places.find((p) => p.id === h);
      if (!place) continue;
      lines.push(config.photo(animal, place, 0), config.photo(animal, place, 1));
      if (animal.herd) lines.push(config.count(animal, place));
    }
    if (animal.herd) for (let n = 2; n <= 6; n++) lines.push(config.counted(animal, n), config.miscounted(animal, n));
  }
  for (const place of config.places) lines.push(config.wrongPlace(place));
  lines.push(...config.weathers.map((w) => w.say));
  return lines;
}
