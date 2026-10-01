import type { TargetLanguageCode } from "@/lib/learning/languages";
import type { Line } from "./line";
import type { VillagerId } from "./villagers";
import { mulberry32 } from "./world";

// Helping the station master. Travellers at the window ask for a ticket
// (where to, one way or return) and which platform; from the third level
// some ask the way into town instead, and you carry their suitcase there by
// following the station master's directions through a little street grid.

// ---------- The town ----------

// Streets meet at a grid of crossings: columns 0..COLS-1 west to east, rows
// 0..ROWS-1 from the station northwards. You start at (1, 0) facing north.
export const COLS = 3;
export const ROWS = 4;
export type Node = { c: number; r: number };
export type Heading = 0 | 1 | 2 | 3; // north, east, south, west
export type Corner = "ne" | "nw" | "se" | "sw";
export const START: Node = { c: 1, r: 0 };

export type LandmarkKind = "church" | "post" | "bank" | "pharmacy" | "hotel" | "restaurant" | "museum" | "park" | "school" | "fountain";
export type Landmark = { slug: string; kind: LandmarkKind; name: Line; node: Node; corner: Corner };

export const sameNode = (a: Node, b: Node) => a.c === b.c && a.r === b.r;
const step = (n: Node, h: Heading): Node => ({ c: n.c + (h === 1 ? 1 : h === 3 ? -1 : 0), r: n.r + (h === 0 ? 1 : h === 2 ? -1 : 0) });
export const inTown = (n: Node) => n.c >= 0 && n.c < COLS && n.r >= 0 && n.r < ROWS;
export const forward = (n: Node, h: Heading) => step(n, h);
export const turn = (h: Heading, way: "left" | "right"): Heading => ((h + (way === "left" ? 3 : 1)) % 4) as Heading;

// Which side of you a corner is on, standing at its crossing facing `h`.
export function sideOf(corner: Corner, h: Heading): "left" | "right" | null {
  const ns = corner[0] === "n" ? 0 : 2;
  const ew = corner[1] === "e" ? 1 : 3;
  // Facing north: east corners are on the right. Facing east: south corners are on the right.
  const right = ((h + 1) % 4) as Heading;
  const left = ((h + 3) % 4) as Heading;
  if (right === ns || right === ew) return "right";
  if (left === ns || left === ew) return "left";
  return null;
}

// ---------- Directions ----------

export type Instruction =
  | { kind: "straight" }
  | { kind: "turn"; way: "left" | "right"; at: Node; ref: { type: "landmark"; landmark: Landmark } | { type: "light" } | { type: "ordinal"; n: number } }
  | { kind: "arrive"; landmark: Landmark; side: "left" | "right" };

export type Route = { nodes: Node[]; headings: Heading[]; instructions: Instruction[] };

// The shortest way there with the fewest turns, from the start facing north.
export function planRoute(to: Node): Route | null {
  type State = { node: Node; heading: Heading; path: Node[]; headings: Heading[]; turns: number };
  const queue: State[] = [{ node: START, heading: 0, path: [START], headings: [0], turns: 0 }];
  let best: State | null = null;
  const seen = new Map<string, number>();
  while (queue.length) {
    queue.sort((a, b) => a.path.length - b.path.length || a.turns - b.turns);
    const s = queue.shift()!;
    if (sameNode(s.node, to)) {
      if (!best || s.path.length < best.path.length || (s.path.length === best.path.length && s.turns < best.turns)) best = s;
      continue;
    }
    if (best && s.path.length >= best.path.length) continue;
    for (const h of [0, 1, 2, 3] as Heading[]) {
      if (h === (s.heading + 2) % 4) continue;
      const next = step(s.node, h);
      if (!inTown(next)) continue;
      const turns = s.turns + (h === s.heading ? 0 : 1);
      const key = `${next.c},${next.r},${h}`;
      if ((seen.get(key) ?? Infinity) <= s.path.length + 1 + turns * 0.1) continue;
      seen.set(key, s.path.length + 1 + turns * 0.1);
      queue.push({ node: next, heading: h, path: [...s.path, next], headings: [...s.headings, h], turns });
    }
  }
  if (!best) return null;
  return { nodes: best.path, headings: best.headings, instructions: [] };
}

export type TownOptions = { landmarks: Landmark[]; lights: Node[] };

// "Geh geradeaus. An der Kirche links. Dann die zweite Straße rechts. Da ist das Museum."
export function directions(route: Route, destination: Landmark, town: TownOptions): Instruction[] {
  const out: Instruction[] = [{ kind: "straight" }];
  let sinceTurn = 0;
  for (let i = 1; i < route.nodes.length - 1; i++) {
    const before = route.headings[i];
    const after = route.headings[i + 1];
    sinceTurn++;
    if (before === after) continue;
    const at = route.nodes[i];
    const way = after === turn(before, "left") ? "left" : "right";
    const landmark = town.landmarks.find((l) => sameNode(l.node, at) && l !== destination);
    const light = town.lights.some((n) => sameNode(n, at));
    // A landmark if there is one, else the traffic lights, else "the second street".
    const ref = landmark ? { type: "landmark" as const, landmark } : light ? { type: "light" as const } : { type: "ordinal" as const, n: sinceTurn };
    out.push({ kind: "turn", way, at, ref });
    sinceTurn = 0;
  }
  out.push({ kind: "arrive", landmark: destination, side: sideOf(destination.corner, route.headings[route.headings.length - 1]) ?? "right" });
  return out;
}

// How many turns a route has.
export const turnsOf = (route: Route) => route.headings.slice(1).filter((h, i) => h !== route.headings[i]).length;

// ---------- Tickets ----------

export type Destination = { slug: string; name: Line; platform: number };
export type TicketKind = "single" | "return";

export type StationConfig = {
  host: VillagerId;
  destinations: Destination[];
  landmarks: Landmark[];
  lights: Node[];
  numbers: Record<number, string>;
  concepts: { ticket: string; single: string; return: string; platform: string; left: string; right: string; straight: string; light: string; first: string; second: string; third: string; howDoIGet: string };
  // A traveller at the window: "Eine Fahrkarte nach Titisee, bitte."
  askTicket(destination: Destination): Line;
  kindAnswer(kind: TicketKind): Line;
  wrongTicket(destination: Destination, kind: TicketKind): Line;
  // "Gleis zwei." and its parser.
  platform(n: number): Line;
  parsePlatform(text: string, code: TargetLanguageCode): number | "digits" | null;
  askWay(landmark: Landmark): Line;
  // One sentence per instruction, so each is recorded once.
  instruction(step: Instruction): Line;
  wrongBuilding(got: Landmark): Line;
  lines: {
    invite: Line;
    notYet: Line;
    intro: Line[];
    townIntro: Line;
    title: Line;
    clock: Line;
    hello: Line[];
    whichKind: Line;
    askPlatform: Line;
    platformWrong: Line;
    words: Line;
    thanks: Line[];
    carry: Line;
    lost: Line;
    arrived: Line;
    ticket: Line;
    print: Line;
    board: Line;
    repeat: Line;
    late: Line;
    done: [Line, Line, Line];
    harder: Line;
    again: Line;
    back: Line;
  };
};

export type StationLevel = {
  travellers: number;
  platform: boolean;
  // How many of the travellers want directions, and how many turns their way has at most.
  ways: number;
  maxTurns: number;
  ordinals: boolean;
  heard: boolean;
  seconds: number;
};

export const STATION_LEVELS: StationLevel[] = [
  { travellers: 3, platform: false, ways: 0, maxTurns: 0, ordinals: false, heard: false, seconds: 120 },
  { travellers: 4, platform: true, ways: 0, maxTurns: 0, ordinals: false, heard: false, seconds: 160 },
  { travellers: 4, platform: true, ways: 1, maxTurns: 1, ordinals: false, heard: false, seconds: 200 },
  { travellers: 5, platform: true, ways: 2, maxTurns: 2, ordinals: true, heard: true, seconds: 250 },
  { travellers: 6, platform: true, ways: 3, maxTurns: 2, ordinals: true, heard: true, seconds: 280 },
];

export function stationLevel(index: number) {
  return STATION_LEVELS[Math.max(0, Math.min(STATION_LEVELS.length - 1, index))];
}

export type Traveller =
  | { kind: "ticket"; destination: Destination; ticket: TicketKind; line: Line }
  | { kind: "way"; landmark: Landmark; route: Route; steps: Instruction[]; line: Line; directions: Line };

export type StationOptions = {
  level: StationLevel;
  destinations: string[];
  // Landmarks whose names the learner has met, and whether the direction words are known.
  landmarks: string[];
  ways: boolean;
  weight?: (slug: string) => number;
  seed: number;
};

export function makeTravellers(config: StationConfig, options: StationOptions): Traveller[] {
  const random = mulberry32(options.seed);
  const { level } = options;
  const destinations = config.destinations.filter((d) => options.destinations.includes(d.slug));
  const known = config.landmarks.filter((l) => options.landmarks.includes(l.slug));
  const town = { landmarks: known, lights: config.lights };
  // Ways with the right number of turns; before ordinals, only turns at a landmark or the lights.
  const reachable = known
    .map((landmark) => ({ landmark, route: planRoute(landmark.node)! }))
    .filter(({ route }) => route && route.nodes.length > 1 && turnsOf(route) <= level.maxTurns && turnsOf(route) >= Math.min(1, level.maxTurns))
    .filter(({ landmark, route }) => level.ordinals || directions(route, landmark, town).every((s) => s.kind !== "turn" || s.ref.type !== "ordinal"));
  const ways = options.ways ? Math.min(level.ways, reachable.length) : 0;
  // Directions come after the first traveller, spread through the run.
  const slots = new Set<number>();
  while (slots.size < ways) slots.add(1 + Math.floor(random() * (level.travellers - 1)));
  const travellers: Traveller[] = [];
  let last: string | null = null;
  const used = new Set<string>();
  for (let i = 0; i < level.travellers && destinations.length; i++) {
    if (slots.has(i)) {
      const pool = reachable.filter((r) => !used.has(r.landmark.slug));
      const { landmark, route } = pool.length ? pool[Math.floor(random() * pool.length)] : reachable[Math.floor(random() * reachable.length)];
      used.add(landmark.slug);
      const steps = directions(route, landmark, town);
      const parts = steps.map((s) => config.instruction(s));
      travellers.push({
        kind: "way",
        landmark,
        route: { ...route, instructions: steps },
        steps,
        line: config.askWay(landmark),
        directions: { t: parts.map((p) => p.t).join(" "), en: parts.map((p) => p.en).join(" "), parts: parts.map((p) => p.t) },
      });
      continue;
    }
    const pool = destinations.length > 1 ? destinations.filter((d) => d.slug !== last) : destinations;
    const destination = pool[Math.floor(random() * pool.length)];
    last = destination.slug;
    const ticket: TicketKind = random() < 0.5 ? "single" : "return";
    travellers.push({ kind: "ticket", destination, ticket, line: config.askTicket(destination) });
  }
  return travellers;
}

export function stationStars(helped: number, travellers: number, timeLeft: number) {
  if (helped >= travellers) return timeLeft >= 0.2 ? 3 : 2;
  return helped >= travellers / 2 ? 1 : 0;
}

// Everything the station can say, for the gloss audit and the voice catalog.
export function allStationLines(config: StationConfig): Line[] {
  const lines: Line[] = [];
  for (const d of config.destinations) {
    lines.push(config.askTicket(d));
    for (const kind of ["single", "return"] as TicketKind[]) lines.push(config.wrongTicket(d, kind));
  }
  lines.push(config.kindAnswer("single"), config.kindAnswer("return"));
  for (let n = 1; n <= 4; n++) lines.push(config.platform(n));
  for (const l of config.landmarks) {
    lines.push(config.askWay(l), config.wrongBuilding(l), config.instruction({ kind: "arrive", landmark: l, side: "left" }), config.instruction({ kind: "arrive", landmark: l, side: "right" }));
    for (const way of ["left", "right"] as const) lines.push(config.instruction({ kind: "turn", way, at: l.node, ref: { type: "landmark", landmark: l } }));
  }
  lines.push(config.instruction({ kind: "straight" }));
  for (const way of ["left", "right"] as const) {
    lines.push(config.instruction({ kind: "turn", way, at: START, ref: { type: "light" } }));
    for (let n = 1; n <= 3; n++) lines.push(config.instruction({ kind: "turn", way, at: START, ref: { type: "ordinal", n } }));
  }
  return lines;
}
