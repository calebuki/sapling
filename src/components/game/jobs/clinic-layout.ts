import * as THREE from "three";
import type { BodyPart, HerbColor } from "@/lib/game/clinic";
import type { Bounds, Point } from "./walk";

// Aylin's surgery as a cutaway room: the examination corner on the left, the
// cauldron in the middle with the herb jars on the counter behind it, and
// the door on the right that patients come and go through.

export const ROOM = { halfWidth: 7, back: -4.6, front: 4.6 };

export const PATIENT_SPOT: Point = { x: -3.6, z: 0.4 };
export const DOOR_OUTSIDE: Point = { x: 8.0, z: 2.4 };
export const DOOR_INSIDE: Point = { x: 6.4, z: 2.4 };
export const AISLE_Z = 2.4;
export const PLAYER_START: Point = { x: 0.8, z: 1.4 };
export const HAND_SPOT: Point = { x: -2.5, z: 0.9 };
export const HOST_SPOT: Point = { x: 3.6, z: -0.9 };

export const CAULDRON = { x: 1.8, z: -1.5 };
export const COUNTER_Z = -3.75;
export const JARS: Record<HerbColor, number> = { red: 0.2, yellow: 1.1, green: 2.0, blue: 2.9 };
export const SUGAR_X = 3.8;
export const KETTLE_X = -0.8;
export const JUG_X = 4.8;
// Where you stand to take from the counter, and to stir.
export const counterSpot = (x: number): Point => ({ x, z: -2.95 });
export const BREW_SPOT: Point = { x: 1.8, z: -0.45 };

export const BOUNDS: Bounds = { minX: -5.6, maxX: 6.2, minZ: -3.1, maxZ: 3.8 };

export const HERB_COLORS: Record<HerbColor, string> = { red: "#d64545", yellow: "#f4c24a", green: "#4f9a4a", blue: "#3f7fd1" };

// The cameras: the whole room, and close in on the patient for "where does it hurt?".
export const VIEWS = {
  room: { position: new THREE.Vector3(0.3, 8.3, 8.2), target: new THREE.Vector3(0, 0.5, -0.6) },
  exam: { position: new THREE.Vector3(-3.35, 1.6, 3.1), target: new THREE.Vector3(-3.6, 0.86, 0.4) },
};

// Where on a patient (standing at the origin, facing +z, life size) each part
// is, as clickable boxes: centre and size. Pairs are mirrored.
export const BODY: Record<BodyPart, Array<{ at: [number, number, number]; size: [number, number, number] }>> = {
  head: [{ at: [0, 1.47, 0.02], size: [0.8, 0.17, 0.72] }],
  eye: [-1, 1].map((s) => ({ at: [s * 0.155, 1.19, 0.35] as [number, number, number], size: [0.14, 0.13, 0.06] as [number, number, number] })),
  nose: [{ at: [0, 1.08, 0.37], size: [0.1, 0.09, 0.08] }],
  tooth: [{ at: [0, 0.99, 0.35], size: [0.2, 0.08, 0.06] }],
  ear: [-1, 1].map((s) => ({ at: [s * 0.47, 1.14, 0] as [number, number, number], size: [0.12, 0.22, 0.24] as [number, number, number] })),
  throat: [{ at: [0, 0.79, 0.16], size: [0.34, 0.08, 0.1] }],
  arm: [-1, 1].map((s) => ({ at: [s * 0.34, 0.62, 0] as [number, number, number], size: [0.15, 0.2, 0.2] as [number, number, number] })),
  hand: [-1, 1].map((s) => ({ at: [s * 0.34, 0.42, 0.02] as [number, number, number], size: [0.15, 0.13, 0.2] as [number, number, number] })),
  belly: [{ at: [0, 0.52, 0.19], size: [0.42, 0.3, 0.08] }],
  leg: [-1, 1].map((s) => ({ at: [s * 0.12, 0.2, 0.02] as [number, number, number], size: [0.15, 0.18, 0.2] as [number, number, number] })),
  foot: [-1, 1].map((s) => ({ at: [s * 0.12, 0.04, 0.07] as [number, number, number], size: [0.17, 0.08, 0.3] as [number, number, number] })),
};
