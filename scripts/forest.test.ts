import assert from "node:assert/strict";
import { test } from "node:test";

import { forest as de } from "../src/content/de/forest";
import { FOREST_LEVELS, forestStars, judgeWeather, makeMap, matching, mismatch, usableClues, type Terrain, type Tile, type Weather } from "../src/lib/game/forest";

const allWeathers: Weather[] = ["sun", "clouds", "rain", "snow", "fog", "wind", "storm"];
const allPlaces: Terrain[] = ["lake", "meadow", "forest", "mountain", "river"];
const allAnimals = de.animals.map((a) => a.slug);

test("every caller can be found from what they say, and only there", () => {
  const known = [
    { places: allPlaces, weathers: allWeathers, animals: allAnimals },
    { places: ["lake", "meadow", "forest"] as Terrain[], weathers: ["rain", "snow"] as Weather[], animals: ["das-reh", "der-fuchs", "die-ente"] },
    { places: ["forest", "mountain", "river"] as Terrain[], weathers: ["sun"] as Weather[], animals: ["das-schaf"] },
  ];
  for (let seed = 1; seed < 150; seed++) {
    for (const [i, level] of FOREST_LEVELS.entries()) {
      for (const k of known) {
        const { tiles, tasks } = makeMap(de, { level, ...k, seed });
        assert.ok(tiles.length >= Math.min(level.tiles, k.places.length), `level ${i}: ${tiles.length} tiles`);
        assert.ok(tiles.every((t) => k.places.includes(t.terrain) && k.weathers.includes(t.weather)));
        assert.ok(tiles.every((t) => !t.animal || k.animals.includes(t.animal.slug)));
        assert.notEqual(tasks[0].kind, "weather", "the first task is always a call");
        const calls = tasks.filter((t) => t.kind === "call");
        assert.ok(calls.length >= Math.min(level.calls, tiles.length));
        assert.equal(new Set(calls.map((c) => c.tile)).size, calls.length, "nobody calls from the same place twice");
        for (const call of calls) {
          const tile = tiles.find((t) => t.id === call.tile)!;
          assert.deepEqual(matching(tiles, tile, call.clues), [tile], `${call.line.t} fits more than one place`);
          assert.ok(call.line.t.includes(de.places.find((p) => p.id === tile.terrain)!.at.t));
        }
        // Weather questions only when there's more than one weather to tell apart.
        assert.ok(tasks.filter((t) => t.kind === "weather").length <= (k.weathers.length >= 2 ? level.weather : 0));
      }
    }
  }
});

test("places that turn up twice are told apart by the weather on some maps, the animal on others", () => {
  const level = FOREST_LEVELS[2];
  let sameWeather = 0;
  let sameAnimal = 0;
  for (let seed = 1; seed < 100; seed++) {
    const options = { places: ["lake", "forest", "meadow"] as Terrain[], weathers: allWeathers, animals: allAnimals, seed };
    const { tiles } = makeMap(de, { level, ...options });
    assert.deepEqual(usableClues(level, options), ["place", "weather", "animal"]);
    const pairs = tiles.flatMap((t) => tiles.filter((u) => u.id > t.id && u.terrain === t.terrain).map((u) => [t, u]));
    assert.ok(pairs.length >= 1, "this map has places that turn up twice");
    sameWeather += pairs.filter(([t, u]) => t.weather === u.weather).length;
    sameAnimal += pairs.filter(([t, u]) => t.animal?.slug === u.animal?.slug).length;
  }
  assert.ok(sameWeather > 20 && sameAnimal > 10, `${sameWeather} pairs share the weather, ${sameAnimal} the animal`);
});

test("pointing at the wrong place names the first thing that doesn't fit", () => {
  const fuchs = de.animals.find((a) => a.slug === "der-fuchs")!;
  const reh = de.animals.find((a) => a.slug === "das-reh")!;
  const want: Tile = { id: 0, terrain: "forest", weather: "snow", animal: fuchs };
  assert.equal(mismatch(want, { id: 1, terrain: "lake", weather: "snow", animal: fuchs }, ["place", "weather", "animal"]), "place");
  assert.equal(mismatch(want, { id: 1, terrain: "forest", weather: "rain", animal: fuchs }, ["place", "weather", "animal"]), "weather");
  assert.equal(mismatch(want, { id: 1, terrain: "forest", weather: "snow", animal: reh }, ["place", "weather", "animal"]), "animal");
  assert.equal(mismatch(want, { id: 1, terrain: "forest", weather: "rain", animal: reh }, ["place"]), null, "they only said where");
});

test("weather told to the forester must match the map", () => {
  assert.ok(judgeWeather(de, "rain", "Es regnet.", "de").ok);
  assert.ok(judgeWeather(de, "fog", "es ist neblig", "de").ok);
  assert.ok(judgeWeather(de, "clouds", "Es ist bewoelkt", "de").ok);
  assert.ok(judgeWeather(de, "storm", "Es regnet!", "de").ok, "rain is true in a storm");
  assert.ok(!judgeWeather(de, "snow", "Es regnet.", "de").ok);
  assert.equal(judgeWeather(de, "snow", "keine Ahnung", "de").said, null);
  for (const w of allWeathers) assert.ok(judgeWeather(de, w, de.weathers.find((x) => x.id === w)!.say.t, "de").ok, w);
});

test("German lines", () => {
  const fuchs = de.animals.find((a) => a.slug === "der-fuchs")!;
  const ente = de.animals.find((a) => a.slug === "die-ente")!;
  const reh = de.animals.find((a) => a.slug === "das-reh")!;
  const wald = de.places.find((p) => p.id === "forest")!;
  const emma = de.callers.find((c) => c.name === "Emma")!;
  const finn = de.callers.find((c) => c.name === "Finn")!;
  const tile: Tile = { id: 0, terrain: "forest", weather: "snow", animal: fuchs };
  assert.deepEqual(de.call(emma, tile, wald, ["place", "weather", "animal"]).parts, ["Hilfe, hier ist Emma!", "Ich bin im Wald.", "Hier schneit es.", "Ich sehe einen Fuchs."]);
  assert.equal(de.call(finn, tile, wald, ["place"]).t, "Hilfe, hier ist Finn! Ich bin im Wald.");
  assert.equal(de.wrong(emma, tile, { ...tile, terrain: "lake" }, "place").t, "Nein, das ist der See. Sie ist im Wald!");
  assert.equal(de.wrong(finn, tile, { ...tile, weather: "sun" }, "weather").t, "Nein, da ist es sonnig. Bei ihm schneit es!");
  assert.equal(de.wrong(emma, { ...tile, animal: ente }, { ...tile, animal: reh }, "animal").t, "Nein, da ist ein Reh. Sie sieht eine Ente!");
  assert.equal(de.askWeather(wald).t, "Ich fahre in den Wald. Wie ist das Wetter im Wald?");
  assert.equal(forestStars(5, 5, 0.3), 3);
  assert.equal(forestStars(2, 5, 0.3), 0);
});
