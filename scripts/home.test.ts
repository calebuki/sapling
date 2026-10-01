import assert from "node:assert/strict";
import { test } from "node:test";

import { home as de } from "../src/content/de/home";
import { home as sv } from "../src/content/sv/home";
import { arrange, HOME_LEVELS, homeStars, placeIn, type Placement, type Spot } from "../src/lib/game/home";

const anchors = de.anchors.map((a) => a.slug);
const things = de.things.map((t) => t.slug);
const spots: Spot[] = ["on", "under", "next", "in"];
const at = (slug: string) => de.anchors.find((a) => a.slug === slug)!;

test("the room only holds what the learner has met, one thing per place", () => {
  for (let seed = 1; seed < 200; seed++) {
    for (const level of HOME_LEVELS) {
      const { placements } = arrange(de, { level, anchors: ["der-tisch", "das-bett"], things: ["die-tasse", "die-katze"], spots: ["on", "under"], seed });
      const places = placements.map((p) => `${p.anchor.slug}:${p.spot}`);
      assert.equal(new Set(places).size, places.length);
      for (const p of placements) {
        assert.ok(["der-tisch", "das-bett"].includes(p.anchor.slug));
        assert.ok(["die-tasse", "die-katze"].includes(p.thing.slug));
        assert.ok(["on", "under"].includes(p.spot));
        assert.ok(p.anchor.spots.includes(p.spot));
      }
    }
  }
});

test("asking where something is only happens when there's just one of it", () => {
  for (let seed = 1; seed < 300; seed++) {
    const level = HOME_LEVELS[4];
    const { placements, tasks } = arrange(de, { level, anchors, things, spots, seed });
    const room: Placement[] = [...placements];
    for (const task of tasks) {
      if (task.kind === "tell") assert.equal(room.filter((p) => p.thing.slug === task.target.thing.slug).length, 1, task.line.t);
      room.splice(room.indexOf(task.target), 1);
    }
    assert.equal(tasks.length, level.tasks);
  }
});

test("later shifts have look-alikes, so the place decides which one", () => {
  let lookalikes = 0;
  for (let seed = 1; seed < 100; seed++) {
    const { placements, tasks } = arrange(de, { level: HOME_LEVELS[3], anchors, things, spots, seed });
    const first = tasks.find((t) => t.kind === "fetch")!;
    if (placements.filter((p) => p.thing.slug === first.target.thing.slug).length > 1) lookalikes++;
  }
  assert.ok(lookalikes > 70, `${lookalikes}`);
  // Every room on those levels has look-alikes.
  for (let seed = 1; seed < 500; seed++) {
    const { placements } = arrange(de, { level: HOME_LEVELS[4], anchors, things, spots, seed });
    const kinds = new Set(placements.map((p) => p.thing.slug));
    assert.ok(kinds.size < placements.length, `seed ${seed}`);
  }
  const easy = arrange(de, { level: HOME_LEVELS[0], anchors, things, spots, seed: 4 });
  assert.ok(easy.tasks.every((t) => t.kind === "fetch"));
});

test("places take the dative", () => {
  assert.equal(de.where("on", at("der-tisch")).t, "auf dem Tisch");
  assert.equal(de.where("under", at("das-bett")).t, "unter dem Bett");
  assert.equal(de.where("next", at("die-tuer")).t, "neben der Tür");
  assert.equal(de.where("in", at("der-schrank")).t, "im Schrank");
  assert.equal(de.fetch(de.things.find((t) => t.slug === "der-schluessel")!, de.where("on", at("der-tisch")), 0).t, "Bring mir bitte den Schlüssel! Er ist auf dem Tisch.");
  assert.equal(de.ask(de.things.find((t) => t.slug === "die-tasse")!).t, "Wo ist meine Tasse?");
});

test("telling the host where something is", () => {
  assert.deepEqual(summary(placeIn(de, "Unter dem Bett!", "de")), ["under", "das-bett", true]);
  assert.deepEqual(summary(placeIn(de, "Er ist im Kühlschrank.", "de")), ["in", "der-kuehlschrank", true]);
  assert.deepEqual(summary(placeIn(de, "neben der Tuer", "de")), ["next", "die-tuer", true]);
  assert.deepEqual(summary(placeIn(de, "unter der Bett", "de")), ["under", "das-bett", false]);
  assert.deepEqual(summary(placeIn(de, "auf Tisch", "de")), ["on", "der-tisch", false]);
  assert.deepEqual(summary(placeIn(de, "keine Ahnung", "de")), [null, null, false]);
});

test("Swedish places put the article on the noun", () => {
  const bed = sv.anchors.find((a) => a.slug === "en-saeng")!;
  assert.equal(sv.where("under", bed).t, "under sängen");
  assert.equal(sv.ask(sv.things.find((t) => t.slug === "en-nyckel")!).t, "Var är min nyckel?");
  assert.deepEqual(summary(placeIn(sv, "Den är under sängen", "sv")), ["under", "en-saeng", true]);
  assert.deepEqual(summary(placeIn(sv, "pa bordet", "sv")), ["on", "ett-bord", true]);
  assert.deepEqual(summary(placeIn(sv, "under säng", "sv")), ["under", "en-saeng", false]);
});

test("stars", () => {
  assert.equal(homeStars(6, 6, 0.5), 3);
  assert.equal(homeStars(6, 6, 0.1), 2);
  assert.equal(homeStars(3, 6, 0), 1);
  assert.equal(homeStars(2, 6, 0), 0);
});

function summary(result: ReturnType<typeof placeIn>) {
  return [result.spot, result.anchor?.slug ?? null, result.formOk];
}
