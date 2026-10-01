import * as THREE from "three";
import type { Habitat, Sighting, Weather } from "@/lib/game/forest";
import type { Bounds, Point } from "./walk";

// The clearing below the forester's lookout: a pond on the left, the meadow
// on the right, a big old tree in the middle and the fir forest behind. You
// and the forester stand on the lookout's deck at the front.

export const DECK = { x: 0, z: 5.2, halfWidth: 2.6, halfDepth: 1.2, y: 0 };
export const PLAYER_SPOT: Point = { x: 0.7, z: 5.0 };
export const HOST_SPOT: Point = { x: -1.0, z: 5.1 };
export const BOUNDS: Bounds = { minX: -2.2, maxX: 2.2, minZ: 4.3, maxZ: 6.0 };

export const POND = { x: -5.2, z: -1.2, r: 2.6 };
export const TREE = { x: 0.6, z: -2.4 };
export const MEADOW = { x: 5.2, z: -0.6, halfWidth: 3.2, halfDepth: 2.8 };
export const FOREST_EDGE_Z = -7.2;

// The hiker comes along the path in front of the deck.
export const HIKER_PATH: Point[] = [
  { x: -12, z: 7.6 },
  { x: -4, z: 7.6 },
];
export const HIKER_SPOT: Point = { x: -2.6, z: 7.0 };

export const VIEW = { position: new THREE.Vector3(0.2, 6.2, 12.4), target: new THREE.Vector3(0.2, 0.6, -2.6) };

// A stable spot for each animal in its habitat; herds spread out around it.
export function spotOf(s: Sighting, k: number): { x: number; y: number; z: number } {
  const r = ((s.id * 9301 + 49297) % 233280) / 233280;
  const r2 = ((s.id * 4271 + 1013) % 9973) / 9973;
  const spread = (k - 0.5) * 0.9;
  switch (s.habitat as Habitat) {
    case "lake":
      return { x: POND.x - 1.2 + r * 2.2 + Math.cos(k * 2.1) * 0.7, y: -0.05, z: POND.z - 0.8 + r2 * 1.4 + Math.sin(k * 2.1) * 0.5 };
    case "tree":
      // On the branches: birds along them, a squirrel on the trunk.
      return s.count > 1 ? { x: TREE.x - 1.2 + k * 0.55, y: 3.1 + (k % 2) * 0.5, z: TREE.z + 0.3 } : { x: TREE.x + 0.35, y: 1.7, z: TREE.z + 0.35 };
    case "forest":
      return { x: -3.5 + r * 7 + spread * 0.4, y: 0, z: FOREST_EDGE_Z + 1.4 + r2 * 0.8 };
    default: {
      // Spread over the meadow by id (golden-ratio steps), each herd in a little row.
      const u = (s.id * 0.618034) % 1;
      const v = (s.id * 0.381966 + 0.2) % 1;
      return { x: MEADOW.x - 2.6 + u * 4.4 + (k % 3) * 0.75, y: 0, z: MEADOW.z - 2.0 + v * 3.4 + Math.floor(k / 3) * 0.75 };
    }
  }
}

// Sky, haze and light for each weather.
export const SKIES: Record<Weather, { sky: string; fog: [string, number, number]; sun: number; fill: string }> = {
  sun: { sky: "#9fd3ef", fog: ["#cfe7ee", 30, 90], sun: 2.4, fill: "#d6ecff" },
  clouds: { sky: "#b9c6cf", fog: ["#c9d2d8", 25, 80], sun: 1.3, fill: "#c5ced6" },
  rain: { sky: "#7f8c96", fog: ["#8d99a3", 18, 60], sun: 0.8, fill: "#98a4ae" },
  snow: { sky: "#d6dee6", fog: ["#e3e9ee", 16, 55], sun: 1.0, fill: "#e8eef4" },
  fog: { sky: "#c9cfd3", fog: ["#d3d8db", 4, 22], sun: 0.7, fill: "#d0d5d8" },
  wind: { sky: "#a9cde2", fog: ["#c3dbe6", 28, 85], sun: 1.9, fill: "#cfe3ef" },
  storm: { sky: "#4b5563", fog: ["#5b6573", 14, 50], sun: 0.5, fill: "#6b7583" },
};
