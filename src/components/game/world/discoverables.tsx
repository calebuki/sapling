"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { discoveries, type Discovery, type PropKind } from "@/lib/game/discoveries";
import { dock, groundAt } from "@/lib/game/world";
import { runtime, useGame } from "../store";
import { glow, palette, toon } from "./materials";

const sphere = new THREE.SphereGeometry(1, 14, 10);
const cyl = new THREE.CylinderGeometry(1, 1, 1, 12);
const cone = new THREE.ConeGeometry(1, 1, 8);
const box = new THREE.BoxGeometry(1, 1, 1);
const torus = new THREE.TorusGeometry(1, 0.12, 6, 20);
const gem = new THREE.OctahedronGeometry(1, 0);

type V3 = [number, number, number];
function M({ g, c, p, s, r }: { g: THREE.BufferGeometry; c: string; p: V3; s: V3 | number; r?: V3 }) {
  return <mesh geometry={g} material={toon(c)} position={p} scale={s} rotation={r} castShadow />;
}

function Animated({ children, fn }: { children: React.ReactNode; fn: (g: THREE.Group, t: number) => void }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) fn(ref.current, state.clock.elapsedTime);
  });
  return <group ref={ref}>{children}</group>;
}

function Prop({ kind }: { kind: PropKind }) {
  switch (kind) {
    case "rowboat":
      return (
        <Animated fn={(g, t) => { g.position.y = Math.sin(t * 1.1) * 0.06; g.rotation.z = Math.sin(t * 0.8) * 0.05; }}>
          <M g={sphere} c="#a0522d" p={[0, 0.1, 0]} s={[0.8, 0.35, 1.9]} />
          <M g={sphere} c="#ffffff" p={[0, 0.2, 0]} s={[0.82, 0.12, 1.92]} />
          <M g={box} c="#7b3f20" p={[0, 0.34, 0]} s={[1.3, 0.08, 0.3]} />
          <M g={cyl} c={palette.plank} p={[0.6, 0.35, 0.2]} s={[0.04, 1.8, 0.04]} r={[1.2, 0, 0.4]} />
        </Animated>
      );
    case "bucket":
      return (
        <group>
          <M g={cyl} c="#8e9aa6" p={[0, 0.25, 0]} s={[0.28, 0.5, 0.28]} />
          <Animated fn={(g, t) => { g.rotation.z = Math.sin(t * 5) * 0.25; }}>
            <M g={sphere} c="#ff9f43" p={[0, 0.62, 0]} s={[0.1, 0.22, 0.07]} />
            <M g={cone} c="#ff9f43" p={[0, 0.9, 0]} s={[0.1, 0.14, 0.04]} />
          </Animated>
        </group>
      );
    case "gull":
      return (
        <Animated fn={(g, t) => { g.rotation.y = Math.sin(t * 0.6) * 0.8; }}>
          <M g={sphere} c="#ffffff" p={[0, 0.3, 0]} s={[0.16, 0.16, 0.3]} />
          <M g={sphere} c="#ffffff" p={[0, 0.5, 0.18]} s={0.11} />
          <M g={cone} c="#f6b93b" p={[0, 0.48, 0.33]} s={[0.035, 0.12, 0.035]} r={[Math.PI / 2, 0, 0]} />
          <M g={sphere} c="#b2bec3" p={[0.14, 0.33, -0.05]} s={[0.05, 0.1, 0.26]} />
          <M g={sphere} c="#b2bec3" p={[-0.14, 0.33, -0.05]} s={[0.05, 0.1, 0.26]} />
          <M g={cyl} c="#f6b93b" p={[0.05, 0.08, 0]} s={[0.015, 0.16, 0.015]} />
          <M g={cyl} c="#f6b93b" p={[-0.05, 0.08, 0]} s={[0.015, 0.16, 0.015]} />
        </Animated>
      );
    case "cup":
      return (
        <group>
          <M g={cyl} c="#ffffff" p={[0, 0.02, 0]} s={[0.16, 0.02, 0.16]} />
          <M g={cyl} c="#ffffff" p={[0, 0.1, 0]} s={[0.08, 0.14, 0.08]} />
          <M g={torus} c="#ffffff" p={[0.1, 0.1, 0]} s={0.045} />
          <M g={cyl} c="#6b3e26" p={[0, 0.165, 0]} s={[0.07, 0.01, 0.07]} />
        </group>
      );
    case "cat":
      return (
        <Animated fn={(g, t) => { g.scale.y = 1 + Math.sin(t * 1.8) * 0.04; }}>
          <M g={sphere} c="#f0932b" p={[0, 0.2, 0]} s={[0.3, 0.2, 0.42]} />
          <M g={sphere} c="#f0932b" p={[0, 0.3, 0.36]} s={0.18} />
          <M g={cone} c="#f0932b" p={[0.09, 0.47, 0.36]} s={[0.06, 0.12, 0.06]} />
          <M g={cone} c="#f0932b" p={[-0.09, 0.47, 0.36]} s={[0.06, 0.12, 0.06]} />
          <M g={sphere} c="#2d3436" p={[0.06, 0.32, 0.52]} s={[0.035, 0.008, 0.01]} />
          <M g={sphere} c="#2d3436" p={[-0.06, 0.32, 0.52]} s={[0.035, 0.008, 0.01]} />
          <M g={torus} c="#e67e22" p={[0.18, 0.08, -0.1]} s={[0.25, 0.25, 0.4]} r={[Math.PI / 2, 0, 0]} />
        </Animated>
      );
    case "mailbox":
      return (
        <group>
          <M g={cyl} c={palette.woodDark} p={[0, 0.5, 0]} s={[0.06, 1, 0.06]} />
          <M g={box} c="#f7c948" p={[0, 1.1, 0]} s={[0.36, 0.3, 0.55]} />
          <M g={cyl} c="#f7c948" p={[0, 1.25, 0]} s={[0.18, 0.55, 0.18]} r={[Math.PI / 2, 0, 0]} />
          <M g={box} c="#2f6fb5" p={[0.19, 1.1, 0.05]} s={[0.02, 0.12, 0.2]} />
        </group>
      );
    case "bike":
      return (
        <group rotation-z={0.12}>
          <M g={torus} c="#2d3436" p={[0, 0.38, 0.55]} s={0.36} r={[0, Math.PI / 2, 0]} />
          <M g={torus} c="#2d3436" p={[0, 0.38, -0.55]} s={0.36} r={[0, Math.PI / 2, 0]} />
          <M g={cyl} c="#d63031" p={[0, 0.6, 0]} s={[0.04, 1.1, 0.04]} r={[Math.PI / 2, 0, 0]} />
          <M g={cyl} c="#d63031" p={[0, 0.55, -0.3]} s={[0.04, 0.6, 0.04]} r={[0.5, 0, 0]} />
          <M g={cyl} c="#d63031" p={[0, 0.75, 0.5]} s={[0.035, 0.6, 0.035]} r={[-0.3, 0, 0]} />
          <M g={box} c="#2d3436" p={[0, 0.88, -0.35]} s={[0.12, 0.05, 0.25]} />
          <M g={cyl} c="#b2bec3" p={[0, 1.02, 0.58]} s={[0.03, 0.5, 0.03]} r={[0, 0, Math.PI / 2]} />
          <M g={box} c="#dfe6e9" p={[0, 0.82, 0.78]} s={[0.3, 0.2, 0.25]} />
        </group>
      );
    case "dog":
      return (
        <group>
          <M g={sphere} c="#b07a4f" p={[0, 0.38, 0]} s={[0.22, 0.2, 0.38]} />
          <M g={sphere} c="#b07a4f" p={[0, 0.6, 0.32]} s={0.17} />
          <M g={sphere} c="#8a5a36" p={[0, 0.55, 0.47]} s={[0.08, 0.07, 0.08]} />
          <M g={sphere} c="#1d1d24" p={[0, 0.58, 0.54]} s={0.03} />
          <M g={sphere} c="#8a5a36" p={[0.15, 0.6, 0.3]} s={[0.04, 0.12, 0.07]} />
          <M g={sphere} c="#8a5a36" p={[-0.15, 0.6, 0.3]} s={[0.04, 0.12, 0.07]} />
          {[
            [0.12, 0.2],
            [-0.12, 0.2],
            [0.12, -0.22],
            [-0.12, -0.22],
          ].map(([x, z]) => (
            <M key={`${x}${z}`} g={cyl} c="#b07a4f" p={[x, 0.12, z]} s={[0.05, 0.24, 0.05]} />
          ))}
          <Animated fn={(g, t) => { g.rotation.y = Math.sin(t * 14) * 0.6; }}>
            <group position={[0, 0.48, -0.36]}>
              <M g={cyl} c="#b07a4f" p={[0, 0.08, -0.06]} s={[0.035, 0.22, 0.035]} r={[-0.7, 0, 0]} />
            </group>
          </Animated>
        </group>
      );
    case "moose":
      return (
        <Animated fn={(g, t) => { g.children[0].rotation.x = Math.sin(t * 0.5) * 0.08; }}>
          <group>
            <M g={sphere} c="#6d4c33" p={[0, 1.6, 0]} s={[0.55, 0.55, 1.05]} />
            <M g={sphere} c="#5b3d28" p={[0, 1.95, 0.5]} s={[0.45, 0.35, 0.45]} />
            <group position={[0, 2.1, 1.05]} rotation-x={0.5}>
              <M g={sphere} c="#6d4c33" p={[0, 0, 0]} s={[0.26, 0.3, 0.3]} />
              <M g={sphere} c="#5b3d28" p={[0, -0.12, 0.34]} s={[0.2, 0.2, 0.3]} />
              <M g={sphere} c="#1d1d24" p={[0.15, 0.08, 0.2]} s={0.035} />
              <M g={sphere} c="#1d1d24" p={[-0.15, 0.08, 0.2]} s={0.035} />
              {[-1, 1].map((side) => (
                <group key={side} position={[side * 0.28, 0.28, -0.05]} rotation-z={-side * 0.5}>
                  <M g={box} c="#e8d5b0" p={[side * 0.25, 0.1, 0]} s={[0.5, 0.06, 0.32]} />
                  {[0, 1, 2].map((k) => (
                    <M key={k} g={cone} c="#e8d5b0" p={[side * (0.1 + k * 0.17), 0.25, 0.1]} s={[0.04, 0.2, 0.04]} />
                  ))}
                </group>
              ))}
            </group>
            {[
              [0.3, 0.6],
              [-0.3, 0.6],
              [0.3, -0.6],
              [-0.3, -0.6],
            ].map(([x, z]) => (
              <M key={`${x}${z}`} g={cyl} c="#5b3d28" p={[x, 0.6, z]} s={[0.09, 1.25, 0.09]} />
            ))}
          </group>
        </Animated>
      );
    case "mushroom":
      return (
        <group scale={1.4}>
          <M g={cyl} c="#fdfaf0" p={[0, 0.15, 0]} s={[0.07, 0.3, 0.07]} />
          <M g={sphere} c="#e74c3c" p={[0, 0.32, 0]} s={[0.22, 0.13, 0.22]} />
          {[0, 1, 2, 3, 4].map((i) => (
            <M key={i} g={sphere} c="#ffffff" p={[Math.cos(i * 1.3) * 0.13, 0.4, Math.sin(i * 1.3) * 0.13]} s={0.03} />
          ))}
        </group>
      );
    case "strawberry":
      return (
        <group>
          <M g={sphere} c="#4f8f3a" p={[0, 0.15, 0]} s={[0.4, 0.15, 0.4]} />
          {[0, 1, 2].map((i) => (
            <M key={i} g={cone} c="#e84343" p={[Math.cos(i * 2.1) * 0.25, 0.14, Math.sin(i * 2.1) * 0.25]} s={[0.08, 0.14, 0.08]} r={[Math.PI, 0, 0]} />
          ))}
        </group>
      );
    case "flower":
      return (
        <Animated fn={(g, t) => { g.rotation.z = Math.sin(t * 1.5) * 0.06; }}>
          <M g={cyl} c="#4f8f3a" p={[0, 0.35, 0]} s={[0.025, 0.7, 0.025]} />
          {Array.from({ length: 6 }, (_, i) => (
            <M key={i} g={sphere} c="#ff7aa2" p={[Math.cos(i * 1.05) * 0.12, 0.72, Math.sin(i * 1.05) * 0.12]} s={[0.09, 0.03, 0.09]} />
          ))}
          <M g={sphere} c="#ffd35c" p={[0, 0.74, 0]} s={0.06} />
        </Animated>
      );
    case "appletree":
      return (
        <group>
          <M g={cyl} c={palette.wood} p={[0, 1, 0]} s={[0.22, 2, 0.22]} />
          <M g={sphere} c="#5f9e4a" p={[0, 2.8, 0]} s={1.5} />
          {Array.from({ length: 9 }, (_, i) => (
            <M key={i} g={sphere} c="#e74c3c" p={[Math.cos(i * 0.7) * 1.35, 2.3 + (i % 3) * 0.45, Math.sin(i * 0.7) * 1.35]} s={0.13} />
          ))}
        </group>
      );
    case "stone":
      return (
        <group>
          <mesh geometry={new THREE.DodecahedronGeometry(1, 0)} material={toon(palette.stone)} position={[0, 0.6, 0]} scale={[1.3, 1, 1.1]} castShadow />
          <M g={sphere} c="#6aa04d" p={[0.2, 1.35, 0.1]} s={[0.6, 0.12, 0.5]} />
        </group>
      );
    case "swing":
      return (
        <group>
          {/* A-frame legs: feet spread along z, tops meet under the crossbar */}
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.9, 0, 0]}>
              <M g={cyl} c={palette.wood} p={[0, 1.2, 0.45]} s={[0.07, 2.6, 0.07]} r={[-0.35, 0, 0]} />
              <M g={cyl} c={palette.wood} p={[0, 1.2, -0.45]} s={[0.07, 2.6, 0.07]} r={[0.35, 0, 0]} />
            </group>
          ))}
          <M g={cyl} c={palette.wood} p={[0, 2.4, 0]} s={[0.07, 1.9, 0.07]} r={[0, 0, Math.PI / 2]} />
          {/* The seat hangs from, and pivots around, the crossbar. */}
          <group position={[0, 2.4, 0]}>
            <Animated fn={(g, t) => { g.rotation.x = Math.sin(t * 1.6) * 0.3; }}>
              <M g={cyl} c="#dfe6e9" p={[0.3, -0.9, 0]} s={[0.015, 1.8, 0.015]} />
              <M g={cyl} c="#dfe6e9" p={[-0.3, -0.9, 0]} s={[0.015, 1.8, 0.015]} />
              <M g={box} c="#d63031" p={[0, -1.8, 0]} s={[0.75, 0.07, 0.3]} />
            </Animated>
          </group>
        </group>
      );
    case "birch":
      return (
        <group scale={1.2}>
          <M g={cyl} c={palette.birchBark} p={[0, 1.8, 0]} s={[0.14, 3.6, 0.14]} />
          {[0.6, 1.4, 2.3, 3].map((h) => (
            <M key={h} g={box} c="#2d3436" p={[0.1, h, 0.08]} s={[0.1, 0.05, 0.08]} />
          ))}
          <M g={sphere} c={palette.leafLight} p={[0, 3.9, 0]} s={[1.1, 1.5, 1.1]} />
        </group>
      );
    default:
      return null;
  }
}

function baseHeight(item: Discovery) {
  if (item.y !== undefined) return groundAt(item.x, item.z) + item.y;
  if (item.prop === "rowboat") return 0;
  if (item.prop === "gull" || item.prop === "bucket") return dock.height;
  return groundAt(item.x, item.z);
}

function DiscoveryItem({ item, found }: { item: Discovery; found: boolean }) {
  const marker = useRef<THREE.Group>(null);
  const y = baseHeight(item);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const d = Math.hypot(runtime.player.x - item.x, runtime.player.z - item.z);
    if (marker.current) {
      marker.current.visible = !found;
      marker.current.position.y = item.lift + 0.3 + Math.sin(t * 2.4 + item.x) * 0.15;
      marker.current.rotation.y = t * 1.6;
      const pulse = 1 + Math.sin(t * 5 + item.z) * 0.15;
      marker.current.scale.setScalar((d < 4 ? 0.1 : d < 12 ? 0.17 : 0.13) * pulse);
    }
  });
  return (
    <group position={[item.x, y, item.z]}>
      <group rotation-y={item.rot ?? 0}>
        <Prop kind={item.prop} />
      </group>
      <group ref={marker}>
        <mesh geometry={gem} material={glow("#ffe27a", 2.6)} />
      </group>
    </group>
  );
}

export function Discoverables() {
  const discovered = useGame((s) => s.save.discovered);
  return (
    <>
      {discoveries.map((item) => (
        <DiscoveryItem key={item.id} item={item} found={discovered.includes(item.id)} />
      ))}
    </>
  );
}
