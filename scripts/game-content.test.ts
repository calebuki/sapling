import assert from "node:assert/strict";
import { test } from "node:test";

import { swedishLessons, swedishListenSpeakItems } from "../src/lib/learning/swedish-course";
import { getPracticeScenario, getPracticeScenarios } from "../src/lib/practice/scenarios";
import { discoveries } from "../src/lib/game/discoveries";
import { lookupGloss } from "../src/lib/game/glossary";
import { computeProgress, levelFromXp } from "../src/lib/game/progression";
import { ui } from "../src/lib/game/ui-text";
import { elinAfterName, elinIntro, nudges, praise, roundDone, villagers } from "../src/lib/game/villagers";
import { groundAt, isWalkable, onDock, resolveMove, spawn } from "../src/lib/game/world";
import type { Concept, LearnerConceptState } from "../src/types/learning";

function gameSwedish() {
  const texts: string[] = [];
  for (const lesson of swedishLessons) {
    for (const exercise of lesson.exercises) texts.push(exercise.expected);
    for (const word of [...(lesson.support?.words ?? []), ...(lesson.support?.starters ?? [])]) texts.push(word.target);
  }
  for (const item of swedishListenSpeakItems) texts.push(item.text);
  for (const scenario of getPracticeScenarios("sv")) {
    texts.push(scenario.openingLine, ...scenario.starterHints.map((h) => h.target), ...scenario.fallbackReplies.map((h) => h.target));
  }
  for (const v of villagers) {
    for (const line of [v.role, v.place, v.locked, v.teach, v.talk, ...v.greetings, ...v.chatter, ...v.goodbye]) texts.push(line.sv);
  }
  for (const line of [...elinIntro, ...elinAfterName("Kim"), ...praise, ...nudges, ...roundDone]) texts.push(line.sv);
  for (const item of discoveries) texts.push(item.sv);
  for (const value of Object.values(ui)) {
    texts.push(typeof value === "function" ? value("Kim", { sv: "Bryggan", en: "The dock" }).sv : value.sv);
  }
  return texts;
}

test("every Swedish word the game shows has an English gloss", () => {
  const missing = new Set<string>();
  for (const text of gameSwedish()) {
    for (const [word] of text.matchAll(/\p{L}[\p{L}\p{N}]*/gu)) {
      if (word !== "Kim" && !lookupGloss(word)) missing.add(word);
    }
  }
  assert.deepEqual([...missing], []);
});

test("every villager owns real course concepts and an existing scenario", () => {
  const courseSlugs = new Set(swedishLessons.flatMap((l) => l.exercises.map((e) => e.conceptSlug)));
  const owned = villagers.flatMap((v) => v.conceptSlugs);
  assert.equal(new Set(owned).size, owned.length, "no concept is taught by two villagers");
  for (const slug of owned) assert.ok(courseSlugs.has(slug), `${slug} is in the course`);
  for (const v of villagers) {
    const scenario = getPracticeScenario("sv", v.scenarioId);
    assert.ok(scenario, `${v.scenarioId} exists`);
    assert.equal(scenario.characterId, v.id);
  }
});

test("the player spawns on the dock and villagers stand on walkable ground", () => {
  assert.ok(onDock(spawn.x, spawn.z));
  assert.ok(isWalkable(spawn.x, spawn.z));
  for (const v of villagers) {
    const [x, z] = v.position;
    assert.ok(isWalkable(x, z), `${v.id} is reachable`);
    assert.ok(groundAt(x, z) > 0.3, `${v.id} is above water`);
  }
});

test("every discovery is close to walkable ground", () => {
  for (const item of discoveries) {
    let reachable = false;
    for (let a = 0; a < Math.PI * 2 && !reachable; a += Math.PI / 12) {
      for (const r of [0, 1, 2, 3]) {
        if (isWalkable(item.x + Math.cos(a) * r, item.z + Math.sin(a) * r)) reachable = true;
      }
    }
    assert.ok(reachable, `${item.id} can be reached`);
  }
});

test("walking into the sea keeps the player on land", () => {
  const [x, z] = resolveMove(0, 20, 0, 60);
  assert.ok(isWalkable(x, z));
});

test("levels grow with learning evidence, not with activity alone", () => {
  assert.equal(levelFromXp(0).level, 1);
  assert.equal(levelFromXp(100).level, 2);
  assert.equal(levelFromXp(299).level, 2);
  assert.equal(levelFromXp(300).level, 3);

  const concepts: Concept[] = villagers[0].conceptSlugs.map((slug, i) => ({
    id: `c-${slug}`, languageCode: "sv", slug, kind: "word", canonicalForm: slug, gloss: slug, description: null, sortOrder: i,
  }));
  const fresh = computeProgress(concepts, [], 0);
  assert.equal(fresh.level, 1);
  assert.equal(fresh.goal, "elin");
  assert.equal(fresh.villagers.bosse.unlocked, false);

  const states: LearnerConceptState[] = concepts.map((c) => ({
    conceptId: c.id, recognitionText: null, recognitionAudio: 0.6, recall: 0.6, production: null, pronunciation: null,
    automaticity: null, contextDiversity: null, speakerDiversity: null, retrievalLatencyMs: null, lastExposureAt: null,
    lastSuccessfulRetrievalAt: null, retrievalStrength: 0.5, estimateConfidence: 0.3, exposureCount: 3,
    successfulRetrievalCount: 2, algorithmVersion: 3,
  }));
  const grown = computeProgress(concepts, states, 2);
  assert.ok(grown.level > fresh.level);
  assert.equal(grown.villagers.bosse.unlocked, true);
});

test("answer checking forgives keyboard accents and single typos, not wrong words", async () => {
  const { checkAnswer, buildTiles, splitWords } = await import("../src/lib/game/lesson");
  assert.equal(checkAnswer("Hej!", "Hej."), "exact");
  assert.equal(checkAnswer("mjolk", "Mjölk."), "accent");
  assert.equal(checkAnswer("jag skulle vilja ha en kaffee", "Jag skulle vilja ha en kaffe."), "typo");
  assert.equal(checkAnswer("tack", "Hej."), "wrong");
  assert.equal(checkAnswer("", "Hej."), "wrong");
  const tiles = buildTiles("Vad heter du?", ["Jag heter Kim.", "Trevligt att träffas."], 4);
  for (const word of splitWords("Vad heter du?")) assert.ok(tiles.some((t) => t.word === word));
  assert.ok(tiles.length >= 5);
});
