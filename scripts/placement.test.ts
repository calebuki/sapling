import assert from "node:assert/strict";
import test from "node:test";
import { island } from "../src/content/sv/index.ts";
import { answerPlacement, placedBand, startPlacement } from "../src/lib/game/placement.ts";
import { buildTiles, checkAnswer, splitWords } from "../src/lib/game/lesson.ts";
import { acceptsAnswer, nameIn, reactionTo } from "../src/lib/game/scenes.ts";
import { itemsIn } from "../src/lib/game/cafe.ts";

const { course, placement, scenes, sceneExtras, cafe } = island;
const all = new Set(course.units.flatMap((u) => u.slugs));
const fixed = () => 0.5;

function run(experience: "little" | "some" | "lots", answer: (band: number) => boolean) {
  let state = startPlacement(placement, course.units, experience, all, fixed);
  for (let guard = 0; !state.done && guard < 20; guard++) state = answerPlacement(placement, course.units, state, answer(state.band), all, fixed);
  return state;
}

const last = placement.bands.length - 1;

test("placement climbs while the learner keeps passing", () => {
  const state = run("little", () => true);
  assert.equal(state.done, true);
  assert.deepEqual(state.passed, Array.from({ length: last + 1 - placement.startBand.little }, (_, i) => placement.startBand.little + i));
  assert.equal(placedBand(placement, state), last);
});

test("placement stops at the first band the learner can't do", () => {
  const state = run("little", (band) => band < 1);
  assert.deepEqual(state.passed, [0]);
  assert.deepEqual(state.failed, [1]);
  assert.equal(placedBand(placement, state), 1);
});

test("an overconfident self-report walks back down", () => {
  const start = placement.startBand.lots;
  const state = run("lots", (band) => band === 0);
  assert.deepEqual(state.failed, Array.from({ length: start }, (_, i) => start - i));
  assert.deepEqual(state.passed, [0]);
  assert.equal(placedBand(placement, state), 1);
});

test("two misses end a band early", () => {
  const state = run("little", () => false);
  assert.equal(state.answers.length, 2);
  assert.equal(placedBand(placement, state), 0);
});

test("answer checking forgives keyboard accents, single typos and a missing article, not wrong words", () => {
  assert.equal(checkAnswer("Hej!", "Hej.", "sv"), "exact");
  assert.equal(checkAnswer("mjolk", "Mjölk.", "sv"), "accent");
  assert.equal(checkAnswer("jag skulle vilja ha en kaffee", "Jag skulle vilja ha en kaffe.", "sv"), "typo");
  assert.equal(checkAnswer("tack", "Hej.", "sv"), "wrong");
  assert.equal(checkAnswer("", "Hej.", "sv"), "wrong");
  assert.equal(checkAnswer("bil", "en bil", "sv"), "article");
  assert.equal(checkAnswer("Madchen", "das Mädchen", "de"), "article");
  assert.equal(checkAnswer("das Maedchen", "das Mädchen", "de"), "accent");
  assert.equal(checkAnswer("die strasse", "die Straße", "de"), "accent");
  assert.equal(checkAnswer("der Hund", "die Katze", "de"), "wrong");
  const tiles = buildTiles("Vad heter du?", ["Jag heter Kim.", "Trevligt att träffas."], 4, "sv");
  for (const word of splitWords("Vad heter du?")) assert.ok(tiles.some((t) => t.word === word));
  assert.ok(tiles.length >= 5);
});

test("Vietnamese forgives missing marks but never a wrong tone", () => {
  assert.equal(checkAnswer("Cảm ơn!", "Cảm ơn!", "vi"), "exact");
  // No marks at all, or only the vowel shapes, pass with the spelling shown.
  assert.equal(checkAnswer("cam on", "Cảm ơn!", "vi"), "accent");
  assert.equal(checkAnswer("cam ơn", "Cảm ơn!", "vi"), "accent");
  assert.equal(checkAnswer("xin chao", "Xin chào!", "vi"), "accent");
  // Right tones on bare vowels still count.
  assert.equal(checkAnswer("cảm on", "Cảm ơn!", "vi"), "accent");
  // A wrong or missing tone once tones are typed is a different word.
  assert.equal(checkAnswer("cám ơn", "Cảm ơn!", "vi"), "wrong");
  assert.equal(checkAnswer("mà", "má", "vi"), "wrong");
  assert.equal(checkAnswer("toi khoe cam ơn ban", "Tôi khỏe, cảm ơn bạn.", "vi"), "accent");
  assert.equal(checkAnswer("tôi khỏe cảm ơn ban", "Tôi khỏe, cảm ơn bạn.", "vi"), "wrong");
  // The older tone placement (khoẻ for khỏe) is the same word, so it passes.
  assert.equal(checkAnswer("tôi khoẻ cảm ơn", "Tôi khỏe, cảm ơn.", "vi"), "accent");
  // Classifiers can be left off like articles.
  assert.equal(checkAnswer("xoai", "quả xoài", "vi"), "article");
  // Accepted-answer patterns work with or without tones, but not wrong ones.
  const intro = ["^(tôi tên là|tên tôi là) \\p{L}+"];
  assert.ok(acceptsAnswer(intro, "Tôi tên là Kim.", "vi"));
  assert.ok(acceptsAnswer(intro, "toi ten la Kim", "vi"));
  assert.ok(!acceptsAnswer(intro, "tối tên là Kim", "vi"));
});

test("Lilla Ö's scenes react to what the learner actually said", () => {
  for (const item of course.listenSpeakItems.filter((i) => i.conceptSlug === "jag-heter")) assert.ok(nameIn(item.text, sceneExtras), item.text);
  const maja = scenes.elin["jag-heter"][0];
  assert.equal(reactionTo(maja, "Hej, jag heter Maria.", "Kim", sceneExtras, "sv").t, "Vilket fint namn, Maria!");
  assert.ok(acceptsAnswer(scenes.elin.hej[0].accept, "Hejsan!", "sv"));
  assert.ok(!acceptsAnswer(scenes.elin.ja[0].accept, "Nej", "sv"));
  assert.equal(reactionTo(scenes.elin.tack[2], "Nej tack", "Kim", sceneExtras, "sv").t, "Okej, då äter jag den!");
  // The island's first hand-built chapters play out every phrase.
  for (const unit of course.units.filter((u) => ["hej", "resan", "planer"].includes(u.id))) {
    for (const slug of unit.slugs) assert.ok((scenes[unit.villager][slug]?.length ?? 0) >= 3, `${unit.villager} plays out ${slug}`);
  }
});

test("Café Kanel understands orders", () => {
  assert.ok(cafe);
  assert.deepEqual(itemsIn(cafe, "Jag skulle vilja ha en kaffe med mjölk, tack.", "sv").map((i) => i.slug), ["kaffe", "mjoelk"]);
  assert.deepEqual(itemsIn(cafe, "Och en kanelbulle, tack.", "sv").map((i) => i.slug), ["kanelbulle"]);
  assert.equal(cafe.withArticle(cafe.menu.find((i) => i.slug === "te")!), "ett te");
  assert.ok(acceptsAnswer(cafe.orderVariants["cafe-order-drink"][1].accept, "Kan jag få ett te?", "sv"));
});
