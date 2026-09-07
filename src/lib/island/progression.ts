import type { State } from "./game.ts";

export const islandInvitations = [
  {
    id: "meet-elin",
    target: "Hej, granne!",
    title: "A new neighbor",
    description: "Introduce yourself to Elin.",
    icon: "👋",
    place: "By the apple trees",
    reward: 15,
  },
  {
    id: "fika-order",
    target: "Dags för fika",
    title: "Fika with Elin",
    description: "Order something warm at the picnic table.",
    icon: "☕",
    place: "The picnic table",
    reward: 20,
  },
  {
    id: "centralstation-change",
    target: "En liten resa",
    title: "A little trip",
    description: "Practice finding your train before leaving the island.",
    icon: "⛵",
    place: "The dock",
    reward: 25,
  },
  {
    id: "make-weekend-plans",
    target: "Vi ses på lördag",
    title: "Weekend plans",
    description: "Make a plan with Elin for Saturday.",
    icon: "🌼",
    place: "The flower garden",
    reward: 25,
  },
] as const;

export type IslandActivity =
  | "learn"
  | "invitations"
  | "journal"
  | (typeof islandInvitations)[number]["id"];
export function parseIslandActivity(
  value: string | null,
): IslandActivity | null {
  return value &&
    [
      "learn",
      "invitations",
      "journal",
      ...islandInvitations.map((q) => q.id),
    ].includes(value)
    ? (value as IslandActivity)
    : null;
}
export function islandStorageKey(learnerId: string) {
  return `sapling.island.${learnerId}.sv.v1`;
}

type Evidence = {
  completedScenarioIds: readonly string[];
  successfulRetrievals: number;
};
export function availableSupplies(state: State, evidence: Evidence) {
  const claimed = new Set(state.learningRewards ?? []);
  const rewards: { id: string; shells: number; wood: number; stone: number }[] =
    islandInvitations
      .filter((q) => evidence.completedScenarioIds.includes(q.id))
      .map((q) => ({
        id: `invitation:${q.id}`,
        shells: q.reward,
        wood: 4,
        stone: 2,
      }));
  const milestones = Math.min(
    50,
    Math.floor(Math.max(0, evidence.successfulRetrievals) / 5),
  );
  for (let i = 1; i <= milestones; i++)
    rewards.push({ id: `learning:${i}`, shells: 10, wood: 3, stone: 2 });
  return rewards.filter((reward) => !claimed.has(reward.id));
}
// Cosmetic island rewards consume existing saved learning evidence; never write learning evidence.
export function claimSupplies(state: State, evidence: Evidence): State {
  const rewards = availableSupplies(state, evidence);
  if (!rewards.length) return state;
  return {
    ...state,
    learningRewards: [
      ...(state.learningRewards ?? []),
      ...rewards.map((r) => r.id),
    ],
    coins: state.coins + rewards.reduce((n, r) => n + r.shells, 0),
    bag: {
      ...state.bag,
      wood: state.bag.wood + rewards.reduce((n, r) => n + r.wood, 0),
      stone: state.bag.stone + rewards.reduce((n, r) => n + r.stone, 0),
    },
  };
}
