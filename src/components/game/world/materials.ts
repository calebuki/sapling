import * as THREE from "three";
import { SURFACE_GAIN, SURFACE_TILE, surfaceTexture, type Surface } from "./pixel-textures";

export type { Surface } from "./pixel-textures";

// A chunky three-step toon ramp: clear light, mid and shadow bands.
let ramp: THREE.DataTexture | null = null;
export function toonRamp() {
  if (!ramp) {
    const steps = new Uint8Array([110, 175, 255]);
    ramp = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat);
    ramp.minFilter = THREE.NearestFilter;
    ramp.magFilter = THREE.NearestFilter;
    ramp.generateMipmaps = false;
    ramp.needsUpdate = true;
  }
  return ramp;
}

// Projects a pixel texture onto each face along its dominant axis, in object
// space scaled to world size. Boxes, cylinders and hand-built roofs need no UVs,
// and every surface shares one texel density however it was scaled.
function withSurface(material: THREE.MeshToonMaterial, kind: Surface) {
  material.defines = { ...material.defines, USE_SURFACE: "" };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSurface = { value: surfaceTexture(kind) };
    shader.uniforms.uSurfaceGain = { value: SURFACE_GAIN };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vSurfPos;\nvarying vec3 vSurfNormal;",
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vec3 surfScale = vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz));
        vec3 surfOffset = vec3(0.0);
        #ifdef USE_INSTANCING
          surfScale *= vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
          surfOffset = instanceMatrix[3].xyz;
        #endif
        vSurfPos = position * surfScale + surfOffset;
        vSurfNormal = normal;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vSurfPos;\nvarying vec3 vSurfNormal;\nuniform sampler2D uSurface;\nuniform float uSurfaceGain;",
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        vec3 surfAxis = abs(vSurfNormal);
        vec2 surfUv = surfAxis.x >= surfAxis.y && surfAxis.x >= surfAxis.z ? vSurfPos.zy : (surfAxis.y >= surfAxis.z ? vSurfPos.xz : vSurfPos.xy);
        diffuseColor.rgb *= texture2D(uSurface, surfUv / ${SURFACE_TILE.toFixed(3)}).rgb * uSurfaceGain;`,
      );
  };
  material.customProgramCacheKey = () => `surface-${kind}`;
  return material;
}

const cache = new Map<string, THREE.Material>();

// The ground: a baked pixel colour map with grass tufts on top.
export function groundMaterial(map: THREE.Texture) {
  return withSurface(new THREE.MeshToonMaterial({ color: "#ffffff", map, gradientMap: toonRamp() }), "turf");
}

export type ToonOptions = {
  emissive?: string;
  emissiveIntensity?: number;
  vertexColors?: boolean;
  transparent?: boolean;
  opacity?: number;
  // Pixel detail painted onto the surface; null keeps it flat (faces, glass).
  surface?: Surface | null;
};

export function toon(color: string, options: ToonOptions = {}) {
  const surface = options.surface === undefined ? "grain" : options.surface;
  const key = `${color}|${options.emissive ?? ""}|${options.emissiveIntensity ?? 0}|${options.vertexColors ? 1 : 0}|${options.opacity ?? 1}|${surface ?? ""}`;
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
    if (surface) withSurface(material, surface);
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

// Warm, slightly muted colours that sit well together once pixelated.
export const palette = {
  falu: "#a83a2f",
  faluDark: "#7d2a24",
  trim: "#f6efe0",
  roof: "#3d3f4a",
  roofTile: "#9a4f3a",
  wood: "#9a6a44",
  woodDark: "#6b4830",
  plank: "#be9163",
  stone: "#aaa89e",
  stoneDark: "#80827c",
  leaf: "#5c9a47",
  leafLight: "#8ec25e",
  pine: "#2f6a4a",
  birchBark: "#f0ede4",
  sand: "#ead6a4",
  blue: "#3570b3",
  yellow: "#f4c24a",
  glass: "#bfe6f0",
};
