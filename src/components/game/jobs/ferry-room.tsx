"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { runtime } from "../store";
import { Character, type CharacterAnim } from "../world/character";
import { glow, palette, toon } from "../world/materials";
import { box, Box, cone, cyl, sphere, torus } from "../world/parts";
import { ShiftProjector } from "./anchors";
import {
  BOAT,
  GANGWAY,
  HOST_SPOT,
  LECTERN,
  PIER,
  SKIES,
  VIEW,
  WATER_Y,
} from "./ferry-layout";
import {
  askName,
  farewell,
  ferryRuntime,
  ferrySetup,
  fill,
  getFerry,
  greet,
  lookOf,
  repair,
  submitEntry,
  tickFerry,
  useFerry,
  type FerrySetup,
} from "./ferry-store";
import { emoteOf, JobCamera, JobPlayer, OutdoorSun } from "./job-scene";

// Greta's landing stage at morning, midday or evening: the pier across the
// lake, the paddle steamer waiting behind it and the hills beyond.

export function FerryRoom() {
  const setup = ferrySetup();
  const time = useFerry((s) => s.time);
  useFrame((_, delta) => {
    if (process.env.NODE_ENV !== "production")
      (window as unknown as { __ferry: unknown }).__ferry = {
        getFerry,
        greet,
        askName,
        fill,
        submitEntry,
        farewell,
        repair,
      };
    tickFerry(Math.min(delta, 0.05));
  });
  if (!setup) return null;
  const sky = SKIES[time];
  // The sky and haze take the time of day; the island's come back when this unmounts.
  return (
    <>
      <color attach="background" args={[sky.sky]} />
      <fog attach="fog" args={[sky.fog, 30, 90]} />
      <group>
        <hemisphereLight args={[sky.fill, sky.ground, 0.9]} />
        <OutdoorSun position={sky.sunAt} intensity={sky.intensity} color={sky.sun} />
        <Lake />
        <Shore />
        <Pier />
        <Steamer />
        <Lectern />
        <Host setup={setup} />
        <Passengers />
        <JobPlayer />
        <JobCamera position={VIEW.position} target={VIEW.target} />
        <ShiftProjector />
      </group>
    </>
  );
}

function Lake() {
  const water = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (water.current)
      water.current.position.y =
        WATER_Y + Math.sin(clock.elapsedTime * 0.7) * 0.03;
  });
  return (
    <group>
      <mesh
        ref={water}
        rotation-x={-Math.PI / 2}
        position-y={WATER_Y}
        receiveShadow
      >
        <planeGeometry args={[160, 160]} />
        <meshToonMaterial color="#3f9aa0" />
      </mesh>
      {/* glints on the water */}
      {Array.from({ length: 18 }, (_, i) => (
        <mesh
          key={i}
          geometry={box}
          material={glow("#e8fbff", 0.7)}
          position={[
            ((i * 37) % 44) - 22,
            WATER_Y + 0.02,
            -((i * 13) % 20) - 6,
          ]}
          scale={[0.9 + (i % 3) * 0.4, 0.01, 0.08]}
        />
      ))}
    </group>
  );
}

// Hills and firs across the lake, and the grassy bank the pier starts from.
function Shore() {
  return (
    <group>
      <Box
        p={[PIER.minX - 6, -0.3, -2]}
        s={[12, 0.6, 30]}
        c="#7fae5a"
        t={null}
        shadow={false}
      />
      {[
        [-30, -38, 18],
        [-6, -42, 22],
        [18, -40, 16],
        [36, -34, 14],
      ].map(([x, z, s], i) => (
        <mesh
          key={i}
          geometry={sphere}
          material={toon(i % 2 ? "#3f6f4a" : "#4f7f52", { surface: "leaves" })}
          position={[x, -2, z]}
          scale={[s, s * 0.45, s * 0.6]}
        />
      ))}
      {Array.from({ length: 14 }, (_, i) => {
        const x = -17 - (i % 4) * 1.6;
        const z = -8 + i * 1.3;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh
              geometry={cone}
              material={toon("#2f5f3a", { surface: "leaves" })}
              position={[0, 1.6, 0]}
              scale={[0.8, 2.2, 0.8]}
              castShadow
            />
            <mesh
              geometry={cyl}
              material={toon(palette.woodDark)}
              position={[0, 0.3, 0]}
              scale={[0.15, 0.6, 0.15]}
            />
          </group>
        );
      })}
    </group>
  );
}

function Pier() {
  const planks = useMemo(() => {
    const xs: number[] = [];
    for (let x = PIER.minX; x <= PIER.maxX; x += 0.6) xs.push(x);
    return xs;
  }, []);
  return (
    <group>
      {planks.map((x, i) => (
        <Box
          key={x}
          p={[x, -0.08, 0]}
          s={[0.56, 0.16, PIER.halfDepth * 2]}
          c={i % 3 ? palette.plank : "#8a6a44"}
          t="planks"
          shadow={false}
        />
      ))}
      {planks
        .filter((_, i) => i % 5 === 0)
        .flatMap((x) =>
          [-1, 1].map((side) => (
            <mesh
              key={`${x}${side}`}
              geometry={cyl}
              material={toon(palette.woodDark, { surface: "bark" })}
              position={[x, -0.4, side * (PIER.halfDepth + 0.05)]}
              scale={[0.14, 1.4, 0.14]}
              castShadow
            />
          )),
        )}
      {/* a rope rail along the front, and a life ring */}
      <Box
        p={[(PIER.minX + PIER.maxX) / 2 - 3, 0.75, PIER.halfDepth - 0.05]}
        s={[PIER.maxX - PIER.minX - 8, 0.05, 0.05]}
        c="#d9c39a"
        shadow={false}
      />
      <mesh
        geometry={torus}
        material={toon("#e74c3c")}
        position={[-6.5, 0.75, PIER.halfDepth]}
        scale={0.35}
      />
      {/* the gangway up to the deck */}
      <Box
        p={[GANGWAY.x, 0.02, GANGWAY.z - 0.7]}
        s={[1.1, 0.08, 1.6]}
        c="#a07a52"
        t="planks"
      />
      {[-0.55, 0.55].map((dx) => (
        <Box
          key={dx}
          p={[GANGWAY.x + dx, 0.45, GANGWAY.z - 0.7]}
          s={[0.05, 0.05, 1.6]}
          c="#d9a53a"
          shadow={false}
        />
      ))}
    </group>
  );
}

const CABIN_X = 3.4;
const FUNNEL_X = 2.9;

// The paddle steamer: it bobs at the pier, and pulls away once everyone's aboard.
function Steamer() {
  const group = useRef<THREE.Group>(null);
  const wheel = useRef<THREE.Group>(null);
  const smoke = useRef<THREE.Group>(null);
  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    if (group.current) {
      group.current.position.x = BOAT.x + ferryRuntime.departed;
      group.current.position.y = Math.sin(t * 0.8) * 0.04;
      group.current.rotation.x = Math.sin(t * 0.6) * 0.008;
    }
    if (wheel.current)
      wheel.current.rotation.z -= delta * (0.4 + ferryRuntime.departed * 0.3);
    smoke.current?.children.forEach((puff, i) => {
      const k = (t * 0.35 + i / 4) % 1;
      puff.position.set(FUNNEL_X - k * 1.5, 4.2 + k * 2, 0);
      puff.scale.setScalar(0.25 + k * 0.6);
    });
  });
  const { length, width, z } = BOAT;
  return (
    <group ref={group} position={[BOAT.x, 0, z]}>
      {/* hull and deck, level with the pier */}
      <Box p={[0, -0.45, 0]} s={[length, 0.8, width]} c="#f7f3ea" />
      <Box
        p={[0, -0.85, 0]}
        s={[length + 0.05, 0.3, width + 0.05]}
        c="#1f5a3a"
      />
      <Box
        p={[0, 0.0, 0]}
        s={[length - 0.2, 0.06, width - 0.2]}
        c="#c9a77a"
        t="planks"
        shadow={false}
      />
      <mesh
        geometry={cone}
        material={toon("#f7f3ea")}
        position={[length / 2 + 0.6, -0.45, 0]}
        rotation-z={-Math.PI / 2}
        scale={[width / 2, 1.3, 0.8]}
      />
      {/* railings, with a gap at the gangway */}
      {[-1, 1].map((side) => (
        <Box
          key={side}
          p={[side === 1 ? 1.2 : 0, 0.5, (side * (width - 0.1)) / 2]}
          s={[side === 1 ? length - 2.6 : length - 0.2, 0.05, 0.05]}
          c="#d9a53a"
          shadow={false}
        />
      ))}
      {/* the cabin at the bow with the funnel on top, and the paddle box */}
      <Box p={[CABIN_X, 0.9, 0]} s={[3, 1.7, width - 0.4]} c="#ffffff" />
      <mesh
        geometry={box}
        material={glow("#bfe6f0", 0.9)}
        position={[CABIN_X, 1.15, 0]}
        scale={[3.05, 0.5, width - 0.5]}
      />
      <Box p={[CABIN_X, 1.85, 0]} s={[3.3, 0.12, width - 0.1]} c="#8b1e2d" />
      <mesh
        geometry={cyl}
        material={toon("#1d1d24")}
        position={[FUNNEL_X, 2.8, 0]}
        scale={[0.32, 2.2, 0.32]}
        castShadow
      />
      <mesh
        geometry={cyl}
        material={toon("#d9a53a")}
        position={[FUNNEL_X, 3.85, 0]}
        scale={[0.34, 0.16, 0.34]}
      />
      <group ref={smoke}>
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={i}
            geometry={sphere}
            material={toon("#eeeeee", {
              surface: null,
              transparent: true,
              opacity: 0.6,
            })}
          />
        ))}
      </group>
      <Box p={[0.8, 0.3, -width / 2 - 0.25]} s={[2.2, 1.4, 0.5]} c="#8b1e2d" />
      <group ref={wheel} position={[0.8, -0.2, -width / 2 - 0.3]}>
        <mesh geometry={torus} material={toon("#1d1d24")} scale={0.9} />
        {[0, 1, 2, 3].map((i) => (
          <Box
            key={i}
            p={[0, 0, 0]}
            s={[0.16, 1.7, 0.1]}
            r={[0, 0, (i * Math.PI) / 4]}
            c="#6e4a2f"
            shadow={false}
          />
        ))}
      </group>
      <Box p={[length / 2 - 0.6, 0.6, 0]} s={[0.1, 1.2, 0.1]} c="#5b3a24" />
      <Box
        p={[length / 2 - 0.6, 1.3, 0.25]}
        s={[0.04, 0.4, 0.5]}
        c="#2f6fb5"
        shadow={false}
      />
    </group>
  );
}

// The ticket lectern, with the passenger list on it.
function Lectern() {
  return (
    <group position={[LECTERN.x, 0, LECTERN.z]}>
      <Box p={[0, 0.5, 0]} s={[0.7, 1, 0.5]} c="#2f6fb5" t="siding" />
      <Box
        p={[0, 1.05, 0.05]}
        s={[0.85, 0.08, 0.6]}
        r={[0.35, 0, 0]}
        c="#8a5a36"
      />
      <Box
        p={[0, 1.12, 0.07]}
        s={[0.5, 0.02, 0.4]}
        r={[0.35, 0, 0]}
        c="#fffaf0"
        shadow={false}
      />
      {/* a bell for "all aboard" */}
      <mesh
        geometry={sphere}
        material={toon("#d9a53a")}
        position={[0.3, 1.2, -0.12]}
        scale={[0.08, 0.06, 0.08]}
      />
    </group>
  );
}

// ---------- People ----------

function Host({ setup }: { setup: FerrySetup }) {
  const id = setup.host.id;
  const anim = useMemo(
    () => (): CharacterAnim => ({
      speed: 0,
      talking: runtime.speaking === id,
      emote: emoteOf(id),
    }),
    [id],
  );
  return (
    <group position={[HOST_SPOT.x, 0, HOST_SPOT.z]} rotation-y={-0.6}>
      <Character look={setup.host.look} getAnim={anim} seed={2} />
    </group>
  );
}

function Passengers() {
  const passengers = useFerry((s) => s.passengers);
  return (
    <>
      {passengers.map((p, i) => (
        <Passenger key={`${p.person.id}${i}`} index={i} />
      ))}
    </>
  );
}

function Passenger({ index }: { index: number }) {
  const passenger = useFerry((s) => s.passengers[index]);
  const look = useMemo(() => lookOf(passenger), [passenger]);
  const group = useRef<THREE.Group>(null);
  const anim = useMemo(
    () => (): CharacterAnim => {
      const w = ferryRuntime.walkers[index];
      const s = getFerry();
      const greeting = s.index === index && s.said?.by === "passenger";
      return {
        speed: w?.path.length ? 2.4 : 0,
        talking: greeting && runtime.speaking === null,
        emote: s.step === "boarding" && s.index === index ? "wave" : undefined,
      };
    },
    [index],
  );
  useFrame((_, delta) => {
    const w = ferryRuntime.walkers[index];
    if (!group.current || !w) return;
    // Seated passengers sail with the steamer.
    const sailing = ferryRuntime.seated[index] ? ferryRuntime.departed : 0;
    group.current.position.set(
      w.x + sailing,
      ferryRuntime.seated[index] ? 0.05 : 0,
      w.z,
    );
    const diff =
      THREE.MathUtils.euclideanModulo(
        w.rot - group.current.rotation.y + Math.PI,
        Math.PI * 2,
      ) - Math.PI;
    group.current.rotation.y += diff * Math.min(1, delta * 8);
  });
  return (
    <group ref={group} position={[-20, 0, 0]}>
      <Character look={look} getAnim={anim} seed={index + 3} />
      <mesh rotation-x={-Math.PI / 2} position-y={0.03}>
        <circleGeometry args={[0.4 * (look.scale ?? 1), 16]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.14}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export function passengerHead(): [number, number, number] {
  const s = getFerry();
  const w = ferryRuntime.walkers[s.index];
  const tall = s.passengers[s.index]?.person.register === "du" ? 1.55 : 2.0;
  return w ? [w.x - 0.2, tall, w.z] : [0, 2, 0];
}

export function hostHeadFerry(): [number, number, number] {
  return [HOST_SPOT.x + 0.3, 2.3, HOST_SPOT.z];
}
