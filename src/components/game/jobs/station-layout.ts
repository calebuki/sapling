import * as THREE from "three";
import type { Corner, Heading, Node } from "@/lib/game/station";
import type { Bounds, Point } from "./walk";

// Lena's station on the south side, its ticket kiosk in front, and the little
// town of crossings to the north that travellers ask the way into.

// Wide blocks, so each corner building belongs to one crossing only.
export const NODE_X = [-7, 0, 7];
export const NODE_Z = [2.4, -4.6, -11.6, -18.6];
export const STREET = 1.9;

export const nodePoint = (n: Node): Point => ({ x: NODE_X[n.c], z: NODE_Z[n.r] });
export const cornerPoint = (n: Node, corner: Corner, out = 2.3): Point => ({ x: NODE_X[n.c] + (corner[1] === "e" ? out : -out), z: NODE_Z[n.r] + (corner[0] === "n" ? -out : out) });
// Facing north is facing -z.
export const headingRot = (h: Heading) => [Math.PI, Math.PI / 2, 0, -Math.PI / 2][h];

export const KIOSK: Point = { x: 0, z: 6.4 };
export const PLAYER_SPOT: Point = { x: 1.25, z: 6.3 };
export const TRAVELLER_SPOT: Point = { x: -1.25, z: 6.3 };
export const HOST_SPOT: Point = { x: 2.7, z: 6.9 };
export const BOARD: Point = { x: -3.2, z: 7.2 };
export const PLATFORM_EXIT: Point = { x: -7, z: 8.6 };
export const ARRIVAL: Point = { x: -9, z: 5.2 };
// From the kiosk out to the first crossing, and back.
export const TO_TOWN: Point[] = [{ x: 1.25, z: 4.6 }, { x: 0, z: 4.2 }];

export const BOUNDS: Bounds = { minX: 0.6, maxX: 2.0, minZ: 5.6, maxZ: 7.0 };

export const VIEWS = {
  counter: { position: new THREE.Vector3(0.6, 5.6, -0.9), target: new THREE.Vector3(0, 0.9, 6.5) },
  town: { position: new THREE.Vector3(0, 30, 3.5), target: new THREE.Vector3(0, 0, -7.6) },
};
