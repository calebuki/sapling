export type Point = { x: number; z: number };
export function walkable(p: Point) {
  return (
    (p.x / 9.2) ** 2 + (p.z / 7.3) ** 2 < 1 &&
    !(p.x > -1.7 && p.x < 1.7 && p.z > -5.25 && p.z < -2.2)
  );
}
const corners: Point[] = [
  { x: -1.9, z: -5.45 },
  { x: 1.9, z: -5.45 },
  { x: -1.9, z: -2 },
  { x: 1.9, z: -2 },
];
export function clearPath(a: Point, b: Point) {
  const steps = Math.ceil(Math.hypot(a.x - b.x, a.z - b.z) / 0.1);
  for (let i = 0; i <= steps; i++) {
    const t = steps ? i / steps : 0;
    if (!walkable({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }))
      return false;
  }
  return true;
}
// A tiny visibility graph routes around the cabin without a per-frame pathfinder.
export function routeTo(start: Point, end: Point): Point[] {
  if (!walkable(start) || !walkable(end)) return [];
  if (clearPath(start, end)) return [end];
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
      if (visited.has(next) || !clearPath(nodes[at], nodes[next])) continue;
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
