import assert from "node:assert/strict";
import test from "node:test";
import { gatedSlugs, grammarTips, pendingTip } from "../src/lib/game/grammar.ts";
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

test("every gated phrase belongs to the villager teaching the tip", () => {
  for (const tip of grammarTips) {
    const villager = villagers.find((v) => v.id === tip.villager)!;
    for (const slug of tip.gates) assert.ok(villager.conceptSlugs.includes(slug), `${tip.id} gates ${slug}`);
    assert.ok(tip.check.options.includes(tip.check.answer), `${tip.id} answer is an option`);
  }
});

test("tips never gate a villager into a dead end", () => {
  for (const villager of villagers) {
    const seen: string[] = [];
    let met = 0;
    // Walk forward: learn every open phrase, then read whatever tip is pending.
    for (let guard = 0; guard < 20; guard++) {
      const gated = gatedSlugs(seen);
      met = villager.conceptSlugs.filter((s) => !gated.has(s)).length;
      const tip = pendingTip(villager.id, met, seen);
      if (!tip) break;
      seen.push(tip.id);
    }
    assert.equal(met, villager.conceptSlugs.length, `${villager.id} can reach all phrases`);
  }
});

test("café orders put the right things on the tray", async () => {
  const { itemsIn, mixUp, orderSlugs, cafeMenu, withArticle } = await import("../src/lib/game/cafe.ts");
  assert.deepEqual(itemsIn("Jag skulle vilja ha en kaffe med mjölk, tack.").map((i) => i.slug), ["kaffe", "mjoelk"]);
  assert.deepEqual(itemsIn("Och en kanelbulle, tack.").map((i) => i.slug), ["kanelbulle"]);
  assert.deepEqual(itemsIn("Jag vill ha te").map((i) => i.slug), ["te"]);
  assert.equal(withArticle(cafeMenu.find((i) => i.slug === "te")!), "ett te");
  const bosse = villagers.find((v) => v.id === "bosse")!;
  for (const slug of orderSlugs) assert.ok(bosse.conceptSlugs.includes(slug), slug);
  for (const want of cafeMenu) {
    for (let seed = 0; seed < 6; seed++) {
      const mix = mixUp(want, seed);
      assert.notEqual(mix.got.slug, want.slug);
      assert.equal(mix.options.filter((o) => o.right).length, 1);
      assert.equal(new Set(mix.options.map((o) => o.sv)).size, 3);
    }
  }
});
