"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { heightAt, mulberry32, places, scatter } from "@/lib/game/world";
import { discoveries } from "@/lib/game/discoveries";
import { getGame } from "../store";
import { glow, palette, toon } from "./materials";

type Placement = { x: number; y: number; z: number; s: number; r: number; color?: THREE.Color };

function Instances({ geometry, material, items, transform }: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  items: Placement[];
  transform?: (item: Placement, m: THREE.Object3D) => void;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    items.forEach((item, i) => {
      o.position.set(item.x, item.y, item.z);
      o.rotation.set(0, item.r, 0);
      o.scale.setScalar(item.s);
      transform?.(item, o);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      if (item.color) mesh.setColorAt(i, item.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items, transform]);
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow receiveShadow />;
}

// Keep scattered scenery off discovery props so found objects stay visible.
const reserved = discoveries.map((d) => ({ x: d.x, z: d.z }));
function clear(points: ReturnType<typeof scatter>, radius: number) {
  return points.filter((p) => reserved.every((d) => Math.hypot(p.x - d.x, p.z - d.z) > radius));
}

export function Vegetation() {
  const data = useMemo(() => {
    const random = mulberry32(99);
    const pines = clear(scatter(46, 11, 3.2), 2.5).map((p) => ({ ...p, y: heightAt(p.x, p.z), s: p.s * 1.15 }));
    const rounds = clear(scatter(26, 23, 3.4), 2.5).map((p) => ({ ...p, y: heightAt(p.x, p.z) }));
    const birches = clear(scatter(18, 5, 3), 2.5).map((p) => ({ ...p, y: heightAt(p.x, p.z) }));
    const bushes = clear(scatter(40, 77, 1.8), 1.6).map((p) => ({ ...p, y: heightAt(p.x, p.z), s: p.s * 0.8 }));
    const rocks = clear(scatter(26, 31, 2.2), 1.6).map((p) => ({ ...p, y: heightAt(p.x, p.z) - 0.1, s: p.s * 0.6 }));
    const flowerColors = ["#ff7aa2", "#ffd35c", "#ffffff", "#b58cff", "#6fb7ff", "#ff9a5c"].map((c) => new THREE.Color(c));
    const flowers: Placement[] = [];
    const grass: Placement[] = [];
    const area = scatter(160, 57, 0.9);
    area.forEach((p, i) => {
      const cluster = 3 + Math.floor(random() * 4);
      const color = flowerColors[i % flowerColors.length];
      for (let k = 0; k < cluster; k++) {
        const x = p.x + (random() - 0.5) * 1.6;
        const z = p.z + (random() - 0.5) * 1.6;
        if (i % 3 === 0) flowers.push({ x, z, y: heightAt(x, z) + 0.15, s: 0.09 + random() * 0.05, r: 0, color });
        else grass.push({ x, z, y: heightAt(x, z), s: 0.25 + random() * 0.25, r: random() * 6 });
      }
    });
    // Extra blossoms around the square and garden.
    for (let i = 0; i < 60; i++) {
      const a = random() * Math.PI * 2;
      const r = 6 + random() * 1.4;
      const x = places.square.x + Math.cos(a) * r;
      const z = places.square.z + Math.sin(a) * r;
      flowers.push({ x, z, y: heightAt(x, z) + 0.15, s: 0.1, r: 0, color: flowerColors[i % flowerColors.length] });
    }
    return { pines, rounds, birches, bushes, rocks, flowers, grass };
  }, []);

  const geo = useMemo(() => {
    const pine = new THREE.ConeGeometry(1.3, 2.4, 7);
    pine.translate(0, 2.7, 0);
    const pine2 = new THREE.ConeGeometry(1.0, 2, 7);
    pine2.translate(0, 3.9, 0);
    const pine3 = new THREE.ConeGeometry(0.65, 1.6, 7);
    pine3.translate(0, 4.9, 0);
    const trunk = new THREE.CylinderGeometry(0.16, 0.24, 1.8, 7);
    trunk.translate(0, 0.9, 0);
    const round = new THREE.IcosahedronGeometry(1.5, 1);
    round.translate(0, 3.1, 0);
    const birchTop = new THREE.IcosahedronGeometry(1.1, 1);
    birchTop.scale(1, 1.35, 1);
    birchTop.translate(0, 3.6, 0);
    const birchTrunk = new THREE.CylinderGeometry(0.1, 0.15, 3.2, 7);
    birchTrunk.translate(0, 1.6, 0);
    const bush = new THREE.IcosahedronGeometry(0.7, 1);
    bush.translate(0, 0.35, 0);
    const rock = new THREE.DodecahedronGeometry(1, 0);
    const flower = new THREE.SphereGeometry(1, 7, 5);
    flower.scale(1, 0.55, 1);
    const blade = new THREE.ConeGeometry(0.12, 1, 4);
    blade.translate(0, 0.5, 0);
    return { pine, pine2, pine3, trunk, round, birchTop, birchTrunk, bush, rock, flower, blade };
  }, []);

  const squash = useMemo(() => (item: Placement, o: THREE.Object3D) => o.scale.set(item.s * 1.3, item.s * 0.8, item.s), []);

  return (
    <group>
      <Instances geometry={geo.trunk} material={toon(palette.woodDark)} items={data.pines} />
      <Instances geometry={geo.pine} material={toon(palette.pine)} items={data.pines} />
      <Instances geometry={geo.pine2} material={toon("#357a52")} items={data.pines} />
      <Instances geometry={geo.pine3} material={toon("#3d8a5c")} items={data.pines} />
      <Instances geometry={geo.trunk} material={toon(palette.wood)} items={data.rounds} />
      <Instances geometry={geo.round} material={toon(palette.leaf)} items={data.rounds} />
      <Instances geometry={geo.birchTrunk} material={toon(palette.birchBark)} items={data.birches} />
      <Instances geometry={geo.birchTop} material={toon(palette.leafLight)} items={data.birches} />
      <Instances geometry={geo.bush} material={toon("#5a9444")} items={data.bushes} />
      <Instances geometry={geo.rock} material={toon(palette.stone)} items={data.rocks} transform={squash} />
      <Instances geometry={geo.flower} material={toon("#ffffff")} items={data.flowers} />
      <Instances geometry={geo.blade} material={toon("#6aa84f")} items={data.grass} />
    </group>
  );
}

// The island's tree: a tiny sprout at level 1 that becomes a blossoming giant.
export function GreatTree({ stage }: { stage: number }) {
  const group = useRef<THREE.Group>(null);
  const burst = useRef<THREE.Points>(null);
  const displayed = useRef(0.2);
  const lastCelebration = useRef(getGame().celebration);
  const burstStart = useRef(-10);
  const { x, z } = places.square;
  const y = heightAt(x, z);

  const burstGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const count = 120;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const random = mulberry32(3);
    for (let i = 0; i < count; i++) {
      const a = random() * Math.PI * 2;
      const up = 2 + random() * 5;
      const out = 1 + random() * 3;
      velocities.set([Math.cos(a) * out, up, Math.sin(a) * out], i * 3);
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.userData.velocities = velocities;
    return geometry;
  }, []);

  useFrame((state, delta) => {
    const game = getGame();
    if (game.celebration !== lastCelebration.current) {
      lastCelebration.current = game.celebration;
      burstStart.current = state.clock.elapsedTime;
    }
    const scaleTarget = 0.28 + stage * 0.2;
    displayed.current = THREE.MathUtils.damp(displayed.current, scaleTarget, 1.6, delta);
    const since = state.clock.elapsedTime - burstStart.current;
    const bounce = since < 1.2 ? Math.sin(since * 14) * 0.08 * (1.2 - since) : 0;
    if (group.current) {
      group.current.scale.setScalar(displayed.current + bounce);
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
    if (burst.current) {
      const visible = since < 2.2;
      burst.current.visible = visible;
      if (visible) {
        const geometry = burst.current.geometry;
        const positions = geometry.attributes.position as THREE.BufferAttribute;
        const velocities = geometry.userData.velocities as Float32Array;
        for (let i = 0; i < positions.count; i++) {
          positions.setXYZ(
            i,
            velocities[i * 3] * since,
            2 + velocities[i * 3 + 1] * since - 4.5 * since * since,
            velocities[i * 3 + 2] * since,
          );
        }
        positions.needsUpdate = true;
        (burst.current.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - since / 2.2);
      }
    }
  });

  return (
    <group position={[x, y, z]}>
      <group ref={group}>
        <mesh material={toon("#7a5234")} position={[0, 2, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.6, 4, 9]} />
        </mesh>
        {[
          [0, 4.6, 0, 1.9],
          [1.3, 4.0, 0.5, 1.3],
          [-1.2, 4.2, -0.4, 1.4],
          [0.2, 5.6, -0.8, 1.2],
          [-0.5, 5.3, 1, 1.1],
        ].map(([cx, cy, cz, r], i) => (
          <mesh key={i} material={toon(i % 2 ? "#6bb24f" : "#7cc35a")} position={[cx, cy, cz]} castShadow>
            <icosahedronGeometry args={[r, 1]} />
          </mesh>
        ))}
        {stage >= 3
          ? Array.from({ length: 26 }, (_, i) => {
              const a = i * 2.39;
              const h = 3.6 + (i % 7) * 0.35;
              const r = 1.6 + (i % 3) * 0.35;
              return (
                <mesh key={i} material={glow(i % 3 ? "#ffc4dd" : "#fff4c2", 1.15)} position={[Math.cos(a) * r, h, Math.sin(a) * r]} scale={0.16}>
                  <icosahedronGeometry args={[1, 0]} />
                </mesh>
              );
            })
          : null}
      </group>
      <points ref={burst} geometry={burstGeometry} visible={false}>
        <pointsMaterial color="#fff2a8" size={0.35} transparent depthWrite={false} toneMapped={false} />
      </points>
    </group>
  );
}
