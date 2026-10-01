import * as THREE from "three";
import type { Bounds, Point } from "./walk";

// Marie's stall on the market square: a long counter of produce crates with
// the basket and till at its right end, and a clothes rail beside it. You
// work behind the counter; customers come up the square from the left.

export const COUNTER = { minX: -3.7, maxX: 3.1, z: 0.2, depth: 1.0, top: 1.0 };
// Crates sit along the counter, one per kind of produce.
export const crateX = (i: number) => -3.3 + i * 0.55;
export const BASKET_X = 1.8;
export const TILL_X = 2.65;
export const BEHIND_Z = -0.75;
export const behind = (x: number): Point => ({ x, z: BEHIND_Z });

export const PLAYER_START: Point = { x: 0.6, z: BEHIND_Z };
export const HOST_SPOT: Point = { x: 2.95, z: -1.15 };
export const STREET: Point = { x: -10, z: 3.2 };
// Customers wait at the till end, so the crates stay in view.
export const COUNTER_SPOT: Point = { x: 2.3, z: 1.45 };

// The clothes rail, with the hangers along it and where shoppers stand.
export const RAIL = { x: 6.3, z: -0.2, halfWidth: 2.2, y: 2.25 };
// The gap between the counter and the rail you walk through.
export const GAP_X = 3.6;
export const hangerX = (i: number, n: number) => RAIL.x - RAIL.halfWidth + 0.35 + (i * (RAIL.halfWidth * 2 - 0.7)) / Math.max(1, n - 1);
export const RAIL_FRONT_Z = 0.55;
// Shoppers wait beside the mirror, so the rail stays in view.
export const CLOTHES_SPOT: Point = { x: 9.0, z: 1.6 };
export const HAND_SPOT: Point = { x: 8.2, z: 1.15 };

export const BOUNDS: Bounds = { minX: -3.6, maxX: 8.6, minZ: -1.2, maxZ: 1.4 };

export const VIEWS = {
  stall: { position: new THREE.Vector3(1.0, 6.4, 9.6), target: new THREE.Vector3(1.1, 0.4, -0.4) },
  rail: { position: new THREE.Vector3(6.6, 4.6, 8.4), target: new THREE.Vector3(6.6, 1.1, -0.2) },
};
