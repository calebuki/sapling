import * as THREE from "three";

// A soft four-step toon ramp: cartoony banding without harsh black shadows.
let ramp: THREE.DataTexture | null = null;
function toonRamp() {
  if (!ramp) {
    const steps = new Uint8Array([90, 150, 205, 255]);
    ramp = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat);
    ramp.minFilter = THREE.NearestFilter;
    ramp.magFilter = THREE.NearestFilter;
    ramp.generateMipmaps = false;
    ramp.needsUpdate = true;
  }
  return ramp;
}

const cache = new Map<string, THREE.Material>();

export function toon(color: string, options: { emissive?: string; emissiveIntensity?: number; vertexColors?: boolean; transparent?: boolean; opacity?: number } = {}) {
  const key = `${color}|${options.emissive ?? ""}|${options.emissiveIntensity ?? 0}|${options.vertexColors ? 1 : 0}|${options.opacity ?? 1}`;
  let material = cache.get(key) as THREE.MeshToonMaterial | undefined;
  if (!material) {
    material = new THREE.MeshToonMaterial({
      color,
      gradientMap: toonRamp(),
      emissive: options.emissive ?? "#000000",
      emissiveIntensity: options.emissiveIntensity ?? 0,
      vertexColors: options.vertexColors ?? false,
      transparent: options.transparent ?? false,
      opacity: options.opacity ?? 1,
    });
    cache.set(key, material);
  }
  return material;
}

export function glow(color: string, intensity = 2.2) {
  const key = `glow|${color}|${intensity}`;
  let material = cache.get(key);
  if (!material) {
    material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), toneMapped: false });
    cache.set(key, material);
  }
  return material;
}

export const palette = {
  falu: "#a8322d",
  faluDark: "#7d2420",
  trim: "#f6f1e7",
  roof: "#3a3d45",
  roofTile: "#8c4a3a",
  wood: "#9a6a44",
  woodDark: "#6e4a2f",
  plank: "#b98b5e",
  stone: "#a9aaa4",
  stoneDark: "#7f8480",
  leaf: "#5f9e4a",
  leafLight: "#86bf5b",
  pine: "#2f6b4a",
  birchBark: "#efeee8",
  sand: "#e9d7a7",
  blue: "#2f6fb5",
  yellow: "#f7c948",
  glass: "#bfe6f0",
};
