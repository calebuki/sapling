"use client";

import * as THREE from "three";
import { glow, palette, toon } from "./materials";

// Building blocks every island's scenery is made of.

export const box = new THREE.BoxGeometry(1, 1, 1);
export const cyl = new THREE.CylinderGeometry(1, 1, 1, 16);
export const prism = new THREE.CylinderGeometry(1, 1, 1, 3);
export const sphere = new THREE.SphereGeometry(1, 16, 12);
export const cone = new THREE.ConeGeometry(1, 1, 12);
export const torus = new THREE.TorusGeometry(1, 0.12, 8, 24);

export type V3 = [number, number, number];

export function Box({ p, s, c, r, shadow = true }: { p: V3; s: V3; c: string; r?: V3; shadow?: boolean }) {
  return <mesh geometry={box} material={toon(c)} position={p} scale={s} rotation={r} castShadow={shadow} receiveShadow />;
}

export function FlowerBox({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <Box p={[0, 0, 0]} s={[0.3, 0.3, 1]} c={palette.wood} />
      {[-0.35, 0, 0.35].map((z, i) => (
        <mesh key={z} geometry={sphere} material={toon(["#ff6f91", "#ffd35c", "#ffffff"][i])} position={[0, 0.22, z]} scale={0.14} />
      ))}
    </group>
  );
}

export function Bench({ position, rotation }: { position: V3; rotation: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      <Box p={[0, 0.45, 0]} s={[1.8, 0.1, 0.5]} c={palette.wood} />
      <Box p={[0, 0.8, -0.22]} s={[1.8, 0.4, 0.08]} c={palette.wood} />
      {[-0.75, 0.75].map((bx) => (
        <Box key={bx} p={[bx, 0.22, 0]} s={[0.1, 0.45, 0.45]} c={palette.woodDark} />
      ))}
    </group>
  );
}

export function Lantern({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh geometry={cyl} material={toon("#2d3436")} position={[0, 1.1, 0]} scale={[0.06, 2.2, 0.06]} castShadow />
      <mesh geometry={box} material={glow("#ffcf7a", 2.4)} position={[0, 2.3, 0]} scale={[0.26, 0.34, 0.26]} />
      <mesh geometry={cone} material={toon("#2d3436")} position={[0, 2.6, 0]} scale={[0.26, 0.2, 0.26]} />
    </group>
  );
}
