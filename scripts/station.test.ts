import assert from "node:assert/strict";
import { test } from "node:test";

import { station as de } from "../src/content/de/station";
import { forward, makeTravellers, planRoute, sameNode, sideOf, START, STATION_LEVELS, stationStars, turn, turnsOf, type Heading, type Node } from "../src/lib/game/station";

// Walk a route's instructions the way a player would, and see where you end up.
function follow(steps: ReturnType<typeof makeTravellers>[number] & { kind: "way" }) {
  let at: Node = START;
  let h: Heading = 0;
  const path = [at];
  for (const node of steps.route.nodes.slice(1)) {
    // At each crossing on the way, turn if the next node isn't straight ahead.
    if (!sameNode(forward(at, h), node)) h = sameNode(forward(at, turn(h, "left")), node) ? turn(h, "left") : turn(h, "right");
    at = forward(at, h);
    path.push(at);
  }
  return { at, h, path };
}

test("routes are shortest, with as few turns as possible", () => {
  const museum = de.landmarks.find((l) => l.slug === "das-museum")!;
  const route = planRoute(museum.node)!;
  assert.equal(route.nodes.length, 5);
  assert.equal(turnsOf(route), 1);
  assert.deepEqual(planRoute({ c: 1, r: 3 })!.nodes.length, 4);
  assert.equal(turnsOf(planRoute({ c: 1, r: 3 })!), 0);
});

test("which side a corner is on", () => {
  assert.equal(sideOf("ne", 0), "right");
  assert.equal(sideOf("nw", 0), "left");
  assert.equal(sideOf("ne", 1), "left");
  assert.equal(sideOf("se", 1), "right");
  assert.equal(sideOf("sw", 2), "right");
});

test("travellers want tickets the learner can sell and ways they can follow", () => {
  const all = { destinations: de.destinations.map((d) => d.slug), landmarks: de.landmarks.map((l) => l.slug), ways: true };
  for (let seed = 1; seed < 200; seed++) {
    for (const level of STATION_LEVELS) {
      const travellers = makeTravellers(de, { ...all, level, seed });
      assert.equal(travellers.length, level.travellers);
      assert.equal(travellers[0].kind, "ticket");
      const ways = travellers.filter((t) => t.kind === "way");
      assert.ok(ways.length <= level.ways);
      for (const w of ways) {
        if (w.kind !== "way") continue;
        assert.ok(turnsOf(w.route) <= level.maxTurns);
        // Following the directions gets you to the landmark's crossing.
        assert.ok(sameNode(follow(w).at, w.landmark.node), w.directions.t);
        assert.equal(w.directions.parts?.length, w.steps.length);
        if (!level.ordinals) assert.ok(!w.directions.t.includes("Straße"), w.directions.t);
      }
    }
  }
});

test("German tickets, platforms and directions", () => {
  const titisee = de.destinations.find((d) => d.slug === "titisee")!;
  assert.equal(de.askTicket(titisee).t, "Eine Fahrkarte nach Titisee, bitte.");
  assert.deepEqual(de.wrongTicket(titisee, "return").parts, ["Nein, das stimmt nicht.", "Eine Fahrkarte nach Titisee, bitte.", "Hin und zurück, bitte."]);
  assert.equal(de.parsePlatform("Gleis drei", "de"), 3);
  assert.equal(de.parsePlatform("Von Gleis 3", "de"), "digits");
  const kirche = de.landmarks.find((l) => l.slug === "die-kirche")!;
  const hotel = de.landmarks.find((l) => l.slug === "das-hotel")!;
  assert.equal(de.askWay(kirche).t, "Entschuldigung, wie komme ich zur Kirche?");
  assert.equal(de.instruction({ kind: "turn", way: "left", at: kirche.node, ref: { type: "landmark", landmark: kirche } }).t, "An der Kirche links.");
  assert.equal(de.instruction({ kind: "turn", way: "right", at: hotel.node, ref: { type: "landmark", landmark: hotel } }).t, "Am Hotel rechts.");
  assert.equal(de.instruction({ kind: "turn", way: "right", at: START, ref: { type: "ordinal", n: 2 } }).t, "Dann die zweite Straße rechts.");
  assert.equal(de.instruction({ kind: "arrive", landmark: hotel, side: "left" }).t, "Das Hotel ist links.");
  assert.equal(stationStars(4, 4, 0.5), 3);
});
