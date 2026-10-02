import * as THREE from "three";
import type { Point } from "./walk";

// The rescue map: square tiles of countryside in a grid, each its own place
// with its own weather, seen from above like a map on a table. You and the
// forester stand at the radio by its corner.

export const TILE = 3.4;
export const GAP = 0.35;
export const TILE_HEIGHT = 0.5;
const STEP = TILE + GAP;

export function gridOf(n: number) {
  const cols = n <= 4 ? 2 : n === 9 ? 3 : Math.ceil(n / 2);
  return { cols, rows: Math.ceil(n / cols) };
}

// The middle of tile `index` on a map of `n`, at ground level.
export function tileCenter(index: number, n: number): [number, number] {
  const { cols, rows } = gridOf(n);
  const col = index % cols;
  const row = Math.floor(index / cols);
  return [(col - (cols - 1) / 2) * STEP, (row - (rows - 1) / 2) * STEP];
}

// Where you, the forester and the radio stand, beside the map on the right.
export function stationOf(n: number) {
  const { cols } = gridOf(n);
  const right = (cols * STEP) / 2 + 1.3;
  return {
    player: { x: right, z: 0.2 } as Point,
    host: { x: right + 0.35, z: -1.4 } as Point,
    radio: [right - 0.2, 1.05, 1.4] as [number, number, number],
  };
}

// Everything that should be in view: the map, and the people at the radio.
export function viewBox(n: number) {
  const { cols, rows } = gridOf(n);
  const halfW = (cols * STEP) / 2;
  const halfD = (rows * STEP) / 2;
  return new THREE.Box3(new THREE.Vector3(-halfW, 0, -halfD), new THREE.Vector3(halfW + 2.0, 1.6, halfD + 0.2));
}

// Looking down steeply, as at a map, but enough from the front that the
// mountains stand up.
export const VIEW_DIRECTION = new THREE.Vector3(0, 1.3, 1);
