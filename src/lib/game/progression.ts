import type { Concept, LearnerConceptState } from "@/types/learning";
import { villagers, type Villager, type VillagerId } from "./villagers";

// Progress is a projection over the learning model, never a separate score the
// game can inflate. Discoveries add a little flavour XP but no mastery.

export type Stage = 0 | 1 | 2 | 3 | 4;
export const stageNames: Record<Stage, { sv: string; en: string }> = {
  0: { sv: "okänd", en: "unknown" },
  1: { sv: "frö", en: "seed" },
  2: { sv: "grodd", en: "sprout" },
  3: { sv: "planta", en: "sapling" },
  4: { sv: "blomma", en: "in bloom" },
};

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

export type VillagerProgress = {
  villager: Villager;
  unlocked: boolean;
  total: number;
  met: number;
  strong: number;
  // Enough met to open the next villager.
  ready: boolean;
};

export type GameProgress = ReturnType<typeof levelFromXp> & {
  villagers: Record<VillagerId, VillagerProgress>;
  wordsMet: number;
  wordsTotal: number;
  treeStage: number;
  goal: VillagerId | null;
};

export function computeProgress(
  concepts: Concept[],
  states: LearnerConceptState[],
  discoveredCount: number,
  // Placement opens every villager up to this index without claiming mastery.
  placedBand = 0,
): GameProgress {
  const bySlug = new Map(concepts.filter((c) => c.languageCode === "sv").map((c) => [c.slug, c]));
  const byConcept = new Map(states.map((s) => [s.conceptId, s]));
  const stateFor = (slug: string) => {
    const concept = bySlug.get(slug);
    return concept ? byConcept.get(concept.id) : undefined;
  };

  let xp = discoveredCount * DISCOVERY_XP;
  let wordsMet = 0;
  let wordsTotal = 0;
  const result = {} as Record<VillagerId, VillagerProgress>;
  let previousReady = true;
  villagers.forEach((villager, index) => {
    const slugs = villager.conceptSlugs.filter((slug) => bySlug.has(slug));
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
    const unlocked = previousReady || index <= placedBand;
    result[villager.id] = { villager, unlocked, total: slugs.length, met, strong, ready };
    previousReady = unlocked && ready;
  });

  const level = levelFromXp(xp);
  const open = (v: Villager) => result[v.id].unlocked && result[v.id].met < result[v.id].total;
  const goal = (villagers.slice(placedBand).find(open) ?? villagers.find(open))?.id ?? null;
  return {
    ...level,
    villagers: result,
    wordsMet,
    wordsTotal,
    treeStage: Math.min(6, level.level - 1),
    goal,
  };
}
