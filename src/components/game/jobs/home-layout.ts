import type { FurnitureModel, Spot } from "@/lib/game/home";
import type { Bounds, Point } from "./walk";

// Where everything stands in the parlour, a cutaway room like the café: the
// kitchen along the back wall, the bed on the right, the table and chair in
// the middle, the sofa and lamp on the left by the door you come in through.
// Cupboards are open fronted, and things under furniture
// peek out at the edge facing the camera, so every one of them can be seen.

export const ROOM = { halfWidth: 7, back: -4.6, front: 4.6 };

type Furniture = { x: number; z: number; rot: number; spots: Partial<Record<Spot, [number, number, number]>> };

export const FURNITURE: Record<FurnitureModel, Furniture> = {
  cupboard: { x: -4.6, z: -4.05, rot: 0, spots: { in: [-4.6, 1.01, -3.92], on: [-4.6, 2.36, -3.9], next: [-3.35, 0, -3.8] } },
  stove: { x: -2.2, z: -4.05, rot: 0, spots: { on: [-2.35, 0.98, -4.0], next: [-0.95, 0, -3.8] } },
  fridge: { x: 0.35, z: -4.05, rot: 0, spots: { in: [0.35, 0.95, -3.92], next: [1.45, 0, -3.8] } },
  window: { x: 3.6, z: -4.6, rot: 0, spots: { next: [2.45, 0, -4.0] } },
  bed: { x: 5.3, z: -1.3, rot: 0, spots: { on: [5.3, 0.66, -1.35], under: [5.3, 0.02, -0.18], next: [3.9, 0, -1.3] } },
  table: { x: -0.7, z: 0.6, rot: 0, spots: { on: [-0.75, 0.83, 0.6], under: [-0.7, 0.02, 1.0], next: [-2.15, 0, 0.6] } },
  chair: { x: 1.0, z: 0.6, rot: -Math.PI / 2, spots: { on: [1.0, 0.52, 0.6], under: [1.0, 0.02, 0.82], next: [1.95, 0, 0.6] } },
  sofa: { x: -5.4, z: 1.7, rot: Math.PI / 2, spots: { on: [-5.35, 0.55, 1.4], next: [-5.4, 0, 3.4] } },
  lamp: { x: -3.2, z: 3.5, rot: 0, spots: { next: [-2.4, 0, 3.5] } },
  door: { x: -7, z: -1.6, rot: 0, spots: { next: [-6.2, 0, -0.5] } },
};

export function spotPosition(model: FurnitureModel, spot: Spot): [number, number, number] {
  return FURNITURE[model].spots[spot] ?? [FURNITURE[model].x, 0, FURNITURE[model].z];
}

export const BOUNDS: Bounds = { minX: -6.4, maxX: 6.4, minZ: -3.5, maxZ: 3.9 };

// Where you stand to pick something up: in front of it, toward the camera.
export function standFor(model: FurnitureModel, spot: Spot): Point {
  const [x, , z] = spotPosition(model, spot);
  return { x: Math.min(BOUNDS.maxX, Math.max(BOUNDS.minX, x)), z: Math.min(BOUNDS.maxZ, Math.max(BOUNDS.minZ, z + 0.85)) };
}

// The host waits in the front aisle; things are brought to her there.
export const HOST_SPOT: Point = { x: 2.9, z: 2.7 };
export const HAND_OVER: Point = { x: 2.0, z: 2.7 };
export const DOOR_OUTSIDE: Point = { x: -7.8, z: -1.6 };
export const DOOR_INSIDE: Point = { x: -6.2, z: -1.6 };
export const PLAYER_START: Point = { x: -1.8, z: 2.6 };

// Back-wall things are reached by a corridor between the chair and the bed,
// so nobody walks through the table.
const BACK = -1.9;
const CORRIDOR = 2.75;

export function route(from: Point, to: Point): Point[] {
  const back = (p: Point) => p.z < BACK;
  if (back(from) === back(to)) return [to];
  return [
    { x: CORRIDOR, z: from.z },
    { x: CORRIDOR, z: to.z },
    to,
  ];
}
