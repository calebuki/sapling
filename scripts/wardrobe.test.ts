import assert from "node:assert/strict";
import { test } from "node:test";
import { praiseFor, wardrobeWords } from "../src/content/wardrobe";
import {
  defaultOutfit,
  emptyRecord,
  giftsFor,
  isUnlocked,
  itemById,
  items,
  legacyOutfit,
  mergeRecords,
  nextLevelItem,
  noticeable,
  readRecord,
  wardrobeLevel,
  wearable,
  type WardrobeRecord,
} from "../src/lib/game/wardrobe";
import { supportedLanguageCodes } from "../src/lib/learning/languages";

const record = (patch: Partial<WardrobeRecord>): WardrobeRecord => ({ ...emptyRecord, ...patch });

test("level-ups on every island add up to one wardrobe level", () => {
  assert.equal(wardrobeLevel(emptyRecord), 1);
  assert.equal(wardrobeLevel(record({ levels: { sv: 4 } })), 4);
  // Level 4 in Swedish (3 level-ups) and level 3 in German (2 more).
  assert.equal(wardrobeLevel(record({ levels: { sv: 4, de: 3 } })), 6);
});

test("level items open at their level and gifts only once given", () => {
  const cap = itemById("cap");
  const knit = itemById("knit");
  const bollenhut = itemById("bollenhut");
  assert.equal(isUnlocked(cap, emptyRecord), false);
  assert.equal(isUnlocked(cap, record({ levels: { vi: 2 } })), true);
  assert.equal(isUnlocked(knit, record({ levels: { sv: 4, de: 2 } })), false);
  assert.equal(isUnlocked(knit, record({ levels: { sv: 4, de: 3 } })), true);
  assert.equal(isUnlocked(bollenhut, record({ levels: { de: 40 } })), false);
  assert.equal(isUnlocked(bollenhut, record({ gifts: ["bollenhut"] })), true);
  assert.equal(nextLevelItem(record({ levels: { sv: 2 } }))?.id, "stripes");
});

test("finishing a gift unit on its own island earns that gift", () => {
  assert.deepEqual(giftsFor("de", ["hallo", "familie"]), ["bollenhut"]);
  assert.deepEqual(giftsFor("sv", ["familie"]), []);
  assert.deepEqual(giftsFor("vi", ["o-cho"]), ["nonla"]);
});

test("merging keeps every earning and takes the newer outfit", () => {
  const phone = record({ outfit: { ...defaultOutfit, topColour: "#27ae60" }, levels: { sv: 5, de: 2 }, gifts: ["crown"], seen: ["cap"] });
  const account = record({ outfit: { ...defaultOutfit, topColour: "#c0392b" }, levels: { sv: 3, vi: 4 }, gifts: ["nonla"] });
  const merged = mergeRecords(account, phone);
  assert.deepEqual(merged.levels, { sv: 5, de: 2, vi: 4 });
  assert.deepEqual(merged.gifts.sort(), ["crown", "nonla"]);
  assert.equal(merged.outfit?.topColour, "#27ae60");
  assert.equal(mergeRecords(phone, record({ outfit: null })).outfit?.topColour, "#27ae60");
});

test("stored JSON is checked before it is trusted", () => {
  const read = readRecord({
    outfit: { skin: "red", hat: "crown", top: "scarf", topColour: "#27ae60", extras: ["glasses", "glasses", "tee", 7] },
    levels: { sv: 3.7, de: -2, xx: 9, vi: "5" },
    gifts: ["bollenhut", "cap", "nope"],
    seen: ["cap", 3],
  });
  assert.equal(read.outfit?.skin, defaultOutfit.skin);
  assert.equal(read.outfit?.hat, "crown");
  assert.equal(read.outfit?.top, "tee");
  assert.equal(read.outfit?.topColour, "#27ae60");
  assert.deepEqual(read.outfit?.extras, ["glasses"]);
  assert.deepEqual(read.levels, { sv: 3 });
  // Only gift items can be gifts; a cap is earned by level.
  assert.deepEqual(read.gifts, ["bollenhut"]);
  assert.deepEqual(read.seen, ["cap"]);
  assert.deepEqual(readRecord("nonsense"), emptyRecord);
  assert.equal(readRecord({ outfit: { hat: null } }).outfit?.hat, null);
});

test("anything not yet earned comes off, without touching the rest", () => {
  const outfit = { ...defaultOutfit, hat: "crown" as const, top: "knit" as const, bottom: "shorts" as const, extras: ["glasses" as const] };
  const worn = wearable(outfit, record({ levels: { sv: 4 } }));
  assert.equal(worn.hat, "beanie");
  assert.equal(worn.top, "tee");
  assert.equal(worn.bottom, "shorts");
  assert.deepEqual(worn.extras, []);
  assert.equal(worn.topColour, outfit.topColour);
});

test("the four old looks carry over", () => {
  assert.equal(legacyOutfit(0).topColour, "#3f7fd1");
  assert.equal(legacyOutfit(2).skin, "#8a5a3c");
  assert.equal(legacyOutfit(5).topColour, legacyOutfit(1).topColour);
  assert.equal(legacyOutfit(1).hat, "beanie");
});

test("villagers notice earned pieces once, hats first", () => {
  const outfit = { ...defaultOutfit, hat: "cap" as const, top: "stripes" as const };
  assert.equal(noticeable(outfit, []), "cap");
  assert.equal(noticeable(outfit, ["cap"]), "stripes");
  assert.equal(noticeable(outfit, ["cap", "stripes"]), null);
  assert.equal(noticeable(defaultOutfit, []), null);
});

test("every piece has a name on every island and earned ones get a compliment", () => {
  for (const item of items) {
    for (const code of supportedLanguageCodes) assert.ok(wardrobeWords[item.id].name[code], `${item.id} in ${code}`);
    if (item.unlock.kind === "free") continue;
    for (const code of ["sv", "de", "vi"] as const) assert.ok(praiseFor(item.id, code), `${item.id} praise in ${code}`);
  }
});
