import type { BuildPiece } from './game';
export type Point = { x: number; z: number };
export function walkable(
  p: Point,
  expansion = 0,
  buildings: BuildPiece[] = [],
) {
  return (
    (p.x / (9.2 + expansion * 1.8)) ** 2 +
      (p.z / (7.3 + expansion * 1.45)) ** 2 <
      1 &&
    !obstacles(buildings).some(
      (b) => p.x > b.x0 && p.x < b.x1 && p.z > b.z0 && p.z < b.z1,
    )
  );
}
function obstacles(buildings: BuildPiece[]) {
  return buildings
    .filter(
      (b) => b.level === 0 && ['wall', 'window', 'doorway'].includes(b.kind),
    )
    .map((b) => {
      const r = (b.rotation * Math.PI) / 180,
        x = b.x * 1.5 - Math.sin(r) * 0.68,
        z = b.z * 1.5 - Math.cos(r) * 0.68;
      const dx = b.rotation % 180 === 0 ? 0.94 : 0.3,
        dz = b.rotation % 180 === 0 ? 0.3 : 0.94;
      return { x0: x - dx, x1: x + dx, z0: z - dz, z1: z + dz };
    });
}
export function clearPath(
  a: Point,
  b: Point,
  expansion = 0,
  buildings: BuildPiece[] = [],
) {
  const steps = Math.ceil(Math.hypot(a.x - b.x, a.z - b.z) / 0.1);
  for (let i = 0; i <= steps; i++) {
    const t = steps ? i / steps : 0;
    if (
      !walkable(
        { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t },
        expansion,
        buildings,
      )
    )
      return false;
  }
  return true;
}
// Visibility graph follows the current wall pieces, including extensions and removals.
export function routeTo(
  start: Point,
  end: Point,
  expansion = 0,
  buildings: BuildPiece[] = [],
): Point[] {
  if (
    !walkable(start, expansion, buildings) ||
    !walkable(end, expansion, buildings)
  )
    return [];
  if (clearPath(start, end, expansion, buildings)) return [end];
  const corners = obstacles(buildings).flatMap((b) => [
    { x: b.x0 - 0.02, z: b.z0 - 0.02 },
    { x: b.x1 + 0.02, z: b.z0 - 0.02 },
    { x: b.x0 - 0.02, z: b.z1 + 0.02 },
    { x: b.x1 + 0.02, z: b.z1 + 0.02 },
  ]);
  const nodes = [start, ...corners, end],
    distance = nodes.map(() => Infinity),
    previous = nodes.map(() => -1),
    visited = new Set<number>();
  distance[0] = 0;
  for (let step = 0; step < nodes.length; step++) {
    let at = -1;
    for (let i = 0; i < nodes.length; i++)
      if (!visited.has(i) && (at < 0 || distance[i] < distance[at])) at = i;
    if (at < 0 || !Number.isFinite(distance[at])) break;
    if (at === nodes.length - 1) {
      const result: Point[] = [];
      while (at > 0) {
        result.unshift(nodes[at]);
        at = previous[at];
      }
      return result;
    }
    visited.add(at);
    for (let next = 0; next < nodes.length; next++) {
      if (
        visited.has(next) ||
        !clearPath(nodes[at], nodes[next], expansion, buildings)
      )
        continue;
      const cost =
        distance[at] +
        Math.hypot(nodes[at].x - nodes[next].x, nodes[at].z - nodes[next].z);
      if (cost < distance[next]) {
        distance[next] = cost;
        previous[next] = at;
      }
    }
  }
  return [];
}
