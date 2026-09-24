// Pure island geometry. Rendering, movement and collision all read from here so
// the ground the player walks on is exactly the ground that is drawn.

export const WATER_LEVEL = 0;

export const places = {
  dock: { x: 0, z: 30 },
  square: { x: 0, z: 5 },
  cafe: { x: -16, z: 2 },
  station: { x: 18, z: -5 },
  garden: { x: -4, z: -18 },
  lookout: { x: 7, z: -23 },
} as const;

// Dock planks run from the shore out to the ferry.
export const dock = { x: 0, zStart: 23, zEnd: 38, halfWidth: 1.6, height: 0.95 };
export const spawn = { x: 0, z: 34.5, facing: Math.PI };

export function islandRadius(angle: number) {
  return (
    33 +
    3.6 * Math.sin(3 * angle + 0.5) +
    2.2 * Math.cos(5 * angle + 1.3) +
    1.2 * Math.sin(7 * angle + 2.1)
  );
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

type Segment = [number, number, number, number];

export const paths: Segment[] = [
  [0, 24, 0, 8],
  [0, 5, -11, 3.5],
  [-11, 3.5, -14, 3],
  [0, 5, 13, -1],
  [13, -1, 16, -3],
  [0, 5, -1, -10],
  [-1, -10, -2, -14],
  [-1, -10, 6, -20],
];

function segmentDistance(x: number, z: number, [ax, az, bx, bz]: Segment) {
  const dx = bx - ax;
  const dz = bz - az;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(x - (ax + t * dx), z - (az + t * dz));
}

export function pathDistance(x: number, z: number) {
  let best = Infinity;
  for (const segment of paths) best = Math.min(best, segmentDistance(x, z, segment));
  return best;
}

// Flat pads keep buildings, the square and villagers level.
const pads = [
  { x: places.square.x, z: places.square.z, r: 7 },
  { x: places.cafe.x, z: places.cafe.z, r: 8 },
  { x: places.station.x, z: places.station.z, r: 9 },
  { x: places.garden.x, z: places.garden.z, r: 6 },
  { x: 0, z: 22, r: 5 },
];

export function shoreDistance(x: number, z: number) {
  return islandRadius(Math.atan2(z, x)) - Math.hypot(x, z);
}

function naturalHeight(x: number, z: number) {
  const inland = smoothstep(1.5, 8, shoreDistance(x, z));
  const hill =
    4.2 * Math.exp(-((x - places.lookout.x) ** 2 + (z - places.lookout.z) ** 2) / 70) +
    1.8 * Math.exp(-((x - places.garden.x) ** 2 + (z - places.garden.z) ** 2) / 90) +
    1.2 * Math.exp(-((x + 20) ** 2 + (z + 12) ** 2) / 60);
  const ripple = 0.22 * Math.sin(x * 0.31 + 1.7) * Math.cos(z * 0.27 - 0.4) + 0.12 * Math.sin(x * 0.7 + z * 0.5);
  return 0.65 + inland * (hill + ripple);
}

const padHeights = pads.map((pad) => naturalHeight(pad.x, pad.z));

export function heightAt(x: number, z: number) {
  const land = smoothstep(-5, 3.5, shoreDistance(x, z));
  let ground = naturalHeight(x, z);
  pads.forEach((pad, index) => {
    const weight = 1 - smoothstep(pad.r * 0.55, pad.r, Math.hypot(x - pad.x, z - pad.z));
    if (weight > 0) ground = ground * (1 - weight) + padHeights[index] * weight;
  });
  return -1.6 + land * (ground + 1.6);
}

export type Collider = { x: number; z: number; r: number };

export const buildingColliders: Collider[] = [
  { x: places.cafe.x - 1.2, z: places.cafe.z - 1, r: 4.1 },
  { x: places.station.x + 0.5, z: places.station.z - 1.5, r: 3.8 },
  { x: places.garden.x - 3.2, z: places.garden.z - 2.5, r: 2.6 },
  { x: places.square.x, z: places.square.z, r: 1.4 },
];

export const cottages: Array<{ x: number; z: number; rot: number; color: string; size: number }> = [
  { x: -11, z: 16, rot: 0.4, color: "#b0413e", size: 1 },
  { x: 11, z: 15, rot: -0.5, color: "#e3b448", size: 0.9 },
  { x: -23, z: -8, rot: 1.2, color: "#b0413e", size: 1.1 },
  { x: 21, z: 10, rot: -1.1, color: "#6f8fb5", size: 0.95 },
  { x: -20, z: 13, rot: 0.9, color: "#e9e2d0", size: 0.85 },
  { x: 16, z: -17, rot: -0.3, color: "#b0413e", size: 0.9 },
];

export const colliders: Collider[] = [
  ...buildingColliders,
  ...cottages.map((c) => ({ x: c.x, z: c.z, r: 2.6 * c.size })),
];

export function onDock(x: number, z: number) {
  return Math.abs(x - dock.x) <= dock.halfWidth && z >= dock.zStart && z <= dock.zEnd;
}

export function groundAt(x: number, z: number) {
  return onDock(x, z) ? Math.max(dock.height, heightAt(x, z)) : heightAt(x, z);
}

export function isWalkable(x: number, z: number) {
  if (onDock(x, z)) return true;
  return shoreDistance(x, z) > 1.2 && heightAt(x, z) > 0.25;
}

// Moves from (x, z) toward (nx, nz), sliding along obstacles rather than sticking.
export function resolveMove(x: number, z: number, nx: number, nz: number, extra: Collider[] = []) {
  let px = nx;
  let pz = nz;
  for (const c of [...colliders, ...extra]) {
    const dx = px - c.x;
    const dz = pz - c.z;
    const d = Math.hypot(dx, dz);
    const min = c.r + 0.45;
    if (d < min && d > 0.0001) {
      px = c.x + (dx / d) * min;
      pz = c.z + (dz / d) * min;
    }
  }
  if (isWalkable(px, pz)) return [px, pz] as const;
  if (isWalkable(px, z)) return [px, z] as const;
  if (isWalkable(x, pz)) return [x, pz] as const;
  return [x, z] as const;
}

// Seeded scatter so trees and flowers stay put between visits.
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function isOpenGround(x: number, z: number, clearance = 2) {
  if (shoreDistance(x, z) < 3) return false;
  if (pathDistance(x, z) < 1.8 + clearance * 0.3) return false;
  for (const c of colliders) if (Math.hypot(x - c.x, z - c.z) < c.r + clearance) return false;
  for (const p of Object.values(places)) if (Math.hypot(x - p.x, z - p.z) < 5) return false;
  return Math.hypot(x - 0, z - 22) > 5;
}

export function scatter(count: number, seed: number, clearance: number) {
  const random = mulberry32(seed);
  const points: Array<{ x: number; z: number; s: number; r: number }> = [];
  let guard = 0;
  while (points.length < count && guard++ < count * 60) {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * 32;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (!isOpenGround(x, z, clearance)) continue;
    if (points.some((p) => Math.hypot(p.x - x, p.z - z) < clearance)) continue;
    points.push({ x, z, s: 0.75 + random() * 0.6, r: random() * Math.PI * 2 });
  }
  return points;
}
