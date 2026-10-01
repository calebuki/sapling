import { shade, type Cheeks, type Eyes, type HairStyle, type ItemId } from "@/lib/game/wardrobe";

// Wardrobe icons as 12x12 pixel maps, drawn as crisp SVG rects so they match
// the island's pixel art. Letters pick colours: a is the piece's own colour,
// b a darker shade of it, s the second colour stripes and knits use, and the
// rest are fixed (k ink, w white, g leaf …). A dot is empty.

type Map = readonly string[];

const tee: Map = [
  "............",
  "...aabbaa...",
  ".aaaaaaaaaa.",
  "aaaaaaaaaaaa",
  "aa.aaaaaa.aa",
  "...aaaaaa...",
  "...aaaaaa...",
  "...aaaaaa...",
  "...aaaaaa...",
  "...aaaaaa...",
  "............",
  "............",
];

// Stripes and knits are the T-shirt with rows swapped for the second colour.
const swap = (map: Map, rows: Record<number, string>): Map =>
  map.map((row, y) => (rows[y] ? [...row].map((c, x) => (c === "a" && rows[y][x] === "s" ? "s" : c)).join("") : row));

const maps: Record<ItemId, Map> = {
  beanie: [
    "............",
    "............",
    ".....ww.....",
    "....wwww....",
    "....aaaa....",
    "...aaaaaa...",
    "..aaaaaaaa..",
    "..aaaaaaaa..",
    "..bbbbbbbb..",
    "..bbbbbbbb..",
    "............",
    "............",
  ],
  cap: [
    "............",
    "............",
    "............",
    "....aaaa....",
    "...aaaaaa...",
    "..aaaaaaaa..",
    "..aaaaaaaa..",
    "..aaaaaaaa..",
    "..bbbbbbbbbb",
    "........bbbb",
    "............",
    "............",
  ],
  sunhat: [
    "............",
    "............",
    "............",
    "....cccc....",
    "...cccccc...",
    "...cccccc...",
    "...aaaaaa...",
    ".cccccccccc.",
    "cccccccccccc",
    ".dddddddddd.",
    "............",
    "............",
  ],
  crown: [
    "............",
    "............",
    "............",
    "............",
    ".ww..pp..yy.",
    "wyww.pyp.yyy",
    ".wwgggppgyy.",
    "gggggggggggg",
    ".gg......gg.",
    "............",
    "............",
    "............",
  ],
  bollenhut: [
    "............",
    "...rr..rr...",
    "..rrrrrrrr..",
    ".rrrrrrrrrr.",
    ".rrrrrrrrrr.",
    "..rrrrrrrr..",
    "...cccccc...",
    "..cccccccc..",
    "cccccccccccc",
    ".dddddddddd.",
    "............",
    "............",
  ],
  nonla: [
    "............",
    "............",
    ".....cc.....",
    "....cccc....",
    "...cccccc...",
    "...dddddd...",
    "..cccccccc..",
    ".cccccccccc.",
    "cccccccccccc",
    "dddddddddddd",
    "............",
    "............",
  ],
  tee,
  stripes: swap(tee, { 3: "ssssssssssss", 5: "ssssssssssss", 7: "ssssssssssss", 9: "ssssssssssss" }),
  knit: swap(tee, { 4: "....s..s....", 5: "...s.ss.s...", 6: "....s..s....", 8: "...s.s.s.s.." }),
  trousers: [
    "............",
    "..bbbbbbbb..",
    "..aaaaaaaa..",
    "..aaaaaaaa..",
    "..aaa..aaa..",
    "..aaa..aaa..",
    "..aaa..aaa..",
    "..aaa..aaa..",
    "..aaa..aaa..",
    "..bbb..bbb..",
    "............",
    "............",
  ],
  shorts: [
    "............",
    "............",
    "............",
    "..bbbbbbbb..",
    "..aaaaaaaa..",
    "..aaaaaaaa..",
    "..aaa..aaa..",
    "..aaa..aaa..",
    "..bbb..bbb..",
    "............",
    "............",
    "............",
  ],
  overalls: [
    "...a....a...",
    "...a....a...",
    "...aaaaaa...",
    "...ayaaya...",
    "...aaaaaa...",
    "..bbbbbbbb..",
    "..aaaaaaaa..",
    "..aaa..aaa..",
    "..aaa..aaa..",
    "..aaa..aaa..",
    "..bbb..bbb..",
    "............",
  ],
  glasses: [
    "............",
    "............",
    "............",
    "............",
    "..kkk..kkk..",
    ".k...kk...k.",
    "kk.w.kk.w.kk",
    ".k...k.k..k.",
    "..kkk...kkk.",
    "............",
    "............",
    "............",
  ],
  scarf: [
    "............",
    "............",
    "..bbbbbbbb..",
    ".aaaaaaaaaa.",
    ".aaaaaaaaaa.",
    "..aaaaaaaa..",
    ".......aa...",
    ".......aa...",
    ".......aa...",
    ".......aa...",
    ".......b.b..",
    "............",
  ],
};

const fixed: Record<string, string> = {
  k: "#2b2233",
  w: "#ffffff",
  y: "#f7d94c",
  p: "#f39ac0",
  g: "#4f8f3f",
  r: "#d42a2a",
  c: "#ead9a2",
  d: "#c9b26e",
};

// The bollenhut's straw is paler than the sun hat and nón lá.
const overrides: Partial<Record<ItemId, Record<string, string>>> = {
  bollenhut: { c: "#f3ead8", d: "#d8cbb0" },
  sunhat: { c: "#e8cf8a", d: "#c9ad62" },
};

function lightness(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

function Pixels({ map, colours, title }: { map: Map; colours: Record<string, string>; title?: string }) {
  const rects: React.ReactNode[] = [];
  map.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let run = 1;
      while (x + run < row.length && row[x + run] === c) run++;
      if (c !== "." && colours[c]) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={colours[c]} />);
      x += run;
    }
  });
  return (
    <svg className="pixel-icon" viewBox="0 0 12 12" shapeRendering="crispEdges" role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      {rects}
    </svg>
  );
}

const silhouette = "rgba(44, 42, 61, 0.22)";

export function ItemIcon({ id, colour, locked = false }: { id: ItemId; colour: string; locked?: boolean }) {
  const map = maps[id];
  const colours: Record<string, string> = locked
    ? Object.fromEntries([..."abskwyprgcd"].map((c) => [c, silhouette]))
    : {
        ...fixed,
        ...overrides[id],
        a: colour,
        b: shade(colour, 0.78),
        s: lightness(colour) > 0.62 ? "#2c3e50" : "#f4efe6",
      };
  return <Pixels map={map} colours={colours} />;
}

// ---- Heads, for hair and face choices ------------------------------------------

const head: Map = [
  "............",
  "............",
  "...hhhhhh...",
  "..hhhhhhhh..",
  "..hhhhhhhh..",
  "..hssssssh..",
  "..ssksskss..",
  "..ssksskss..",
  "..ssssssss..",
  "...ssssss...",
  "............",
  "............",
];

const set = (map: Map, cells: [number, number, string][]): Map => {
  const rows = map.map((row) => [...row]);
  for (const [x, y, c] of cells) rows[y][x] = c;
  return rows.map((row) => row.join(""));
};

const heads: Record<HairStyle, Map> = {
  short: head,
  bob: set(head, [
    [1, 4, "h"], [1, 5, "h"], [1, 6, "h"], [1, 7, "h"], [1, 8, "h"],
    [10, 4, "h"], [10, 5, "h"], [10, 6, "h"], [10, 7, "h"], [10, 8, "h"],
    [2, 5, "h"], [9, 5, "h"],
  ]),
  bun: set(head, [[5, 0, "h"], [6, 0, "h"], [4, 1, "h"], [5, 1, "h"], [6, 1, "h"], [7, 1, "h"]]),
  braid: set(head, [[10, 6, "h"], [10, 7, "d"], [10, 8, "h"], [10, 9, "d"], [10, 10, "h"], [10, 11, "a"]]),
};

export function HairIcon({ style, hair, skin }: { style: HairStyle; hair: string; skin: string }) {
  return <Pixels map={heads[style]} colours={{ h: hair, d: shade(hair, 0.75), s: skin, k: fixed.k, a: "#e76f51" }} />;
}

// Faces close up: a square of skin with eyes, cheeks, a mouth and maybe a beard.
function faceMap(eyes: Eyes, cheeks: Cheeks, beard = false): Map {
  const cells: [number, number, string][] = [];
  for (const x of [3, 7]) {
    if (eyes === "sleepy") {
      cells.push([x - 1, 4, "k"], [x, 4, "k"], [x + 1, 4, "k"], [x + 2, 4, "k"], [x, 5, "k"], [x + 1, 5, "k"]);
    } else {
      for (const y of [3, 4, 5]) cells.push([x, y, "k"], [x + 1, y, "k"]);
      cells.push([x + 1, 3, "w"]);
      if (eyes === "lashes") cells.push([x < 6 ? x - 1 : x + 2, 2, "k"]);
    }
  }
  if (cheeks === "blush") cells.push([1, 7, "p"], [2, 7, "p"], [9, 7, "p"], [10, 7, "p"]);
  if (cheeks === "freckles") cells.push([2, 6, "f"], [1, 7, "f"], [3, 7, "f"], [9, 6, "f"], [8, 7, "f"], [10, 7, "f"]);
  if (beard) {
    for (let x = 2; x <= 9; x++) cells.push([x, 9, "h"], [x, 10, "h"]);
    for (let x = 4; x <= 7; x++) cells.push([x, 11, "h"]);
  }
  cells.push([5, 8, "m"], [6, 8, "m"]);
  const rows = Array.from({ length: 12 }, () => Array.from({ length: 12 }, () => "s"));
  for (const [x, y, c] of cells) rows[y][x] = c;
  return rows.map((row) => row.join(""));
}

export function FaceIcon({ eyes, cheeks, beard, skin, hair }: { eyes: Eyes; cheeks: Cheeks; beard?: boolean; skin: string; hair: string }) {
  return (
    <Pixels
      map={faceMap(eyes, cheeks, beard)}
      colours={{ s: skin, k: fixed.k, w: "#ffffff", p: "#f39a9a", f: "#b0704f", m: "#7a3030", h: hair }}
    />
  );
}

export function NoneIcon() {
  return (
    <Pixels
      map={[
        "............",
        "............",
        "....kkkk....",
        "...k....k...",
        "..k....k.k..",
        "..k...k..k..",
        "..k..k...k..",
        "..k.k....k..",
        "...k....k...",
        "....kkkk....",
        "............",
        "............",
      ]}
      colours={{ k: silhouette }}
    />
  );
}
