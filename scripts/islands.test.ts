import assert from "node:assert/strict";
import { test } from "node:test";

import { island as sv } from "../src/content/sv";
import type { IslandPack } from "../src/content/types";
import { gatedSlugs, pendingTip } from "../src/lib/game/grammar";
import { itemsIn, mixUp } from "../src/lib/game/cafe";
import { checkAnswer } from "../src/lib/game/lesson";
import { openThrough } from "../src/lib/game/placement";
import { computeProgress, levelFromXp } from "../src/lib/game/progression";
import { acceptsAnswer } from "../src/lib/game/scenes";
import { createEmptyState } from "../src/lib/learning/model";
import type { Concept, LearnerConceptState } from "../src/types/learning";

// Every island must hold together the same way: its course, its people, its
// words and its ground. These run once per island.
export const islands: IslandPack[] = [sv];

// Everything an island shows in its target language, for the gloss check.
export function shownText(pack: IslandPack) {
  const texts: string[] = [];
  for (const lesson of pack.course.lessons) {
    for (const exercise of lesson.exercises) texts.push(exercise.expected);
    for (const word of [...(lesson.support?.words ?? []), ...(lesson.support?.starters ?? [])]) texts.push(word.target);
  }
  for (const item of pack.course.listenSpeakItems) texts.push(item.text);
  for (const unit of pack.course.units) texts.push(unit.title.t);
  for (const scenario of pack.scenarios) {
    texts.push(scenario.openingLine, ...scenario.starterHints.map((h) => h.target), ...scenario.fallbackReplies.map((h) => h.target));
  }
  for (const v of pack.villagers) {
    for (const line of [v.role, v.place, v.locked, v.teach, v.talk, ...v.greetings, ...v.chatter, ...v.goodbye]) texts.push(line.t);
  }
  const { script } = pack;
  for (const line of [...script.intro, ...script.afterName("Kim"), ...script.praise, ...script.nudges, ...script.roundDone, ...Object.values(script.stageNames)]) {
    texts.push(line.t);
  }
  for (const item of pack.discoveries) texts.push(item.t);
  for (const sign of pack.signs) texts.push(sign.line.t, sign.closedLine?.t ?? "");
  for (const [key, value] of Object.entries(pack.ui)) {
    if (typeof value !== "function") texts.push(value.t);
    else if (key === "wordGrows") texts.push(pack.ui.wordGrows(script.stageNames[3]).t);
    else texts.push((value as (name: string, place: { t: string; en: string }) => { t: string })("Kim", pack.villagers[0].place).t);
  }
  return texts;
}

function concepts(pack: IslandPack): Concept[] {
  return pack.course.concepts.map((seed, i) => ({
    id: `c-${seed.slug}`,
    languageCode: pack.code,
    slug: seed.slug,
    kind: seed.kind,
    canonicalForm: seed.canonicalForm,
    gloss: seed.gloss,
    description: null,
    sortOrder: i,
  }));
}

for (const pack of islands) {
  const { code, course, villagers } = pack;

  test(`${code}: every word the island shows has an English gloss`, () => {
    const missing = new Set<string>();
    for (const text of shownText(pack)) {
      for (const [word] of text.matchAll(/\p{L}[\p{L}\p{N}]*/gu)) {
        if (word !== "Kim" && !pack.glossary.lookup(word)) missing.add(word);
      }
    }
    assert.deepEqual([...missing], []);
  });

  test(`${code}: units, lessons and the concept catalog agree`, () => {
    const taught = new Set(course.lessons.flatMap((l) => l.exercises.map((e) => e.conceptSlug)));
    const seeded = new Set(course.concepts.map((c) => c.slug));
    const owned = course.units.flatMap((u) => u.slugs);
    assert.equal(new Set(owned).size, owned.length, "no concept is in two units");
    for (const slug of owned) {
      assert.ok(taught.has(slug), `${slug} has a lesson`);
      assert.ok(seeded.has(slug), `${slug} is in the catalog`);
    }
    for (const slug of taught) assert.ok(owned.includes(slug), `${slug} belongs to a unit`);
    for (const item of course.listenSpeakItems) {
      assert.ok(taught.has(item.conceptSlug), item.id);
      assert.ok(item.options.includes(item.meaning), `${item.id} offers its own meaning`);
      assert.equal(new Set(item.options).size, item.options.length, `${item.id} options are distinct`);
    }
  });

  test(`${code}: every unit has a villager, and every villager a real scenario`, () => {
    for (const unit of course.units) assert.ok(villagers.some((v) => v.id === unit.villager), `${unit.id} → ${unit.villager}`);
    assert.ok(villagers.some((v) => v.id === pack.host), "the host lives here");
    for (const v of villagers) {
      assert.ok(course.units.some((u) => u.villager === v.id), `${v.id} teaches something`);
      if (!v.scenarioId) continue;
      const scenario = pack.scenarios.find((s) => s.id === v.scenarioId);
      assert.ok(scenario, `${v.scenarioId} exists`);
      assert.equal(scenario.characterId, v.id);
      assert.equal(scenario.languageCode, code);
    }
  });

  test(`${code}: the player spawns on the dock and villagers stand on walkable ground`, () => {
    const { spawn, onDock, isWalkable, groundAt } = pack.world;
    assert.ok(onDock(spawn.x, spawn.z));
    assert.ok(isWalkable(spawn.x, spawn.z));
    for (const v of villagers) {
      const [x, z] = v.position;
      assert.ok(isWalkable(x, z), `${v.id} is reachable`);
      assert.ok(groundAt(x, z) > 0.3, `${v.id} is above water`);
    }
  });

  test(`${code}: every discovery is close to walkable ground`, () => {
    const { isWalkable } = pack.world;
    for (const item of pack.discoveries) {
      let reachable = false;
      for (let a = 0; a < Math.PI * 2 && !reachable; a += Math.PI / 12) {
        for (const r of [0, 1, 2, 3]) {
          if (isWalkable(item.x + Math.cos(a) * r, item.z + Math.sin(a) * r)) reachable = true;
        }
      }
      assert.ok(reachable, `${item.id} can be reached`);
    }
  });

  test(`${code}: walking into the water keeps the player on land`, () => {
    const { resolveMove, isWalkable, spawn } = pack.world;
    const [x, z] = resolveMove(0, spawn.z - 14, 0, spawn.z + 30);
    assert.ok(isWalkable(x, z));
  });

  test(`${code}: levels and units grow with learning evidence, not with activity alone`, () => {
    assert.equal(levelFromXp(0).level, 1);
    assert.equal(levelFromXp(100).level, 2);
    assert.equal(levelFromXp(300).level, 3);
    const all = concepts(pack);
    const fresh = computeProgress({ course, villagers, concepts: all, states: [], discoveredCount: 0 });
    const [first, second] = course.units;
    assert.equal(fresh.level, 1);
    assert.equal(fresh.goal, first.villager);
    assert.equal(fresh.units[1].unlocked, false);

    const firstIds = new Set(first.slugs.map((s) => `c-${s}`));
    const states: LearnerConceptState[] = all
      .filter((c) => firstIds.has(c.id))
      .map((c) => ({ ...createEmptyState(c.id), recognitionAudio: 0.6, recall: 0.6, retrievalStrength: 0.5, estimateConfidence: 0.3, exposureCount: 3, successfulRetrievalCount: 2 }));
    const grown = computeProgress({ course, villagers, concepts: all, states, discoveredCount: 2 });
    assert.ok(grown.level > fresh.level);
    assert.equal(grown.units[1].unlocked, true);
    assert.equal(grown.villagers[second.villager].unlocked, true);
  });

  test(`${code}: placement opens units without claiming any mastery`, () => {
    const band = Math.min(2, pack.placement.bands.length - 1);
    const through = openThrough(pack.placement, course.units, band);
    const progress = computeProgress({ course, villagers, concepts: concepts(pack), states: [], discoveredCount: 0, openThrough: through, startUnit: pack.placement.bands[band] });
    assert.ok(progress.units.slice(0, through + 1).every((u) => u.unlocked));
    assert.ok(progress.units.slice(through + 1).every((u) => !u.unlocked));
    assert.equal(progress.wordsMet, 0);
    assert.equal(progress.goal, course.units[pack.placement.bands[band]].villager);
  });

  test(`${code}: grammar tips gate their own unit's phrases and never lead to a dead end`, () => {
    for (const tip of pack.grammar) {
      const unit = course.units.find((u) => u.id === tip.unit);
      assert.ok(unit, `${tip.id} belongs to a unit`);
      for (const slug of tip.gates) assert.ok(unit.slugs.includes(slug), `${tip.id} gates ${slug}`);
      assert.ok(tip.check.options.includes(tip.check.answer), `${tip.id} answer is an option`);
    }
    for (const unit of course.units) {
      const seen: string[] = [];
      let met = 0;
      // Walk forward: learn every open phrase, then read whatever tip is pending.
      for (let guard = 0; guard < 20; guard++) {
        const gated = gatedSlugs(pack.grammar, seen);
        met = unit.slugs.filter((s) => !gated.has(s)).length;
        const tip = pendingTip(pack.grammar, [{ id: unit.id, met }], seen);
        if (!tip) break;
        seen.push(tip.id);
      }
      assert.equal(met, unit.slugs.length, `${unit.id} can reach all phrases`);
    }
  });

  test(`${code}: scene variants belong to their villager and accept their own answers`, () => {
    const extras = pack.sceneExtras;
    for (const [villagerId, beats] of Object.entries(pack.scenes)) {
      const own = new Set(course.units.filter((u) => u.villager === villagerId).flatMap((u) => u.slugs));
      for (const [slug, variants] of Object.entries(beats)) {
        assert.ok(own.has(slug), `${villagerId} teaches ${slug}`);
        assert.ok(variants.length >= 2, `${slug} has ${variants.length} variants`);
        for (const beat of variants) {
          if (beat.ride) assert.ok(extras.journey.includes(beat.ride), beat.ride);
          if (beat.departure) assert.ok(extras.departures.some((d) => d.to === beat.departure), beat.departure);
          for (const pattern of [...(beat.accept ?? []), ...(beat.branches ?? []).map((b) => b.when)]) new RegExp(pattern, "u");
          if (beat.expect && beat.accept) assert.ok(acceptsAnswer(beat.accept, beat.expect.t, code), `${slug}: ${beat.expect.t}`);
        }
      }
    }
    for (const slug of Object.keys(pack.drills)) assert.ok(course.units.some((u) => u.slugs.includes(slug)), slug);
    for (const sentences of Object.values(extras.whenSentences)) assert.ok(sentences.length >= 2);
    for (const q of extras.whereQuestions) assert.ok(extras.signs.some((s) => s.id === q.sign), q.t);
    for (const a of extras.announcements) assert.ok(extras.departures.some((d) => d.to === a.to), a.t);
  });

  test(`${code}: every course answer and example passes its own checks`, () => {
    for (const lesson of course.lessons) {
      for (const exercise of lesson.exercises) {
        assert.equal(checkAnswer(exercise.expected, exercise.expected, code), "exact", exercise.expected);
        for (const pattern of exercise.accept ?? []) new RegExp(pattern, "u");
      }
    }
  });

  if (pack.cafe) {
    const cafe = pack.cafe;
    test(`${code}: café orders put the right things on the tray`, () => {
      const host = course.units.filter((u) => villagers.find((v) => v.id === u.villager)?.round === "cafe");
      const hostSlugs = new Set(host.flatMap((u) => u.slugs));
      for (const slug of cafe.orderSlugs) assert.ok(hostSlugs.has(slug), `${slug} is taught at the counter`);
      for (const want of cafe.menu) {
        for (let seed = 0; seed < 6; seed++) {
          const mix = mixUp(cafe, want, seed);
          assert.notEqual(mix.got.slug, want.slug);
          assert.equal(mix.options.filter((o) => o.right).length, 1);
          assert.equal(new Set(mix.options.map((o) => o.t)).size, 3);
        }
      }
      for (const [slug, variants] of Object.entries(cafe.orderVariants)) {
        for (const v of variants) if (v.accept) assert.ok(acceptsAnswer(v.accept, v.t, code), `${slug}: ${v.t}`);
      }
      for (const order of cafe.trayOrders) {
        // What you hear is what goes on the tray (plurals the menu can't spell aside).
        const heard = new Set(itemsIn(cafe, order.t, code).map((i) => i.slug));
        for (const slug of order.items) {
          const item = cafe.menu.find((i) => i.slug === slug);
          assert.ok(item, slug);
          if (order.t.toLowerCase().includes(item.name.toLowerCase())) assert.ok(heard.has(slug), `${order.t} → ${slug}`);
        }
      }
    });
  }
}
