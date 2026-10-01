"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { Time } from "@/lib/game/clock";
import { runtime } from "../store";
import { Character, type CharacterAnim } from "../world/character";
import { glow, toon } from "../world/materials";
import { box, Box, cone, cyl, sphere } from "../world/parts";
import { ShiftProjector } from "./anchors";
import { BENCH, EASEL, HOST_SPOT, ROOM, VIEWS, WALL_CLOCK } from "./clock-layout";
import { answerAppointment, clockRuntime, clockSetup, finishSet, getClock, setHand, tickClock, turnHand, useClock, type ClockSetup } from "./clock-store";
import { emoteOf, JobCamera, JobPlayer, pointer } from "./job-scene";

// Jonas's workshop as a cutaway: wood-panelled walls hung with cuckoo clocks
// (every pendulum swinging), the big wall clock, and the workbench where the
// customer's clock stands on an easel for you to set.

const c = { floor: "#a9784e", wall: "#efe3cc", wood: "#7a4b2f", dark: "#4a2c1a", top: "#c49a6c" };

export function ClockRoom() {
  const setup = clockSetup();
  const step = useClock((s) => s.step);
  useFrame((_, delta) => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __clock: unknown }).__clock = { getClock, setHand, turnHand, finishSet, answerAppointment };
    tickClock(Math.min(delta, 0.05));
  });
  if (!setup) return null;
  const view = step === "set" ? VIEWS.set : step === "tell" ? VIEWS.wall : VIEWS.room;
  return (
    <group>
      <pointLight position={[0, 4.4, 0.5]} intensity={16} distance={16} decay={1.6} color="#ffd9a0" />
      <ambientLight intensity={0.35} color="#ffe6c4" />
      <Room />
      <Bench />
      <EaselClock />
      <WallClock />
      <Host setup={setup} />
      <Customer />
      <JobPlayer />
      <JobCamera position={view.position} target={view.target} />
      <ShiftProjector />
    </group>
  );
}

// ---------- The room ----------

const CUCKOOS: Array<[number, number, number, number]> = [
  // x, y, z, rotation (on the back wall unless turned)
  [-5.6, 3.4, ROOM.back + 0.2, 0],
  [-4.0, 2.6, ROOM.back + 0.2, 0],
  [-2.4, 3.6, ROOM.back + 0.2, 0],
  [3.0, 3.5, ROOM.back + 0.2, 0],
  [4.6, 2.7, ROOM.back + 0.2, 0],
  [6.0, 3.7, ROOM.back + 0.2, 0],
  [-ROOM.halfWidth + 0.2, 3.0, -2.6, Math.PI / 2],
  [-ROOM.halfWidth + 0.2, 3.4, -0.6, Math.PI / 2],
  [-ROOM.halfWidth + 0.2, 2.8, 1.2, Math.PI / 2],
];

function Room() {
  const { halfWidth, back, front } = ROOM;
  const depth = front - back;
  return (
    <group>
      <Box p={[0, -0.1, (front + back) / 2]} s={[halfWidth * 2, 0.2, depth]} c={c.floor} t="planks" shadow={false} />
      <Box p={[0, -0.6, (front + back) / 2 + 0.2]} s={[halfWidth * 2 + 0.4, 0.8, depth + 0.4]} c={c.dark} shadow={false} />
      <Box p={[0, 2.6, back - 0.1]} s={[halfWidth * 2, 5.2, 0.2]} c={c.wall} t="plaster" />
      <Box p={[0, 0.8, back]} s={[halfWidth * 2, 1.6, 0.06]} c={c.wood} t="siding" shadow={false} />
      <Box p={[-halfWidth - 0.1, 2.6, (back + 1.8) / 2]} s={[0.2, 5.2, 1.8 - back]} c={c.wall} t="plaster" />
      <Box p={[-halfWidth, 0.8, (back + 1.8) / 2]} s={[0.06, 1.6, 1.8 - back]} c={c.wood} t="siding" shadow={false} />
      <Box p={[halfWidth + 0.1, 2.6, (back + 1.6) / 2]} s={[0.2, 5.2, 1.6 - back]} c={c.wall} t="plaster" />
      <Box p={[halfWidth + 0.1, 4.25, 2.4]} s={[0.2, 1.9, 1.6]} c={c.wall} t="plaster" />
      <Box p={[halfWidth + 0.06, 1.6, 2.4]} s={[0.1, 3.2, 1.7]} c={c.dark} shadow={false} />
      <mesh geometry={box} material={glow("#cfe9c4", 0.8)} position={[halfWidth + 0.02, 1.6, 2.4]} scale={[0.04, 3.0, 1.4]} />
      {CUCKOOS.map(([x, y, z, rot], i) => (
        <Cuckoo key={i} position={[x, y, z]} rotation={rot} seed={i} />
      ))}
      {/* a tall grandfather clock in the corner */}
      <group position={[5.6, 0, -3.6]}>
        <Box p={[0, 1.3, 0]} s={[0.8, 2.6, 0.5]} c={c.wood} t="planks" />
        <mesh geometry={cyl} material={toon("#f6efe2", { surface: null })} position={[0, 2.25, 0.26]} rotation-x={Math.PI / 2} scale={[0.3, 0.03, 0.3]} />
        <mesh geometry={cone} material={toon(c.dark)} position={[0, 2.85, 0]} rotation-y={Math.PI / 4} scale={[0.6, 0.35, 0.4]} />
        <Pendulum position={[0, 1.7, 0.26]} length={0.9} speed={1.6} />
      </group>
    </group>
  );
}

function Pendulum({ position, length, speed }: { position: [number, number, number]; length: number; speed: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.z = Math.sin(clock.elapsedTime * speed) * 0.3;
  });
  return (
    <group ref={group} position={position}>
      <mesh geometry={cyl} material={toon("#d9a53a")} position={[0, -length / 2, 0]} scale={[0.02, length, 0.02]} />
      <mesh geometry={cyl} material={toon("#d9a53a")} position={[0, -length, 0]} rotation-x={Math.PI / 2} scale={[0.1, 0.03, 0.1]} />
    </group>
  );
}

function Cuckoo({ position, rotation, seed }: { position: [number, number, number]; rotation: number; seed: number }) {
  const colors = ["#6b3f24", "#8a5a36", "#5b3a24"];
  return (
    <group position={position} rotation-y={rotation}>
      <Box p={[0, 0, 0]} s={[0.7, 0.7, 0.25]} c={colors[seed % 3]} t="planks" />
      <mesh geometry={cone} material={toon(c.dark)} position={[0, 0.5, 0]} rotation-y={Math.PI / 4} scale={[0.6, 0.35, 0.27]} />
      <mesh geometry={cyl} material={toon("#f6efe2", { surface: null })} position={[0, -0.04, 0.13]} rotation-x={Math.PI / 2} scale={[0.22, 0.03, 0.22]} />
      <Box p={[0, 0.23, 0.13]} s={[0.15, 0.12, 0.03]} c="#2b1d14" shadow={false} />
      {/* a little bird, now and then */}
      <mesh geometry={sphere} material={toon("#f4c24a", { surface: null })} position={[0, 0.23, 0.17]} scale={0.05} />
      <Pendulum position={[0, -0.36, 0.06]} length={0.5} speed={2 + seed * 0.13} />
    </group>
  );
}

function Bench() {
  return (
    <group position={[BENCH.x, 0, BENCH.z]}>
      <Box p={[0, BENCH.height / 2, 0]} s={[BENCH.width, BENCH.height, BENCH.depth]} c={c.wood} t="planks" />
      <Box p={[0, BENCH.height + 0.04, 0]} s={[BENCH.width + 0.1, 0.08, BENCH.depth + 0.1]} c={c.top} />
      {/* tools: a magnifier, a box of cogs, a little lamp */}
      <mesh geometry={cyl} material={toon("#d9a53a")} position={[-1.5, BENCH.height + 0.1, 0.2]} scale={[0.25, 0.03, 0.25]} />
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} geometry={cyl} material={toon(i % 2 ? "#d9a53a" : "#9aa3a8")} position={[1.4 + (i % 2) * 0.22, BENCH.height + 0.1, 0.1 + Math.floor(i / 2) * 0.22]} scale={[0.1, 0.03, 0.1]} />
      ))}
      <mesh geometry={cone} material={toon("#2f6f4a")} position={[1.7, BENCH.height + 0.7, -0.3]} scale={[0.22, 0.2, 0.22]} />
      <mesh geometry={sphere} material={glow("#ffd98f", 2)} position={[1.7, BENCH.height + 0.6, -0.3]} scale={0.08} />
      <mesh geometry={cyl} material={toon(c.dark)} position={[1.7, BENCH.height + 0.35, -0.3]} scale={[0.03, 0.6, 0.03]} />
    </group>
  );
}

// ---------- Clock faces ----------

function angleOf(time: Time, hand: "hour" | "minute") {
  return hand === "minute" ? (time.m / 60) * Math.PI * 2 : (((time.h % 12) + time.m / 60) / 12) * Math.PI * 2;
}

// Faces are round, unlike the island's chunky ten-sided cylinders.
const disc = new THREE.CylinderGeometry(1, 1, 1, 40);

// A clock face (facing +z) with hour marks and two hands.
function Face({ radius, time, children }: { radius: number; time: Time; children?: React.ReactNode }) {
  return (
    <group>
      <mesh geometry={disc} material={toon(c.wood)} rotation-x={Math.PI / 2} scale={[radius * 1.12, 0.08, radius * 1.12]} />
      <mesh geometry={disc} material={toon("#fbf6ea", { surface: null })} position={[0, 0, 0.045]} rotation-x={Math.PI / 2} scale={[radius, 0.02, radius]} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const big = i % 3 === 0;
        return (
          <mesh
            key={i}
            geometry={box}
            material={toon("#2b2233", { surface: null })}
            position={[Math.sin(a) * radius * 0.85, Math.cos(a) * radius * 0.85, 0.06]}
            rotation-z={-a}
            scale={[radius * (big ? 0.06 : 0.035), radius * (big ? 0.16 : 0.1), 0.01]}
          />
        );
      })}
      <Hand radius={radius} angle={angleOf(time, "hour")} length={0.5} width={0.09} color="#2b2233" z={0.07} />
      <Hand radius={radius} angle={angleOf(time, "minute")} length={0.78} width={0.05} color="#c0392b" z={0.08} />
      <mesh geometry={cyl} material={toon("#d9a53a", { surface: null })} position={[0, 0, 0.09]} rotation-x={Math.PI / 2} scale={[radius * 0.07, 0.02, radius * 0.07]} />
      {children}
    </group>
  );
}

function Hand({ radius, angle, length, width, color, z }: { radius: number; angle: number; length: number; width: number; color: string; z: number }) {
  const group = useRef<THREE.Group>(null);
  // Hands sweep to their new place rather than jumping.
  useFrame((_, delta) => {
    if (!group.current) return;
    const current = group.current.rotation.z;
    const target = -angle;
    const diff = THREE.MathUtils.euclideanModulo(target - current + Math.PI, Math.PI * 2) - Math.PI;
    group.current.rotation.z = current + diff * Math.min(1, delta * 14);
  });
  return (
    <group ref={group} position={[0, 0, z]}>
      <mesh geometry={box} material={toon(color, { surface: null })} position={[0, (radius * length) / 2, 0]} scale={[radius * width, radius * length, 0.012]} />
    </group>
  );
}

// The customer's clock, on an easel. Drag near the rim to move the big hand,
// nearer the middle for the small one.
function EaselClock() {
  const hands = useClock((s) => s.hands);
  const step = useClock((s) => s.step);
  const dragging = useRef<"hour" | "minute" | null>(null);
  const [hover, setHover] = useState<"hour" | "minute" | null>(null);
  const handAt = (e: ThreeEvent<PointerEvent>) => {
    const local = e.object.worldToLocal(e.point.clone());
    // The face is a cylinder turned to face +z: its local x and -z are the face's x and y.
    const x = local.x;
    const y = -local.z;
    const angle = THREE.MathUtils.euclideanModulo(Math.atan2(x, y), Math.PI * 2);
    return { angle, near: Math.hypot(x, y) };
  };
  const apply = (hand: "hour" | "minute", angle: number) => {
    if (hand === "minute") setHand("minute", (Math.round(angle / (Math.PI / 2)) % 4) * 15);
    else {
      // The small hand sits part-way to the next hour; allow for that before rounding.
      const offset = (getClock().hands.m / 60) * (Math.PI / 6);
      setHand("hour", ((Math.round((angle - offset) / (Math.PI / 6)) % 12) + 23) % 12 + 1);
    }
  };
  const active = step === "set";
  return (
    <group position={[EASEL.x, 0, EASEL.z]}>
      {/* the easel */}
      {[-1, 1].map((s) => (
        <Box key={s} p={[s * 0.45, BENCH.height + 0.4, -0.15]} s={[0.06, 0.8, 0.06]} r={[0.2, 0, 0]} c={c.dark} />
      ))}
      <group position={[0, EASEL.y, 0]}>
        <Face radius={EASEL.radius} time={hands}>
          <mesh
            geometry={disc}
            rotation-x={Math.PI / 2}
            position={[0, 0, 0.1]}
            scale={[EASEL.radius * 1.05, 0.02, EASEL.radius * 1.05]}
            material={active && hover ? (hover === "minute" ? rimGlow : middleGlow) : hidden}
            onPointerDown={(e) => {
              if (!active) return;
              e.stopPropagation();
              const { angle, near } = handAt(e);
              dragging.current = near > 0.55 ? "minute" : "hour";
              apply(dragging.current, angle);
            }}
            onPointerMove={(e) => {
              if (!active) return;
              const { angle, near } = handAt(e);
              setHover(near > 0.55 ? "minute" : "hour");
              if (dragging.current && e.buttons & 1) apply(dragging.current, angle);
            }}
            onPointerUp={() => (dragging.current = null)}
            onPointerOver={pointer.onPointerOver}
            onPointerOut={() => {
              pointer.onPointerOut();
              setHover(null);
              dragging.current = null;
            }}
          />
        </Face>
      </group>
    </group>
  );
}

const hidden = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
const rimGlow = new THREE.MeshBasicMaterial({ color: "#c0392b", transparent: true, opacity: 0.12, depthWrite: false });
const middleGlow = new THREE.MeshBasicMaterial({ color: "#2b2233", transparent: true, opacity: 0.1, depthWrite: false });

// The big clock on the back wall: what customers ask the time by.
function WallClock() {
  const customer = useClock((s) => s.customers[s.index]);
  const time = customer?.tell ?? { h: 10, m: 0 };
  return (
    <group position={[WALL_CLOCK.x, WALL_CLOCK.y, WALL_CLOCK.z]}>
      <Face radius={WALL_CLOCK.radius} time={time} />
      <mesh geometry={cone} material={toon(c.dark)} position={[0, WALL_CLOCK.radius * 1.3, 0]} rotation-y={Math.PI / 4} scale={[1.2, 0.5, 0.3]} />
    </group>
  );
}

// ---------- People ----------

function Host({ setup }: { setup: ClockSetup }) {
  const id = setup.host.id;
  const anim = useMemo(() => (): CharacterAnim => ({ speed: 0, talking: runtime.speaking === id, emote: emoteOf(id) }), [id]);
  return (
    <group position={[HOST_SPOT.x, 0, HOST_SPOT.z]} rotation-y={-0.4}>
      <Character look={setup.host.look} getAnim={anim} seed={5} />
    </group>
  );
}

function Customer() {
  const look = useClock((s) => s.look);
  const index = useClock((s) => s.index);
  const group = useRef<THREE.Group>(null);
  const anim = useMemo(
    () => (): CharacterAnim => {
      const p = clockRuntime.customer;
      return { speed: p.path.length ? 2.6 : 0, talking: false, emote: getClock().step === "leaving" ? "happy" : undefined };
    },
    [],
  );
  useFrame((_, delta) => {
    const p = clockRuntime.customer;
    if (!group.current) return;
    group.current.position.set(p.x, 0, p.z);
    const diff = THREE.MathUtils.euclideanModulo(p.rot - group.current.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    group.current.rotation.y += diff * Math.min(1, delta * 8);
  });
  return (
    <group ref={group} position={[0, 0, 8]}>
      <Character key={index} look={look} getAnim={anim} seed={index + 11} />
    </group>
  );
}

export function customerHead(): [number, number, number] {
  const p = clockRuntime.customer;
  return [p.x + 0.4, 2.2, p.z];
}

export function hostHeadClock(): [number, number, number] {
  return [HOST_SPOT.x + 0.35, 2.3, HOST_SPOT.z];
}
