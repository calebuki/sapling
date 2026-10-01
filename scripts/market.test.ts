import assert from "node:assert/strict";
import { test } from "node:test";

import { market as de } from "../src/content/de/market";
import { amountCents, checkBasket, makeCustomers, MARKET_LEVELS, marketStars, tillText } from "../src/lib/game/market";

const all = {
  produce: de.produce.map((p) => p.slug),
  numbers: [1, 2, 3, 4, 5],
  kilos: true,
  price: true,
  payment: true,
  clothes: de.clothes.map((c) => c.slug),
  colours: de.colours.map((c) => c.slug),
  sizes: true,
};

test("customers only want what the learner has met, and totals stay sayable", () => {
  for (let seed = 1; seed < 200; seed++) {
    for (const level of MARKET_LEVELS) {
      const some = makeCustomers(de, { ...all, level, produce: ["der-apfel", "die-kirsche"], numbers: [1, 2, 3], clothes: ["der-rock", "die-jacke"], colours: ["rot", "blau"], seed });
      assert.equal(some.length, level.customers);
      for (const c of some) {
        if (c.kind === "clothes") {
          assert.ok(level.clothes && ["der-rock", "die-jacke"].includes(c.wish.item.slug) && ["rot", "blau"].includes(c.wish.colour.slug));
          const wanted = c.rail.filter((r) => r.item === c.wish.item && r.colour === c.wish.colour);
          assert.equal(wanted.length, level.sizes && c.wish.item.sized ? 2 : 1);
          assert.ok(wanted.some((r) => r.size === c.wish.size));
          assert.ok(c.rail.length >= 3);
          continue;
        }
        assert.ok(c.parts.length >= 1 && c.parts.length <= level.parts);
        assert.ok(c.cents <= 1250);
        for (const { amount } of c.parts) {
          assert.ok(["der-apfel", "die-kirsche"].includes(amount.produce.slug));
          if (amount.produce.by === "piece") assert.ok([1, 2, 3].includes(amount.n));
          else assert.ok(level.kilos);
        }
      }
      assert.equal(some[0].kind, "produce", "the first customer of a shift always buys produce");
    }
  }
});

test("the basket must hold exactly what was asked for", () => {
  const apple = de.produce.find((p) => p.slug === "der-apfel")!;
  const cherries = de.produce.find((p) => p.slug === "die-kirsche")!;
  const asked = [{ produce: apple, n: 3 }, { produce: cherries, n: 2 }];
  assert.deepEqual(checkBasket(asked, { "der-apfel": 3, "die-kirsche": 2 }), []);
  assert.deepEqual(checkBasket(asked, { "der-apfel": 2, "die-kirsche": 2, "die-birne": 1 }), ["der-apfel", "die-birne"]);
  assert.equal(amountCents({ produce: cherries, n: 1 }), 200);
  assert.equal(tillText(450), "4,50 €");
});

test("German orders, wishes and prices", () => {
  const apple = de.produce.find((p) => p.slug === "der-apfel")!;
  const cherries = de.produce.find((p) => p.slug === "die-kirsche")!;
  assert.equal(de.order({ produce: apple, n: 1 }, 0).t, "Ich nehme einen Apfel.");
  assert.equal(de.order({ produce: apple, n: 3 }, 0).t, "Ich nehme drei Äpfel.");
  assert.deepEqual(de.order({ produce: cherries, n: 1 }, 1).parts, ["Haben Sie Kirschen?", "Ein halbes Kilo, bitte."]);
  assert.equal(de.order({ produce: cherries, n: 4 }, 0).t, "Ich nehme zwei Kilo Kirschen.");
  const rock = de.clothes.find((c) => c.slug === "der-rock")!;
  const kleid = de.clothes.find((c) => c.slug === "das-kleid")!;
  const jacke = de.clothes.find((c) => c.slug === "die-jacke")!;
  const rot = de.colours.find((c) => c.slug === "rot")!;
  const lila = de.colours.find((c) => c.slug === "lila")!;
  assert.equal(de.ask(rock, rot).t, "Ich suche einen roten Rock.");
  assert.equal(de.ask(kleid, rot).t, "Ich suche ein rotes Kleid.");
  assert.equal(de.ask(jacke, lila).t, "Ich suche eine lila Jacke.");
  assert.equal(de.wrongSize(jacke, "small").t, "Hmm, die ist zu klein.");
  assert.equal(de.price(450).t, "Das kostet vier Euro fünfzig.");
  assert.equal(de.price(150).t, "Das kostet einen Euro fünfzig.");
  assert.equal(de.price(50).t, "Das kostet fünfzig Cent.");
  assert.equal(de.price(3000).t, "Das kostet dreißig Euro.");
});

test("prices are understood however they're said, but not in digits", () => {
  for (const [said, cents] of [
    ["Das kostet vier Euro fünfzig.", 450],
    ["vier fuenfzig", 450],
    ["funfzig cent", 50],
    ["ein Euro fünfzig", 150],
    ["Dreißig Euro", 3000],
    ["dreissig euro", 3000],
    ["zwölf Euro", 1200],
  ] as const) assert.equal(de.parsePrice(said, "de"), cents, said);
  assert.equal(de.parsePrice("4,50 Euro", "de"), "digits");
  assert.equal(de.parsePrice("keine Ahnung", "de"), null);
  assert.equal(marketStars(4, 4, 0.5), 3);
});
