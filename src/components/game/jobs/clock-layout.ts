import * as THREE from "three";
import type { Bounds, Point } from "./walk";

// The clockmaker's workshop: a workbench in the middle with the customer's
// clock on an easel, the big wall clock on the back wall, cuckoo clocks all
// around, and the door on the right.

export const ROOM = { halfWidth: 7, back: -4.6, front: 4.6 };

export const BENCH = { x: 0.3, z: -0.9, width: 4.2, depth: 1.3, height: 1.0 };
// The clock you set stands on an easel on the bench, facing you.
export const EASEL = { x: 0.3, y: 1.9, z: -0.7, radius: 0.62 };
export const WALL_CLOCK = { x: 0.3, y: 3.3, z: -4.45, radius: 0.95 };

export const CUSTOMER_SPOT: Point = { x: -2.3, z: 0.7 };
export const PLAYER_SPOT: Point = { x: -1.05, z: 0.35 };
export const HOST_SPOT: Point = { x: 2.6, z: -1.9 };
export const DOOR_OUTSIDE: Point = { x: 8.0, z: 2.4 };
export const DOOR_INSIDE: Point = { x: 6.4, z: 2.4 };
export const AISLE_Z = 2.4;
export const PLAYER_START: Point = { x: -0.4, z: 1.6 };

export const BOUNDS: Bounds = { minX: -5.6, maxX: 6.2, minZ: -0.1, maxZ: 3.8 };

export const VIEWS = {
  room: { position: new THREE.Vector3(0.3, 8.2, 8.0), target: new THREE.Vector3(0, 0.8, -0.8) },
  set: { position: new THREE.Vector3(EASEL.x + 0.35, EASEL.y + 0.1, EASEL.z + 2.9), target: new THREE.Vector3(EASEL.x + 0.35, EASEL.y - 0.05, EASEL.z) },
  // Looking a little below the wall clock keeps it clear of the answer panel.
  wall: { position: new THREE.Vector3(WALL_CLOCK.x, WALL_CLOCK.y - 0.3, WALL_CLOCK.z + 4.6), target: new THREE.Vector3(WALL_CLOCK.x, WALL_CLOCK.y - 0.7, WALL_CLOCK.z) },
};
