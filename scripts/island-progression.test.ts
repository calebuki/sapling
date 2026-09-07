import test from "node:test";
import assert from "node:assert/strict";
import { initialState, restore } from "../src/lib/island/game.ts";
import {
  availableSupplies,
  claimSupplies,
  islandStorageKey,
  parseIslandActivity,
} from "../src/lib/island/progression.ts";

test("supplies require completed conversations or successful retrievals, never exposure", () => {
  const s = initialState();
  s.completed = 40;
  assert.equal(
    availableSupplies(s, { completedScenarioIds: [], successfulRetrievals: 0 })
      .length,
    0,
  );
  assert.equal(
    availableSupplies(s, {
      completedScenarioIds: ["unknown", "fika-order"],
      successfulRetrievals: 4,
    }).length,
    1,
  );
});
test("completed activities reward once and remain claimed after save/restore", () => {
  const s = initialState(),
    evidence = {
      completedScenarioIds: ["fika-order", "fika-order"],
      successfulRetrievals: 5,
    };
  const rewarded = claimSupplies(s, evidence);
  assert.equal(rewarded.coins, 30);
  assert.equal(rewarded.bag.wood, 7);
  assert.equal(rewarded.bag.stone, 4);
  assert.deepEqual(rewarded.words, s.words);
  assert.equal(s.coins, 0);
  assert.deepEqual(
    claimSupplies(restore(JSON.stringify(rewarded)), evidence),
    rewarded,
  );
});
test("rewards accumulate materials without dropping a delivery at a full bag", () => {
  const s = initialState();
  s.bag.wood = 99;
  const next = claimSupplies(s, {
    completedScenarioIds: ["meet-elin"],
    successfulRetrievals: 0,
  });
  assert.equal(next.bag.wood, 103);
  assert.deepEqual(restore(JSON.stringify(next)), next);
});
test("island saves are scoped by account and only supported activity routes open", () => {
  assert.notEqual(islandStorageKey("a"), islandStorageKey("b"));
  assert.match(islandStorageKey("a"), /\.sv\.v1$/);
  assert.equal(parseIslandActivity("fika-order"), "fika-order");
  assert.equal(parseIslandActivity("unknown"), null);
});
