import { supportedLanguageCodes, type TargetLanguageCode } from "@/lib/learning/languages";
import type { CharacterLook } from "./villagers";

// The player's wardrobe: what they wear, and what they have earned. Colours
// are always free; the shapes are earned, by levelling up on any island or as
// a gift from a villager once their unit is done. Earned things are recorded
// as a ratchet (best level per island, gifts received), so an item never
// locks again when a word's strength dips.

export const skinTones = ["#f6d7c0", "#f1c7a5", "#e8b48f", "#d9a47c", "#c68a62", "#a86d4a", "#8a5a3c", "#5e3b26"] as const;
export const hairColours = ["#1c1410", "#3a2a1e", "#5b3a24", "#8a5a2b", "#c0562b", "#e9c46a", "#e6e6e6", "#e76f8a"] as const;
export const clothColours = [
  "#3f7fd1",
  "#2f8f8f",
  "#27ae60",
  "#f7c948",
  "#e67e22",
  "#c0392b",
  "#e76f8a",
  "#9b59b6",
  "#8a6a44",
  "#f4efe6",
  "#3d3d3d",
  "#2c3e50",
] as const;

export const hairStyles = ["short", "buzz", "spiky", "curly", "bob", "long", "ponytail", "bun", "spacebuns", "braid"] as const;
export const eyeStyles = ["round", "lashes", "sleepy"] as const;
export const cheekStyles = ["blush", "freckles", "none"] as const;

export type HairStyle = (typeof hairStyles)[number];
export type Eyes = (typeof eyeStyles)[number];
export type Cheeks = (typeof cheekStyles)[number];

export type Slot = "hat" | "top" | "bottom" | "extra";
export type HatId = "beanie" | "cap" | "sunhat" | "crown" | "bollenhut" | "nonla";
export type TopId = "tee" | "longsleeve" | "tank" | "print" | "stripes" | "hoodie" | "knit" | "shirt" | "raincoat";
export type BottomId = "trousers" | "shorts" | "overalls";
export type ExtraId = "glasses" | "scarf";
export type ItemId = HatId | TopId | BottomId | ExtraId;

export type Unlock =
  | { kind: "free" }
  // The wardrobe level: 1 plus every level-up on every island.
  | { kind: "level"; level: number }
  | { kind: "gift"; island: TargetLanguageCode; villager: string; from: string; unit: string };

export type Item = { id: ItemId; slot: Slot; unlock: Unlock };

const free = { kind: "free" } as const;
const level = (n: number) => ({ kind: "level", level: n }) as const;

export const items: readonly Item[] = [
  { id: "beanie", slot: "hat", unlock: free },
  { id: "cap", slot: "hat", unlock: level(2) },
  { id: "sunhat", slot: "hat", unlock: level(7) },
  { id: "crown", slot: "hat", unlock: { kind: "gift", island: "sv", villager: "maja", from: "Maja", unit: "klaeder" } },
  { id: "bollenhut", slot: "hat", unlock: { kind: "gift", island: "de", villager: "hilde", from: "Hilde", unit: "familie" } },
  { id: "nonla", slot: "hat", unlock: { kind: "gift", island: "vi", villager: "mai", from: "Mai", unit: "o-cho" } },
  { id: "tee", slot: "top", unlock: free },
  { id: "longsleeve", slot: "top", unlock: free },
  { id: "tank", slot: "top", unlock: free },
  { id: "print", slot: "top", unlock: level(2) },
  { id: "stripes", slot: "top", unlock: level(3) },
  { id: "hoodie", slot: "top", unlock: level(4) },
  { id: "knit", slot: "top", unlock: level(6) },
  { id: "shirt", slot: "top", unlock: level(7) },
  { id: "raincoat", slot: "top", unlock: level(10) },
  { id: "trousers", slot: "bottom", unlock: free },
  { id: "shorts", slot: "bottom", unlock: level(4) },
  { id: "overalls", slot: "bottom", unlock: level(8) },
  { id: "glasses", slot: "extra", unlock: level(5) },
  { id: "scarf", slot: "extra", unlock: level(9) },
];

const byId = new Map(items.map((item) => [item.id, item]));
export const itemById = (id: ItemId) => byId.get(id)!;
export const isItemId = (value: unknown): value is ItemId => typeof value === "string" && byId.has(value as ItemId);

export type Outfit = {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  eyes: Eyes;
  cheeks: Cheeks;
  beard: boolean;
  hat: HatId | null;
  hatColour: string;
  top: TopId;
  topColour: string;
  bottom: BottomId;
  bottomColour: string;
  extras: ExtraId[];
  extraColour: string;
};

export const defaultOutfit: Outfit = {
  skin: "#f1c7a5",
  hair: "#5b3a24",
  hairStyle: "short",
  eyes: "round",
  cheeks: "blush",
  beard: false,
  hat: "beanie",
  hatColour: "#c0392b",
  top: "tee",
  topColour: "#3f7fd1",
  bottom: "trousers",
  bottomColour: "#2c3e50",
  extras: [],
  extraColour: "#f7c948",
};

// The four looks from before the wardrobe, so nobody arrives changed.
const legacy: Partial<Outfit>[] = [
  { skin: "#f1c7a5", hair: "#5b3a24", topColour: "#3f7fd1", bottomColour: "#2c3e50", hatColour: "#c0392b" },
  { skin: "#c68a62", hair: "#1c1410", topColour: "#27ae60", bottomColour: "#2c3e50", hatColour: "#f7c948" },
  { skin: "#8a5a3c", hair: "#1c1410", topColour: "#e67e22", bottomColour: "#2c3e50", hatColour: "#9b59b6" },
  { skin: "#f6d7c0", hair: "#c0562b", topColour: "#9b59b6", bottomColour: "#3d3d3d", hatColour: "#2f8f8f" },
];

export function legacyOutfit(index: number): Outfit {
  return { ...defaultOutfit, ...legacy[((index % legacy.length) + legacy.length) % legacy.length] };
}

export type WardrobeRecord = {
  v: 1;
  outfit: Outfit | null;
  // The best level reached on each island.
  levels: Partial<Record<TargetLanguageCode, number>>;
  gifts: ItemId[];
  // Earned items the player has already looked at, so "new" dots go away.
  seen: ItemId[];
};

export const emptyRecord: WardrobeRecord = { v: 1, outfit: null, levels: {}, gifts: [], seen: [] };

export function wardrobeLevel(record: Pick<WardrobeRecord, "levels">) {
  return 1 + Object.values(record.levels).reduce((sum, n) => sum + Math.max(0, (n ?? 1) - 1), 0);
}

export function isUnlocked(item: Item, record: Pick<WardrobeRecord, "levels" | "gifts">) {
  if (item.unlock.kind === "free") return true;
  if (item.unlock.kind === "level") return wardrobeLevel(record) >= item.unlock.level;
  return record.gifts.includes(item.id);
}

export function unlockedIds(record: Pick<WardrobeRecord, "levels" | "gifts">) {
  return items.filter((item) => isUnlocked(item, record)).map((item) => item.id);
}

// Earned and not yet looked at.
export function newIds(record: WardrobeRecord) {
  return unlockedIds(record).filter((id) => itemById(id).unlock.kind !== "free" && !record.seen.includes(id));
}

// The next level item still to earn, for the "next at level n" hint.
export function nextLevelItem(record: WardrobeRecord) {
  const at = wardrobeLevel(record);
  return items
    .filter((item): item is Item & { unlock: { kind: "level"; level: number } } => item.unlock.kind === "level" && item.unlock.level > at)
    .sort((a, b) => a.unlock.level - b.unlock.level)[0] ?? null;
}

// The gifts an island's villagers give once these units are done.
export function giftsFor(code: TargetLanguageCode, doneUnits: readonly string[]): ItemId[] {
  return items.flatMap((item) =>
    item.unlock.kind === "gift" && item.unlock.island === code && doneUnits.includes(item.unlock.unit) ? [item.id] : [],
  );
}

export function giverOf(id: ItemId) {
  const unlock = itemById(id).unlock;
  return unlock.kind === "gift" ? unlock.from : null;
}

// Swaps anything locked for the free piece in its slot.
export function wearable(outfit: Outfit, record: Pick<WardrobeRecord, "levels" | "gifts">): Outfit {
  const ok = (id: ItemId) => isUnlocked(itemById(id), record);
  return {
    ...outfit,
    hat: outfit.hat && ok(outfit.hat) ? outfit.hat : outfit.hat ? "beanie" : null,
    top: ok(outfit.top) ? outfit.top : "tee",
    bottom: ok(outfit.bottom) ? outfit.bottom : "trousers",
    extras: outfit.extras.filter(ok),
  };
}

// Combines two copies of the record, say this device's and the account's.
// Earnings only ever grow; the outfit comes from `newer` when it has one.
export function mergeRecords(older: WardrobeRecord, newer: WardrobeRecord): WardrobeRecord {
  const levels: WardrobeRecord["levels"] = { ...older.levels };
  for (const [code, n] of Object.entries(newer.levels) as [TargetLanguageCode, number][]) levels[code] = Math.max(levels[code] ?? 1, n);
  return {
    v: 1,
    outfit: newer.outfit ?? older.outfit,
    levels,
    gifts: [...new Set([...older.gifts, ...newer.gifts])],
    seen: [...new Set([...older.seen, ...newer.seen])],
  };
}

export function sameRecord(a: WardrobeRecord, b: WardrobeRecord) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ---- Reading untrusted JSON ------------------------------------------------------

const oneOf = <T extends string>(options: readonly T[], value: unknown, fallback: T): T =>
  options.includes(value as T) ? (value as T) : fallback;
const ids = <T extends ItemId>(value: unknown, slot?: Slot) =>
  Array.isArray(value) ? [...new Set(value.filter((v): v is T => isItemId(v) && (!slot || itemById(v).slot === slot)))] : [];

export function readOutfit(raw: unknown): Outfit | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const d = defaultOutfit;
  const slotItem = <T extends ItemId>(value: unknown, slot: Slot, fallback: T): T =>
    isItemId(value) && itemById(value).slot === slot ? (value as T) : fallback;
  return {
    skin: oneOf(skinTones, o.skin, d.skin),
    hair: oneOf(hairColours, o.hair, d.hair),
    hairStyle: oneOf(hairStyles, o.hairStyle, d.hairStyle),
    eyes: oneOf(eyeStyles, o.eyes, d.eyes),
    cheeks: oneOf(cheekStyles, o.cheeks, d.cheeks),
    beard: o.beard === true,
    hat: o.hat === null ? null : slotItem<HatId>(o.hat, "hat", "beanie"),
    hatColour: oneOf(clothColours, o.hatColour, d.hatColour),
    top: slotItem<TopId>(o.top, "top", d.top),
    topColour: oneOf(clothColours, o.topColour, d.topColour),
    bottom: slotItem<BottomId>(o.bottom, "bottom", d.bottom),
    bottomColour: oneOf(clothColours, o.bottomColour, d.bottomColour),
    extras: ids<ExtraId>(o.extras, "extra"),
    extraColour: oneOf(clothColours, o.extraColour, d.extraColour),
  };
}

export function readRecord(raw: unknown): WardrobeRecord {
  if (!raw || typeof raw !== "object") return emptyRecord;
  const r = raw as Record<string, unknown>;
  const levels: WardrobeRecord["levels"] = {};
  if (r.levels && typeof r.levels === "object") {
    for (const code of supportedLanguageCodes) {
      const n = (r.levels as Record<string, unknown>)[code];
      if (typeof n === "number" && Number.isFinite(n) && n >= 1) levels[code] = Math.min(999, Math.floor(n));
    }
  }
  return {
    v: 1,
    outfit: readOutfit(r.outfit),
    levels,
    gifts: ids(r.gifts).filter((id) => itemById(id).unlock.kind === "gift"),
    seen: ids(r.seen),
  };
}

// ---- Dressing the 3D character ---------------------------------------------------

export function shade(hex: string, by: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v * by)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, "0")).join("")}`;
}

export function lookOf(outfit: Outfit): CharacterLook {
  return {
    skin: outfit.skin,
    hair: outfit.hair,
    hairStyle: outfit.hairStyle,
    shirt: outfit.topColour,
    pants: outfit.bottomColour,
    accent: outfit.hatColour,
    collar: shade(outfit.topColour, 0.82),
    hat: outfit.hat ?? undefined,
    beard: outfit.beard,
    face: { eyes: outfit.eyes, cheeks: outfit.cheeks },
    top: outfit.top,
    bottom: outfit.bottom,
    glasses: outfit.extras.includes("glasses"),
    scarf: outfit.extras.includes("scarf") ? outfit.extraColour : undefined,
  };
}

// The earned piece a villager is most likely to notice first.
export function noticeable(outfit: Outfit, already: readonly string[]): ItemId | null {
  const worn: ItemId[] = [...(outfit.hat ? [outfit.hat] : []), outfit.top, outfit.bottom, ...outfit.extras];
  return worn.find((id) => itemById(id).unlock.kind !== "free" && !already.includes(id)) ?? null;
}
