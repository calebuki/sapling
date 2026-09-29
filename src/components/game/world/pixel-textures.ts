import * as THREE from "three";
import { mulberry32 } from "@/lib/game/world";

// Tiny pixel-art detail textures, drawn in code so nothing has to download.
// Each one is a grey multiplier (1.0 = the material's own colour) that the
// toon material projects onto every face at a fixed texel density, so a
// stretched box and a tiny crate get the same crisp pixels.

export type Surface =
  | "grain"
  | "planks"
  | "siding"
  | "plaster"
  | "roof"
  | "shingle"
  | "stone"
  | "cobble"
  | "bark"
  | "birch"
  | "leaves"
  | "needles"
  | "logs"
  | "fabric"
  | "turf";

// Stored values are divided by GAIN so details can brighten as well as darken.
export const SURFACE_GAIN = 1.25;
// World units covered by one 16px tile: 16 texels per unit.
export const SURFACE_TILE = 1;

const SIZE = 16;

type Painter = (set: (x: number, y: number, v: number) => void, random: () => number) => void;

// Ordered 4x4 Bayer matrix, for dithered two-tone blends.
const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const dither = (x: number, y: number) => bayer[(y & 3) * 4 + (x & 3)];

const painters: Record<Surface, Painter> = {
  grain(set, random) {
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) set(x, y, 1 + (random() < 0.12 ? -0.06 : random() < 0.08 ? 0.05 : 0));
  },
  // Horizontal boards with dark seams, grain streaks and the odd nail.
  planks(set, random) {
    for (let y = 0; y < SIZE; y++) {
      const board = Math.floor(y / 4);
      const shade = 1 + ((board * 7) % 3) * 0.035 - 0.035;
      for (let x = 0; x < SIZE; x++) {
        let v = shade;
        if (y % 4 === 3) v = 0.72;
        else if (random() < 0.1) v -= 0.07;
        if ((x + board * 5) % 16 === 0 && y % 4 !== 3) v = 0.78;
        set(x, y, v);
      }
    }
    set(2, 1, 0.6);
    set(10, 9, 0.6);
  },
  // Vertical boards: Swedish board-and-batten walls.
  siding(set, random) {
    for (let x = 0; x < SIZE; x++) {
      const seam = x % 4 === 0;
      const batten = x % 4 === 1;
      for (let y = 0; y < SIZE; y++) {
        let v = 1 - (Math.floor(x / 4) % 2) * 0.03;
        if (seam) v = 0.74;
        else if (batten) v = 1.07;
        else if (random() < 0.07) v -= 0.06;
        set(x, y, v);
      }
    }
  },
  plaster(set, random) {
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) set(x, y, 1 - (random() < 0.1 ? 0.05 : 0) + (random() < 0.05 ? 0.03 : 0));
    set(5, 11, 0.9);
    set(6, 12, 0.9);
    set(12, 3, 0.92);
  },
  // Clay tile rows. Rows run along u so they follow a roof's ridge.
  roof(set) {
    for (let x = 0; x < SIZE; x++) {
      const row = Math.floor(x / 4);
      for (let y = 0; y < SIZE; y++) {
        const k = x % 4;
        let v = k === 0 ? 0.7 : k === 1 ? 1.08 : 1;
        if ((y + row * 2) % 4 === 0 && k !== 0) v = 0.84;
        set(x, y, v);
      }
    }
  },
  // Small staggered wooden shingles, rows along u like the tiles.
  shingle(set, random) {
    for (let x = 0; x < SIZE; x++) {
      const row = Math.floor(x / 3);
      for (let y = 0; y < SIZE; y++) {
        let v = 1 - ((Math.floor((y + (row % 2) * 2) / 4) * 3) % 5) * 0.025;
        if (x % 3 === 0) v = 0.72;
        else if ((y + (row % 2) * 2) % 4 === 0) v = 0.82;
        else if (random() < 0.06) v -= 0.05;
        set(x, y, v);
      }
    }
  },
  // Rough stone courses with mortar lines.
  stone(set, random) {
    for (let y = 0; y < SIZE; y++) {
      const course = Math.floor(y / 4);
      const offset = course % 2 ? 3 : 0;
      for (let x = 0; x < SIZE; x++) {
        const block = Math.floor((x + offset) / 6);
        let v = 0.95 + ((block * 5 + course * 3) % 4) * 0.035;
        if (y % 4 === 0 || (x + offset) % 6 === 0) v = 0.74;
        else if (random() < 0.12) v -= 0.05;
        set(x, y, v);
      }
    }
  },
  cobble(set, random) {
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) {
        const ox = (x + (Math.floor(y / 4) % 2) * 2) % 4;
        let v = 1 + ((Math.floor(x / 4) * 3 + Math.floor(y / 4) * 5) % 3) * 0.03;
        if (ox === 0 || y % 4 === 0) v = 0.8;
        else if (ox === 1 && y % 4 === 1) v = 1.1;
        else if (random() < 0.08) v -= 0.04;
        set(x, y, v);
      }
  },
  bark(set, random) {
    for (let x = 0; x < SIZE; x++) {
      const groove = x % 5 === 0 || x % 7 === 3;
      for (let y = 0; y < SIZE; y++) {
        let v = groove ? 0.74 : 1;
        if (!groove && random() < 0.12) v = 0.88;
        if (!groove && random() < 0.05) v = 1.08;
        set(x, y, v);
      }
    }
  },
  // White birch bark with short black dashes.
  birch(set, random) {
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) set(x, y, random() < 0.05 ? 0.9 : 1);
    for (const [x, y, w] of [
      [1, 2, 3],
      [9, 4, 4],
      [4, 8, 2],
      [12, 10, 3],
      [2, 13, 4],
      [8, 14, 2],
    ])
      for (let i = 0; i < w; i++) set((x + i) % SIZE, y, 0.3);
  },
  // Clumpy dithered foliage: light tops, dark gaps.
  leaves(set, random) {
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) {
        const n = Math.sin(x * 1.3 + Math.cos(y * 0.9) * 2) * Math.cos(y * 1.1 - x * 0.4);
        const d = dither(x, y);
        let v = n > 0.35 ? 1.12 : n < -0.45 ? 0.78 : 1;
        if (n > 0.15 && n <= 0.35 && d > 0.5) v = 1.12;
        if (n < -0.25 && n >= -0.45 && d > 0.5) v = 0.78;
        if (random() < 0.04) v = 1.18;
        set(x, y, v);
      }
  },
  // Fir needles: stacked zig-zag tiers.
  needles(set, random) {
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) {
        const tier = (y + Math.abs((x % 8) - 4)) % 4;
        let v = tier === 0 ? 1.13 : tier === 3 ? 0.8 : 1;
        if (random() < 0.05) v = 0.86;
        set(x, y, v);
      }
  },
  // Stacked logs for the forester's cabin: horizontal bands with round ends.
  logs(set, random) {
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) {
        const k = y % 8;
        let v = k === 0 ? 0.7 : k === 1 || k === 7 ? 0.86 : k === 2 ? 1.1 : 1;
        if (random() < 0.08 && k > 2) v -= 0.06;
        set(x, y, v);
      }
  },
  // Grass tufts for the ground: little light blades with dark roots.
  turf(set, random) {
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) set(x, y, 1);
    for (let i = 0; i < 9; i++) {
      const x = Math.floor(random() * SIZE);
      const y = Math.floor(random() * SIZE);
      set(x, y, 1.12);
      set(x, y + 1, 0.9);
      if (random() < 0.5) set(x + 1, y + 1, 1.08);
    }
    for (let i = 0; i < 6; i++) set(Math.floor(random() * SIZE), Math.floor(random() * SIZE), 0.93);
  },
  // Woven cloth for awnings and clothes.
  fabric(set) {
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) set(x, y, (x + y) % 2 ? 1.02 : 0.95);
  },
};

const cache = new Map<Surface, THREE.DataTexture>();

export function surfaceTexture(kind: Surface) {
  let texture = cache.get(kind);
  if (!texture) {
    const data = new Uint8Array(SIZE * SIZE * 4);
    const random = mulberry32(kind.length * 977 + kind.charCodeAt(0));
    painters[kind]((x, y, v) => {
      const i = ((y % SIZE) * SIZE + (x % SIZE)) * 4;
      const byte = Math.round(THREE.MathUtils.clamp(v / SURFACE_GAIN, 0, 1) * 255);
      data[i] = data[i + 1] = data[i + 2] = byte;
      data[i + 3] = 255;
    }, random);
    texture = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestMipmapNearestFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    cache.set(kind, texture);
  }
  return texture;
}
