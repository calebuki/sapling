import assert from "node:assert/strict";
import { test } from "node:test";

import { coreText, extraText, missingGlosses } from "../src/content/audit";
import { island as de } from "../src/content/de";
import { island as sv } from "../src/content/sv";
import { island as vi } from "../src/content/vi";
import type { IslandPack } from "../src/content/types";
import { gatedSlugs, pendingTip } from "../src/lib/game/grammar";
import { lessonFor } from "../src/lib/game/job-lesson";
import { itemsIn, mixUp } from "../src/lib/game/cafe";
import { checkAnswer } from "../src/lib/game/lesson";
import { openThrough } from "../src/lib/game/placement";
import { computeProgress, levelFromXp } from "../src/lib/game/progression";
import { acceptsAnswer } from "../src/lib/game/scenes";
import { createEmptyState } from "../src/lib/learning/model";
import type { Concept, LearnerConceptState } from "../src/types/learning";

// Every island must hold together the same way: its course, its people, its
// words and its ground. These run once per island.
const islands: IslandPack[] = [sv, de, vi];

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
    assert.deepEqual(missingGlosses(pack, coreText(pack)).map(([word]) => word), []);
    assert.deepEqual(missingGlosses(pack, extraText(pack)).map(([word]) => word), []);
  });

  test(`${code}: job lessons show course words and check what they teach`, () => {
    const taught = new Set(course.concepts.map((c) => c.slug));
    for (const [job, lesson] of Object.entries(pack.jobLessons?.jobs ?? {})) {
      for (const card of lesson?.cards ?? []) if (card.kind === "words") for (const slug of card.slugs) assert.ok(taught.has(slug), `${job}: ${slug}`);
      for (const check of lesson?.checks ?? []) assert.ok(check.options.includes(check.answer), `${job}: ${check.question}`);
      assert.ok(lessonFor(lesson!, 0).cards.length, `${job} has a lesson for its first level`);
    }
  });

  test(`${code}: conversations only practise phrases the course teaches`, () => {
    const taught = new Set(course.units.flatMap((u) => u.slugs));
    for (const scenario of pack.scenarios) {
      for (const slug of [...scenario.requiredConceptSlugs, ...scenario.optionalConceptSlugs]) {
        assert.ok(taught.has(slug), `${scenario.id} practises ${slug}`);
      }
    }
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
    // The concepts table's own checks (see scripts/concepts-sql.ts).
    for (const c of course.concepts) {
      assert.match(c.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, c.slug);
      assert.ok(c.canonicalForm.trim() && c.gloss.trim(), c.slug);
    }
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

  test(`${code}: a unit the learner has started stays open when new units come before it`, () => {
    const all = concepts(pack);
    const later = course.units[3];
    const started = all.find((c) => c.slug === later.slugs[0])!;
    const states = [{ ...createEmptyState(started.id), recall: 0.4, exposureCount: 2 }];
    const progress = computeProgress({ course, villagers, concepts: all, states, discoveredCount: 0 });
    assert.equal(progress.units[1].unlocked, false);
    assert.equal(progress.units[3].unlocked, true);
    assert.equal(progress.villagers[later.villager].unlocked, true);
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
