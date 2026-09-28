import { createWorld } from "@/lib/game/world";

// Lilla Ö: a rounded skerry with a ferry dock in the south, the café and
// station either side of the square, and a garden and lookout up the hill.

const places = {
  dock: { x: 0, z: 30 },
  square: { x: 0, z: 5 },
  cafe: { x: -16, z: 2 },
  station: { x: 18, z: -5 },
  garden: { x: -4, z: -18 },
  lookout: { x: 7, z: -23 },
};

export const world = createWorld({
  shore: {
    base: 33,
    waves: [
      { amp: 3.6, freq: 3, phase: 0.5, fn: "sin" },
      { amp: 2.2, freq: 5, phase: 1.3, fn: "cos" },
      { amp: 1.2, freq: 7, phase: 2.1, fn: "sin" },
    ],
  },
  places,
  // Dock planks run from the shore out to the ferry.
  dock: { x: 0, zStart: 23, zEnd: 38, halfWidth: 1.6, height: 0.95 },
  spawn: { x: 0, z: 34.5, facing: Math.PI },
  paths: [
    [0, 24, 0, 8],
    [0, 5, -11, 3.5],
    [-11, 3.5, -14, 3],
    [0, 5, 13, -1],
    [13, -1, 16, -3],
    [0, 5, -1, -10],
    [-1, -10, -2, -14],
    [-1, -10, 6, -20],
  ],
  pads: [
    { x: places.square.x, z: places.square.z, r: 7 },
    { x: places.cafe.x, z: places.cafe.z, r: 8 },
    { x: places.station.x, z: places.station.z, r: 9 },
    { x: places.garden.x, z: places.garden.z, r: 6 },
    { x: 0, z: 22, r: 5 },
  ],
  hills: [
    { x: places.lookout.x, z: places.lookout.z, height: 4.2, spread: 70 },
    { x: places.garden.x, z: places.garden.z, height: 1.8, spread: 90 },
    { x: -20, z: -12, height: 1.2, spread: 60 },
  ],
  buildingColliders: [
    { x: places.cafe.x - 1.2, z: places.cafe.z - 1, r: 4.1 },
    { x: places.station.x + 0.5, z: places.station.z - 1.5, r: 3.8 },
    { x: places.garden.x - 3.2, z: places.garden.z - 2.5, r: 2.6 },
    { x: places.square.x, z: places.square.z, r: 1.4 },
  ],
  cottages: [
    { x: -11, z: 16, rot: 0.4, color: "#b0413e", size: 1 },
    { x: 11, z: 15, rot: -0.5, color: "#e3b448", size: 0.9 },
    { x: -23, z: -8, rot: 1.2, color: "#b0413e", size: 1.1 },
    { x: 21, z: 10, rot: -1.1, color: "#6f8fb5", size: 0.95 },
    { x: -20, z: 13, rot: 0.9, color: "#e9e2d0", size: 0.85 },
    { x: 16, z: -17, rot: -0.3, color: "#b0413e", size: 0.9 },
  ],
  keepClear: [{ x: 0, z: 22, r: 5 }],
});
