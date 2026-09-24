"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { heightAt, pathDistance, shoreDistance, mulberry32 } from "@/lib/game/world";
import { getGame, runtime } from "../store";
import { toon } from "./materials";

export const FOG = { color: "#cfe6ee", near: 85, far: 260 };
export const SUN_DIRECTION = new THREE.Vector3(-0.55, 0.62, 0.55).normalize();

const grassA = new THREE.Color("#79b457");
const grassB = new THREE.Color("#5f9c47");
const grassHigh = new THREE.Color("#9cc766");
const dirt = new THREE.Color("#d2b07e");
const sand = new THREE.Color("#efdcaa");
const wetSand = new THREE.Color("#cdb582");
const seabed = new THREE.Color("#7fb8a8");

export function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(112, 112, 200, 200);
    geo.rotateX(-Math.PI / 2);
    const position = geo.attributes.position;
    const colors = new Float32Array(position.count * 3);
    const color = new THREE.Color();
    const random = mulberry32(7);
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const y = heightAt(x, z);
      position.setY(i, y);
      const shore = shoreDistance(x, z);
      const patch = 0.5 + 0.5 * Math.sin(x * 0.18 + Math.cos(z * 0.13) * 2) * Math.cos(z * 0.21 - x * 0.05);
      color.copy(grassA).lerp(grassB, patch * 0.8 + random() * 0.12);
      color.lerp(grassHigh, Math.min(1, Math.max(0, (y - 1.6) / 3)) * 0.7);
      const path = pathDistance(x, z);
      if (path < 1.9) color.lerp(dirt, Math.min(1, (1.9 - path) / 0.6) * 0.92);
      if (shore < 3.2) color.lerp(sand, Math.min(1, (3.2 - shore) / 1.2));
      if (y < 0.35) color.lerp(wetSand, Math.min(1, (0.35 - y) / 0.4));
      if (y < -0.3) color.lerp(seabed, Math.min(1, (-0.3 - y) / 0.8));
      colors.set([color.r, color.g, color.b], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 6 || getGame().phase !== "explore" || getGame().overlay) return;
    event.stopPropagation();
    runtime.walkTarget = { x: event.point.x, z: event.point.z };
  };

  return (
    <mesh geometry={geometry} material={toon("#ffffff", { vertexColors: true })} receiveShadow onClick={onClick} />
  );
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

const waterFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;
  varying vec3 vWorld;
  varying float vViewDepth;

  float islandRadius(float a) {
    return 33.0 + 3.6 * sin(3.0 * a + 0.5) + 2.2 * cos(5.0 * a + 1.3) + 1.2 * sin(7.0 * a + 2.1);
  }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    float r = length(vWorld.xz);
    float a = atan(vWorld.z, vWorld.x);
    float d = r - islandRadius(a);
    vec3 shallow = vec3(0.42, 0.85, 0.82);
    vec3 mid = vec3(0.18, 0.6, 0.78);
    vec3 deep = vec3(0.1, 0.36, 0.62);
    vec3 col = mix(shallow, mid, smoothstep(-1.0, 7.0, d));
    col = mix(col, deep, smoothstep(8.0, 45.0, d));

    // Soft moving caustic ripples.
    float n = noise(vWorld.xz * 0.35 + vec2(uTime * 0.12, uTime * 0.08));
    float n2 = noise(vWorld.xz * 0.6 - vec2(uTime * 0.1, -uTime * 0.05));
    col += (smoothstep(0.62, 0.9, n * n2 * 1.9)) * 0.12;

    // Foam where the waves meet the beach, breathing in and out.
    float foamEdge = 0.6 + 0.5 * sin(uTime * 1.3 + a * 6.0);
    float foam = smoothstep(foamEdge + 1.6, foamEdge, d) * step(-3.4, d);
    float foamLine = smoothstep(0.08, 0.0, abs(fract(d * 0.45 - uTime * 0.35) - 0.5) - 0.38) * smoothstep(6.0, 0.5, d);
    col = mix(col, vec3(1.0), clamp(foam * 0.85 + foamLine * 0.35 * (0.6 + n), 0.0, 1.0));

    // Sun glints.
    float glint = step(0.93, noise(vWorld.xz * 2.4 + uTime * 0.6)) * step(0.5, noise(vWorld.xz * 0.2 + uTime * 0.1));
    col += glint * 0.55;

    float fogFactor = smoothstep(uFogNear, uFogFar, vViewDepth);
    gl_FragColor = vec4(mix(col, uFogColor, fogFactor), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function Water() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: waterVertex,
        fragmentShader: waterFragment,
        uniforms: {
          uTime: { value: 0 },
          uFogColor: { value: new THREE.Color(FOG.color) },
          uFogNear: { value: FOG.near },
          uFogFar: { value: FOG.far },
        },
      }),
    [],
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
