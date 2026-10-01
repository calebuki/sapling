import assert from "node:assert/strict";
import { test } from "node:test";

import { cafe as de } from "../src/content/de/cafe";
import { cafe as sv } from "../src/content/sv/cafe";
import { allOrders, checkTray, makeOrder, partsIn, RUSH_LEVELS, starsFor } from "../src/lib/game/rush";

const rushDe = de.rush!;
const rushSv = sv.rush!;

test("orders only ask for menu items the learner has met", () => {
  const items = ["kaffee", "tee", "brezel"];
  for (let seed = 1; seed < 300; seed++) {
    for (const level of RUSH_LEVELS) {
      const order = makeOrder(de, rushDe, { level, items, quantities: true, modifiers: true, seed });
      assert.ok(order.parts.length >= 1 && order.parts.length <= level.maxParts, `${seed}: ${order.line.t}`);
      for (const part of order.parts) assert.ok(items.includes(part.item), `${seed}: ${part.item}`);
      assert.ok(order.tray.every((slug) => items.includes(slug) || slug === "milch"));
    }
  }
});

test("early shifts keep orders simple; later ones bring quantities, milk and changes of mind", () => {
  const items = ["kaffee", "tee", "brezel", "kuchen", "milch"];
  const first = Array.from({ length: 200 }, (_, seed) => makeOrder(de, rushDe, { level: RUSH_LEVELS[0], items, quantities: true, modifiers: true, seed }));
  assert.ok(first.every((o) => o.parts.length === 1 && o.parts[0].count === 1 && !o.parts[0].with && !o.changed));
  const last = Array.from({ length: 400 }, (_, seed) => makeOrder(de, rushDe, { level: RUSH_LEVELS[4], items, quantities: true, modifiers: true, seed }));
  assert.ok(last.some((o) => o.parts.some((p) => p.count === 2)), "some doubles");
  assert.ok(last.some((o) => o.parts.some((p) => p.with === "milch")), "some with milk");
  assert.ok(last.some((o) => o.changed), "some changes of mind");
  // With "mit Milch" in play, milk only ever comes with a drink.
  assert.ok(last.every((o) => o.parts.every((p) => p.item !== "milch")));
});

test("quantities and milk wait until the learner has met them", () => {
  const items = ["kaffee", "tee", "milch"];
  for (let seed = 0; seed < 200; seed++) {
    const order = makeOrder(de, rushDe, { level: RUSH_LEVELS[4], items, quantities: false, modifiers: false, seed });
    assert.ok(order.parts.every((p) => p.count === 1 && !p.with), order.line.t);
  }
});

test("a change of mind only counts what they want in the end", () => {
  const items = ["kaffee", "tee", "brezel"];
  const changed = Array.from({ length: 400 }, (_, seed) => makeOrder(de, rushDe, { level: RUSH_LEVELS[4], items, quantities: false, modifiers: false, seed })).find((o) => o.changed)!;
  assert.match(changed.line.t, /ach nein, doch lieber/);
  assert.deepEqual(changed.tray, [changed.parts[0].item]);
  assert.ok(changed.line.t.endsWith(`${rushDe.phrase(changed.parts[0]).t}!`));
});

test("orders read naturally", () => {
  const order = makeOrder(de, rushDe, { level: RUSH_LEVELS[0], items: ["brezel"], quantities: false, modifiers: false, seed: 3 });
  assert.match(order.line.t, /^(Ich hätte gern eine Brezel\.|Eine Brezel, bitte\.|Ich möchte eine Brezel, bitte\.)$/);
  assert.equal(rushDe.phrase({ item: "kaffee", count: 1, with: "milch" }).t, "einen Kaffee mit Milch");
  assert.equal(rushDe.phrase({ item: "brezel", count: 2 }).t, "zwei Brezeln");
  assert.equal(rushSv.phrase({ item: "kanelbulle", count: 2 }).t, "två kanelbullar");
});

test("trays must hold exactly what was ordered", () => {
  const order = { parts: [], line: { t: "", en: "" }, tray: ["kaffee", "milch", "brezel", "brezel"], changed: false };
  assert.ok(checkTray(order, ["brezel", "kaffee", "brezel", "milch"]).ok);
  assert.deepEqual(checkTray(order, ["kaffee", "milch", "brezel"]), { ok: false, missing: ["brezel"], extra: [] });
  assert.deepEqual(checkTray(order, ["kaffee", "milch", "brezel", "brezel", "tee"]), { ok: false, missing: [], extra: ["tee"] });
});

test("the kitchen hears what you ask for, and whether you said it right", () => {
  assert.deepEqual(partsIn(de, rushDe, "Zwei Brezeln und ein Stück Kuchen, bitte!", "de"), [
    { item: "brezel", count: 2, formOk: true },
    { item: "kuchen", count: 1, formOk: true },
  ]);
  assert.deepEqual(partsIn(de, rushDe, "Kuchen bitte", "de"), [{ item: "kuchen", count: 1, formOk: false }]);
  assert.deepEqual(partsIn(de, rushDe, "ein Brezel", "de"), [{ item: "brezel", count: 1, formOk: false }]);
  assert.deepEqual(partsIn(de, rushDe, "Hallo Franz", "de"), []);
  assert.deepEqual(partsIn(sv, rushSv, "Två kanelbullar, tack", "sv"), [{ item: "kanelbulle", count: 2, formOk: true }]);
});

test("stars follow how many guests left happy", () => {
  assert.equal(starsFor(6, 6), 3);
  assert.equal(starsFor(5, 6), 2);
  assert.equal(starsFor(3, 6), 1);
  assert.equal(starsFor(2, 6), 0);
});

test("every possible order has one wording per opener", () => {
  for (const config of [de, sv]) {
    const lines = allOrders(config, config.rush!).map((l) => l.t);
    assert.equal(new Set(lines).size, lines.length);
    assert.ok(lines.length > 50);
  }
});
