import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { createDemoLearningRepository } from "../src/lib/repositories/demo-learning-repository";

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "window", {
  value: {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  },
  configurable: true,
});
beforeEach(() => storage.clear());

const completedVisit = {
  sessionId: "test-visit",
  languageCode: "sv" as const,
  scenarioId: "fika-order",
  characterId: "elin",
  turnCount: 3,
  goalProgress: 1,
  summary: "Ordered a coffee and answered a follow-up.",
};

test("a completed adventure earns one durable stamp across repeated visits and reloads", async () => {
  const repository = createDemoLearningRepository();
  await repository.completePracticeSession(completedVisit);
  for (let i = 0; i < 8; i++)
    await repository.completePracticeSession({
      ...completedVisit,
      scenarioId: "meet-elin",
    });
  await repository.completePracticeSession(completedVisit);
  const reloaded =
    await createDemoLearningRepository().loadPracticeSnapshot("sv");
  assert.deepEqual(reloaded.completedScenarioIds, ["fika-order", "meet-elin"]);
  assert.equal(reloaded.continuity[0].encounterCount, 10);
});

test("ending early, reaching a turn limit, or lacking feedback cannot earn a stamp", async () => {
  const repository = createDemoLearningRepository();
  for (const input of [
    { ...completedVisit, turnCount: 0 },
    { ...completedVisit, turnCount: 2 },
    { ...completedVisit, goalProgress: 0.9, turnCount: 6 },
    { ...completedVisit, goalProgress: 0, turnCount: 6 },
  ])
    await repository.completePracticeSession(input);
  assert.deepEqual(
    (await repository.loadPracticeSnapshot("sv")).completedScenarioIds,
    [],
  );
});

test("Swedish and Danish journal records remain separate", async () => {
  const repository = createDemoLearningRepository();
  await repository.completePracticeSession(completedVisit);
  assert.deepEqual(
    (await repository.loadPracticeSnapshot("da")).completedScenarioIds,
    [],
  );
});

test("existing saved practice loads without inventing historical stamps", async () => {
  storage.set(
    "sapling.demo.practice.sv.v1",
    JSON.stringify({
      memories: [],
      continuity: [],
      recentScenarioIds: ["fika-order"],
    }),
  );
  const snapshot =
    await createDemoLearningRepository().loadPracticeSnapshot("sv");
  assert.deepEqual(snapshot.completedScenarioIds, []);
  assert.deepEqual(snapshot.recentScenarioIds, ["fika-order"]);
});
