"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { world } from "@/content/vi/world";
import { mulberry32 } from "@/lib/game/world";
import { glow, palette, toon } from "./materials";
import { box, Box, cone, cyl, sphere, torus, type V3 } from "./parts";

// Cát Bà's scenery: limestone pillars standing in the bay all around the
// island, a junk with rust-red sails and bamboo basket boats at the landing,
// a floating fishing village, Bác Hùng's narrow yellow phở shop with plastic
// stools, the market, red lanterns over the banyan square, Ông Sơn's tiled
// house with its bamboo and drying net, the pagoda on the hill and a Cát Bà
// langur in the forest.

const { cottages, dock, heightAt, places } = world;

const colors = {
  tile: "#a4462f",
  tileDark: "#7e3322",
  mustard: "#e9b949",
  cream: "#f4efe4",
  shutter: "#3f7d5a",
  lacquer: "#b3261e",
  hull: "#6b4228",
  sail: "#c8552b",
  bamboo: "#b08a4f",
  limestone: "#9aa29a",
};

// Faces the building's door (local +x) toward a point on the island.
function facing(from: { x: number; z: number }, to: { x: number; z: number }) {
  return Math.atan2(-(to.z - from.z), to.x - from.x);
}

function ground(x: number, z: number): V3 {
  return [x, heightAt(x, z), z];
}

// ---- Limestone pillars -------------------------------------------------------

// A karst tower: undercut by the sea at the waterline, bulging above it and
// tapering to a jungle-covered crown. Vertex colours streak the grey rock and
// green the ledges and the top.
function karstGeometry(seed: number) {
  const random = mulberry32(seed);
  const geometry = new THREE.CylinderGeometry(1, 1, 1, 8, 7, false);
  geometry.translate(0, 0.5, 0);
  const position = geometry.attributes.position;
  const rock = new THREE.Color(colors.limestone);
  const streak = new THREE.Color("#7c857f");
  const pale = new THREE.Color("#b8bdb2");
  const jungle = new THREE.Color("#3f7a45");
  const moss = new THREE.Color("#5c8f4c");
  const lean = (random() - 0.5) * 0.25;
  const bulge = 0.9 + random() * 0.25;
  const colorsOut: number[] = [];
  const jitter = new Map<string, number>();
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const angle = Math.atan2(z, x);
    // Same jitter for vertices on the seam so the tower stays closed.
    const key = `${Math.round(y * 100)}|${Math.round(Math.cos(angle) * 100)}|${Math.round(Math.sin(angle) * 100)}`;
    if (!jitter.has(key)) jitter.set(key, 0.8 + random() * 0.4);
    const rough = jitter.get(key)!;
    // Cap centres sit on the axis; everything else is on the tower's skin.
    const radial = Math.hypot(x, z);
    const notch = y < 0.12 ? 0.72 : 1;
    const profile = notch * bulge * (1 - 0.5 * y ** 1.4) * rough * radial;
    position.setXYZ(i, Math.cos(angle) * profile + lean * y, y, Math.sin(angle) * profile);
    const c = rock.clone();
    if (Math.sin(angle * 5 + seed) > 0.55) c.copy(streak);
    else if (random() > 0.8) c.copy(pale);
    if (y > 0.72 || (y > 0.3 && random() > 0.82)) c.copy(random() > 0.4 ? jungle : moss);
    colorsOut.push(c.r, c.g, c.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colorsOut, 3));
  geometry.computeVertexNormals();
  return geometry;
}

// Clusters of towers around the bay: a few close enough to feel huge, the rest
// fading into the haze.
const pillars = (() => {
  const random = mulberry32(58);
  const placed: Array<{ x: number; z: number; w: number; h: number; r: number; kind: number }> = [];
  const clear = [
    { x: 26, z: 34, r: 12 },
    { x: 12, z: 39, r: 9 },
  ];
  for (let cluster = 0; cluster < 22; cluster++) {
    const angle = (cluster / 22) * Math.PI * 2 + random() * 0.25;
    // The title camera circles at 58, so the nearest towers stand just beyond it.
    const radius = cluster % 3 === 0 ? 76 + random() * 14 : 95 + random() * 100;
    const cx = Math.cos(angle) * radius;
    const cz = Math.sin(angle) * radius;
    const count = 2 + Math.floor(random() * 4);
    for (let i = 0; i < count; i++) {
      const x = cx + (random() - 0.5) * 20;
      const z = cz + (random() - 0.5) * 20;
      const w = 3 + random() * 6 + radius * 0.02;
      const h = 12 + random() * 26 + radius * 0.06;
      if (Math.hypot(x, z) < 66 + w) continue;
      if (clear.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + w)) continue;
      if (placed.some((p) => Math.hypot(x - p.x, z - p.z) < (p.w + w) * 0.8)) continue;
      placed.push({ x, z, w, h, r: random() * Math.PI * 2, kind: Math.floor(random() * 5) });
    }
  }
  return [...placed, ...nearPillars()];
})();

// The play camera looks down steeply and only sees about 15–30 units past the
// player, so the far towers never reach the frame. A ring of smaller towers
// stands in the shallows just off the shore, where walking to the water's edge
// brings them into view. They stay under 15 high so the title camera, circling
// at 58, still sees over them to the island.
function nearPillars() {
  const random = mulberry32(91);
  const placed: Array<{ x: number; z: number; w: number; h: number; r: number; kind: number }> = [];
  const clear = [
    // the landing's channel, the junk, the basket boats, the floating village
    { x: 0, z: 44, r: 7 },
    { x: 12, z: 39, r: 7 },
    { x: -5, z: 30, r: 4 },
    { x: 27, z: 34, r: 8 },
    { x: 33, z: 26, r: 7 },
    { x: 21, z: 41, r: 7 },
  ];
  for (let angle = 0; angle < Math.PI * 2; angle += 0.18 + random() * 0.1) {
    if (random() < 0.25) continue;
    const w = 2.4 + random() * 2.6;
    const h = 7 + random() * 8;
    const shore = world.shoreDistance(Math.cos(angle), Math.sin(angle)) + 1;
    const radius = Math.min(shore + w + 1.5 + random() * 6, 52 - w);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (world.shoreDistance(x, z) > -(w + 1)) continue;
    if (clear.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + w)) continue;
    if (placed.some((p) => Math.hypot(x - p.x, z - p.z) < (p.w + w) * 0.9)) continue;
    placed.push({ x, z, w, h, r: random() * Math.PI * 2, kind: Math.floor(random() * 5) });
  }
  return placed;
}

// White foam where the sea laps at the near towers' feet.
function PillarFoam() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const near = useMemo(() => pillars.filter((p) => Math.hypot(p.x, p.z) < 60), []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    near.forEach((p, i) => {
      o.position.set(p.x, 0.06, p.z);
      o.rotation.set(0, p.r, 0);
      o.scale.set(p.w * 0.85, 0.05, p.w * 0.75);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [near]);
  return <instancedMesh ref={ref} args={[cyl, toon("#e8f4ef", { surface: null }), near.length]} />;
}

function PillarKind({ kind }: { kind: number }) {
  const geometry = useMemo(() => karstGeometry(101 + kind * 17), [kind]);
  const ref = useRef<THREE.InstancedMesh>(null);
  const mine = useMemo(() => pillars.filter((p) => p.kind === kind), [kind]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    mine.forEach((p, i) => {
      o.position.set(p.x, -1.5, p.z);
      o.rotation.set(0, p.r, 0);
      o.scale.set(p.w, p.h + 1.5, p.w * 0.85);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [mine]);
  return <instancedMesh ref={ref} args={[geometry, toon("#ffffff", { vertexColors: true, surface: "stone" }), mine.length]} />;
}

// Lumpy jungle caps so the towers' crowns read as trees, not bare rock.
function PillarCrowns() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const crowns = useMemo(() => {
    const random = mulberry32(4);
    return pillars.flatMap((p) =>
      Array.from({ length: 3 }, () => ({
        x: p.x + (random() - 0.5) * p.w * 0.6,
        y: p.h * (1.0 + random() * 0.04) - 1,
        z: p.z + (random() - 0.5) * p.w * 0.5,
        s: p.w * (0.28 + random() * 0.2),
      })),
    );
  }, []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    crowns.forEach((c, i) => {
      o.position.set(c.x, c.y, c.z);
      o.scale.set(c.s, c.s * 0.6, c.s);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [crowns]);
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);
  return <instancedMesh ref={ref} args={[geometry, toon("#3a7342", { surface: "leaves" }), crowns.length]} />;
}

export function KarstPillars() {
  return (
    <group>
      {[0, 1, 2, 3, 4].map((kind) => (
        <PillarKind key={kind} kind={kind} />
      ))}
      <PillarFoam />
      <PillarCrowns />
    </group>
  );
}

// ---- The landing -------------------------------------------------------------

function Flag({ position, scale = 1 }: { position: V3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh geometry={cyl} material={toon(palette.woodDark)} position={[0, 0.7, 0]} scale={[0.03, 1.4, 0.03]} />
      <Box p={[0, 1.2, 0.3]} s={[0.02, 0.4, 0.6]} c="#d42a2a" t={null} shadow={false} />
      <mesh geometry={cyl} material={toon("#ffd23f", { surface: null })} position={[0.015, 1.2, 0.3]} rotation-z={Math.PI / 2} scale={[0.09, 0.01, 0.09]} />
    </group>
  );
}

// A junk: a dark wooden hull with a raised stern and three fan-shaped,
// battened sails in rust red.
function Junk() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.position.y = 0.05 + Math.sin(t * 0.7) * 0.08;
      ref.current.rotation.z = Math.sin(t * 0.5) * 0.02;
    }
  });
  const masts = [
    { z: -2.6, h: 6.2, w: 3.2 },
    { z: 0.6, h: 7.4, w: 3.8 },
    { z: 3.4, h: 4.8, w: 2.4 },
  ];
  return (
    // East of the landing and out of the camera's line to it, sails to the island.
    <group ref={ref} position={[12, 0, 39]} rotation-y={-0.3}>
      <Box p={[0, 0.2, 0]} s={[2.4, 1.2, 8.4]} c={colors.hull} t="planks" />
      <Box p={[0, 0.35, -4.6]} s={[1.6, 0.9, 1.2]} r={[0.35, 0, 0]} c={colors.hull} t="planks" />
      <Box p={[0, 1.05, 3.4]} s={[2.5, 0.9, 2]} c="#5a3620" t="planks" />
      <Box p={[0, 0.84, 0]} s={[2.3, 0.08, 8]} c={palette.plank} t="planks" />
      {/* the cabin, with warm windows */}
      <Box p={[0, 1.35, 1.2]} s={[1.8, 0.9, 2.2]} c="#8a5a36" t="siding" />
      <mesh geometry={box} material={glow("#ffd89a", 0.9)} position={[0.92, 1.4, 1.2]} scale={[0.04, 0.35, 1.6]} />
      <mesh geometry={box} material={glow("#ffd89a", 0.9)} position={[-0.92, 1.4, 1.2]} scale={[0.04, 0.35, 1.6]} />
      {masts.map((m) => (
        <group key={m.z} position={[0, 0.8, m.z]}>
          <mesh geometry={cyl} material={toon(palette.woodDark, { surface: "bark" })} position={[0, m.h / 2, 0]} scale={[0.07, m.h, 0.07]} castShadow />
          {Array.from({ length: 5 }, (_, i) => {
            const width = m.w * (0.55 + i * 0.12);
            const y = 1 + i * ((m.h - 1.4) / 5);
            return (
              <group key={i}>
                <Box p={[0, y + 0.5, width * 0.28]} s={[0.04, (m.h - 1.4) / 5 - 0.04, width]} c={colors.sail} t="fabric" />
                <Box p={[0, y, width * 0.28]} s={[0.07, 0.05, width + 0.1]} c="#3b2616" shadow={false} />
              </group>
            );
          })}
        </group>
      ))}
      <Flag position={[0, 1.5, 4.2]} scale={0.9} />
    </group>
  );
}

const basketBoat = (() => {
  const geometry = new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  return geometry;
})();

// Round bamboo coracles, rocking beside the landing.
function BasketBoats() {
  const refs = useRef<Array<THREE.Group | null>>([]);
  const boats = [
    { x: -4.4, z: 31.8, phase: 0 },
    { x: -5.4, z: 28.6, phase: 1.7 },
  ];
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    refs.current.forEach((g, i) => {
      if (!g) return;
      g.rotation.x = Math.sin(t * 0.9 + boats[i].phase) * 0.08;
      g.rotation.z = Math.cos(t * 0.7 + boats[i].phase) * 0.08;
      g.position.y = 0.15 + Math.sin(t * 1.1 + boats[i].phase) * 0.05;
    });
  });
  return (
    <group>
      {boats.map((b, i) => (
        <group key={i} ref={(g) => { refs.current[i] = g; }} position={[b.x, 0.15, b.z]}>
          <mesh geometry={basketBoat} material={toon(colors.bamboo, { surface: "planks" })} scale={[0.95, 0.5, 0.95]} castShadow />
          <mesh geometry={cyl} material={toon("#4a3a22")} position={[0, 0.02, 0]} scale={[0.9, 0.04, 0.9]} />
          <mesh geometry={torus} material={toon("#d9b77a", { surface: null })} position={[0, 0.03, 0]} rotation-x={Math.PI / 2} scale={[0.96, 0.96, 0.8]} />
          <mesh geometry={cyl} material={toon(palette.plank)} position={[0.3, 0.3, 0.3]} rotation={[1.1, 0, -0.5]} scale={[0.03, 1.6, 0.03]} />
        </group>
      ))}
    </group>
  );
}

export function Landing() {
  const planks = useMemo(() => {
    const items: number[] = [];
    for (let z = dock.zStart; z <= dock.zEnd; z += 0.55) items.push(z);
    return items;
  }, []);
  return (
    <group>
      {planks.map((z, i) => (
        <Box key={z} p={[dock.x, dock.height - 0.08, z]} s={[dock.halfWidth * 2, 0.14, 0.5]} c={i % 3 ? palette.plank : "#8a6a44"} t="planks" />
      ))}
      {[29, 33, 37, 40].flatMap((z) =>
        [-1, 1].map((side) => (
          <mesh key={`${z}${side}`} geometry={cyl} material={toon(palette.woodDark, { surface: "bark" })} position={[side * (dock.halfWidth + 0.1), 0.3, z]} scale={[0.15, 2, 0.15]} castShadow />
        )),
      )}
      <Junk />
      <BasketBoats />
      {/* Lan's ticket kiosk at the foot of the landing */}
      <group position={[-3.4, heightAt(-3.4, 25.5) - 0.05, 25.5]} rotation-y={-Math.PI / 2}>
        <Box p={[0, 1.1, 0]} s={[2, 2.2, 1.8]} c="#4f8fb8" t="siding" />
        <Box p={[0, 2.35, 0]} s={[2.5, 0.2, 2.3]} c={colors.tile} t="roof" />
        <mesh geometry={box} material={glow("#ffd89a", 1)} position={[1.02, 1.3, 0]} scale={[0.05, 0.6, 0.8]} />
      </group>
      <Box p={[2.4, 1.3, 25.5]} s={[0.14, 2.2, 0.14]} c={palette.woodDark} />
      <Flag position={[-4.6, heightAt(-4.6, 23.6), 23.6]} scale={2} />
    </group>
  );
}

// ---- The floating village ----------------------------------------------------

// Fish farms on plank rafts over blue barrels, each with a little hut.
function FloatingVillage() {
  const rafts = [
    { x: 27, z: 34, r: 0.4, hut: "#6fa8c9" },
    { x: 33, z: 26, r: -0.3, hut: "#8fbf7a" },
    { x: 21, z: 41, r: 0.9, hut: "#e9c46a" },
  ];
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.05;
  });
  return (
    <group ref={ref}>
      {rafts.map((raft) => (
        <group key={raft.x} position={[raft.x, 0, raft.z]} rotation-y={raft.r}>
          {[-2.2, 0, 2.2].flatMap((bx) =>
            [-2.2, 0, 2.2].map((bz) => (
              <mesh key={`${bx}${bz}`} geometry={cyl} material={toon("#2f6fb5", { surface: null })} position={[bx, 0.05, bz]} rotation-x={Math.PI / 2} scale={[0.35, 1.2, 0.35]} />
            )),
          )}
          <Box p={[0, 0.45, 0]} s={[6, 0.14, 6]} c={palette.plank} t="planks" />
          {/* square fish pens cut into the deck */}
          {[-1.5, 1.5].map((px) => (
            <group key={px} position={[px, 0.5, 1.6]}>
              <mesh geometry={box} material={toon("#1f5f5a", { surface: null })} scale={[2, 0.02, 2]} />
              <Box p={[0, 0.06, -1.02]} s={[2.1, 0.12, 0.1]} c="#8a6a44" shadow={false} />
              <Box p={[0, 0.06, 1.02]} s={[2.1, 0.12, 0.1]} c="#8a6a44" shadow={false} />
            </group>
          ))}
          <group position={[0, 0.5, -1.4]}>
            <Box p={[0, 0.9, 0]} s={[3.2, 1.8, 2.6]} c={raft.hut} t="siding" />
            <Box p={[0, 1.95, 0]} s={[3.6, 0.14, 3]} r={[0.12, 0, 0]} c="#7a8da0" t="roof" />
            <mesh geometry={box} material={glow("#ffd89a", 0.9)} position={[0, 0.9, 1.31]} scale={[0.8, 0.5, 0.04]} />
          </group>
        </group>
      ))}
    </group>
  );
}

// ---- The phở shop ------------------------------------------------------------

function Stool({ position, color }: { position: V3; color: string }) {
  return (
    <group position={position}>
      <mesh geometry={cyl} material={toon(color, { surface: null })} position={[0, 0.2, 0]} scale={[0.2, 0.4, 0.2]} castShadow />
      <mesh geometry={cyl} material={toon(color, { surface: null })} position={[0, 0.41, 0]} scale={[0.24, 0.04, 0.24]} />
    </group>
  );
}

// Bác Hùng's shop: a narrow three-storey "tube house" in mustard plaster with
// green shutters, a balcony, and the kitchen open to the street.
export function PhoShop({ open }: { open: boolean }) {
  const at = { x: places.pho.x - 1.6, z: places.pho.z - 0.6 };
  const y = heightAt(at.x, at.z);
  const floors = [0, 1, 2];
  return (
    <group>
      <group position={[at.x, y - 0.05, at.z]} rotation-y={facing(at, places.square)}>
        <Box p={[0, 3.6, 0]} s={[5.4, 7.2, 3.8]} c={colors.mustard} t="plaster" />
        <Box p={[0, 7.35, 0]} s={[5.6, 0.3, 4]} c={colors.cream} t="plaster" />
        <Box p={[-1.2, 7.9, 0]} s={[2.4, 0.9, 3.6]} c={colors.mustard} t="plaster" />
        <Box p={[-1.2, 8.45, 0]} s={[2.8, 0.2, 4]} c={colors.tile} t="roof" />
        {/* the open kitchen: a warm glow and a big pot on the counter */}
        <mesh geometry={box} material={glow(open ? "#ffcf8a" : "#6b5a48", open ? 1.1 : 0.6)} position={[2.71, 1.2, 0]} scale={[0.04, 2.2, 3]} />
        <Box p={[2.9, 0.5, -0.8]} s={[0.7, 1, 1.4]} c="#c9c4b8" t="stone" />
        <mesh geometry={cyl} material={toon("#9aa0a6", { surface: null })} position={[2.9, 1.3, -0.8]} scale={[0.4, 0.6, 0.4]} castShadow />
        {/* the red sign board over the door */}
        <Box p={[2.78, 2.7, 0]} s={[0.1, 0.8, 3.4]} c="#c8412b" t={null} />
        <Box p={[2.84, 2.7, 0]} s={[0.04, 0.3, 2.2]} c="#ffd23f" t={null} shadow={false} />
        {/* striped awning */}
        {Array.from({ length: 5 }, (_, i) => (
          <Box key={i} p={[3.2, 3.3, -1.6 + i * 0.8]} s={[1.1, 0.08, 0.8]} r={[0, 0, -0.3]} c={i % 2 ? "#ffffff" : "#2f6f4a"} t="fabric" />
        ))}
        {floors.slice(1).map((f) => (
          <group key={f} position={[2.72, 1.4 + f * 2.2, 0]}>
            {[-0.9, 0.9].map((z) => (
              <group key={z} position={[0, 0.2, z]}>
                <mesh geometry={box} material={glow("#ffe2a8", 0.9)} scale={[0.04, 1, 0.6]} />
                {[-1, 1].map((side) => (
                  <Box key={side} p={[0.04, 0, side * 0.46]} s={[0.05, 1.1, 0.3]} c={colors.shutter} shadow={false} />
                ))}
              </group>
            ))}
            {/* balcony rail with potted plants */}
            <Box p={[0.5, -0.6, 0]} s={[1, 0.1, 3.6]} c={colors.cream} />
            <Box p={[0.98, -0.3, 0]} s={[0.06, 0.5, 3.6]} c="#2d3436" t={null} shadow={false} />
            <mesh geometry={sphere} material={toon(palette.leaf, { surface: "leaves" })} position={[0.7, -0.2, 1.4]} scale={0.3} />
          </group>
        ))}
      </group>
      {/* little tables and plastic stools on the pavement */}
      {[
        [-9.6, 10],
        [-11.6, 9.4],
      ].map(([tx, tz], i) => (
        <group key={tx}>
          <group position={ground(tx, tz)}>
            <mesh geometry={box} material={toon("#d9d2c2")} position={[0, 0.5, 0]} scale={[0.9, 0.06, 0.9]} castShadow />
            <mesh geometry={cyl} material={toon("#9aa0a6")} position={[0, 0.25, 0]} scale={[0.05, 0.5, 0.05]} />
            {i === 0 ? (
              <group position={[0, 0.55, 0]}>
                <mesh geometry={basketBoat} material={toon("#ffffff", { surface: null })} position={[0, 0.16, 0]} scale={[0.22, 0.16, 0.22]} />
                <mesh geometry={cyl} material={toon("#c98b4a", { surface: null })} position={[0, 0.14, 0]} scale={[0.19, 0.01, 0.19]} />
                <mesh geometry={cyl} material={toon("#6aa84f", { surface: null })} position={[0.05, 0.155, 0.03]} scale={[0.06, 0.01, 0.06]} />
                {[-0.03, 0.03].map((cz) => (
                  <Box key={cz} p={[0.1, 0.2, cz]} s={[0.4, 0.015, 0.015]} r={[0, 0, 0.35]} c="#8a5a36" t={null} shadow={false} />
                ))}
              </group>
            ) : null}
          </group>
          {[
            [0.8, 0],
            [-0.8, 0],
            [0, 0.8],
          ].map(([sx, sz], k) => (
            <Stool key={k} position={ground(tx + sx, tz + sz)} color={k % 2 ? "#2f6fb5" : "#d42a2a"} />
          ))}
        </group>
      ))}
      <Stool position={ground(-10.8, 11.4)} color="#d42a2a" />
    </group>
  );
}

// ---- The market --------------------------------------------------------------

function FruitPile({ position, color, s = 0.13, tip }: { position: V3; color: string; s?: number; tip?: string }) {
  return (
    <group position={position}>
      <mesh geometry={cyl} material={toon("#b08a4f", { surface: "planks" })} position={[0, 0.05, 0]} scale={[0.42, 0.1, 0.42]} />
      {[
        [0, 0.18, 0],
        [0.18, 0.15, 0.1],
        [-0.16, 0.15, 0.12],
        [0.05, 0.15, -0.18],
        [0.02, 0.32, 0.03],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh geometry={sphere} material={toon(color, { surface: null })} scale={[s, s * 0.9, s * 1.2]} />
          {tip ? <mesh geometry={cone} material={toon(tip, { surface: null })} position={[0, s, 0]} scale={[s * 0.35, s * 0.6, s * 0.35]} /> : null}
        </group>
      ))}
    </group>
  );
}

function Stall({ position, rotation, tarp, fruit }: { position: V3; rotation: number; tarp: string; fruit: Array<{ color: string; tip?: string; s?: number }> }) {
  return (
    <group position={position} rotation-y={rotation}>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} p={[sx * 1.1, 1.2, sz * 0.8]} s={[0.08, 2.4, 0.08]} c="#8a6a44" />))}
      <Box p={[0, 2.5, 0]} s={[2.8, 0.06, 2.2]} r={[0.2, 0, 0]} c={tarp} t="fabric" />
      <Box p={[0, 0.8, 0.1]} s={[2.4, 0.1, 1.2]} c={palette.wood} t="planks" />
      <Box p={[0, 0.4, 0.1]} s={[2.3, 0.8, 1.1]} c="#8a6a44" t="planks" />
      {fruit.map((f, i) => (
        <FruitPile key={i} position={[-0.75 + i * 0.75, 0.85, 0.1]} color={f.color} tip={f.tip} s={f.s} />
      ))}
    </group>
  );
}

export function Market({ open }: { open: boolean }) {
  const { x, z } = places.market;
  const mango = { color: "#f4b41a" };
  const banana = { color: "#f7e04a", s: 0.1 };
  const dragon = { color: "#e0457b", tip: "#7fbf4f", s: 0.15 };
  return (
    <group>
      <Stall position={ground(x + 1.5, z - 1.8)} rotation={-Math.PI / 2 + 0.2} tarp="#2f6fb5" fruit={open ? [mango, dragon, banana] : []} />
      <Stall position={ground(x + 2.2, z + 2.2)} rotation={-Math.PI / 2 - 0.3} tarp="#e76f51" fruit={open ? [banana, mango, dragon] : []} />
      {/* a crate of conical hats for sale */}
      <group position={ground(12.4, 0.4)} rotation-y={0.4}>
        <Box p={[0, 0.3, 0]} s={[0.9, 0.6, 0.9]} c="#8a6a44" t="planks" />
        {[0, 1, 2].map((i) => (
          <mesh key={i} geometry={cone} material={toon("#ead9a2", { surface: null })} position={[0, 0.78 + i * 0.1, 0]} scale={[0.55, 0.3, 0.55]} castShadow />
        ))}
      </group>
      {/* the mango on the edge of the stall, for finding */}
      <mesh geometry={sphere} material={toon("#f4b41a", { surface: null })} position={[15.6, heightAt(15.6, 0.6) + 0.95, 0.6]} scale={[0.14, 0.12, 0.17]} />
    </group>
  );
}

// ---- The banyan square -------------------------------------------------------

// Red silk lanterns strung between poles around the square.
export function Lanterns() {
  const { x, z } = places.square;
  const poles: Array<[number, number]> = [
    [x + 4.2, z - 3.6],
    [x - 4.6, z - 3.2],
    [x - 4.4, z + 4],
    [x + 4.4, z + 3.8],
  ];
  const swing = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (swing.current) swing.current.children.forEach((c, i) => (c.rotation.z = Math.sin(state.clock.elapsedTime * 1.3 + i) * 0.08));
  });
  const strings = poles.map((p, i) => [p, poles[(i + 1) % poles.length]] as const);
  return (
    <group>
      {poles.map(([px, pz]) => (
        <mesh key={`${px}${pz}`} geometry={cyl} material={toon(palette.woodDark, { surface: "bark" })} position={[px, heightAt(px, pz) + 1.8, pz]} scale={[0.08, 3.6, 0.08]} castShadow />
      ))}
      <group ref={swing}>
        {strings.flatMap(([[ax, az], [bx, bz]], s) =>
          [0.25, 0.5, 0.75].map((t) => {
            const lx = ax + (bx - ax) * t;
            const lz = az + (bz - az) * t;
            const ly = Math.max(heightAt(ax, az), heightAt(bx, bz)) + 3.3 - Math.sin(t * Math.PI) * 0.4;
            return (
              <group key={`${s}${t}`} position={[lx, ly, lz]}>
                <mesh geometry={sphere} material={glow((s + t * 4) % 2 < 1 ? "#ff4a3a" : "#ffb03a", 1.1)} position={[0, -0.25, 0]} scale={[0.22, 0.28, 0.22]} />
                <Box p={[0, -0.02, 0]} s={[0.12, 0.05, 0.12]} c="#ffd23f" t={null} shadow={false} />
                <Box p={[0, -0.6, 0]} s={[0.03, 0.2, 0.03]} c="#ffd23f" t={null} shadow={false} />
              </group>
            );
          }),
        )}
      </group>
    </group>
  );
}

// ---- Ông Sơn's house ---------------------------------------------------------

// A Northern village house: low ochre walls, red lacquered columns on the
// porch and a tiled roof whose corners curl up at the ends.
function TiledRoof({ w, d, h, rise, color = colors.tile }: { w: number; d: number; h: number; rise: number; color?: string }) {
  const slope = Math.atan2(rise, w / 2);
  const length = Math.hypot(rise, w / 2) + 0.5;
  return (
    <group>
      {[-1, 1].map((side) => (
        <Box key={side} p={[(side * w) / 4, h + rise / 2, 0]} s={[length, 0.16, d + 0.8]} r={[0, 0, -side * slope]} c={color} t="roof" />
      ))}
      <Box p={[0, h + rise + 0.05, 0]} s={[0.3, 0.22, d + 1.1]} c={colors.tileDark} />
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} geometry={cone} material={toon(colors.tileDark)} position={[sx * (w / 2 + 0.2), h + 0.2, sz * (d / 2 + 0.45)]} rotation={[sz * -0.5, 0, sx * 0.6]} scale={[0.12, 0.5, 0.12]} />
        )),
      )}
      {[-1, 1].map((sz) => (
        <mesh key={sz} geometry={cone} material={toon(colors.tileDark)} position={[0, h + rise + 0.35, sz * (d / 2 + 0.55)]} rotation-x={sz * -0.6} scale={[0.1, 0.45, 0.1]} />
      ))}
    </group>
  );
}

export function SonHouse() {
  const at = { x: places.house.x + 1.4, z: places.house.z + 0.8 };
  const y = heightAt(at.x, at.z);
  return (
    <group>
      <group position={[at.x, y - 0.05, at.z]} rotation-y={facing(at, { x: 9, z: 21 })}>
        <Box p={[0, 0.2, 0]} s={[4.6, 0.4, 6.6]} c="#b9b3a6" t="stone" />
        <Box p={[-0.5, 1.6, 0]} s={[3.2, 2.6, 6]} c="#e8c07a" t="plaster" />
        <TiledRoof w={4.2} d={6} h={2.9} rise={1.6} />
        {[-2.2, -0.7, 0.7, 2.2].map((z) => (
          <mesh key={z} geometry={cyl} material={toon(colors.lacquer)} position={[1.5, 1.55, z]} scale={[0.1, 2.7, 0.1]} castShadow />
        ))}
        {/* wooden doors, one ajar with a warm light behind */}
        <Box p={[1.12, 1.2, -0.7]} s={[0.08, 1.9, 1.1]} c="#6b4228" t="planks" />
        <mesh geometry={box} material={glow("#ffcf8a", 1)} position={[1.1, 1.2, 0.6]} scale={[0.04, 1.8, 1]} />
        {/* big clay water jars by the porch */}
        {[-2.7, -3.3].map((z) => (
          <mesh key={z} geometry={sphere} material={toon("#8a5a36")} position={[1.9, 0.75, z]} scale={[0.4, 0.45, 0.4]} castShadow />
        ))}
      </group>
      {/* the fishing net drying on poles by the water */}
      <group position={ground(11.4, 22.6)} rotation-y={0.5}>
        {[-1.4, 1.4].map((px) => (
          <mesh key={px} geometry={cyl} material={toon(palette.woodDark, { surface: "bark" })} position={[px, 1.2, 0]} scale={[0.07, 2.4, 0.07]} castShadow />
        ))}
        <Box p={[0, 2.3, 0]} s={[3, 0.06, 0.06]} c={palette.woodDark} shadow={false} />
        <Box p={[0, 1.6, 0]} s={[2.7, 1.4, 0.03]} c="#6f8f6a" t="fabric" />
        {Array.from({ length: 5 }, (_, i) => (
          <Box key={i} p={[-1.1 + i * 0.55, 1.6, 0.02]} s={[0.03, 1.4, 0.02]} c="#3f5f45" t={null} shadow={false} />
        ))}
        {[0.9, 1.2].map((py) => (
          <mesh key={py} geometry={sphere} material={toon("#f4efe4", { surface: null })} position={[-1.2 + py, py, 0.05]} scale={0.08} />
        ))}
      </group>
      <Bamboo x={19.4} z={13.2} />
    </group>
  );
}

function Bamboo({ x, z }: { x: number; z: number }) {
  const stalks = useMemo(() => {
    const random = mulberry32(12);
    return Array.from({ length: 11 }, () => ({
      x: (random() - 0.5) * 1.8,
      z: (random() - 0.5) * 1.8,
      h: 5 + random() * 2.5,
      lean: (random() - 0.5) * 0.25,
      turn: random() * Math.PI * 2,
    }));
  }, []);
  return (
    <group position={ground(x, z)}>
      {stalks.map((s, i) => (
        <group key={i} position={[s.x, 0, s.z]} rotation={[s.lean, s.turn, s.lean * 0.6]}>
          <mesh geometry={cyl} material={toon(i % 3 ? "#7fae4a" : "#9bbf55", { surface: null })} position={[0, s.h / 2, 0]} scale={[0.06, s.h, 0.06]} castShadow />
          {[0.3, 0.55, 0.8].map((f) => (
            <mesh key={f} geometry={cyl} material={toon("#5f8a3a", { surface: null })} position={[0, s.h * f, 0]} scale={[0.075, 0.05, 0.075]} />
          ))}
          <mesh geometry={cone} material={toon("#5c9a47", { surface: "leaves" })} position={[0, s.h + 0.3, 0]} scale={[0.6, 1.4, 0.6]} castShadow />
        </group>
      ))}
    </group>
  );
}

// ---- Palms, pagoda, langur and houses ----------------------------------------

// A coconut palm whose trunk curves away from the island, over the beach.
function Palm({ x, z, lean, turn }: { x: number; z: number; lean: number; turn: number }) {
  const segments = 6;
  const step = 0.95;
  const bend = (t: number) => lean * 4 * t * t;
  return (
    <group position={ground(x, z)} rotation-y={turn}>
      {Array.from({ length: segments }, (_, i) => {
        const t = (i + 0.5) / segments;
        const slope = (lean * 8 * t) / (segments * step);
        return (
          <mesh key={i} geometry={cyl} material={toon("#8a6a44", { surface: "bark" })} position={[bend(t), (i + 0.5) * step, 0]} rotation-z={-Math.atan(slope)} scale={[0.18 - t * 0.05, 1.05, 0.18 - t * 0.05]} castShadow />
        );
      })}
      <group position={[bend(1), segments * step + 0.1, 0]}>
        {Array.from({ length: 7 }, (_, i) => (
          <group key={i} rotation-y={(i / 7) * Math.PI * 2}>
            <Box p={[1.1, -0.25, 0]} s={[2.4, 0.06, 0.5]} r={[0, 0, -0.4]} c={i % 2 ? "#4f8f3a" : "#5fa048"} t="leaves" />
          </group>
        ))}
        {[0, 2, 4].map((i) => (
          <mesh key={i} geometry={sphere} material={toon("#6b5a2e")} position={[Math.cos(i) * 0.25, -0.3, Math.sin(i) * 0.25]} scale={0.18} />
        ))}
      </group>
    </group>
  );
}

export function Palms() {
  return (
    <>
      <Palm x={-12} z={25} lean={0.5} turn={2.2} />
      <Palm x={-16} z={21.6} lean={0.35} turn={2.6} />
      <Palm x={9} z={27.4} lean={0.45} turn={-1.2} />
      <Palm x={-21} z={17} lean={0.3} turn={2.9} />
    </>
  );
}

// A small hilltop pagoda: a stone terrace, red columns and two tiers of
// curling tiled roofs, with a bronze incense urn in front.
export function Pagoda() {
  const at = { x: places.pagoda.x, z: places.pagoda.z - 1.4 };
  const y = heightAt(at.x, at.z);
  return (
    <group position={[at.x, y - 0.05, at.z]} rotation-y={facing(at, places.square)}>
      <Box p={[0, 0.3, 0]} s={[6, 0.6, 6.4]} c="#a9a293" t="stone" />
      <Box p={[-0.4, 1.8, 0]} s={[3.4, 2.4, 4.6]} c="#f1d27a" t="plaster" />
      {[-1.8, -0.6, 0.6, 1.8].map((z) => (
        <mesh key={z} geometry={cyl} material={toon(colors.lacquer)} position={[1.8, 1.8, z]} scale={[0.12, 2.4, 0.12]} castShadow />
      ))}
      <TiledRoof w={4.6} d={4.8} h={3} rise={1.2} />
      <group position={[-0.2, 1.4, 0]} scale={0.62}>
        <Box p={[0, 2.8, 0]} s={[3, 1.4, 3.6]} c="#f1d27a" t="plaster" />
        <TiledRoof w={4} d={3.8} h={3.4} rise={1.4} />
      </group>
      <mesh geometry={box} material={glow("#ffcf8a", 1)} position={[1.32, 1.4, 0]} scale={[0.04, 1.6, 1.1]} />
      <group position={[3.2, 0.6, 0]}>
        <mesh geometry={cyl} material={toon("#8c6a2f")} position={[0, 0.35, 0]} scale={[0.35, 0.7, 0.35]} castShadow />
        <mesh geometry={cyl} material={toon("#8c6a2f")} position={[0, 0.75, 0]} scale={[0.45, 0.1, 0.45]} />
        {[-0.1, 0.1].map((dx) => (
          <mesh key={dx} geometry={cyl} material={glow("#ff8a4a", 1.4)} position={[dx, 1, 0]} scale={[0.015, 0.4, 0.015]} />
        ))}
      </group>
    </group>
  );
}

// The golden-headed Cát Bà langur, one of the rarest monkeys in the world,
// sitting on a rock in the forest with its long tail hanging down.
export function Langur() {
  const at = { x: places.forest.x - 0.6, z: places.forest.z - 2 };
  const tail = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (tail.current) tail.current.rotation.z = Math.sin(t * 0.8) * 0.15;
    if (head.current) head.current.rotation.y = Math.sin(t * 0.4) * 0.6;
  });
  return (
    <group position={ground(at.x, at.z)} rotation-y={0.6}>
      <mesh geometry={sphere} material={toon(palette.stoneDark, { surface: "stone" })} position={[0, 0.5, 0]} scale={[1.1, 0.9, 1]} castShadow />
      <group position={[0, 1.3, 0]}>
        <mesh geometry={sphere} material={toon("#2a2522")} position={[0, 0.3, 0]} scale={[0.32, 0.42, 0.28]} castShadow />
        <group ref={head} position={[0, 0.85, 0]}>
          <mesh geometry={sphere} material={toon("#e8c77a")} scale={[0.24, 0.24, 0.24]} castShadow />
          <mesh geometry={sphere} material={toon("#2a2522")} position={[0.12, -0.02, 0]} scale={[0.14, 0.14, 0.15]} />
          <mesh geometry={cone} material={toon("#e8c77a")} position={[0, 0.22, 0]} scale={[0.12, 0.2, 0.12]} />
        </group>
        <group ref={tail} position={[-0.25, 0.1, 0]}>
          <mesh geometry={cyl} material={toon("#2a2522")} position={[0, -0.8, 0]} scale={[0.05, 1.6, 0.05]} />
        </group>
      </group>
    </group>
  );
}

export function Houses() {
  return (
    <>
      {cottages.map((c, i) => (
        <group key={i} position={[c.x, heightAt(c.x, c.z) - 0.05, c.z]} rotation-y={c.rot} scale={c.size}>
          {i % 2 ? (
            <>
              <Box p={[0, 1.3, 0]} s={[3.2, 2.6, 4.4]} c={c.color} t="plaster" />
              <TiledRoof w={3.6} d={4.4} h={2.6} rise={1.3} />
            </>
          ) : (
            <>
              <Box p={[0, 2.6, 0]} s={[3.6, 5.2, 3]} c={c.color} t="plaster" />
              <Box p={[0, 5.3, 0]} s={[3.8, 0.2, 3.2]} c={colors.tile} t="roof" />
              <Box p={[1.82, 3.6, 0]} s={[0.06, 1, 0.6]} c={colors.shutter} shadow={false} />
            </>
          )}
          <Box p={[i % 2 ? 1.62 : 1.82, 0.95, 0]} s={[0.08, 1.7, 0.9]} c="#6b4228" shadow={false} />
          <mesh geometry={box} material={glow("#ffd89a", 1)} position={[i % 2 ? 1.63 : 1.83, 1.6, -1.2]} scale={[0.04, 0.5, 0.5]} />
        </group>
      ))}
    </>
  );
}

export function CatBa({ unlocked }: { unlocked: Record<string, boolean> }) {
  return (
    <>
      <Landing />
      <FloatingVillage />
      <PhoShop open={unlocked.hung} />
      <Market open={unlocked.mai} />
      <Lanterns />
      <SonHouse />
      <Pagoda />
      <Langur />
      <Palms />
      <Houses />
      <KarstPillars />
    </>
  );
}
