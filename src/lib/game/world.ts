// Pure island geometry. Rendering, movement and collision all read from here so
// the ground the player walks on is exactly the ground that is drawn. Each
// island describes its shape once and gets the same physics.

export const WATER_LEVEL = 0;

export type Point = { x: number; z: number };
export type Collider = { x: number; z: number; r: number };
export type Segment = [number, number, number, number];
export type Cottage = { x: number; z: number; rot: number; color: string; size: number };

export type WorldDef = {
  // Shoreline: base radius plus a few waves around the island.
  shore: { base: number; waves: Array<{ amp: number; freq: number; phase: number; fn: "sin" | "cos" }> };
  places: Record<string, Point>;
  dock: { x: number; zStart: number; zEnd: number; halfWidth: number; height: number };
  spawn: { x: number; z: number; facing: number };
  paths: Segment[];
  // Flat pads keep buildings, the square and villagers level.
  pads: Array<Point & { r: number }>;
  hills: Array<Point & { height: number; spread: number }>;
  buildingColliders: Collider[];
  cottages: Cottage[];
  // Extra spots scenery must not grow on (besides places and colliders).
  keepClear: Array<Point & { r: number }>;
};

export type World = ReturnType<typeof createWorld>;

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function segmentDistance(x: number, z: number, [ax, az, bx, bz]: Segment) {
  const dx = bx - ax;
  const dz = bz - az;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(x - (ax + t * dx), z - (az + t * dz));
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

export function createWorld(def: WorldDef) {
  const { shore, places, dock, paths, pads, hills, buildingColliders, cottages, keepClear } = def;

  function islandRadius(angle: number) {
    return shore.waves.reduce((r, w) => r + w.amp * Math[w.fn](w.freq * angle + w.phase), shore.base);
  }

  // The same outline for the water shader's foam and shallows.
  const radiusGlsl = shore.waves.reduce(
    (expr, w) => `${expr} + ${w.amp.toFixed(3)} * ${w.fn}(${w.freq.toFixed(3)} * a + ${w.phase.toFixed(3)})`,
    shore.base.toFixed(3),
  );

  function pathDistance(x: number, z: number) {
    let best = Infinity;
    for (const segment of paths) best = Math.min(best, segmentDistance(x, z, segment));
    return best;
  }

  function shoreDistance(x: number, z: number) {
    return islandRadius(Math.atan2(z, x)) - Math.hypot(x, z);
  }

  function naturalHeight(x: number, z: number) {
    const inland = smoothstep(1.5, 8, shoreDistance(x, z));
    const hill = hills.reduce((sum, h) => sum + h.height * Math.exp(-((x - h.x) ** 2 + (z - h.z) ** 2) / h.spread), 0);
    const ripple = 0.22 * Math.sin(x * 0.31 + 1.7) * Math.cos(z * 0.27 - 0.4) + 0.12 * Math.sin(x * 0.7 + z * 0.5);
    return 0.65 + inland * (hill + ripple);
  }

  const padHeights = pads.map((pad) => naturalHeight(pad.x, pad.z));

  function heightAt(x: number, z: number) {
    const land = smoothstep(-5, 3.5, shoreDistance(x, z));
    let ground = naturalHeight(x, z);
    pads.forEach((pad, index) => {
      const weight = 1 - smoothstep(pad.r * 0.55, pad.r, Math.hypot(x - pad.x, z - pad.z));
      if (weight > 0) ground = ground * (1 - weight) + padHeights[index] * weight;
    });
    return -1.6 + land * (ground + 1.6);
  }

  const colliders: Collider[] = [...buildingColliders, ...cottages.map((c) => ({ x: c.x, z: c.z, r: 2.6 * c.size }))];

  function onDock(x: number, z: number) {
    return Math.abs(x - dock.x) <= dock.halfWidth && z >= dock.zStart && z <= dock.zEnd;
  }

  function groundAt(x: number, z: number) {
    return onDock(x, z) ? Math.max(dock.height, heightAt(x, z)) : heightAt(x, z);
  }

  function isWalkable(x: number, z: number) {
    if (onDock(x, z)) return true;
    return shoreDistance(x, z) > 1.2 && heightAt(x, z) > 0.25;
  }

  // Moves from (x, z) toward (nx, nz), sliding along obstacles rather than sticking.
  function resolveMove(x: number, z: number, nx: number, nz: number, extra: Collider[] = []) {
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

  function isOpenGround(x: number, z: number, clearance = 2) {
    if (shoreDistance(x, z) < 3) return false;
    if (pathDistance(x, z) < 1.8 + clearance * 0.3) return false;
    for (const c of colliders) if (Math.hypot(x - c.x, z - c.z) < c.r + clearance) return false;
    for (const p of Object.values(places)) if (Math.hypot(x - p.x, z - p.z) < 5) return false;
    return keepClear.every((k) => Math.hypot(x - k.x, z - k.z) > k.r);
  }

  function scatter(count: number, seed: number, clearance: number) {
    const random = mulberry32(seed);
    const points: Array<{ x: number; z: number; s: number; r: number }> = [];
    const reach = shore.base - 1;
    let guard = 0;
    while (points.length < count && guard++ < count * 60) {
      const angle = random() * Math.PI * 2;
      const radius = Math.sqrt(random()) * reach;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      if (!isOpenGround(x, z, clearance)) continue;
      if (points.some((p) => Math.hypot(p.x - x, p.z - z) < clearance)) continue;
      points.push({ x, z, s: 0.75 + random() * 0.6, r: random() * Math.PI * 2 });
    }
    return points;
  }

  return {
    ...def,
    colliders,
    islandRadius,
    radiusGlsl,
    pathDistance,
    shoreDistance,
    heightAt,
    groundAt,
    onDock,
    isWalkable,
    resolveMove,
    isOpenGround,
    scatter,
  };
}
