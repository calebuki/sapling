export const ITEMS = {
  wood: {
    name: "Wood",
    sv: "trä",
    plural: "trä",
    icon: "🪵",
    unit: "en",
    many: "bitar trä",
  },
  apple: {
    name: "Apple",
    sv: "äpple",
    plural: "äpplen",
    icon: "🍎",
    unit: "ett",
    many: "äpplen",
  },
  stone: {
    name: "Stone",
    sv: "sten",
    plural: "stenar",
    icon: "🪨",
    unit: "en",
    many: "stenar",
  },
  flower: {
    name: "Flower",
    sv: "blomma",
    plural: "blommor",
    icon: "🌼",
    unit: "en",
    many: "blommor",
  },
  chair: {
    name: "Chair",
    sv: "stol",
    plural: "stolar",
    icon: "🪑",
    unit: "en",
    many: "stolar",
  },
  table: {
    name: "Table",
    sv: "bord",
    plural: "bord",
    icon: "🛠️",
    unit: "ett",
    many: "bord",
  },
  planter: {
    name: "Flowerpot",
    sv: "blomkruka",
    plural: "blomkrukor",
    icon: "🪴",
    unit: "en",
    many: "blomkrukor",
  },
} as const;
export type Item = keyof typeof ITEMS;
export type Inventory = Record<Item, number>;
export const emptyBag = (): Inventory => ({
  wood: 0,
  apple: 0,
  stone: 0,
  flower: 0,
  chair: 0,
  table: 0,
  planter: 0,
});
export const RECIPES: Record<
  string,
  { cost: Partial<Inventory>; unlock: number }
> = {
  chair: { cost: { wood: 3 }, unlock: 0 },
  planter: { cost: { stone: 2, flower: 2 }, unlock: 2 },
  table: { cost: { wood: 5, stone: 2 }, unlock: 4 },
};
export type Token = { sv: string; en: string; key: string };
export type Request = {
  visitor: string;
  role: string;
  tokens: Token[];
  needs: Partial<Inventory>;
  reward: number;
};
const t = (sv: string, en: string, key = sv.toLowerCase()): Token => ({
  sv,
  en,
  key,
});
function noun(id: Item, n: number): Token[] {
  const a = ITEMS[id];
  if (id === "wood")
    return [
      t(["", "en", "två", "tre"][n], ["", "one", "two", "three"][n], `n${n}`),
      t(n === 1 ? "bit" : "bitar", "piece" + (n === 1 ? "" : "s"), "bit"),
      t("trä", "wood", "wood"),
    ];
  return [
    t(
      n === 1 ? a.unit : n === 2 ? "två" : "tre",
      n === 1 ? "a" : n === 2 ? "two" : "three",
      `n${n}`,
    ),
    t(
      n === 1 ? a.sv : a.plural,
      n === 1 ? a.name.toLowerCase() : a.name.toLowerCase() + "s",
      id,
    ),
  ];
}
export function makeRequest(completed: number, cycle = 0): Request {
  const tier = completed < 2 ? 0 : completed < 5 ? 1 : 2;
  const pool: Item[] =
    tier === 0
      ? ["apple", "flower", "wood", "stone"]
      : tier === 1
        ? ["chair", "apple", "stone", "flower", "planter"]
        : ["table", "planter", "chair", "apple", "flower", "wood"];
  const index = (completed + cycle) % pool.length,
    id = pool[index],
    n = completed === 0 ? 1 : 1 + ((completed + cycle) % 3),
    count = id === "table" || id === "planter" || id === "chair" ? 1 : n;
  const people = [
    ["Elsa", "Your neighbor"],
    ["Nils", "The gardener"],
    ["Maja", "From the next island"],
    ["Otto", "The boatbuilder"],
  ];
  const [visitor, role] = people[(completed + cycle) % 4];
  let tokens: Token[];
  const ns = noun(id, count);
  switch ((completed + cycle) % 4) {
    case 0:
      tokens = [
        t("Jag", "I"),
        t("behöver", "need"),
        ...ns,
        t("tack.", "please", "tack"),
      ];
      break;
    case 1:
      tokens = [
        t("Kan", "Can"),
        t("du", "you"),
        t("ge", "give"),
        t("mig", "me"),
        ...ns,
      ];
      tokens[tokens.length - 1] = {
        ...tokens[tokens.length - 1],
        sv: tokens[tokens.length - 1].sv + "?",
      };
      break;
    case 2:
      tokens = [
        t("Jag", "I"),
        t("vill", "want"),
        t("ha", "to have"),
        ...ns,
        t("tack.", "please", "tack"),
      ];
      break;
    default:
      tokens = [t("Har", "Have"), t("du", "you"), ...ns];
      tokens[tokens.length - 1] = {
        ...tokens[tokens.length - 1],
        sv: tokens[tokens.length - 1].sv + "?",
      };
  }
  const needs: Partial<Inventory> = { [id]: count };
  if (completed >= 8 && (completed + cycle) % 3 === 0) {
    const extra: Item = id === "apple" ? "flower" : "apple";
    needs[extra] = 2;
    tokens = tokens
      .map((v) => ({ ...v, sv: v.sv.replace(/[.?]/g, "") }))
      .filter((v) => v.key !== "tack");
    tokens.push(
      t("och", "and"),
      ...noun(extra, 2),
      t("tack.", "please", "tack"),
    );
  }
  return {
    visitor,
    role,
    tokens,
    needs,
    reward: 8 + count * 3 + (RECIPES[id] ? 8 : 0),
  };
}
export type Word = {
  sv: string;
  en: string;
  encounters: number;
  successes: number;
  help: number;
};
export const COLORS = [
  "#dfb475",
  "#a8c58a",
  "#eaa6a0",
  "#9bbde0",
  "#b9a0d9",
] as const;
export const EXPANSION_COSTS = [35, 65, 100];
export type Decoration = {
  id: string;
  kind: Item;
  x: number;
  z: number;
  rotation?: number;
  color?: string;
};
export function canPlace(
  s: Pick<State, "expansion" | "decorations"> & { buildings?: BuildPiece[] },
  x: number,
  z: number,
) {
  return (
    Number.isFinite(x) &&
    Number.isFinite(z) &&
    (x / (8.8 + s.expansion * 1.8)) ** 2 +
      (z / (6.9 + s.expansion * 1.45)) ** 2 <
      1 &&
    !(x > -0.8 && x < 2.8 && z > 5.4) &&
    !(x > 2.2 && x < 6.5 && z > 4.2 && z < 5.4) &&
    ![
      [-7.2, 1.3],
      [-6.6, -3.5],
      [-3.4, -5],
      [3.4, -5.5],
      [7, 0],
      [6, 2],
      [-5, -2],
      [-6, 3],
      [5, -3],
      [4, 4],
      [1.3, 4.6],
    ].some(([a, b]) => Math.hypot(x - a, z - b) < 1.5) &&
    !s.decorations.some((d) => Math.hypot(d.x - x, d.z - z) < 1.3) &&
    !(s.buildings ?? []).some(
      (b) =>
        b.level === 0 &&
        !["floor", "roof", "doorway"].includes(b.kind) &&
        Math.hypot(b.x * 1.5 - x, b.z * 1.5 - z) < 1.2,
    )
  );
}
export const visitorDelay = (random = Math.random()) =>
  25000 + Math.floor(Math.max(0, Math.min(1, random)) * 65000);
export const BUILD_PARTS = {
  door: { sv: "dörr", en: "door", wood: 2, stone: 0 },
  chimney: { sv: "skorsten", en: "chimney", wood: 0, stone: 4 },
  awning: { sv: "markis", en: "awning", wood: 3, stone: 0 },
  post: { sv: "stolpe", en: "post", wood: 1, stone: 0 },
  windowbox: { sv: "blomlåda", en: "window box", wood: 2, stone: 0 },
  railing: { sv: "räcke", en: "railing", wood: 2, stone: 0 },
  floor: { sv: "golv", en: "floor", wood: 2, stone: 0 },
  wall: { sv: "vägg", en: "wall", wood: 3, stone: 0 },
  doorway: { sv: "dörröppning", en: "doorway", wood: 3, stone: 0 },
  window: { sv: "fönster", en: "window", wood: 2, stone: 1 },
  roof: { sv: "tak", en: "roof", wood: 3, stone: 1 },
  stairs: { sv: "trappa", en: "stairs", wood: 4, stone: 0 },
  shelf: { sv: "hylla", en: "shelf", wood: 3, stone: 0 },
  bench: { sv: "arbetsbänk", en: "workbench", wood: 4, stone: 2 },
  chair: { sv: "stol", en: "chair", wood: 0, stone: 0 },
  table: { sv: "bord", en: "table", wood: 0, stone: 0 },
  planter: { sv: "blomkruka", en: "flowerpot", wood: 0, stone: 0 },
} as const;
export type BuildKind = keyof typeof BUILD_PARTS;
export type BuildPiece = {
  id: string;
  kind: BuildKind;
  x: number;
  z: number;
  level: number;
  rotation: number;
  color: string;
  material: "wood" | "stone";
  area: "workshop" | "island";
};
export const WORKSHOP_COSTS = [
  { wood: 10, stone: 6 },
  { wood: 18, stone: 12 },
];
export function buildCost(kind: BuildKind, material: "wood" | "stone") {
  const p = BUILD_PARTS[kind];
  return material === "stone" &&
    ["floor", "wall", "doorway", "window"].includes(kind)
    ? { wood: 0, stone: p.wood + p.stone }
    : { wood: p.wood, stone: p.stone };
}
export function validBuild(
  s: State,
  p: Omit<BuildPiece, "id">,
  ignore?: string,
) {
  if (
    !BUILD_PARTS[p.kind] ||
    ![0, 1].includes(p.level) ||
    !Number.isInteger(p.x) ||
    !Number.isInteger(p.z) ||
    ![0, 90, 180, 270].includes(p.rotation) ||
    !COLORS.includes(p.color as (typeof COLORS)[number]) ||
    !["wood", "stone"].includes(p.material) ||
    !["workshop", "island"].includes(p.area)
  )
    return false;
  // The house and the island use one physical grid. Existing cells remain editable.
  const occupied = s.buildings.some(
    (b) => b.id === ignore && b.x === p.x && b.z === p.z,
  );
  if (!occupied && !canPlace({ ...s, buildings: [] }, p.x * 1.5, p.z * 1.5))
    return false;
  const pieces = s.buildings.filter((b) => b.id !== ignore);
  const same = pieces.filter((b) => b.x === p.x && b.z === p.z);
  const category = (k: BuildKind) =>
    k === "floor"
      ? "floor"
      : k === "roof"
        ? "roof"
        : ["wall", "window", "doorway"].includes(k)
          ? "edge"
          : [
                "door",
                "chimney",
                "awning",
                "post",
                "windowbox",
                "railing",
              ].includes(k)
            ? k
            : "object";
  const edge = (b: Omit<BuildPiece, "id">) => [
    b.x * 2 - Math.round(Math.sin((b.rotation * Math.PI) / 180)),
    b.z * 2 - Math.round(Math.cos((b.rotation * Math.PI) / 180)),
  ];
  if (
    category(p.kind) === "edge" &&
    pieces.some(
      (b) =>
        category(b.kind) === "edge" &&
        b.level === p.level &&
        edge(b)[0] === edge(p)[0] &&
        edge(b)[1] === edge(p)[1],
    )
  )
    return false;
  if (
    same.some(
      (b) =>
        b.level === p.level &&
        category(b.kind) === category(p.kind) &&
        (category(p.kind) !== "edge" || b.rotation === p.rotation),
    )
  )
    return false;
  if (
    p.level === 1 &&
    p.kind !== "floor" &&
    !same.some((b) => b.level === 1 && b.kind === "floor")
  )
    return false;
  if (p.level === 1 && !same.some((b) => b.level === 0 && b.kind === "floor"))
    return false;
  if (
    p.kind !== "floor" &&
    !same.some((b) => b.kind === "floor" && b.level === p.level)
  )
    return false;
  return true;
}
export function starterHouse(): BuildPiece[] {
  const out: BuildPiece[] = [];
  const add = (kind: BuildKind, x: number, z: number, rotation = 0) =>
    out.push({
      id: `home-${kind}-${x}-${z}-${rotation}`,
      kind,
      x,
      z,
      level: 0,
      rotation,
      color: COLORS[0],
      material: kind === "chimney" ? "stone" : "wood",
      area: "workshop",
    });
  for (let x = -1; x <= 1; x++)
    for (let z = -3; z <= -1; z++) {
      add("floor", x, z);
      if (z < -1) add("roof", x, z);
    }
  for (let x = -1; x <= 1; x++) {
    add("wall", x, -3);
    add(x === 0 ? "doorway" : "window", x, -2, 180);
  }
  for (let z = -3; z <= -2; z++) {
    add("wall", -1, z, 90);
    add("wall", 1, z, 270);
  }
  add("door", 0, -2, 180);
  add("chimney", 1, -3);
  add("bench", -1, -2);
  for (let x = -1; x <= 1; x++) add("awning", x, -1);
  add("post", -1, -1);
  add("post", 1, -1);
  add("windowbox", -1, -2, 180);
  add("windowbox", 1, -2, 180);
  return out;
}
function migrateHouse(s: State & { houseVersion?: number }): State {
  if (s.houseVersion === 1) return s;
  const old = s.buildings.map((b) =>
    b.area === "workshop" ? { ...b, z: b.z - 2 } : b,
  );
  const parts = starterHouse().filter(
    (p) =>
      !old.some(
        (b) =>
          b.kind === p.kind &&
          b.x === p.x &&
          b.z === p.z &&
          b.level === p.level &&
          b.rotation === p.rotation,
      ),
  );
  // Floors under existing interior items preserve their old positions and materials.
  for (const b of old) {
    if (
      b.area === "workshop" &&
      !old.some(
        (f) =>
          f.kind === "floor" &&
          f.x === b.x &&
          f.z === b.z &&
          f.level === b.level,
      ) &&
      !parts.some(
        (f) =>
          f.kind === "floor" &&
          f.x === b.x &&
          f.z === b.z &&
          f.level === b.level,
      )
    )
      parts.push({
        ...b,
        id: "support-" + b.id,
        kind: "floor",
        rotation: 0,
        material: "wood",
      });
  }
  return {
    ...s,
    houseVersion: 1,
    expansion: Math.max(
      s.expansion,
      old.some((b) => Math.abs(b.x) > 4 || Math.abs(b.z) > 4) ? 3 : 0,
    ),
    buildings: [...old, ...parts],
  };
}
export type State = {
  learningRewards?: string[];
  version: 1;
  houseVersion: 1;
  workshopLevel: number;
  buildings: BuildPiece[];
  nextVisitorAt: number;
  expansion: number;
  islandName: string;
  roofColor: string;
  bag: Inventory;
  coins: number;
  completed: number;
  cycle: number;
  words: Record<string, Word>;
  decorations: Decoration[];
  mode: "guided" | "listening" | "immersive";
  sound: boolean;
  welcomed: boolean;
  requestHelp: boolean;
  helpedKeys: string[];
  heard: boolean;
  cooldowns: Partial<Record<Item, number>>;
};
export const initialState = (): State => ({
  version: 1,
  houseVersion: 1,
  workshopLevel: 0,
  buildings: starterHouse(),
  nextVisitorAt: 0,
  expansion: 0,
  islandName: "Lilla",
  roofColor: COLORS[0],
  bag: emptyBag(),
  coins: 0,
  completed: 0,
  cycle: 0,
  words: {},
  decorations: [],
  mode: "guided",
  sound: true,
  welcomed: false,
  requestHelp: false,
  helpedKeys: [],
  heard: false,
  cooldowns: {},
});
export type Action =
  | { type: "trade"; item: Item }
  | { type: "gather"; item: Item; now: number }
  | { type: "craft"; item: Item }
  | { type: "offer"; bag: Inventory; now?: number; random?: number }
  | { type: "hear"; now?: number }
  | { type: "help"; key?: string }
  | { type: "skip"; now?: number; random?: number }
  | {
      type: "place";
      item: Item;
      slot?: number;
      x?: number;
      z?: number;
      rotation?: number;
      color?: string;
    }
  | { type: "expand" }
  | { type: "workshop-expand" }
  | { type: "build"; piece: Omit<BuildPiece, "id"> }
  | { type: "build-edit"; id: string; piece: Omit<BuildPiece, "id"> }
  | { type: "build-remove"; id: string }
  | {
      type: "edit";
      id: string;
      x: number;
      z: number;
      rotation: number;
      color: string;
    }
  | { type: "personalize"; name: string; color: string }
  | { type: "remove"; id: string }
  | { type: "mode"; mode: State["mode"] }
  | { type: "sound"; sound: boolean }
  | { type: "welcome" };
export type Result = { state: State; message: string; ok: boolean };
export const SLOTS = [
  [-3, 2],
  [-3, 3.5],
  [-3, 5],
  [3, -0.5],
  [4.5, -0.5],
  [6, -0.5],
  [4, 2],
  [5.5, 2],
];
export function transition(s: State, a: Action): Result {
  const fail = (message: string): Result => ({ state: s, message, ok: false });
  const next: State = {
    ...s,
    bag: { ...s.bag },
    words: { ...s.words },
    cooldowns: { ...s.cooldowns },
  };
  let message = "";
  if (
    (a.type === "offer" || a.type === "hear" || a.type === "skip") &&
    (a.now ?? Date.now()) < s.nextVisitorAt
  )
    return fail("Your next neighbor is still on the way.");
  if (a.type === "gather") {
    if (!["wood", "stone", "apple", "flower"].includes(a.item))
      return fail("That cannot be gathered.");
    if ((s.cooldowns[a.item] ?? 0) > a.now)
      return fail("Let it regrow for a moment. Try another spot.");
    if (s.bag[a.item] >= 99)
      return fail("Your bag has enough of that for now.");
    next.bag[a.item] += a.item === "wood" ? 2 : 1;
    next.cooldowns[a.item] = a.now + 3500;
    message = `+${a.item === "wood" ? 2 : 1} ${ITEMS[a.item].name.toLowerCase()}`;
  } else if (a.type === "trade") {
    if (!["wood", "apple", "stone", "flower"].includes(a.item) || s.coins < 6)
      return fail("You need 6 shells for supplies.");
    if (s.bag[a.item] > 96) return fail("Your bag has enough of that.");
    next.coins -= 6;
    next.bag[a.item] += 3;
    message = "Supplies added to your bag.";
  } else if (a.type === "craft") {
    const r = RECIPES[a.item];
    if (!r || s.completed < r.unlock)
      return fail("Complete more requests to unlock this recipe.");
    if (Object.entries(r.cost).some(([k, n]) => s.bag[k as Item] < n!))
      return fail("Gather the missing materials first.");
    if (s.bag[a.item] >= 99) return fail("Your bag is full of that item.");
    for (const [k, n] of Object.entries(r.cost)) next.bag[k as Item] -= n!;
    next.bag[a.item]++;
    message = `Made a ${ITEMS[a.item].name.toLowerCase()}!`;
  } else if (a.type === "hear" || a.type === "help") {
    const req = makeRequest(s.completed, s.cycle);
    if (a.type === "hear" && s.heard)
      return { state: s, message: "", ok: true };
    for (const word of req.tokens) {
      if (a.type === "help" && a.key && word.key !== a.key) continue;
      const old = next.words[word.key] ?? {
        sv: word.sv.replace(/[.?]/g, ""),
        en: word.en,
        encounters: 0,
        successes: 0,
        help: 0,
      };
      next.words[word.key] = {
        ...old,
        encounters: old.encounters + (a.type === "hear" ? 1 : 0),
        help: old.help + (a.type === "help" ? 1 : 0),
      };
    }
    if (a.type === "help")
      next.helpedKeys = [
        ...new Set([
          ...s.helpedKeys,
          ...req.tokens
            .filter((w) => !a.key || w.key === a.key)
            .map((w) => w.key),
        ]),
      ];
    else next.heard = true;
  } else if (a.type === "offer") {
    for (const k of Object.keys(ITEMS) as Item[]) {
      if (!Number.isInteger(a.bag[k]) || a.bag[k] < 0 || a.bag[k] > s.bag[k])
        return fail("Those items are not in your bag.");
    }
    const req = makeRequest(s.completed, s.cycle);
    const correct = (Object.keys(ITEMS) as Item[]).every(
      (k) => a.bag[k] === (req.needs[k] ?? 0),
    );
    if (!correct) {
      next.requestHelp = true;
      for (const token of req.tokens) {
        const w = next.words[token.key];
        if (w)
          next.words[token.key] = {
            ...w,
            successes: Math.max(0, w.successes - 1),
          };
      }
      return {
        state: next,
        message:
          "Inte riktigt — not quite. Listen again or reveal a hint. Your items are still in your bag.",
        ok: false,
      };
    }
    for (const k of Object.keys(ITEMS) as Item[]) next.bag[k] -= a.bag[k];
    for (const token of req.tokens) {
      const w = next.words[token.key] ?? {
        sv: token.sv.replace(/[.?]/g, ""),
        en: token.en,
        encounters: 1,
        successes: 0,
        help: 0,
      };
      next.words[token.key] = {
        ...w,
        successes:
          w.successes +
          (s.requestHelp || s.helpedKeys.includes(token.key) ? 0 : 1),
      };
    }
    next.completed++;
    next.nextVisitorAt = (a.now ?? Date.now()) + visitorDelay(a.random);
    next.coins += req.reward;
    next.heard = false;
    next.requestHelp = false;
    next.helpedKeys = [];
    message = `Tack så mycket! +${req.reward} shells`;
  } else if (a.type === "skip") {
    next.cycle++;
    next.nextVisitorAt = (a.now ?? Date.now()) + visitorDelay(a.random);
    next.requestHelp = false;
    next.helpedKeys = [];
    next.heard = false;
    message = "Your neighbor has headed home. Someone else will stop by later.";
  } else if (a.type === "place") {
    if (!RECIPES[a.item] || s.bag[a.item] < 1)
      return fail("Craft that item first.");
    const point = a.slot !== undefined ? SLOTS[a.slot] : [a.x, a.z];
    if (!point || typeof point[0] !== "number" || typeof point[1] !== "number")
      return fail("Choose a spot on land.");
    const [x, z] = point as [number, number];
    if (s.decorations.length >= 60 || !canPlace(s, x, z))
      return fail(
        "Choose clear land away from buildings, gathering spots, and furniture.",
      );
    if (a.color && !COLORS.includes(a.color as (typeof COLORS)[number]))
      return fail("Choose a color from the palette.");
    if (a.rotation !== undefined && ![0, 90, 180, 270].includes(a.rotation))
      return fail("Choose a quarter turn.");
    next.bag[a.item]--;
    next.decorations = [
      ...s.decorations,
      {
        id: a.item + "-" + x + "-" + z,
        kind: a.item,
        x,
        z,
        rotation: a.rotation ?? 0,
        color: a.color ?? COLORS[0],
      },
    ];
    message = "A little more like home.";
  } else if (a.type === "edit") {
    const d = s.decorations.find((d) => d.id === a.id);
    if (
      !d ||
      !canPlace(
        { ...s, decorations: s.decorations.filter((v) => v.id !== a.id) },
        a.x,
        a.z,
      ) ||
      ![0, 90, 180, 270].includes(a.rotation) ||
      !COLORS.includes(a.color as (typeof COLORS)[number])
    )
      return fail("Choose a clear spot and a palette color.");
    next.decorations = s.decorations.map((v) =>
      v.id === a.id
        ? { ...v, x: a.x, z: a.z, rotation: a.rotation, color: a.color }
        : v,
    );
    message = "Updated.";
  } else if (a.type === "workshop-expand") {
    const cost = WORKSHOP_COSTS[s.workshopLevel];
    if (!cost) return fail("Your workshop is fully expanded.");
    if (s.bag.wood < cost.wood || s.bag.stone < cost.stone)
      return fail("Gather more wood and stone first.");
    next.bag.wood -= cost.wood;
    next.bag.stone -= cost.stone;
    next.workshopLevel++;
    message = "Your workshop has more room!";
  } else if (a.type === "build" || a.type === "build-edit") {
    const old =
      a.type === "build-edit"
        ? s.buildings.find((b) => b.id === a.id)
        : undefined;
    if (
      a.type === "build-edit" &&
      (!old ||
        old.kind !== a.piece.kind ||
        old.material !== a.piece.material ||
        old.area !== a.piece.area)
    )
      return fail("That piece cannot be changed into another item.");
    if (
      old?.kind === "floor" &&
      (old.x !== a.piece.x ||
        old.z !== a.piece.z ||
        old.level !== a.piece.level) &&
      s.buildings.some(
        (b) =>
          b.id !== old.id &&
          b.x === old.x &&
          b.z === old.z &&
          b.level >= old.level,
      )
    )
      return fail("Move the pieces supported by this floor first.");
    if (!validBuild(s, a.piece, old?.id) || (!old && s.buildings.length >= 400))
      return fail(
        "Choose a clear grid square. Upstairs needs a floor below; outdoor pieces need a floor beneath them.",
      );
    const cost = buildCost(a.piece.kind, a.piece.material);
    if (!old) {
      if (RECIPES[a.piece.kind]) {
        if (s.bag[a.piece.kind as Item] < 1)
          return fail("Craft that furniture in the workshop first.");
        next.bag[a.piece.kind as Item]--;
      } else {
        if (s.bag.wood < cost.wood || s.bag.stone < cost.stone)
          return fail("Gather the missing wood or stone.");
        next.bag.wood -= cost.wood;
        next.bag.stone -= cost.stone;
      }
    }
    const piece = {
      ...a.piece,
      id:
        old?.id ??
        "build-" +
          s.completed +
          "-" +
          s.cycle +
          "-" +
          Date.now() +
          "-" +
          s.buildings.length,
    };
    next.buildings = old
      ? s.buildings.map((b) => (b.id === old.id ? piece : b))
      : [...s.buildings, piece];
    message = old ? "Updated." : "Built!";
  } else if (a.type === "build-remove") {
    const b = s.buildings.find((b) => b.id === a.id);
    if (!b) return fail("That piece is no longer here.");
    if (
      b.kind === "floor" &&
      s.buildings.some(
        (v) =>
          v.id !== b.id && v.x === b.x && v.z === b.z && v.level >= b.level,
      )
    )
      return fail("Remove the pieces supported by this floor first.");
    next.buildings = s.buildings.filter((v) => v.id !== b.id);
    const cost = buildCost(b.kind, b.material);
    if (RECIPES[b.kind]) next.bag[b.kind as Item]++;
    else {
      next.bag.wood += cost.wood;
      next.bag.stone += cost.stone;
    }
    message = "Materials returned to your bag.";
  } else if (a.type === "expand") {
    const cost = EXPANSION_COSTS[s.expansion];
    if (cost === undefined) return fail("Your island is fully expanded.");
    if (s.coins < cost) return fail("Collect more shells to expand.");
    next.coins -= cost;
    next.expansion++;
    message = "More room to make yourself at home!";
  } else if (a.type === "personalize") {
    if (
      !a.name.trim() ||
      a.name.trim().length > 24 ||
      !COLORS.includes(a.color as (typeof COLORS)[number])
    )
      return fail("Choose a name up to 24 characters and a palette color.");
    next.islandName = a.name.trim();
    next.roofColor = a.color;
    next.buildings = s.buildings.map((b) =>
      b.kind === "roof" ? { ...b, color: a.color } : b,
    );
    message = "Welcome home.";
  } else if (a.type === "remove") {
    const d = s.decorations.find((v) => v.id === a.id);
    if (!d) return fail("That decoration is no longer here.");
    next.decorations = s.decorations.filter((v) => v.id !== a.id);
    next.bag[d.kind]++;
    message = "Returned to your bag.";
  } else if (a.type === "mode") next.mode = a.mode;
  else if (a.type === "sound") next.sound = a.sound;
  else if (a.type === "welcome") next.welcomed = true;
  return { state: next, message, ok: true };
}
export function restore(raw: string | null): State {
  if (!raw) return initialState();
  try {
    const s = JSON.parse(raw);
    if (
      s.version !== 1 ||
      !Number.isInteger(s.completed) ||
      s.completed < 0 ||
      !Number.isInteger(s.cycle) ||
      s.cycle < 0 ||
      !Number.isInteger(s.coins) ||
      s.coins < 0 ||
      !s.bag ||
      !s.words ||
      !Array.isArray(s.decorations)
    )
      return initialState();
    for (const id of Object.keys(ITEMS))
      if (!Number.isInteger(s.bag[id]) || s.bag[id] < 0 || s.bag[id] > 100000)
        return initialState();
    if (
      s.decorations.length > 60 ||
      s.decorations.some(
        (d: Decoration) =>
          !RECIPES[d.kind] ||
          !Number.isFinite(d.x) ||
          !Number.isFinite(d.z) ||
          Math.abs(d.x) > 15 ||
          Math.abs(d.z) > 12 ||
          typeof d.id !== "string" ||
          (d.color !== undefined &&
            !COLORS.includes(d.color as (typeof COLORS)[number])) ||
          (d.rotation !== undefined && ![0, 90, 180, 270].includes(d.rotation)),
      )
    )
      return initialState();
    for (const w of Object.values(s.words) as Word[])
      if (
        typeof w.sv !== "string" ||
        typeof w.en !== "string" ||
        !Number.isFinite(w.successes) ||
        !Number.isFinite(w.encounters) ||
        !Number.isFinite(w.help)
      )
        return initialState();
    return migrateHouse({
      ...initialState(),
      ...s,
      houseVersion: s.houseVersion === 1 ? 1 : 0,
      ...(Array.isArray(s.learningRewards)
        ? {
            learningRewards: s.learningRewards
              .filter((v: unknown) => typeof v === "string")
              .slice(0, 100),
          }
        : {}),
      workshopLevel: Number.isInteger(s.workshopLevel)
        ? Math.min(2, Math.max(0, s.workshopLevel))
        : 0,
      buildings: Array.isArray(s.buildings)
        ? s.buildings
            .slice(0, 400)
            .filter(
              (b: BuildPiece) =>
                b &&
                typeof b.id === "string" &&
                BUILD_PARTS[b.kind] &&
                Number.isInteger(b.x) &&
                Number.isInteger(b.z) &&
                Math.abs(b.x) <= 12 &&
                Math.abs(b.z) <= 12 &&
                [0, 1].includes(b.level) &&
                [0, 90, 180, 270].includes(b.rotation) &&
                COLORS.includes(b.color as (typeof COLORS)[number]) &&
                ["wood", "stone"].includes(b.material) &&
                ["workshop", "island"].includes(b.area),
            )
        : [],
      expansion:
        Number.isInteger(s.expansion) && s.expansion >= 0 && s.expansion <= 3
          ? s.expansion
          : 0,
      nextVisitorAt:
        Number.isFinite(s.nextVisitorAt) && s.nextVisitorAt >= 0
          ? s.nextVisitorAt
          : 0,
      islandName:
        typeof s.islandName === "string" && s.islandName.trim()
          ? s.islandName.slice(0, 24)
          : "Lilla",
      roofColor: COLORS.includes(s.roofColor) ? s.roofColor : COLORS[0],
      mode: ["guided", "listening", "immersive"].includes(s.mode)
        ? s.mode
        : "guided",
      sound: !!s.sound,
      helpedKeys: Array.isArray(s.helpedKeys)
        ? s.helpedKeys.filter((key: unknown) => typeof key === "string")
        : [],
      cooldowns:
        typeof s.cooldowns === "object" && s.cooldowns !== null
          ? s.cooldowns
          : {},
    } as State);
  } catch {
    return initialState();
  }
}
