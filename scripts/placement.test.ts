import assert from "node:assert/strict";
import test from "node:test";
import { answerPlacement, placedBand, startPlacement } from "../src/lib/game/placement.ts";
import { computeProgress } from "../src/lib/game/progression.ts";
import { villagers } from "../src/lib/game/villagers.ts";

const all = new Set(villagers.flatMap((v) => v.conceptSlugs));
const fixed = () => 0.5;

function run(experience: "little" | "some" | "lots", answer: (band: number) => boolean) {
  let state = startPlacement(experience, all, fixed);
  for (let guard = 0; !state.done && guard < 20; guard++) state = answerPlacement(state, answer(state.band), all, fixed);
  return state;
}

test("placement climbs while the learner keeps passing", () => {
  const state = run("little", () => true);
  assert.equal(state.done, true);
  assert.deepEqual(state.passed, [0, 1, 2, 3]);
  assert.equal(placedBand(state), 3);
});

test("placement stops at the first band the learner can't do", () => {
  const state = run("little", (band) => band < 1);
  assert.deepEqual(state.passed, [0]);
  assert.deepEqual(state.failed, [1]);
  assert.equal(placedBand(state), 1);
});

test("an overconfident self-report walks back down", () => {
  const state = run("lots", (band) => band === 0);
  assert.deepEqual(state.failed, [2, 1]);
  assert.deepEqual(state.passed, [0]);
  assert.equal(placedBand(state), 1);
});

test("two misses end a band early", () => {
  const state = run("little", () => false);
  assert.equal(state.answers.length, 2);
  assert.equal(placedBand(state), 0);
});

test("placement opens villagers without claiming any mastery", () => {
  const concepts = villagers.flatMap((v) => v.conceptSlugs).map((slug, i) => ({
    id: `c${i}`, languageCode: "sv", slug, kind: "chunk" as const, canonicalForm: slug, gloss: slug, description: null, sortOrder: i,
  }));
  const progress = computeProgress(concepts, [], 0, 2);
  assert.equal(progress.villagers.stina.unlocked, true);
  assert.equal(progress.villagers.astrid.unlocked, false);
  assert.equal(progress.wordsMet, 0);
  assert.equal(progress.goal, "stina");
});
