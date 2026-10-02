import assert from "node:assert/strict";
import { test } from "node:test";

import { lessonFor, lessonOpensFor, type JobLesson } from "../src/lib/game/job-lesson";
import { afterRun, mergeShifts, readJobs, readShifts, sameShifts } from "../src/lib/game/jobs";
import { jobGiftOf, jobGiftsFor, items } from "../src/lib/game/wardrobe";

test("a good run opens the next level only from the newest one", () => {
  assert.deepEqual(afterRun(undefined, 0, 2), { progress: { level: 1, stars: [2] }, levelUp: true });
  assert.deepEqual(afterRun({ level: 1, stars: [3] }, 0, 1), { progress: { level: 1, stars: [3] }, levelUp: false });
  assert.deepEqual(afterRun({ level: 1, stars: [3] }, 1, 1), { progress: { level: 1, stars: [3, 1] }, levelUp: false });
  assert.equal(afterRun({ level: 4, stars: [3, 3, 3, 3] }, 4, 3).progress.level, 4);
});

test("two copies merge to the better of each, whichever way round", () => {
  const a = { franz: { level: 2, stars: [3, 2] }, hilde: { level: 0, stars: [1] } };
  const b = { franz: { level: 1, stars: [1, 3, 0] }, jonas: { level: 1, stars: [2] } };
  const merged = { franz: { level: 2, stars: [3, 3, 0] }, hilde: { level: 0, stars: [1] }, jonas: { level: 1, stars: [2] } };
  assert.deepEqual(mergeShifts(a, b), merged);
  assert.ok(sameShifts(mergeShifts(b, a), merged));
});

test("stored progress is read defensively", () => {
  assert.deepEqual(readShifts({ franz: { level: 99, stars: [7, -1, "x"] }, "Bad Host": { level: 1 }, hilde: "nope" }), {
    franz: { level: 4, stars: [3, 0, 0] },
  });
  assert.deepEqual(readJobs({ de: { franz: { level: 1, stars: [2] } }, xx: { franz: { level: 1 } } }), { de: { franz: { level: 1, stars: [2] } } });
  assert.deepEqual(readJobs("nonsense"), {});
});

test("work clothes come with two stars on the third level of a job", () => {
  assert.equal(jobGiftOf("de", "franz"), "apron");
  assert.deepEqual(jobGiftsFor("de", { franz: { stars: [3, 3, 1] } }), []);
  assert.deepEqual(jobGiftsFor("de", { franz: { stars: [3, 3, 2] }, jonas: { stars: [0, 0, 3] } }), ["apron", "bowtie"]);
  // Every German host with a job has one piece, and nobody else gives any.
  const givers = items.flatMap((item) => (item.unlock.kind === "job" ? [item.unlock.villager] : []));
  assert.equal(new Set(givers).size, givers.length);
});

test("a job's lesson opens the first time you help, and when a level brings something new", () => {
  const lesson: JobLesson = {
    cards: [
      { kind: "how", title: { t: "So geht's", en: "How it works" }, steps: ["Click things."] },
      { kind: "how", from: 2, title: { t: "Neu", en: "New" }, steps: ["Now say things."] },
    ],
    checks: [
      { question: "First?", options: ["a", "b"], answer: "a", why: "" },
      { from: 2, question: "Later?", options: ["c", "d"], answer: "c", why: "" },
    ],
  };
  assert.equal(lessonOpensFor(lesson, 0, undefined), "all");
  assert.equal(lessonOpensFor(lesson, 0, [2]), null, "played this level before");
  assert.equal(lessonOpensFor(lesson, 1, [2]), null, "nothing new at level 2");
  assert.equal(lessonOpensFor(lesson, 2, [3, 2]), "new");
  assert.equal(lessonOpensFor(undefined, 0, undefined), null);
  assert.deepEqual(lessonFor(lesson, 2, true).cards.map((c) => c.title.t), ["Neu"]);
  assert.equal(lessonFor(lesson, 2).cards.length, 2);
  assert.equal(lessonFor(lesson, 2).check?.question, "Later?");
  assert.equal(lessonFor(lesson, 1).check?.question, "First?");
});
