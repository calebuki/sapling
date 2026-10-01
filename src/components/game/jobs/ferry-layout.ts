import * as THREE from "three";
import type { DayTime } from "@/lib/game/ferry";
import type { Bounds, Point } from "./walk";

// Greta's landing stage: a pier running left to right across the lake, the
// steamer moored behind it, a lectern with the passenger list in the middle.
// Passengers queue up from the shore on the left, stop at the lectern, then
// walk round to the gangway and take a seat on deck.

export const PIER = { minX: -15, maxX: 7, halfDepth: 1.7 };
export const WATER_Y = -0.55;

export const LECTERN: Point = { x: 0, z: -1.15 };
export const PLAYER_SPOT: Point = { x: 0.95, z: -0.05 };
export const PASSENGER_SPOT: Point = { x: -0.95, z: -0.05 };
export const HOST_SPOT: Point = { x: 3.4, z: -1.0 };
export const SPAWN: Point = { x: -15, z: 0.2 };
// Where the next ones wait their turn.
export const QUEUE: Point[] = [
  { x: -2.5, z: 0.15 },
  { x: -3.7, z: 0.3 },
  { x: -4.9, z: 0.1 },
  { x: -6.1, z: 0.25 },
];

// The steamer lies along the pier; its deck is level with the planks.
export const BOAT = { x: 7.5, z: -3.9, length: 11, width: 2.6 };
export const GANGWAY: Point = { x: 4.6, z: -1.6 };
export const ON_DECK: Point = { x: 4.6, z: -3.2 };
export const SEATS: Point[] = Array.from({ length: 8 }, (_, i) => ({ x: 5.4 + (i % 4) * 1.0, z: i < 4 ? -4.45 : -3.55 }));

// Round the player, along the front of the pier, and up the gangway.
export function boardingPath(seat: number): Point[] {
  return [{ x: PASSENGER_SPOT.x, z: 0.95 }, { x: GANGWAY.x, z: 0.95 }, GANGWAY, ON_DECK, SEATS[seat % SEATS.length]];
}

export const BOUNDS: Bounds = { minX: -3, maxX: 3, minZ: -0.9, maxZ: 1.4 };

export const VIEW = { position: new THREE.Vector3(2.6, 7.4, 11.2), target: new THREE.Vector3(2.8, 0.6, -1.9) };

// The light for each crossing: sky, haze, sun and fill.
export const SKIES: Record<DayTime, { sky: string; fog: string; sun: string; sunAt: [number, number, number]; fill: string; ground: string; intensity: number }> = {
  morning: { sky: "#f6cfa8", fog: "#f3d9c0", sun: "#ffd7a1", sunAt: [-12, 6, 8], fill: "#d8c6ff", ground: "#6f8f7a", intensity: 2.1 },
  day: { sky: "#9fd3ef", fog: "#cfe7ee", sun: "#fff3dc", sunAt: [6, 14, 8], fill: "#cfe8ff", ground: "#7a9a6a", intensity: 2.6 },
  evening: { sky: "#e58f6a", fog: "#c98a8a", sun: "#ff9a5c", sunAt: [14, 4, -6], fill: "#7d6bb3", ground: "#4f4a6a", intensity: 1.7 },
};
