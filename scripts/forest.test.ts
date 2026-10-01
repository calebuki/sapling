import assert from "node:assert/strict";
import { test } from "node:test";

import { forest as de } from "../src/content/de/forest";
import { FOREST_LEVELS, forestStars, judgeHobby, judgeWeather, makeSurvey, type Weather } from "../src/lib/game/forest";

const allWeathers: Weather[] = ["sun", "clouds", "rain", "snow", "fog", "wind", "storm"];

test("a survey only uses animals, places and weather the learner has met", () => {
  for (let seed = 1; seed < 200; seed++) {
    for (const level of FOREST_LEVELS) {
      const survey = makeSurvey(de, { level, animals: ["das-reh", "der-fuchs", "die-ente", "die-kuh"], places: ["lake", "meadow", "forest"], weathers: ["rain", "snow"], numbers: [2, 3, 4], hobbies: true, seed });
      assert.ok(survey.tasks.length <= level.tasks && survey.tasks.length >= level.tasks - 2);
      assert.notEqual(survey.tasks[0].kind, "weather");
      for (const task of survey.tasks) {
        if (task.kind === "photo" || task.kind === "count") assert.ok(["das-reh", "der-fuchs", "die-ente", "die-kuh"].includes(task.target.animal.slug));
        if (task.kind === "count") assert.ok(level.counting && [2, 3, 4].includes(task.target.count));
        if (task.kind === "weather") assert.ok(["rain", "snow"].includes(task.weather));
        if (task.kind === "hobby") assert.ok(level.hikers > 0);
        // A photo of an animal that's out there twice must say where.
        if (task.kind === "photo" && survey.sightings.filter((s) => s.animal === task.target.animal).length > 1) {
          assert.ok(de.places.some((p) => task.line.t.includes(p.at.t)), task.line.t);
        }
      }
      assert.equal(survey.tasks.filter((t) => t.kind === "weather").length, Math.min(level.weather, 2));
    }
  }
});

test("weather in the logbook must match the sky", () => {
  assert.ok(judgeWeather(de, "rain", "Es regnet.", "de").ok);
  assert.ok(judgeWeather(de, "fog", "es ist neblig", "de").ok);
  assert.ok(judgeWeather(de, "clouds", "Es ist bewoelkt", "de").ok);
  assert.ok(judgeWeather(de, "storm", "Es regnet!", "de").ok, "rain is true in a storm");
  assert.ok(!judgeWeather(de, "snow", "Es regnet.", "de").ok);
  assert.equal(judgeWeather(de, "snow", "keine Ahnung", "de").said, null);
  for (const w of allWeathers) assert.ok(judgeWeather(de, w, de.weathers.find((x) => x.id === w)!.say.t, "de").ok, w);
});

test("hobbies are heard in what the learner says they like", () => {
  const { hobbies, framed } = judgeHobby(de, "Ich fotografiere gern Tiere.", "de");
  assert.deepEqual(hobbies.map((h) => h.concept), ["fotografieren"]);
  assert.ok(framed);
  assert.deepEqual(judgeHobby(de, "Am liebsten fahre ich Rad.", "de").hobbies.map((h) => h.concept), ["rad-fahren"]);
  assert.ok(!judgeHobby(de, "Fußball", "de").framed);
});

test("German lines and numbers", () => {
  const reh = de.animals.find((a) => a.slug === "das-reh")!;
  const ente = de.animals.find((a) => a.slug === "die-ente")!;
  const wald = de.places.find((p) => p.id === "forest")!;
  const see = de.places.find((p) => p.id === "lake")!;
  assert.equal(de.photo(reh, wald, 0).t, "Fotografier das Reh im Wald!");
  assert.deepEqual(de.photo(ente, null, 1).parts, ["Schau, die Enten!", "Mach schnell ein Foto!"]);
  assert.equal(de.count(ente, see).t, "Wie viele Enten sind am See?");
  assert.deepEqual(de.miscounted(ente, 3).parts, ["Hmm, nein.", "Es sind drei Enten."]);
  assert.equal(de.wrongAnimal(ente).t, "Nein, das ist eine Ente!");
  assert.equal(de.parseNumber("Es sind fuenf.", "de"), 5);
  assert.equal(de.parseNumber("3", "de"), "digits");
  assert.equal(forestStars(5, 5, 0.3), 3);
});
