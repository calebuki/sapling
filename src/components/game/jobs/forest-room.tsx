"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { AnimalModel, Sighting, Weather } from "@/lib/game/forest";
import { runtime } from "../store";
import { Character, type CharacterAnim } from "../world/character";
import { glow, palette, toon } from "../world/materials";
import { box, Box, cone, cyl, sphere } from "../world/parts";
import { ShiftProjector } from "./anchors";
import { DECK, FOREST_EDGE_Z, HOST_SPOT, MEADOW, POND, SKIES, spotOf, TREE, VIEW } from "./forest-layout";
import { answer, forestRuntime, forestSetup, getForest, hoverAnimal, photograph, tickForest, useForest, type ForestSetup } from "./forest-store";
import { click, emoteOf, JobCamera, JobPlayer, OutdoorSun, pointer } from "./job-scene";

// The clearing below Sepp's lookout, in whatever weather the day brings.

export function ForestRoom() {
  const setup = forestSetup();
  const weather = useForest((s) => s.weather);
  useFrame((_, delta) => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __forest: unknown }).__forest = { getForest, photograph, answer };
    tickForest(Math.min(delta, 0.05));
  });
  if (!setup) return null;
  const sky = SKIES[weather];
  return (
    <>
      <color attach="background" args={[sky.sky]} />
      <fog attach="fog" args={sky.fog} />
      <group>
        <hemisphereLight args={[sky.fill, "#4f6a3a", 0.8]} />
        <OutdoorSun position={[8, 14, 10]} intensity={sky.sun} color="#fff3dc" />
        <Ground />
        <Pond />
        <BigTree weather={weather} />
        <Firs weather={weather} />
        <Lookout />
        <Animals />
        <Host setup={setup} />
        <Hiker />
        <JobPlayer>
          <Camera />
        </JobPlayer>
        <WeatherFx weather={weather} />
        <Flash />
        <JobCamera position={VIEW.position} target={VIEW.target} />
        <ShiftProjector />
      </group>
    </>
  );
}

// ---------- The clearing ----------

function Ground() {
  const flowers = useMemo(
    () => Array.from({ length: 40 }, (_, i) => ({ x: MEADOW.x - MEADOW.halfWidth + ((i * 37) % 64) / 10, z: MEADOW.z - MEADOW.halfDepth + ((i * 23) % 56) / 10, c: ["#ffffff", "#ffd35c", "#ff6f91", "#c99ae8"][i % 4] })),
    [],
  );
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.02} receiveShadow>
        <planeGeometry args={[80, 60]} />
        <meshToonMaterial color="#6f9a4a" />
      </mesh>
      {/* the meadow is a lighter green, with flowers */}
      <mesh rotation-x={-Math.PI / 2} position={[MEADOW.x, 0, MEADOW.z]} receiveShadow>
        <planeGeometry args={[MEADOW.halfWidth * 2 + 1, MEADOW.halfDepth * 2 + 1]} />
        <meshToonMaterial color="#8dbb5a" />
      </mesh>
      {flowers.map((f, i) => (
        <mesh key={i} geometry={sphere} material={toon(f.c, { surface: null })} position={[f.x, 0.08, f.z]} scale={0.07} />
      ))}
      {/* a path in front of the lookout */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 7.6]}>
        <planeGeometry args={[40, 1.4]} />
        <meshToonMaterial color="#b89a6a" />
      </mesh>
      {[-4.2, 3.4, 7.8].map((x, i) => (
        <mesh key={x} geometry={sphere} material={toon("#8a8f94", { surface: "stone" })} position={[x, 0.2, 2.2 - i * 1.4]} scale={[0.5, 0.35, 0.45]} castShadow />
      ))}
    </group>
  );
}

function Pond() {
  return (
    <group position={[POND.x, 0, POND.z]}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02} scale={[POND.r * 1.3, POND.r, 1]}>
        <circleGeometry args={[1, 24]} />
        <meshToonMaterial color="#3f8fa8" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.015} scale={[POND.r * 1.3 + 0.3, POND.r + 0.3, 1]}>
        <circleGeometry args={[1, 24]} />
        <meshToonMaterial color="#a08a5a" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={cyl} material={toon("#5f7f3a")} position={[s * 2.9, 0.4, 0.6]} scale={[0.04, 0.8, 0.04]} />
      ))}
    </group>
  );
}

// The old tree in the middle, swaying when it's windy.
function BigTree({ weather }: { weather: Weather }) {
  const crown = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const gust = weather === "wind" || weather === "storm" ? 0.08 : 0.01;
    if (crown.current) crown.current.rotation.z = Math.sin(clock.elapsedTime * 1.6) * gust;
  });
  const snowy = weather === "snow";
  return (
    <group position={[TREE.x, 0, TREE.z]}>
      <mesh geometry={cyl} material={toon(palette.woodDark, { surface: "bark" })} position={[0, 1.6, 0]} scale={[0.4, 3.2, 0.4]} castShadow />
      <group ref={crown} position={[0, 3.2, 0]}>
        <Box p={[-0.8, 0, 0.1]} s={[1.8, 0.16, 0.16]} r={[0, 0, 0.2]} c={palette.woodDark} />
        {[
          [0, 1.0, 0, 1.9],
          [-1.2, 0.6, 0.2, 1.3],
          [1.1, 0.7, -0.1, 1.4],
          [0, 1.8, 0, 1.3],
        ].map(([x, y, z, r], i) => (
          <mesh key={i} geometry={sphere} material={toon(snowy ? "#e9eef2" : i % 2 ? "#4f8a3a" : "#5f9a46", { surface: "leaves" })} position={[x, y, z - 0.5]} scale={[r, r * 0.8, r]} castShadow />
        ))}
      </group>
    </group>
  );
}

function Firs({ weather }: { weather: Weather }) {
  const firs = useMemo(() => Array.from({ length: 26 }, (_, i) => ({ x: -16 + i * 1.3 + ((i * 7) % 5) * 0.2, z: FOREST_EDGE_Z - ((i * 13) % 5) * 0.9, s: 1 + ((i * 17) % 7) / 10 })), []);
  const snowy = weather === "snow";
  return (
    <group>
      {firs.map((f, i) => (
        <group key={i} position={[f.x, 0, f.z]} scale={f.s}>
          <mesh geometry={cyl} material={toon(palette.woodDark)} position={[0, 0.4, 0]} scale={[0.18, 0.8, 0.18]} />
          <mesh geometry={cone} material={toon(snowy ? "#dfe7ec" : "#2f5f3a", { surface: "leaves" })} position={[0, 2.0, 0]} scale={[1.1, 2.8, 1.1]} castShadow />
        </group>
      ))}
    </group>
  );
}

// The lookout's deck you stand on, with a railing.
function Lookout() {
  return (
    <group position={[DECK.x, 0, DECK.z]}>
      <Box p={[0, 0.05, 0]} s={[DECK.halfWidth * 2, 0.1, DECK.halfDepth * 2]} c="#a07a52" t="planks" shadow={false} />
      <Box p={[0, 0.7, -DECK.halfDepth]} s={[DECK.halfWidth * 2, 0.08, 0.08]} c={palette.woodDark} />
      {[-DECK.halfWidth, -DECK.halfWidth / 2, 0, DECK.halfWidth / 2, DECK.halfWidth].map((x) => (
        <Box key={x} p={[x, 0.4, -DECK.halfDepth]} s={[0.1, 0.8, 0.1]} c={palette.woodDark} />
      ))}
    </group>
  );
}

// ---------- Animals ----------

function Animals() {
  const sightings = useForest((s) => s.sightings);
  return (
    <>
      {sightings.flatMap((s) => Array.from({ length: s.count }, (_, k) => <Animal key={`${s.id}:${k}`} sighting={s} k={k} />))}
    </>
  );
}

const colours: Record<AnimalModel, string> = {
  deer: "#a0673a",
  fox: "#d9732b",
  hedgehog: "#6b4f3a",
  squirrel: "#b5542c",
  bird: "#4a7fc0",
  duck: "#e9e2c8",
  cow: "#f4f1ea",
  horse: "#7a4f2e",
  sheep: "#f2efe6",
};

function Animal({ sighting, k }: { sighting: Sighting; k: number }) {
  const group = useRef<THREE.Group>(null);
  const at = useMemo(() => spotOf(sighting, k), [sighting, k]);
  const seed = sighting.id * 3 + k;
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    if (!group.current) return;
    // A little life: ducks paddle about, grazers nod, birds hop.
    if (sighting.animal.model === "duck") {
      group.current.position.x = at.x + Math.sin(t * 0.4) * 0.4;
      group.current.rotation.y = Math.cos(t * 0.4) > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else if (sighting.animal.model === "bird") group.current.position.y = at.y + Math.abs(Math.sin(t * 3)) * 0.08;
    else group.current.rotation.y = 0.4 + Math.sin(t * 0.3) * 0.5;
  });
  return (
    <group
      ref={group}
      position={[at.x, at.y, at.z]}
      onClick={click(() => photograph(sighting.id))}
      onPointerOver={(e) => {
        pointer.onPointerOver(e);
        hoverAnimal(sighting.id);
      }}
      onPointerOut={() => {
        pointer.onPointerOut();
        hoverAnimal(null);
      }}
    >
      <AnimalModelMesh model={sighting.animal.model} />
      {/* a bigger, invisible target so small animals are easy to click */}
      <mesh geometry={box} position={[0, 0.4, 0]} scale={[1, 1, 1]} material={hitbox} />
    </group>
  );
}

const hitbox = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

function AnimalModelMesh({ model }: { model: AnimalModel }) {
  const m = toon(colours[model], { surface: null });
  const dark = toon(new THREE.Color(colours[model]).multiplyScalar(0.65).getStyle(), { surface: null });
  const white = toon("#ffffff", { surface: null });
  const legs = (h: number, w: number, d: number, mat = dark) =>
    [-1, 1].flatMap((sx) => [-1, 1].map((sz) => <mesh key={`${sx}${sz}`} geometry={box} material={mat} position={[sx * w, h / 2, sz * d]} scale={[0.09, h, 0.09]} />));
  switch (model) {
    case "deer":
      return (
        <group>
          {legs(0.55, 0.16, 0.3)}
          <mesh geometry={box} material={m} position={[0, 0.7, 0]} scale={[0.4, 0.32, 0.8]} castShadow />
          <mesh geometry={box} material={m} position={[0, 1.05, 0.42]} scale={[0.22, 0.42, 0.22]} />
          <mesh geometry={box} material={m} position={[0, 1.22, 0.55]} scale={[0.2, 0.18, 0.28]} />
          <mesh geometry={box} material={white} position={[0, 0.78, -0.42]} scale={[0.14, 0.14, 0.06]} />
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={box} material={dark} position={[s * 0.1, 1.38, 0.5]} rotation-z={s * -0.4} scale={[0.04, 0.24, 0.04]} />
          ))}
        </group>
      );
    case "horse":
      return (
        <group scale={1.25}>
          {legs(0.6, 0.17, 0.32)}
          <mesh geometry={box} material={m} position={[0, 0.78, 0]} scale={[0.42, 0.38, 0.9]} castShadow />
          <mesh geometry={box} material={m} position={[0, 1.12, 0.45]} rotation-x={-0.5} scale={[0.22, 0.5, 0.24]} />
          <mesh geometry={box} material={m} position={[0, 1.3, 0.65]} scale={[0.2, 0.2, 0.36]} />
          <mesh geometry={box} material={toon("#2b1d14", { surface: null })} position={[0, 1.25, 0.38]} rotation-x={-0.5} scale={[0.06, 0.5, 0.1]} />
          <mesh geometry={box} material={toon("#2b1d14", { surface: null })} position={[0, 0.7, -0.5]} rotation-x={0.5} scale={[0.08, 0.4, 0.08]} />
        </group>
      );
    case "cow":
      return (
        <group scale={1.2}>
          {legs(0.45, 0.2, 0.32)}
          <mesh geometry={box} material={m} position={[0, 0.66, 0]} scale={[0.5, 0.42, 0.9]} castShadow />
          {[
            [0.12, 0.75, 0.15],
            [-0.15, 0.62, -0.2],
          ].map(([x, y, z], i) => (
            <mesh key={i} geometry={box} material={toon("#2b2b2b", { surface: null })} position={[x, y, z]} scale={[0.51, 0.18, 0.22]} />
          ))}
          <mesh geometry={box} material={m} position={[0, 0.78, 0.55]} scale={[0.3, 0.3, 0.3]} />
          <mesh geometry={box} material={toon("#f4a3c1", { surface: null })} position={[0, 0.7, 0.71]} scale={[0.22, 0.12, 0.04]} />
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={box} material={white} position={[s * 0.17, 0.98, 0.55]} scale={[0.1, 0.05, 0.05]} />
          ))}
        </group>
      );
    case "sheep":
      return (
        <group>
          {legs(0.32, 0.13, 0.2, toon("#2b2b2b", { surface: null }))}
          <mesh geometry={sphere} material={m} position={[0, 0.5, 0]} scale={[0.32, 0.26, 0.42]} castShadow />
          <mesh geometry={box} material={toon("#2b2b2b", { surface: null })} position={[0, 0.58, 0.42]} scale={[0.18, 0.2, 0.2]} />
        </group>
      );
    case "fox":
      return (
        <group>
          {legs(0.28, 0.1, 0.18, toon("#2b2b2b", { surface: null }))}
          <mesh geometry={box} material={m} position={[0, 0.38, 0]} scale={[0.24, 0.2, 0.55]} castShadow />
          <mesh geometry={box} material={m} position={[0, 0.5, 0.34]} scale={[0.22, 0.2, 0.2]} />
          <mesh geometry={cone} material={white} position={[0, 0.46, 0.5]} rotation-x={Math.PI / 2} scale={[0.07, 0.14, 0.07]} />
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={cone} material={m} position={[s * 0.07, 0.66, 0.32]} scale={[0.05, 0.12, 0.05]} />
          ))}
          <mesh geometry={box} material={m} position={[0, 0.4, -0.4]} rotation-x={0.5} scale={[0.12, 0.12, 0.38]} />
          <mesh geometry={box} material={white} position={[0, 0.3, -0.57]} rotation-x={0.5} scale={[0.1, 0.1, 0.1]} />
        </group>
      );
    case "hedgehog":
      return (
        <group>
          <mesh geometry={sphere} material={m} position={[0, 0.14, 0]} scale={[0.2, 0.15, 0.26]} castShadow />
          {Array.from({ length: 8 }, (_, i) => (
            <mesh key={i} geometry={cone} material={dark} position={[Math.cos(i) * 0.1, 0.24, -0.05 + Math.sin(i) * 0.1]} rotation-x={-0.4} scale={[0.04, 0.12, 0.04]} />
          ))}
          <mesh geometry={cone} material={toon("#d9b48a", { surface: null })} position={[0, 0.12, 0.27]} rotation-x={Math.PI / 2} scale={[0.07, 0.12, 0.07]} />
        </group>
      );
    case "squirrel":
      return (
        <group>
          <mesh geometry={box} material={m} position={[0, 0.2, 0]} scale={[0.14, 0.24, 0.14]} castShadow />
          <mesh geometry={box} material={m} position={[0, 0.38, 0.04]} scale={[0.13, 0.13, 0.13]} />
          <mesh geometry={sphere} material={m} position={[0, 0.3, -0.16]} scale={[0.09, 0.2, 0.08]} />
        </group>
      );
    case "bird":
      return (
        <group>
          <mesh geometry={sphere} material={m} position={[0, 0.1, 0]} scale={[0.1, 0.09, 0.13]} />
          <mesh geometry={cone} material={toon("#f2c230", { surface: null })} position={[0, 0.12, 0.14]} rotation-x={Math.PI / 2} scale={[0.03, 0.06, 0.03]} />
        </group>
      );
    case "duck":
      return (
        <group>
          <mesh geometry={sphere} material={m} position={[0, 0.1, 0]} scale={[0.17, 0.12, 0.24]} />
          <mesh geometry={sphere} material={toon("#2f7d4f", { surface: null })} position={[0, 0.28, 0.17]} scale={0.1} />
          <mesh geometry={box} material={toon("#f2a830", { surface: null })} position={[0, 0.26, 0.29]} scale={[0.07, 0.03, 0.08]} />
        </group>
      );
  }
}

// ---------- People ----------

function Host({ setup }: { setup: ForestSetup }) {
  const id = setup.host.id;
  const anim = useMemo(() => (): CharacterAnim => ({ speed: 0, talking: runtime.speaking === id, emote: emoteOf(id) }), [id]);
  return (
    <group position={[HOST_SPOT.x, 0.1, HOST_SPOT.z]} rotation-y={Math.PI + 0.3}>
      <Character look={setup.host.look} getAnim={anim} seed={6} />
    </group>
  );
}

function Hiker() {
  const group = useRef<THREE.Group>(null);
  const look = useMemo(() => ({ skin: "#e8b48f", hair: "#3a2a1e", hairStyle: "short" as const, shirt: "#c0392b", pants: "#2c3e50", accent: "#27ae60", hat: "cap" as const, top: "raincoat" as const, backpack: "#27ae60", beard: true }), []);
  const anim = useMemo(() => (): CharacterAnim => ({ speed: forestRuntime.hiker.path.length ? 2.2 : 0, talking: false, emote: undefined }), []);
  useFrame((_, delta) => {
    const w = forestRuntime.hiker;
    if (!group.current) return;
    group.current.position.set(w.x, 0, w.z);
    const diff = THREE.MathUtils.euclideanModulo(w.rot - group.current.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    group.current.rotation.y += diff * Math.min(1, delta * 8);
  });
  return (
    <group ref={group} position={[-30, 0, 7.6]}>
      <Character look={look} getAnim={anim} seed={13} />
    </group>
  );
}

// Your camera, held up in front of you.
function Camera() {
  return (
    <group position={[0, 0.15, -0.1]}>
      <Box p={[0, 0, 0]} s={[0.34, 0.22, 0.14]} c="#2d3436" shadow={false} />
      <mesh geometry={cyl} material={toon("#636e72")} position={[0, 0, 0.1]} rotation-x={Math.PI / 2} scale={[0.07, 0.1, 0.07]} />
    </group>
  );
}

// ---------- Weather and the flash ----------

function WeatherFx({ weather }: { weather: Weather }) {
  const drops = useRef<THREE.InstancedMesh>(null);
  const count = 420;
  // Moved every frame, so they live in a ref rather than state.
  const seeds = useRef(Array.from({ length: count }, (_, i) => ({ x: ((i * 7919) % 400) / 10 - 20, z: ((i * 104729) % 260) / 10 - 14, y: ((i * 31) % 120) / 10, s: 0.7 + ((i * 13) % 6) / 10 })));
  const matrix = useMemo(() => new THREE.Object3D(), []);
  const falling = weather === "rain" || weather === "storm" || weather === "snow" || weather === "wind";
  useFrame(({ clock }, delta) => {
    const mesh = drops.current;
    if (!mesh || !falling) return;
    const snow = weather === "snow";
    const leaves = weather === "wind";
    const speed = snow ? 1.2 : leaves ? 1.5 : 11;
    for (let i = 0; i < count; i++) {
      const p = seeds.current[i];
      p.y -= delta * speed * p.s;
      if (p.y < 0) p.y += 12;
      const drift = snow ? Math.sin(clock.elapsedTime + i) * 0.4 : leaves ? ((clock.elapsedTime * 3 + i) % 40) - 20 : 0;
      matrix.position.set(leaves ? drift : p.x + drift, p.y, p.z);
      matrix.rotation.set(leaves ? clock.elapsedTime * 2 + i : 0, 0, leaves ? i : 0.15);
      matrix.scale.set(snow ? 0.06 : leaves ? 0.12 : 0.02, snow ? 0.06 : leaves ? 0.04 : 0.45, snow ? 0.06 : leaves ? 0.08 : 0.02);
      matrix.updateMatrix();
      mesh.setMatrixAt(i, matrix.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  const colour = weather === "snow" ? "#ffffff" : weather === "wind" ? "#d9a53a" : "#bcd6ea";
  return (
    <group>
      {falling ? (
        <instancedMesh key={weather} ref={drops} args={[box, undefined, count]}>
          <meshBasicMaterial color={colour} transparent opacity={weather === "wind" ? 0.9 : 0.7} />
        </instancedMesh>
      ) : null}
      {weather === "clouds" || weather === "rain" || weather === "storm" ? <Clouds dark={weather !== "clouds"} /> : null}
      {weather === "storm" ? <Lightning /> : null}
      {weather === "sun" ? <mesh geometry={sphere} material={glow("#fff2b0", 1.6)} position={[14, 16, -30]} scale={2.4} /> : null}
    </group>
  );
}

function Clouds({ dark }: { dark: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.position.x = Math.sin(clock.elapsedTime * 0.05) * 3;
  });
  return (
    <group ref={group}>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} geometry={sphere} material={toon(dark ? "#6b7583" : "#e8edf1", { surface: null })} position={[-18 + i * 6, 11 + (i % 2), -14 - (i % 3) * 3]} scale={[3.4, 1.2, 1.8]} />
      ))}
    </group>
  );
}

function Lightning() {
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime % 4.3;
    if (light.current) light.current.intensity = t < 0.08 || (t > 0.18 && t < 0.24) ? 60 : 0;
  });
  return <pointLight ref={light} position={[0, 14, -6]} distance={60} decay={1} color="#e8f0ff" />;
}

// A white flash when you take a photo.
function Flash() {
  const light = useRef<THREE.PointLight>(null);
  useFrame(() => {
    const since = performance.now() / 1000 - forestRuntime.flashAt;
    if (light.current) light.current.intensity = since < 0.15 ? 40 * (1 - since / 0.15) : 0;
  });
  return <pointLight ref={light} position={[0.7, 2, 3.5]} distance={20} decay={1} color="#ffffff" />;
}

export function hostHeadForest(): [number, number, number] {
  return [HOST_SPOT.x - 0.3, 2.3, HOST_SPOT.z];
}

export function hikerHead(): [number, number, number] {
  const w = forestRuntime.hiker;
  return [w.x + 0.3, 2.3, w.z];
}

export function animalHead(s: Sighting): [number, number, number] {
  const at = spotOf(s, 0);
  return [at.x, at.y + (s.animal.model === "horse" || s.animal.model === "cow" ? 1.8 : 1.2), at.z];
}
