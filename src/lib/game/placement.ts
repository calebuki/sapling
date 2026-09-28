import type { Unit } from "@/lib/learning/course";
import type { Line } from "./line";

// Where a returning learner starts. The self-report (Duolingo section or
// similar) only picks the first band to probe; a short check then walks up or
// down one band at a time. Passing a band opens the next one, but the
// learning model only ever hears about answers the learner actually got right.

export type Experience = "new" | "little" | "some" | "lots";

export type PlacementConfig = {
  options: Array<{ id: Experience; title: Line; detail: string }>;
  // Index of the first unit in each band.
  bands: number[];
  startBand: Record<Exclude<Experience, "new">, number>;
};

const PER_BAND = 3;

export type PlacementAnswer = { slug: string; band: number; correct: boolean };
export type PlacementState = {
  band: number;
  queue: string[];
  answers: PlacementAnswer[];
  passed: number[];
  failed: number[];
  done: boolean;
};

export function unitsInBand(config: PlacementConfig, units: readonly Unit[], band: number) {
  return units.slice(config.bands[band], config.bands[band + 1] ?? units.length);
}

// The last unit a placement band opens.
export function openThrough(config: PlacementConfig, units: readonly Unit[], band: number) {
  return Math.min(units.length, config.bands[band + 1] ?? units.length) - 1;
}

// Multi-word phrases say more about a learner than single words, so they go first
// beyond the very first band.
function bandSlugs(config: PlacementConfig, units: readonly Unit[], band: number, available: ReadonlySet<string>, random: () => number) {
  const slugs = unitsInBand(config, units, band).flatMap((u) => u.slugs).filter((slug) => available.has(slug));
  const shuffled = [...slugs].sort(() => random() - 0.5);
  return band === 0 ? shuffled : shuffled.sort((a, b) => b.split("-").length - a.split("-").length);
}

export function startPlacement(
  config: PlacementConfig,
  units: readonly Unit[],
  experience: Exclude<Experience, "new">,
  available: ReadonlySet<string>,
  random = Math.random,
): PlacementState {
  const band = Math.min(config.startBand[experience], config.bands.length - 1);
  return { band, queue: bandSlugs(config, units, band, available, random).slice(0, PER_BAND), answers: [], passed: [], failed: [], done: false };
}

export function answerPlacement(
  config: PlacementConfig,
  units: readonly Unit[],
  state: PlacementState,
  correct: boolean,
  available: ReadonlySet<string>,
  random = Math.random,
): PlacementState {
  const [slug, ...queue] = state.queue;
  const answers = [...state.answers, { slug, band: state.band, correct }];
  const inBand = answers.filter((a) => a.band === state.band);
  const right = inBand.filter((a) => a.correct).length;
  const wrong = inBand.length - right;
  // Two of three decides a band; stop early once the outcome is certain.
  const decided = right >= 2 || wrong >= 2 || queue.length === 0;
  if (!decided) return { ...state, queue, answers };

  const passedBand = right >= 2;
  const passed = passedBand ? [...state.passed, state.band] : state.passed;
  const failed = passedBand ? state.failed : [...state.failed, state.band];
  const tried = new Set([...passed, ...failed]);
  const next = passedBand ? state.band + 1 : state.band - 1;
  if (next < 0 || next >= config.bands.length || tried.has(next) || (!passedBand && passed.length > 0)) {
    return { ...state, queue: [], answers, passed, failed, done: true };
  }
  return { band: next, queue: bandSlugs(config, units, next, available, random).slice(0, PER_BAND), answers, passed, failed, done: false };
}

// The band the learner should start learning in; every band up to it opens.
export function placedBand(config: PlacementConfig, state: Pick<PlacementState, "passed">) {
  if (state.passed.length === 0) return 0;
  return Math.min(config.bands.length - 1, Math.max(...state.passed) + 1);
}
