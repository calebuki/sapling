import type { TargetLanguageCode } from "@/lib/learning/languages";
import { saysPattern } from "./clinic";
import type { Line } from "./line";
import type { VillagerId } from "./villagers";
import { mulberry32 } from "./world";

// The forester's mountain rescue. A map of the hills lies on the table: a
// lake here, a forest there, the mountain, the meadow, the river, each with
// its own weather and an animal about. Hikers who've lost their way radio in
// ("Hilfe, hier ist Emma! Ich bin im Wald. Hier schneit es. Ich sehe einen
// Fuchs.") and you point to where they are, so the forester can fetch them.
// Two forests on one map means the weather or the animal decides which. Later
// the forester asks what the weather is like where he's driving, and you say.

export type AnimalModel = "deer" | "fox" | "hedgehog" | "squirrel" | "bird" | "duck" | "cow" | "horse" | "sheep";
export type Terrain = "lake" | "meadow" | "forest" | "mountain" | "river";
export type Weather = "sun" | "clouds" | "rain" | "snow" | "fog" | "wind" | "storm";
export type Clue = "place" | "weather" | "animal";

// Where an animal is happy to be found.
export type ForestAnimal = { slug: string; model: AnimalModel; name: Line; terrains: Terrain[] };
// "der See", "am See", "zum See".
export type ForestPlace = { id: Terrain; concept: string; name: Line; at: Line; to: Line };
// What the learner can say for a weather, and the model sentence.
export type WeatherWord = { id: Weather; concepts: string[]; accept: string[]; say: Line; alsoOk?: Weather[] };
export type Caller = { name: string; gender: "man" | "woman" };

export type Tile = { id: number; terrain: Terrain; weather: Weather; animal: ForestAnimal | null };

export type ForestTask =
  | { kind: "call"; tile: number; caller: Caller; clues: Clue[]; line: Line }
  | { kind: "weather"; tile: number; line: Line };

export type ForestConfig = {
  host: VillagerId;
  animals: ForestAnimal[];
  places: ForestPlace[];
  weathers: WeatherWord[];
  callers: Caller[];
  // "Hilfe, hier ist Emma! Ich bin im Wald. Hier schneit es. Ich sehe einen Fuchs."
  call(caller: Caller, tile: Tile, place: ForestPlace, clues: Clue[]): Line;
  // The forester, when you point somewhere else: what's wrong with it.
  wrong(caller: Caller, want: Tile, got: Tile, clue: Clue): Line;
  // "Ich fahre zum See. Wie ist das Wetter am See?"
  askWeather(place: ForestPlace): Line;
  // What he takes along for that weather, once you've told him.
  gear(weather: Weather): Line;
  lines: {
    invite: Line;
    notYet: Line;
    intro: Line[];
    // Said before the first shift with weather questions.
    weatherIntro: Line;
    title: Line;
    clock: Line;
    radio: Line;
    howTo: Line;
    found: Line[];
    weatherWrong: Line;
    tellWeather: Line;
    repeat: Line;
    late: Line;
    done: [Line, Line, Line];
    harder: Line;
    again: Line;
    back: Line;
  };
};

export type ForestLevel = {
  tiles: number;
  // How many places turn up more than once, so the weather or animal decides.
  twins: number;
  calls: number;
  // Weather questions from the forester.
  weather: number;
  // What a caller says about where they are.
  clues: Clue[];
  heard: boolean;
  labels: boolean;
  seconds: number;
};

export const FOREST_LEVELS: ForestLevel[] = [
  { tiles: 4, twins: 0, calls: 4, weather: 0, clues: ["place"], heard: false, labels: true, seconds: 120 },
  { tiles: 6, twins: 2, calls: 5, weather: 1, clues: ["place", "weather"], heard: false, labels: true, seconds: 160 },
  { tiles: 6, twins: 2, calls: 5, weather: 1, clues: ["place", "weather", "animal"], heard: true, labels: false, seconds: 170 },
  { tiles: 8, twins: 3, calls: 6, weather: 2, clues: ["place", "weather", "animal"], heard: true, labels: false, seconds: 190 },
  { tiles: 9, twins: 4, calls: 7, weather: 2, clues: ["place", "weather", "animal"], heard: true, labels: false, seconds: 200 },
];

export function forestLevel(index: number) {
  return FOREST_LEVELS[Math.max(0, Math.min(FOREST_LEVELS.length - 1, index))];
}

export type ForestOptions = {
  level: ForestLevel;
  // What the learner has met; nothing else turns up.
  places: Terrain[];
  weathers: Weather[];
  animals: string[];
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

// The clues this map can use: weather needs two kinds of weather, animals two animals.
export function usableClues(level: ForestLevel, options: Pick<ForestOptions, "weathers" | "animals">): Clue[] {
  return level.clues.filter((c) => c === "place" || (c === "weather" ? options.weathers.length >= 2 : options.animals.length >= 2));
}

const keyOf = (tile: Tile, clues: Clue[]) => clues.map((c) => (c === "place" ? tile.terrain : c === "weather" ? tile.weather : (tile.animal?.slug ?? "-"))).join("|");

// Which tiles fit everything a caller said.
export function matching(tiles: Tile[], target: Tile, clues: Clue[]) {
  const key = keyOf(target, clues);
  return tiles.filter((t) => keyOf(t, clues) === key);
}

// Lay out the map. Every tile can be told apart by what this level's callers
// say, and the places that turn up twice differ in just one way where they
// can, so that clue really is the one that decides.
export function makeMap(config: ForestConfig, options: ForestOptions): { tiles: Tile[]; tasks: ForestTask[] } {
  const random = mulberry32(options.seed);
  const weight = options.weight ?? (() => 1);
  const { level } = options;
  const clues = usableClues(level, options);
  const places = shuffle(config.places.filter((p) => options.places.includes(p.id)), random);
  const animals = config.animals.filter((a) => options.animals.includes(a.slug));
  const weathers = options.weathers.length ? options.weathers : (["sun"] as Weather[]);
  const animalFor = (terrain: Terrain, not: string[] = []) => {
    const fits = animals.filter((a) => a.terrains.includes(terrain) && !not.includes(a.slug));
    const pool = fits.length ? fits : animals.filter((a) => !not.includes(a.slug));
    return pool.length ? weightedPick(pool, (a) => weight(a.slug), random) : null;
  };

  // Which place each tile is: every known place once (weak ones first), then twins.
  const byWeakness = [...places].sort((a, b) => weight(b.concept) - weight(a.concept) || random() - 0.5);
  const canTwin = clues.length > 1;
  const twins = canTwin ? Math.min(level.twins, level.tiles - 1) : 0;
  const singles = Math.min(byWeakness.length, level.tiles - twins);
  const terrains: Terrain[] = byWeakness.slice(0, singles).map((p) => p.id);
  for (let i = 0; terrains.length < level.tiles && (canTwin || i < 0); i++) terrains.push(terrains[i % singles]);

  const tiles: Tile[] = [];
  for (const terrain of shuffle(terrains, random)) {
    const siblings = tiles.filter((t) => t.terrain === terrain);
    let tile: Tile | null = null;
    for (let tries = 0; tries < 30 && !tile; tries++) {
      // A twin keeps either the weather or the animal of its sibling, so the other clue decides.
      const sibling = siblings[0];
      const keepWeather = sibling && clues.includes("animal") && (!clues.includes("weather") || random() < 0.5);
      const weather = keepWeather ? sibling.weather : weathers[Math.floor(random() * weathers.length)];
      const animal = sibling && !keepWeather && clues.includes("weather") && random() < 0.6 ? sibling.animal : animalFor(terrain, siblings.map((s) => s.animal?.slug ?? ""));
      const candidate = { id: tiles.length, terrain, weather, animal };
      if (!siblings.some((s) => keyOf(s, clues) === keyOf(candidate, clues))) tile = candidate;
    }
    if (tile) tiles.push(tile);
  }

  // The calls: each tile at most once, weak places and animals first; the
  // forester's weather questions come in between, never first.
  const tasks: ForestTask[] = [];
  const callers = shuffle(config.callers, random);
  const order = shuffle(tiles, random).sort((a, b) => tileWeight(b) - tileWeight(a));
  function tileWeight(t: Tile) {
    const place = config.places.find((p) => p.id === t.terrain)!;
    return weight(place.concept) + (clues.includes("animal") && t.animal ? weight(t.animal.slug) / 2 : 0) + random() * 0.6;
  }
  for (const tile of order.slice(0, level.calls)) {
    const caller = callers[tasks.length % callers.length];
    const place = config.places.find((p) => p.id === tile.terrain)!;
    tasks.push({ kind: "call", tile: tile.id, caller, clues, line: config.call(caller, tile, place, clues) });
  }
  const asked = shuffle(tiles, random).slice(0, weathers.length >= 2 ? level.weather : 0);
  for (const tile of asked) {
    const place = config.places.find((p) => p.id === tile.terrain)!;
    tasks.splice(1 + Math.floor(random() * tasks.length), 0, { kind: "weather", tile: tile.id, line: config.askWeather(place) });
  }
  return { tiles, tasks };
}

// The first thing a caller said that the tile you chose doesn't fit.
export function mismatch(want: Tile, got: Tile, clues: Clue[]): Clue | null {
  for (const clue of clues) {
    if (clue === "place" && want.terrain !== got.terrain) return clue;
    if (clue === "weather" && want.weather !== got.weather) return clue;
    if (clue === "animal" && want.animal?.slug !== got.animal?.slug) return clue;
  }
  return null;
}

export function judgeWeather(config: ForestConfig, weather: Weather, text: string, code: TargetLanguageCode) {
  const word = config.weathers.find((w) => w.id === weather)!;
  const said = config.weathers.find((w) => w.accept.some((p) => saysPattern(p, text, code))) ?? null;
  return { ok: Boolean(said && (said.id === weather || word.alsoOk?.includes(said.id))), said, word };
}

export function forestStars(done: number, tasks: number, timeLeft: number) {
  if (done >= tasks) return timeLeft >= 0.2 ? 3 : 2;
  return done >= tasks / 2 ? 1 : 0;
}

// Everything the rescue can say, for the gloss audit and the voice catalog.
export function allForestLines(config: ForestConfig): { host: Line[]; callers: Map<Caller, Line[]> } {
  const host: Line[] = [];
  const callers = new Map<Caller, Line[]>(config.callers.map((c) => [c, []]));
  const all: Clue[] = ["place", "weather", "animal"];
  const tileOf = (terrain: Terrain, weather: Weather, animal: ForestAnimal | null): Tile => ({ id: 0, terrain, weather, animal });
  const [w0, w1] = config.weathers;
  for (const place of config.places) {
    host.push(config.askWeather(place));
    for (const caller of config.callers) {
      const lines = callers.get(caller)!;
      for (const weather of config.weathers) {
        for (const animal of config.animals) lines.push(config.call(caller, tileOf(place.id, weather.id, animal), place, all));
      }
      // Each kind of mix-up, which the forester explains about this caller.
      const other = config.places.find((p) => p !== place)!;
      const want = tileOf(place.id, w0.id, config.animals[0]);
      host.push(config.wrong(caller, want, tileOf(other.id, w0.id, config.animals[0]), "place"));
      for (const weather of config.weathers) host.push(config.wrong(caller, tileOf(place.id, weather.id, null), tileOf(place.id, (weather === w0 ? w1 : w0).id, null), "weather"));
      for (const animal of config.animals) host.push(config.wrong(caller, tileOf(place.id, w0.id, animal), tileOf(place.id, w0.id, config.animals.find((a) => a !== animal)!), "animal"));
    }
  }
  for (const weather of config.weathers) host.push(config.gear(weather.id), weather.say);
  return { host, callers };
}
