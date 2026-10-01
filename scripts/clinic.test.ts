import assert from "node:assert/strict";
import { test } from "node:test";

import { clinic as de } from "../src/content/de/clinic";
import { clinic as sv } from "../src/content/sv/clinic";
import { checkPot, CLINIC_LEVELS, clinicStars, emptyPot, judgeAdvice, makePatients, saysPattern, type Advice, type Spoons } from "../src/lib/game/clinic";

const all = {
  parts: de.parts.map((p) => p.slug),
  colors: de.colors.map((c) => c.slug),
  spoons: [1, 2, 3] as Spoons[],
  heat: true,
  sugar: true,
  feelings: de.feelings.map((f) => f.concept),
  advice: ["bed", "drink", "rest"] as Advice[],
};

test("patients only bring what the learner has met", () => {
  for (let seed = 1; seed < 200; seed++) {
    for (const level of CLINIC_LEVELS) {
      const patients = makePatients(de, { ...all, spoons: [1, 2], parts: ["der-kopf", "der-arm"], colors: ["rot", "blau"], feelings: ["nervoes"], level, seed });
      assert.equal(patients.length, level.patients);
      for (const p of patients) {
        assert.ok(["der-kopf", "der-arm"].includes(p.part.slug));
        assert.ok(p.recipe.herbs.every((h) => ["red", "blue"].includes(h.color) && h.spoons <= 2));
        assert.ok(p.recipe.herbs.length <= level.herbs);
        if (p.feeling) assert.equal(p.feeling.concept, "nervoes");
      }
    }
  }
});

test("early shifts are simple; later ones bring feelings, advice and sugar", () => {
  const first = makePatients(de, { ...all, level: CLINIC_LEVELS[0], seed: 3 });
  assert.ok(first.every((p) => p.recipe.herbs.length === 1 && !p.recipe.sugar && !p.feeling && !p.advice));
  const later = Array.from({ length: 40 }, (_, seed) => makePatients(de, { ...all, level: CLINIC_LEVELS[4], seed })).flat();
  assert.ok(later.every((p) => p.feeling && p.advice));
  assert.ok(later.some((p) => p.recipe.sugar));
  assert.ok(later.some((p) => p.recipe.herbs.some((h) => h.spoons === 3)));
  // Never the same complaint twice in a row.
  const one = makePatients(de, { ...all, level: CLINIC_LEVELS[4], seed: 9 });
  for (let i = 1; i < one.length; i++) assert.notEqual(one[i].part.slug, one[i - 1].part.slug);
});

test("lines read naturally", () => {
  const head = de.parts.find((p) => p.slug === "der-kopf")!;
  const nose = de.parts.find((p) => p.slug === "die-nase")!;
  assert.equal(de.complaint(head, 0).t, "Mein Kopf tut weh.");
  assert.equal(de.complaint(head, 1).t, "Ich habe Kopfschmerzen.");
  assert.equal(de.complaint(nose, 1).t, "Au! Meine Nase tut so weh.");
  assert.equal(de.wrongPart(head, nose).t, "Nein, das ist meine Nase! Mein Kopf tut weh.");
  assert.equal(
    de.recipe({ herbs: [{ color: "red", spoons: 2 }, { color: "green", spoons: 1 }], water: "hot", sugar: true }).t,
    "Zwei Löffel rote Kräuter. Ein Löffel grüne Kräuter. Dann heißes Wasser, mit Zucker.",
  );
});

test("the brew must match the recipe exactly", () => {
  const recipe = { herbs: [{ color: "red" as const, spoons: 2 as const }], water: "hot" as const, sugar: false };
  assert.ok(checkPot(recipe, { herbs: { red: 2 }, water: "hot", sugar: 0 }).ok);
  assert.deepEqual(checkPot(recipe, { herbs: { red: 3 }, water: "hot", sugar: 0 }).problems, ["red"]);
  assert.deepEqual(checkPot(recipe, { herbs: { red: 2, blue: 1 }, water: "cold", sugar: 1 }).problems, ["blue", "water", "sugar"]);
  assert.deepEqual(checkPot(recipe, emptyPot()).problems, ["red", "water"]);
});

test("advice can be said a few natural ways", () => {
  const bed = de.advice.bed!;
  assert.ok(judgeAdvice(bed, "Du musst im Bett bleiben!", "de"));
  assert.ok(judgeAdvice(bed, "Bleib heute im Bett.", "de"));
  assert.ok(!judgeAdvice(bed, "Du musst viel trinken.", "de"));
  assert.ok(judgeAdvice(de.advice.drink!, "du musst viel wasser trinken", "de"));
  assert.ok(judgeAdvice(de.advice.rest!, "Ruh dich aus!", "de"));
});

test("stars", () => {
  assert.equal(clinicStars(4, 4, 0.5), 3);
  assert.equal(clinicStars(4, 4, 0.1), 2);
  assert.equal(clinicStars(2, 4, 0), 1);
  assert.equal(clinicStars(1, 4, 0), 0);
});

test("the advice frame is only credited when it was used", () => {
  assert.ok(saysPattern(de.adviceFrame!.pattern, "Du musst im Bett bleiben!", "de"));
  assert.ok(!saysPattern(de.adviceFrame!.pattern, "Bleib im Bett!", "de"));
  assert.ok(saysPattern(sv.adviceFrame!.pattern, "du maste vila", "sv"));
});

test("Swedish surgery lines", () => {
  const throat = sv.parts.find((p) => p.slug === "halsen")!;
  assert.equal(sv.complaint(throat, 0).t, "Jag har ont i halsen.");
  assert.equal(sv.recipe({ herbs: [{ color: "blue", spoons: 2 }], water: "cold", sugar: false }).t, "Till drycken: två skedar blå örter och kallt vatten.");
  assert.ok(judgeAdvice(sv.advice.rest!, "Du borde vila!", "sv"));
  assert.ok(judgeAdvice(sv.advice.drink!, "du maste dricka mycket vatten", "sv"));
});
