import type { Course, Unit } from "@/lib/learning/course";
import type { Concept, LearnerConceptState } from "@/types/learning";
import type { Villager, VillagerId } from "./villagers";

// Progress is a projection over the learning model, never a separate score the
// game can inflate. Discoveries add a little flavour XP but no mastery.

export type Stage = 0 | 1 | 2 | 3 | 4;

export function conceptStrength(state: LearnerConceptState | undefined) {
  if (!state || state.exposureCount === 0) return 0;
  const values = [state.recall, state.production, state.recognitionAudio].filter(
    (value): value is number => typeof value === "number",
  );
  if (values.length === 0) return 0.05;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function conceptStage(state: LearnerConceptState | undefined): Stage {
  if (!state || state.exposureCount === 0) return 0;
  const strength = conceptStrength(state);
  if (strength >= 0.72) return 4;
  if (strength >= 0.5) return 3;
  if (strength >= 0.3) return 2;
  return 1;
}

export const DISCOVERY_XP = 5;

export function conceptXp(state: LearnerConceptState | undefined) {
  if (!state || state.exposureCount === 0) return 0;
  return 10 + Math.round(conceptStrength(state) * 90);
}

// Level n starts at 50 * n * (n - 1) XP: 0, 100, 300, 600, 1000 …
export function levelStart(level: number) {
  return 50 * level * (level - 1);
}

export function levelFromXp(xp: number) {
  let level = 1;
  while (xp >= levelStart(level + 1)) level++;
  const start = levelStart(level);
  const next = levelStart(level + 1);
  return { level, xp, into: xp - start, span: next - start, progress: (xp - start) / (next - start) };
}

export type UnitProgress = {
  unit: Unit;
  unlocked: boolean;
  total: number;
  met: number;
  strong: number;
  // Enough met to open the next unit.
  ready: boolean;
};

export type VillagerProgress = {
  villager: Villager;
  unlocked: boolean;
  // Counted over the villager's open units only.
  total: number;
  met: number;
  strong: number;
  units: UnitProgress[];
};

export type GameProgress = ReturnType<typeof levelFromXp> & {
  units: UnitProgress[];
  villagers: Record<VillagerId, VillagerProgress>;
  wordsMet: number;
  wordsTotal: number;
  treeStage: number;
  goal: VillagerId | null;
};

export function computeProgress({
  course,
  villagers,
  concepts,
  states,
  discoveredCount,
  openThrough = 0,
  startUnit = 0,
}: {
  course: Course;
  villagers: readonly Villager[];
  concepts: Concept[];
  states: LearnerConceptState[];
  discoveredCount: number;
  // Placement opens every unit up to this index without claiming mastery.
  openThrough?: number;
  // Where placement suggested starting, for the goal marker.
  startUnit?: number;
}): GameProgress {
  const bySlug = new Map(concepts.filter((c) => c.languageCode === course.languageCode).map((c) => [c.slug, c]));
  const byConcept = new Map(states.map((s) => [s.conceptId, s]));
  const stateFor = (slug: string) => {
    const concept = bySlug.get(slug);
    return concept ? byConcept.get(concept.id) : undefined;
  };

  let xp = discoveredCount * DISCOVERY_XP;
  let wordsMet = 0;
  let wordsTotal = 0;
  let previousReady = true;
  const units = course.units.map((unit, index): UnitProgress => {
    const slugs = unit.slugs.filter((slug) => bySlug.has(slug));
    let met = 0;
    let strong = 0;
    for (const slug of slugs) {
      const state = stateFor(slug);
      xp += conceptXp(state);
      if (state && state.exposureCount > 0) met++;
      if (conceptStage(state) >= 3) strong++;
    }
    wordsMet += met;
    wordsTotal += slugs.length;
    const ready = slugs.length > 0 && met >= Math.ceil(slugs.length * 0.6);
    // A unit the learner has already started never locks again, even when a
    // course update puts new units in front of it.
    const unlocked = previousReady || index <= openThrough || met > 0;
    previousReady = unlocked && ready;
    return { unit, unlocked, total: slugs.length, met, strong, ready };
  });

  const result = {} as Record<VillagerId, VillagerProgress>;
  for (const villager of villagers) {
    const own = units.filter((u) => u.unit.villager === villager.id);
    const open = own.filter((u) => u.unlocked);
    result[villager.id] = {
      villager,
      unlocked: open.length > 0,
      total: open.reduce((sum, u) => sum + u.total, 0),
      met: open.reduce((sum, u) => sum + u.met, 0),
      strong: open.reduce((sum, u) => sum + u.strong, 0),
      units: own,
    };
  }

  const level = levelFromXp(xp);
  const open = (u: UnitProgress) => u.unlocked && u.met < u.total;
  const goalUnit = units.slice(startUnit).find(open) ?? units.find(open);
  return {
    ...level,
    units,
    villagers: result,
    wordsMet,
    wordsTotal,
    treeStage: Math.min(6, level.level - 1),
    goal: goalUnit?.unit.villager ?? null,
  };
}

// The concepts a villager can teach right now: every open unit of theirs.
export function teachableSlugs(progress: GameProgress, villagerId: VillagerId) {
  return progress.villagers[villagerId]?.units.filter((u) => u.unlocked).flatMap((u) => u.unit.slugs) ?? [];
}
