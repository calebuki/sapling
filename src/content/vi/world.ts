import { createWorld } from "@/lib/game/world";

// Cát Bà: a fishing village on an island in Lan Hạ Bay, at the edge of Hạ Long
// Bay, with limestone pillars standing in the sea all around it. The boats
// land in the south; the banyan square sits in the middle, Bác Hùng's phở shop
// to the west, the market to the east, Ông Sơn's house by the water in the
// south-east and a little pagoda on the hill in the north.

const places = {
  dock: { x: 0, z: 31 },
  square: { x: 0, z: 7 },
  pho: { x: -14, z: 6 },
  market: { x: 14, z: 3 },
  house: { x: 14, z: 17 },
  pagoda: { x: 3, z: -24 },
  forest: { x: -20, z: -11 },
};

export const world = createWorld({
  shore: {
    base: 34,
    waves: [
      { amp: 2.6, freq: 3, phase: 1.4, fn: "sin" },
      { amp: 2.2, freq: 5, phase: 0.6, fn: "cos" },
      { amp: 1.1, freq: 8, phase: 2.1, fn: "sin" },
    ],
  },
  places,
  dock: { x: 0, zStart: 25, zEnd: 40, halfWidth: 1.7, height: 0.95 },
  spawn: { x: 0, z: 37, facing: Math.PI },
  paths: [
    [0, 26, 0, 10],
    [0, 7, -10, 6.5],
    [-10, 6.5, -12, 6.2],
    [0, 7, 10, 4],
    [2, 10, 11, 15],
    [0, 7, 1, -8],
    [1, -8, 3, -19],
    [-10, 6.5, -18, -6],
  ],
  pads: [
    { x: places.square.x, z: places.square.z, r: 8 },
    { x: places.pho.x, z: places.pho.z, r: 8 },
    { x: places.market.x, z: places.market.z, r: 8 },
    { x: places.house.x, z: places.house.z, r: 6 },
    { x: places.pagoda.x, z: places.pagoda.z, r: 6 },
    { x: places.forest.x, z: places.forest.z, r: 4 },
    { x: 0, z: 24, r: 5 },
  ],
  hills: [
    // The pagoda's hill, and the forested hills in the west.
    { x: places.pagoda.x, z: places.pagoda.z, height: 6, spread: 90 },
    { x: -22, z: -16, height: 4, spread: 80 },
    { x: -8, z: -24, height: 2.4, spread: 60 },
    { x: 20, z: -14, height: 1.6, spread: 60 },
  ],
  buildingColliders: [
    { x: places.pho.x - 1.6, z: places.pho.z - 0.6, r: 3.4 },
    { x: places.market.x + 1.5, z: places.market.z - 1.8, r: 2.4 },
    { x: places.market.x + 2.2, z: places.market.z + 2.2, r: 1.8 },
    { x: places.house.x + 1.4, z: places.house.z + 0.8, r: 3.4 },
    { x: places.pagoda.x, z: places.pagoda.z - 1.4, r: 3.2 },
    { x: places.square.x, z: places.square.z, r: 1.6 },
    // Bác Hùng's little tables and Lan's ticket hut
    { x: -9.6, z: 10, r: 0.9 },
    { x: -3.4, z: 25.5, r: 1.3 },
  ],
  cottages: [
    { x: -24, z: 6, rot: 1.3, color: "#f1d27a", size: 1 },
    { x: 22, z: 11, rot: -2.4, color: "#f4efe4", size: 0.95 },
    { x: -7, z: 21, rot: 0.3, color: "#e9c46a", size: 0.85 },
    { x: -15, z: -20, rot: 0.9, color: "#f4efe4", size: 0.9 },
    { x: 18, z: -6, rot: -1.9, color: "#f1d27a", size: 0.85 },
  ],
  // The landing, the market lane and the tables stay clear of trees.
  keepClear: [
    { x: 0, z: 24, r: 5 },
    { x: -9.6, z: 10, r: 2.4 },
    { x: 11, z: 6, r: 2.5 },
    { x: 17, z: 21, r: 3 },
  ],
});
