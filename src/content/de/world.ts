import { createWorld } from "@/lib/game/world";

// Tannenau: a hilly island in a Black Forest lake. The boat lands in the
// south, the market square sits in the middle with the bakery to the west and
// the little railway station to the east, and the old farm and the chapel
// look down from the hills in the north.

const places = {
  dock: { x: 0, z: 31 },
  square: { x: 0, z: 7 },
  bakery: { x: -15, z: 5 },
  station: { x: 18, z: -3 },
  clockmaker: { x: 12, z: 16 },
  doctor: { x: -13, z: 17 },
  farm: { x: -7, z: -19 },
  forest: { x: -23, z: -6 },
  school: { x: 17, z: -18 },
  chapel: { x: 6, z: -26 },
};

export const world = createWorld({
  shore: {
    base: 34,
    waves: [
      { amp: 3.0, freq: 2, phase: 0.9, fn: "sin" },
      { amp: 2.4, freq: 5, phase: 0.3, fn: "cos" },
      { amp: 1.3, freq: 7, phase: 2.6, fn: "sin" },
    ],
  },
  places,
  dock: { x: 0, zStart: 25, zEnd: 40, halfWidth: 1.7, height: 0.95 },
  spawn: { x: 0, z: 37, facing: Math.PI },
  paths: [
    [0, 26, 0, 10],
    [0, 7, -11, 5.5],
    [-11, 5.5, -13, 5.2],
    [0, 7, 13, 0],
    [13, 0, 15.5, -1.5],
    [2, 10, 9, 14],
    [-2, 10, -9, 15],
    [0, 7, -2, -8],
    [-2, -8, -5, -15],
    [-2, -8, 4, -20],
    [-11, 5.5, -19, -3],
    [15, -1, 16, -13],
  ],
  pads: [
    { x: places.square.x, z: places.square.z, r: 8 },
    { x: places.bakery.x, z: places.bakery.z, r: 8 },
    { x: places.station.x, z: places.station.z, r: 9 },
    { x: places.clockmaker.x, z: places.clockmaker.z, r: 6 },
    { x: places.doctor.x, z: places.doctor.z, r: 6 },
    { x: places.farm.x, z: places.farm.z, r: 8 },
    { x: places.forest.x, z: places.forest.z, r: 5 },
    { x: places.school.x, z: places.school.z, r: 6 },
    { x: places.chapel.x, z: places.chapel.z, r: 5 },
    { x: 0, z: 24, r: 5 },
  ],
  hills: [
    { x: places.chapel.x, z: places.chapel.z, height: 5.2, spread: 80 },
    { x: places.farm.x, z: places.farm.z, height: 2.6, spread: 110 },
    { x: -24, z: -12, height: 2.4, spread: 70 },
    { x: 18, z: -20, height: 1.4, spread: 60 },
  ],
  buildingColliders: [
    { x: places.bakery.x - 1.4, z: places.bakery.z - 1, r: 4.2 },
    { x: places.station.x + 0.5, z: places.station.z - 1.5, r: 3.8 },
    { x: places.clockmaker.x + 1, z: places.clockmaker.z + 1.2, r: 3.3 },
    { x: places.doctor.x - 0.8, z: places.doctor.z + 1, r: 3.2 },
    { x: places.farm.x - 2.5, z: places.farm.z - 2.6, r: 4.6 },
    { x: places.forest.x - 1.6, z: places.forest.z - 1, r: 2.8 },
    { x: places.school.x + 1.2, z: places.school.z - 1, r: 3.4 },
    { x: places.chapel.x + 0.2, z: places.chapel.z - 1.6, r: 2.6 },
    { x: places.square.x, z: places.square.z, r: 1.6 },
    { x: 5.8, z: 10.5, r: 1.3 },
    // the fountain, the café counter and Greta's ticket hut
    { x: -4.5, z: 3.5, r: 1.6 },
    { x: -9, z: 9.8, r: 0.9 },
    { x: -3.4, z: 25.5, r: 1.3 },
  ],
  cottages: [
    { x: -25, z: 7, rot: 1.3, color: "#f6efe2", size: 1 },
    { x: 21, z: 13, rot: -2.4, color: "#f3e6c8", size: 0.95 },
    { x: -6.5, z: 22.5, rot: 0.3, color: "#f6efe2", size: 0.85 },
    { x: -17, z: -21, rot: 0.9, color: "#f3e6c8", size: 0.9 },
    { x: -27, z: -15, rot: 1.1, color: "#efe2cf", size: 0.85 },
  ],
  // The landing stage, the market stall and the railway line stay clear of trees.
  keepClear: [
    { x: 0, z: 24, r: 5 },
    { x: 5.8, z: 10.5, r: 3 },
    { x: 25.5, z: 6, r: 3.2 },
    { x: 24, z: 0, r: 3.5 },
    { x: 24, z: -6, r: 3.5 },
    { x: 25.5, z: -12, r: 3.2 },
    { x: -4.5, z: 3.5, r: 2.5 },
    { x: -9, z: 9.8, r: 2 },
  ],
});
