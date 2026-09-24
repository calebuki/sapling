import type { Line } from "./villagers";
import { villagers } from "./villagers";

// Where a returning learner starts. The self-report (Duolingo section or
// similar) only picks the first band to probe; a short check then walks up or
// down one villager at a time. Passing a band opens the next villager, but the
// learning model only ever hears about answers the learner actually got right.

export type Experience = "new" | "little" | "some" | "lots";

export const experienceOptions: Array<{ id: Experience; title: Line; detail: string }> = [
  { id: "new", title: { sv: "Helt ny", en: "Brand new" }, detail: "I've never studied Swedish." },
  { id: "little", title: { sv: "Lite grann", en: "A little" }, detail: "Duolingo section 1, or a few weeks of study. I know hej and tack." },
  { id: "some", title: { sv: "En del", en: "Some" }, detail: "Duolingo sections 2–3. I can order at a café and introduce myself." },
  { id: "lots", title: { sv: "Ganska mycket", en: "Quite a bit" }, detail: "Duolingo section 4 or beyond. I can ask for help and talk about plans." },
];

const startBand: Record<Exclude<Experience, "new">, number> = { little: 0, some: 1, lots: 2 };
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

// Multi-word phrases say more about a learner than single words, so they go first
// beyond the very first band.
function bandSlugs(band: number, available: ReadonlySet<string>, random: () => number) {
  const slugs = villagers[band].conceptSlugs.filter((slug) => available.has(slug));
  const shuffled = [...slugs].sort(() => random() - 0.5);
  return band === 0 ? shuffled : shuffled.sort((a, b) => b.split("-").length - a.split("-").length);
}

export function startPlacement(experience: Exclude<Experience, "new">, available: ReadonlySet<string>, random = Math.random): PlacementState {
  const band = startBand[experience];
  return { band, queue: bandSlugs(band, available, random).slice(0, PER_BAND), answers: [], passed: [], failed: [], done: false };
}

export function answerPlacement(
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
  if (next < 0 || next >= villagers.length || tried.has(next) || (!passedBand && passed.length > 0)) {
    return { ...state, queue: [], answers, passed, failed, done: true };
  }
  return { band: next, queue: bandSlugs(next, available, random).slice(0, PER_BAND), answers, passed, failed, done: false };
}

// The villager index the learner should start learning with; everyone up to it opens.
export function placedBand(state: Pick<PlacementState, "passed">) {
  if (state.passed.length === 0) return 0;
  return Math.min(villagers.length - 1, Math.max(...state.passed) + 1);
}
