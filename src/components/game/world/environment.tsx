"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { mulberry32 } from "@/lib/game/world";
import { island } from "../island";
import { getGame, runtime } from "../store";
import { groundMaterial } from "./materials";
import { dither } from "./pixel-textures";

export const FOG = { color: "#cfe6ee", near: 85, far: 260 };
export const SUN_DIRECTION = new THREE.Vector3(-0.55, 0.62, 0.55).normalize();

const grassA = new THREE.Color("#79b457");
const grassB = new THREE.Color("#63a04a");
const grassHigh = new THREE.Color("#98c464");
const grassDark = new THREE.Color("#548f42");
const dirt = new THREE.Color("#d2b07e");
const dirtEdge = new THREE.Color("#b99a6a");
const sand = new THREE.Color("#efdcaa");
const wetSand = new THREE.Color("#cdb582");
const seabed = new THREE.Color("#7fb8a8");
const blossoms = ["#ffffff", "#ffd35c", "#ff8fb1"].map((c) => new THREE.Color(c));

// The ground is baked into a pixel colour map: every texel is one flat colour,
// and where two ground types meet they mix with an ordered dither instead of
// a smooth gradient, the way hand-drawn pixel art blends.
const TERRAIN_SIZE = 112;
const TERRAIN_TEXELS = 896;

function useGroundMap() {
  const { heightAt, pathDistance, shoreDistance } = island().world;
  return useMemo(() => {
    const n = TERRAIN_TEXELS;
    const data = new Uint8Array(n * n * 4);
    const color = new THREE.Color();
    const random = mulberry32(7);
    const pick = (target: THREE.Color, amount: number, x: number, y: number) => {
      if (amount >= 1 || (amount > 0 && amount > dither(x, y))) color.copy(target);
    };
    for (let row = 0; row < n; row++) {
      const z = TERRAIN_SIZE / 2 - ((row + 0.5) / n) * TERRAIN_SIZE;
      for (let col = 0; col < n; col++) {
        const x = ((col + 0.5) / n) * TERRAIN_SIZE - TERRAIN_SIZE / 2;
        const shore = shoreDistance(x, z);
        const noise = random();
        if (shore < -7) {
          color.copy(seabed);
        } else {
          const y = heightAt(x, z);
          const patch = 0.5 + 0.5 * Math.sin(x * 0.18 + Math.cos(z * 0.13) * 2) * Math.cos(z * 0.21 - x * 0.05);
          color.copy(grassA);
          pick(grassB, (patch - 0.45) * 4, col, row);
          pick(grassHigh, (y - 2.2) / 1.5, col, row);
          if (noise < 0.035) color.copy(grassDark);
          else if (noise > 0.996) color.copy(blossoms[Math.floor(noise * 1000) % blossoms.length]);
          const path = pathDistance(x, z);
          pick(dirtEdge, (2.05 - path) / 0.25, col, row);
          pick(dirt, (1.8 - path) / 0.35, col, row);
          pick(sand, (3.2 - shore) / 1.2, col, row);
          pick(wetSand, (0.35 - y) / 0.4, col, row);
          pick(seabed, (-0.3 - y) / 0.8, col, row);
        }
        const i = (row * n + col) * 4;
        color.convertLinearToSRGB();
        data[i] = Math.round(color.r * 255);
        data[i + 1] = Math.round(color.g * 255);
        data[i + 2] = Math.round(color.b * 255);
        data[i + 3] = 255;
      }
    }
    const texture = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestMipmapNearestFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
  }, [heightAt, pathDistance, shoreDistance]);
}

export function Terrain() {
  const { heightAt } = island().world;
  const map = useGroundMap();
  const material = useMemo(() => groundMaterial(map), [map]);
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, 200, 200);
    geo.rotateX(-Math.PI / 2);
    const position = geo.attributes.position;
    for (let i = 0; i < position.count; i++) position.setY(i, heightAt(position.getX(i), position.getZ(i)));
    geo.computeVertexNormals();
    return geo;
  }, [heightAt]);

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 6 || getGame().phase !== "explore" || getGame().overlay) return;
    event.stopPropagation();
    runtime.walkTarget = { x: event.point.x, z: event.point.z };
  };

  return <mesh geometry={geometry} material={material} receiveShadow onClick={onClick} />;
}

const waterVertex = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorld;
  varying float vViewDepth;
  void main() {
    vec3 p = position;
    float w = sin(p.x * 0.18 + uTime * 0.9) * 0.06 + cos(p.z * 0.22 + uTime * 0.7) * 0.06;
    p.y += w;
    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorld = world.xyz;
    vec4 view = viewMatrix * world;
    vViewDepth = -view.z;
    gl_Position = projectionMatrix * view;
  }
`;

const waterFragment = (radius: string) => /* glsl */ `
  uniform float uTime;
  uniform vec3 uFogColor;
  uniform vec3 uShallow;
  uniform vec3 uMid;
  uniform vec3 uDeep;
  uniform float uFogNear;
  uniform float uFogFar;
  varying vec3 vWorld;
  varying float vViewDepth;

  float islandRadius(float a) {
    return ${radius};
  }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  float bayer(vec2 p) {
    vec2 q = mod(floor(p), 4.0);
    int i = int(q.x + q.y * 4.0);
    float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
    return (m[i] + 0.5) / 16.0;
  }

  void main() {
    // Work on a world-space pixel grid so the water shares the island's texel size.
    vec2 texel = floor(vWorld.xz * 6.0);
    vec2 P = (texel + 0.5) / 6.0;
    float dth = bayer(texel);
    float r = length(P);
    float a = atan(P.y, P.x);
    float d = r - islandRadius(a);

    // Three flat bands of depth with dithered borders.
    vec3 col = uShallow;
    if (smoothstep(1.0, 7.0, d) > dth) col = uMid;
    if (smoothstep(10.0, 40.0, d) > dth) col = uDeep;

    // Drifting ripple highlights, drawn as short pixel dashes.
    float n = noise(P * vec2(0.5, 1.4) + vec2(uTime * 0.12, uTime * 0.05));
    float n2 = noise(P * 0.8 - vec2(uTime * 0.09, -uTime * 0.04));
    col = mix(col, mix(col, vec3(1.0), 0.22), step(0.82, n * n2 * 1.9));

    // Foam on the beach and rings rolling in, breathing with the tide.
    float foamEdge = 0.6 + 0.5 * sin(uTime * 1.3 + a * 6.0);
    float foam = step(d, foamEdge + 0.9) * step(-3.4, d);
    float ring = step(abs(fract(d * 0.45 - uTime * 0.35) - 0.5), 0.07) * step(d, 5.0);
    col = mix(col, vec3(1.0), clamp(foam * 0.9 + ring * 0.55, 0.0, 1.0));

    // Sun glints.
    float glint = step(0.97, noise(P * 2.4 + uTime * 0.6)) * step(0.6, noise(P * 0.2 + uTime * 0.1)) * step(d, 30.0);
    col = mix(col, vec3(1.0), glint * 0.8);

    float fogFactor = smoothstep(uFogNear, uFogFar, vViewDepth);
    gl_FragColor = vec4(mix(col, uFogColor, fogFactor), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// The sea around Lilla Ö; islands in lakes bring their own colours.
const seaWater = { shallow: "#adedea", mid: "#76cbe5", deep: "#59a2ce" };

export function fogColor() {
  return island().theme?.fog ?? FOG.color;
}

export function Water() {
  const radius = island().world.radiusGlsl;
  const water = island().theme?.water ?? seaWater;
  const fog = fogColor();
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: waterVertex,
        fragmentShader: waterFragment(radius),
        uniforms: {
          uTime: { value: 0 },
          uFogColor: { value: new THREE.Color(fog) },
          uShallow: { value: new THREE.Color(water.shallow) },
          uMid: { value: new THREE.Color(water.mid) },
          uDeep: { value: new THREE.Color(water.deep) },
          uFogNear: { value: FOG.near },
          uFogFar: { value: FOG.far },
        },
      }),
    [radius, water, fog],
  );
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    const shader = mesh.current?.material as THREE.ShaderMaterial | undefined;
    if (shader) shader.uniforms.uTime.value += delta;
  });
  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} position-y={0.02} material={material}>
      <planeGeometry args={[420, 420, 160, 160]} />
    </mesh>
  );
}

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const skyFragment = /* glsl */ `
  uniform vec3 uSun;
  varying vec3 vDir;
  void main() {
    float h = vDir.y;
    vec3 horizon = vec3(1.0, 0.9, 0.76);
    vec3 mid = vec3(0.66, 0.85, 0.96);
    vec3 zenith = vec3(0.33, 0.62, 0.9);
    vec3 col = mix(horizon, mid, smoothstep(-0.02, 0.18, h));
    col = mix(col, zenith, smoothstep(0.18, 0.75, h));
    float sun = max(dot(normalize(vDir), normalize(uSun)), 0.0);
    col += vec3(1.0, 0.85, 0.6) * pow(sun, 24.0) * 0.45;
    col += vec3(1.0, 0.97, 0.9) * smoothstep(0.9985, 0.9993, sun) * 1.4;
    col = mix(col, vec3(0.81, 0.9, 0.93), smoothstep(0.05, -0.2, h));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export function Sky() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        uniforms: { uSun: { value: SUN_DIRECTION } },
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );
  return (
    <mesh material={material} renderOrder={-1}>
      <sphereGeometry args={[320, 32, 16]} />
    </mesh>
  );
}

const cloudMaterial = new THREE.MeshToonMaterial({ color: "#ffffff", fog: false, emissive: "#fff6ea", emissiveIntensity: 0.35 });

export function Clouds() {
  const group = useRef<THREE.Group>(null);
  const clouds = useMemo(() => {
    const random = mulberry32(42);
    return Array.from({ length: 14 }, (_, i) => {
      const angle = (i / 14) * Math.PI * 2 + random() * 0.3;
      const radius = 120 + random() * 70;
      return {
        position: [Math.cos(angle) * radius, 34 + random() * 26, Math.sin(angle) * radius] as const,
        scale: 5 + random() * 6,
        puffs: Array.from({ length: 4 + Math.floor(random() * 3) }, (_, j) => ({
          x: (j - 2) * 1.2 + random() * 0.6,
          y: random() * 0.6,
          z: random() * 0.8 - 0.4,
          s: 0.8 + random() * 0.7,
        })),
      };
    });
  }, []);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.004;
  });
  return (
    <group ref={group}>
      {clouds.map((cloud, i) => (
        <group key={i} position={cloud.position} scale={cloud.scale}>
          {cloud.puffs.map((p, j) => (
            <mesh key={j} position={[p.x, p.y, p.z]} scale={[p.s * 1.2, p.s * 0.8, p.s]} material={cloudMaterial}>
              <sphereGeometry args={[1, 12, 10]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
