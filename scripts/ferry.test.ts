import assert from "node:assert/strict";
import { test } from "node:test";

import { ferry as de } from "../src/content/de/ferry";
import { checkEntry, emptyEntry, FERRY_LEVELS, ferryStars, judgeAskName, judgeFarewell, judgeGreeting, makeRun } from "../src/lib/game/ferry";

test("a run fills each level with different people, fields the learner knows and a time of day", () => {
  for (let seed = 1; seed < 150; seed++) {
    for (const [i, level] of FERRY_LEVELS.entries()) {
      const run = makeRun(de, { level, fields: ["from", "lives"], askName: i > 0, seed });
      assert.equal(run.passengers.length, level.passengers);
      assert.equal(new Set(run.passengers.map((p) => p.person.id)).size, level.passengers);
      assert.ok(level.times.includes(run.time));
      for (const p of run.passengers) {
        assert.ok(!p.fields.includes("speaks"), "speaks only once its frame is met");
        assert.ok(p.fields.every((f) => level.fields.includes(f)));
        assert.equal(p.intro.parts?.length, p.fields.length);
        assert.equal(p.intro.t, p.intro.parts?.join(" "));
        assert.ok(p.options.name.includes(p.person.name) && p.options.name.length === 3);
        assert.ok(p.options.from.includes(p.from) && p.options.lives.includes(p.lives));
        assert.ok(p.speaks.every((l) => p.options.speaks.includes(l)));
      }
      if (level.passengers >= 4) assert.ok(new Set(run.passengers.map((p) => p.person.register)).size === 2, "children and adults both come");
    }
  }
});

test("greetings must suit the time of day; hallo and Grüß Gott always do", () => {
  assert.ok(judgeGreeting(de, "Guten Morgen!", "morning", "de").ok);
  assert.ok(judgeGreeting(de, "guten abend", "evening", "de").ok);
  assert.deepEqual(
    (({ said, ok }) => [said?.concept, ok])(judgeGreeting(de, "Guten Abend", "morning", "de")),
    ["guten-abend", false],
  );
  assert.ok(judgeGreeting(de, "Hallo Mia!", "evening", "de").ok);
  assert.ok(judgeGreeting(de, "gruss gott", "day", "de").ok);
  assert.equal(judgeGreeting(de, "Tschüss", "day", "de").said, null);
});

test("asking a name tells du from Sie", () => {
  assert.equal(judgeAskName(de, "Wie heißt du?", "de"), "du");
  assert.equal(judgeAskName(de, "wie heissen sie", "de"), "Sie");
  assert.equal(judgeAskName(de, "Wie ist Ihr Name?", "de"), "Sie");
  assert.equal(judgeAskName(de, "Hallo", "de"), null);
});

test("goodbyes, with good night only in the evening", () => {
  assert.ok(judgeFarewell(de, "Tschüss!", "morning", "de").ok);
  assert.ok(judgeFarewell(de, "Auf Wiedersehen", "day", "de").ok);
  assert.ok(judgeFarewell(de, "Gute Nacht!", "evening", "de").ok);
  assert.ok(!judgeFarewell(de, "Gute Nacht!", "morning", "de").ok);
  assert.equal(judgeFarewell(de, "Guten Abend", "evening", "de").said, null);
});

test("the list has to say what the passenger said", () => {
  const run = makeRun(de, { level: FERRY_LEVELS[4], fields: ["from", "lives", "speaks"], askName: true, seed: 7 });
  const p = run.passengers[0];
  assert.deepEqual(checkEntry(p, emptyEntry()), ["name", "from", "lives", "speaks"]);
  const right = { name: p.person.name, from: p.from.id, lives: p.lives.id, speaks: p.speaks.map((l) => l.id).reverse() };
  assert.deepEqual(checkEntry(p, right), []);
  assert.deepEqual(checkEntry(p, { ...right, name: p.person.decoys[0] }), ["name"]);
});

test("German sentences", () => {
  const anna = de.people.find((p) => p.id === "anna")!;
  const schweiz = de.countries.find((c) => c.id === "schweiz")!;
  assert.equal(de.from(schweiz).t, "Ich komme aus der Schweiz.");
  assert.equal(de.spell(anna).t, "Weber: W, E, B, E, R.");
  const [en, de_] = [de.languages[1], de.languages[0]];
  assert.equal(de.speaks([en], de_).t, "Ich spreche Englisch und ein bisschen Deutsch.");
  const evening = de.greetings.find((g) => g.concept === "guten-abend")!;
  const morning = de.greetings.find((g) => g.concept === "guten-morgen")!;
  assert.deepEqual(de.wrongTime(evening, "morning", morning).parts, ["Guten Abend?", "Es ist doch noch Morgen!", "Guten Morgen!"]);
  assert.equal(ferryStars(4, 4, 0.5), 3);
  assert.equal(ferryStars(2, 4, 0), 1);
});
