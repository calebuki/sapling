"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { world } from "@/content/de/world";
import { mulberry32 } from "@/lib/game/world";
import { glow, palette, toon } from "./materials";
import { Bench, box, Box, cone, cyl, FlowerBox, Lantern, prism, sphere, torus, type V3 } from "./parts";

// Tannenau's buildings: half-timbered houses, Café Kuckuck, the clockmaker's
// workshop with its giant cuckoo clock, an old Black Forest farmhouse, the
// forester's log cabin, the school, the onion-domed chapel on the hill, a lake
// steamer at the landing stage and the mountains all around the lake.

const { cottages, dock, heightAt, places } = world;

const colors = {
  plaster: "#f6efe2",
  beam: "#5b3a24",
  roof: "#4a3226",
  shingle: "#3b3b44",
  shutter: "#2f6f4a",
  onion: "#3f7d6a",
  stone: "#9c9a92",
};

// Faces the building's door (local +x) toward a point on the island.
function facing(from: { x: number; z: number }, to: { x: number; z: number }) {
  return Math.atan2(-(to.z - from.z), to.x - from.x);
}

// A steep gable roof: ridge along z, slopes down to ±x.
function GableRoof({ w, d, h, rise, color, overhang = 0.4 }: { w: number; d: number; h: number; rise: number; color: string; overhang?: number }) {
  const slope = Math.atan2(rise, w / 2);
  const length = Math.hypot(rise, w / 2) + overhang;
  return (
    <group>
      <mesh geometry={prism} material={toon(colors.plaster)} position={[0, h + rise / 3, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[w / Math.sqrt(3), d, rise / 1.5]} castShadow />
      {[-1, 1].map((side) => (
        <Box key={side} p={[(side * w) / 4, h + rise / 2 + 0.08, 0]} s={[length, 0.16, d + overhang * 1.4]} r={[0, 0, -side * slope]} c={color} />
      ))}
    </group>
  );
}

// Dark timber frame drawn onto a box of plaster.
function Frame({ w, d, h, beam = colors.beam }: { w: number; d: number; h: number; beam?: string }) {
  const t = 0.12;
  const posts: V3[] = [
    [-w / 2, h / 2, -d / 2],
    [w / 2, h / 2, -d / 2],
    [-w / 2, h / 2, d / 2],
    [w / 2, h / 2, d / 2],
    [w / 2, h / 2, 0],
    [-w / 2, h / 2, 0],
  ];
  const brace = Math.atan2(h / 2, d / 2);
  const diagonal = Math.hypot(h / 2, d / 2);
  return (
    <group>
      {posts.map((p, i) => (
        <Box key={i} p={p} s={[t + 0.02, h, t]} c={beam} shadow={false} />
      ))}
      {[h * 0.5, h - 0.05].map((y) => (
        <group key={y}>
          <Box p={[w / 2 + 0.01, y, 0]} s={[t, t, d]} c={beam} shadow={false} />
          <Box p={[-w / 2 - 0.01, y, 0]} s={[t, t, d]} c={beam} shadow={false} />
          <Box p={[0, y, d / 2 + 0.01]} s={[w, t, t]} c={beam} shadow={false} />
          <Box p={[0, y, -d / 2 - 0.01]} s={[w, t, t]} c={beam} shadow={false} />
        </group>
      ))}
      {/* Braces in the upper floor, the classic Fachwerk X. */}
      {[-1, 1].flatMap((side) =>
        [-1, 1].map((half) => (
          <Box
            key={`${side}${half}`}
            p={[side * (w / 2 + 0.02), h * 0.75, (half * d) / 4]}
            s={[t, diagonal * 0.55, t]}
            r={[half * (Math.PI / 2 - brace), 0, 0]}
            c={beam}
            shadow={false}
          />
        )),
      )}
    </group>
  );
}

function Window({ p, shutters = colors.shutter, flowers = false }: { p: V3; shutters?: string; flowers?: boolean }) {
  return (
    <group position={p}>
      <Box p={[0, 0, 0]} s={[0.08, 0.75, 0.6]} c={colors.beam} shadow={false} />
      <mesh geometry={box} material={glow("#ffd89a", 1.05)} position={[0.03, 0, 0]} scale={[0.05, 0.6, 0.48]} />
      {[-1, 1].map((side) => (
        <Box key={side} p={[0.04, 0, side * 0.46]} s={[0.05, 0.72, 0.28]} c={shutters} shadow={false} />
      ))}
      {flowers ? <FlowerBox position={[0.14, -0.48, 0]} /> : null}
    </group>
  );
}

// A two-storey half-timbered house; the door is on the local +x face.
function Fachwerk({ w = 4, d = 5, h = 4, wall = colors.plaster, roof = colors.roof, sign }: { w?: number; d?: number; h?: number; wall?: string; roof?: string; sign?: React.ReactNode }) {
  return (
    <group>
      <Box p={[0, 0.3, 0]} s={[w + 0.2, 0.6, d + 0.2]} c={colors.stone} />
      <Box p={[0, h / 2, 0]} s={[w, h, d]} c={wall} />
      <Frame w={w} d={d} h={h} />
      <GableRoof w={w} d={d} h={h} rise={w * 0.75} color={roof} />
      <Box p={[w / 2 + 0.04, 0.95, 0]} s={[0.08, 1.7, 0.9]} c={colors.beam} shadow={false} />
      <Window p={[w / 2 + 0.04, h * 0.3, -d * 0.3]} />
      <Window p={[w / 2 + 0.04, h * 0.3, d * 0.3]} />
      <Window p={[w / 2 + 0.04, h * 0.75, -d * 0.25]} flowers />
      <Window p={[w / 2 + 0.04, h * 0.75, d * 0.25]} flowers />
      <Box p={[w * 0.2, h + w * 0.55, d * 0.25]} s={[0.4, 1.2, 0.4]} c={palette.stoneDark} />
      {sign}
    </group>
  );
}

export function Cottages() {
  return (
    <>
      {cottages.map((c, i) => (
        <group key={i} position={[c.x, heightAt(c.x, c.z) - 0.05, c.z]} rotation-y={c.rot} scale={c.size * 0.9}>
          <Fachwerk w={3.8} d={4.4} h={3.4} wall={c.color} roof={i % 2 ? colors.shingle : colors.roof} />
        </group>
      ))}
    </>
  );
}

function Steamer() {
  const ref = useRef<THREE.Group>(null);
  const wheel = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.position.y = 0.05 + Math.sin(t * 0.8) * 0.07;
      ref.current.rotation.z = Math.sin(t * 0.6) * 0.015;
    }
    if (wheel.current) wheel.current.rotation.x += delta * 0.4;
  });
  return (
    <group ref={ref} position={[4.3, 0, 36.5]}>
      <Box p={[0, 0.25, 0]} s={[3.2, 1.1, 9]} c="#f7f3ea" />
      <Box p={[0, -0.15, 0]} s={[3.25, 0.45, 9.05]} c="#1f5a3a" />
      <Box p={[0, 1.3, 0.2]} s={[2.6, 1, 4.6]} c="#ffffff" />
      <mesh geometry={box} material={glow("#bfe6f0", 0.9)} position={[0, 1.4, 0.2]} scale={[2.65, 0.4, 4.4]} />
      <Box p={[0, 1.85, 0.2]} s={[2.9, 0.12, 5]} c="#8b1e2d" />
      <mesh geometry={cyl} material={toon("#1d1d24")} position={[0, 2.6, -0.8]} scale={[0.32, 1.4, 0.32]} castShadow />
      <mesh geometry={cyl} material={toon("#d9a53a")} position={[0, 3.1, -0.8]} scale={[0.34, 0.14, 0.34]} />
      {/* paddle wheel housing and the wheel itself */}
      <Box p={[1.75, 0.8, -1]} s={[0.4, 1.3, 2]} c="#8b1e2d" />
      <group ref={wheel} position={[1.95, 0.4, -1]}>
        <mesh geometry={torus} material={toon("#1d1d24")} rotation-y={Math.PI / 2} scale={0.8} />
        {[0, 1, 2, 3].map((i) => (
          <Box key={i} p={[0, 0, 0]} s={[0.08, 1.5, 0.16]} r={[(i * Math.PI) / 4, 0, 0]} c="#6e4a2f" shadow={false} />
        ))}
      </group>
      {[-3.4, 3.4].map((z) => (
        <mesh key={z} geometry={cyl} material={toon("#d9a53a")} position={[1.2, 1, z]} scale={[0.05, 0.6, 0.05]} />
      ))}
    </group>
  );
}

export function LandingStage() {
  const planks = useMemo(() => {
    const items: number[] = [];
    for (let z = dock.zStart; z <= dock.zEnd; z += 0.55) items.push(z);
    return items;
  }, []);
  return (
    <group>
      {planks.map((z, i) => (
        <Box key={z} p={[dock.x, dock.height - 0.08, z]} s={[dock.halfWidth * 2, 0.14, 0.5]} c={i % 3 ? palette.plank : "#8a6a44"} />
      ))}
      {[29, 33, 37, 40].flatMap((z) =>
        [-1, 1].map((side) => (
          <mesh key={`${z}${side}`} geometry={cyl} material={toon(palette.woodDark)} position={[side * (dock.halfWidth + 0.1), 0.3, z]} scale={[0.15, 2, 0.15]} castShadow />
        )),
      )}
      <Steamer />
      {/* Greta's little ticket hut at the foot of the landing stage */}
      <group position={[-3.4, heightAt(-3.4, 25.5) - 0.05, 25.5]} rotation-y={-Math.PI / 2}>
        <Box p={[0, 1.1, 0]} s={[2, 2.2, 1.8]} c="#2f6fb5" />
        <GableRoof w={2} d={1.8} h={2.2} rise={1.1} color={colors.roof} overhang={0.3} />
        <mesh geometry={box} material={glow("#ffd89a", 1)} position={[1.02, 1.3, 0]} scale={[0.05, 0.6, 0.8]} />
      </group>
      <Box p={[2.4, 1.3, 25.5]} s={[0.14, 2.2, 0.14]} c={palette.woodDark} />
    </group>
  );
}

function Maibaum({ position }: { position: V3 }) {
  const wreath = toon("#3f7d4f");
  const stripes = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);
  return (
    <group position={position}>
      {stripes.map((i) => (
        <mesh key={i} geometry={cyl} material={toon(i % 2 ? "#ffffff" : "#c8a23a")} position={[0, 0.35 + i * 0.6, 0]} scale={[0.13, 0.6, 0.13]} castShadow />
      ))}
      <mesh geometry={cone} material={wreath} position={[0, 8, 0]} scale={[0.6, 1.4, 0.6]} castShadow />
      {[3.4, 5.6].map((y) => (
        <mesh key={y} geometry={torus} material={wreath} position={[0, y, 0]} rotation-x={Math.PI / 2} scale={[0.75, 0.75, 1.4]} />
      ))}
      {/* guild signs on the arms: a pretzel, a clock, a fir and a boat */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2;
        return (
          <group key={i} position={[Math.cos(a) * 0.9, 4.5 + (i % 2) * 0.9, Math.sin(a) * 0.9]} rotation-y={-a}>
            <Box p={[-0.45, 0, 0]} s={[0.9, 0.06, 0.06]} c={colors.beam} shadow={false} />
            <Box p={[0, -0.25, 0]} s={[0.05, 0.5, 0.5]} c={["#b5652b", "#fff4e0", "#1f5a3a", "#2f6fb5"][i]} shadow={false} />
          </group>
        );
      })}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} geometry={box} material={toon(i % 2 ? "#d42a2a" : "#f7c948")} position={[Math.cos(i) * 0.5, 6.4 - (i % 3) * 0.4, Math.sin(i) * 0.5]} scale={[0.04, 0.9, 0.12]} />
      ))}
    </group>
  );
}

function Fountain({ position }: { position: V3 }) {
  const water = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (water.current) water.current.position.y = 0.55 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
  });
  return (
    <group position={position}>
      <mesh geometry={new THREE.CylinderGeometry(1, 1, 1, 8)} material={toon(colors.stone)} position={[0, 0.35, 0]} scale={[1.5, 0.7, 1.5]} castShadow />
      <mesh ref={water} geometry={new THREE.CylinderGeometry(1, 1, 1, 8)} material={toon("#6fc3d9", { emissive: "#2b8fb0", emissiveIntensity: 0.2 })} position={[0, 0.55, 0]} scale={[1.3, 0.1, 1.3]} />
      <mesh geometry={cyl} material={toon(colors.stone)} position={[0, 1.3, 0]} scale={[0.18, 1.6, 0.18]} castShadow />
      <mesh geometry={sphere} material={toon("#c8a23a")} position={[0, 2.2, 0]} scale={0.2} />
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} geometry={cyl} material={toon("#9fdcf0")} position={[Math.cos(i * 1.57) * 0.35, 1.25, Math.sin(i * 1.57) * 0.35]} rotation={[Math.sin(i * 1.57) * 0.6, 0, -Math.cos(i * 1.57) * 0.6]} scale={[0.03, 0.8, 0.03]} />
      ))}
    </group>
  );
}

function MarketStall({ open }: { open: boolean }) {
  const x = 5.8;
  const z = 10.5;
  const fruit = ["#e74c3c", "#f7c948", "#8fce4f", "#c0392b", "#e67e22"];
  return (
    <group position={[x, heightAt(x, z), z]} rotation-y={0.5}>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} p={[sx * 1, 1.2, sz * 0.7]} s={[0.1, 2.4, 0.1]} c={colors.beam} />))}
      {Array.from({ length: 5 }, (_, i) => (
        <Box key={i} p={[-0.8 + i * 0.4, 2.45, 0]} s={[0.4, 0.08, 1.8]} r={[0.25, 0, 0]} c={i % 2 ? "#ffffff" : "#2f8f4f"} />
      ))}
      <Box p={[0, 0.85, 0.2]} s={[2.2, 0.12, 1.1]} c={palette.wood} />
      {open
        ? fruit.map((c, i) => (
            <group key={c} position={[-0.8 + i * 0.4, 1, 0.2]}>
              <Box p={[0, 0.08, 0]} s={[0.36, 0.16, 0.5]} c="#8a6a44" shadow={false} />
              {[0, 1, 2].map((k) => (
                <mesh key={k} geometry={sphere} material={toon(c)} position={[((k % 2) - 0.5) * 0.14, 0.22, (k - 1) * 0.14]} scale={0.09} />
              ))}
            </group>
          ))
        : null}
    </group>
  );
}

export function Marktplatz({ open }: { open: boolean }) {
  const { x, z } = places.square;
  const y = heightAt(x, z);
  return (
    <group>
      <mesh geometry={new THREE.CylinderGeometry(1, 1, 1, 10)} material={toon("#c4bdae")} position={[x, y - 0.02, z]} scale={[6, 0.08, 6]} receiveShadow />
      <mesh geometry={torus} material={toon(palette.stone)} position={[x, y + 0.06, z]} rotation-x={Math.PI / 2} scale={[1.7, 1.7, 1.4]} />
      <Maibaum position={[4.6, heightAt(4.6, 3.6), 3.6]} />
      <Fountain position={[-4.5, heightAt(-4.5, 3.5), 3.5]} />
      <MarketStall open={open} />
      {[
        [-4, 10.5, 0.4],
        [3.2, 12.2, -0.6],
      ].map(([bx, bz, r]) => (
        <Bench key={bx} position={[bx, heightAt(bx, bz), bz]} rotation={r} />
      ))}
      {[
        [1.8, 15],
        [-1.8, 20],
        [6.5, 2],
        [-6.5, 7],
        [-1.8, -4],
        [9, 0.5],
        [7.5, 12.5],
      ].map(([lx, lz]) => (
        <Lantern key={`${lx}${lz}`} position={[lx, heightAt(lx, lz), lz]} />
      ))}
    </group>
  );
}

export function CafeKuckuck({ open }: { open: boolean }) {
  const at = { x: places.bakery.x - 1.4, z: places.bakery.z - 1 };
  const y = heightAt(at.x, at.z);
  const pretzelSign = (
    <group position={[3.4, 2.6, -1.4]}>
      <Box p={[0, 0, 0]} s={[0.8, 0.06, 0.06]} c="#2d3436" shadow={false} />
      <mesh geometry={torus} material={toon("#d9a53a")} position={[0.3, -0.35, 0]} rotation-y={Math.PI / 2} scale={0.22} />
    </group>
  );
  return (
    <group>
      <group position={[at.x, y - 0.05, at.z]} rotation-y={facing(at, places.square)}>
        <Fachwerk w={6} d={7} h={4.2} sign={pretzelSign} />
        {/* striped awning over the shop window */}
        {Array.from({ length: 6 }, (_, i) => (
          <Box key={i} p={[3.55, 2.2, -2.5 + i]} s={[1.3, 0.1, 1]} r={[0, 0, -0.35]} c={i % 2 ? "#ffffff" : "#b5541c"} />
        ))}
      </group>
      {/* outdoor tables come out once the café opens */}
      {open &&
        [
          [-10.8, 1.6],
          [-9.2, 4.4],
        ].map(([tx, tz]) => (
          <group key={tx} position={[tx, heightAt(tx, tz), tz]}>
            <mesh geometry={cyl} material={toon(palette.trim)} position={[0, 0.75, 0]} scale={[0.6, 0.06, 0.6]} castShadow />
            <mesh geometry={cyl} material={toon(palette.woodDark)} position={[0, 0.37, 0]} scale={[0.06, 0.74, 0.06]} />
            <mesh geometry={cone} material={toon("#b5541c")} position={[0, 2.3, 0]} scale={[1.3, 0.5, 1.3]} castShadow />
            <mesh geometry={cyl} material={toon(palette.trim)} position={[0, 1.5, 0]} scale={[0.04, 1.6, 0.04]} />
            {[-0.9, 0.9].map((cx) => (
              <Box key={cx} p={[cx, 0.4, 0]} s={[0.45, 0.08, 0.45]} c={palette.wood} />
            ))}
          </group>
        ))}
      {/* the counter by the door, where Franz sets out cups */}
      <group position={[-9, heightAt(-9, 9.8), 9.8]} rotation-y={0.4}>
        <Box p={[0, 0.55, 0]} s={[1.6, 1.1, 0.8]} c="#7a4b2f" />
        <Box p={[0, 1.15, 0]} s={[1.7, 0.1, 0.9]} c={palette.trim} />
      </group>
    </group>
  );
}

// The line runs from a buffer stop on the island, over a viaduct across the
// lake, into a tunnel in the mountains. The train keeps a timetable once Lena
// opens up.
const track = { x: 25.5, buffer: 8, portal: -158, park: -5, away: -182 };
const railY = heightAt(track.x, track.park) + 0.2;
const deckY = railY - 0.2;
const timetable = { travel: 22, dwell: 28, away: 14 };

function trainZ(elapsed: number) {
  const { travel, dwell, away } = timetable;
  const t = elapsed % (travel * 2 + dwell + away);
  const ease = (k: number) => k * k * (3 - 2 * k);
  if (t < travel) return THREE.MathUtils.lerp(track.away, track.park, ease(t / travel));
  if (t < travel + dwell) return track.park;
  if (t < travel * 2 + dwell) return THREE.MathUtils.lerp(track.park, track.away, ease((t - travel - dwell) / travel));
  return track.away;
}

function Sleepers() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const zs = useMemo(() => {
    const items: number[] = [];
    for (let z = track.buffer - 0.6; z > track.portal; z -= 1.1) items.push(z);
    return items;
  }, []);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const m = new THREE.Matrix4();
    zs.forEach((z, i) => {
      m.compose(new THREE.Vector3(track.x, railY - 0.11, z), new THREE.Quaternion(), new THREE.Vector3(2, 0.12, 0.3));
      mesh.current!.setMatrixAt(i, m);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [zs]);
  return <instancedMesh ref={mesh} args={[box, toon(palette.woodDark), zs.length]} receiveShadow />;
}

// Where the viaduct leaves the island's north-east shore.
const viaductStart = -12;

function Viaduct() {
  const start = viaductStart;
  const length = start - track.portal;
  const mid = (start + track.portal) / 2;
  const arches = useMemo(() => {
    const items: number[] = [];
    for (let z = viaductStart - 5; z > track.portal + 4; z -= 8) items.push(z);
    return items;
  }, []);
  return (
    <group>
      <Box p={[track.x, deckY - 0.2, mid]} s={[3, 0.4, length]} c={colors.stone} shadow={false} />
      {[-1, 1].map((side) => (
        <Box key={side} p={[track.x + side * 1.45, deckY + 0.12, mid]} s={[0.18, 0.28, length]} c={palette.stoneDark} shadow={false} />
      ))}
      {arches.map((z) => (
        <group key={z}>
          <Box p={[track.x, deckY - 1.4, z]} s={[2.6, 2.4, 1.3]} c={colors.stone} shadow={false} />
          <mesh geometry={cyl} material={toon("#d6ece6")} position={[track.x, 0.04, z]} scale={[1.7, 0.04, 1]} />
        </group>
      ))}
    </group>
  );
}

export function Bahnhof({ open }: { open: boolean }) {
  const at = { x: places.station.x + 0.5, z: places.station.z - 1.5 };
  const y = heightAt(at.x, at.z);
  const train = useRef<THREE.Group>(null);
  const since = useRef<number | null>(null);
  useFrame((state) => {
    if (!train.current) return;
    if (!open) {
      since.current = null;
      train.current.position.z = track.away;
      return;
    }
    since.current ??= state.clock.elapsedTime;
    train.current.position.z = trainZ(state.clock.elapsedTime - since.current);
  });
  const railLength = track.buffer - track.portal;
  const railMid = (track.buffer + track.portal) / 2;
  return (
    <group>
      <group position={[at.x, y - 0.05, at.z]} rotation-y={Math.PI}>
        <Box p={[0, 0.9, 0]} s={[5, 1.8, 7]} c={colors.stone} />
        <Box p={[0, 2.5, 0]} s={[5, 1.4, 7]} c="#f3e6c8" />
        <Frame w={5} d={7} h={3.2} />
        <GableRoof w={5} d={7} h={3.2} rise={3} color={colors.shingle} />
        <mesh geometry={box} material={glow("#ffd89a", 1)} position={[2.53, 1.2, 0]} scale={[0.05, 1.2, 1.8]} />
        <Box p={[2.56, 3.3, 0]} s={[0.06, 0.5, 2.6]} c="#1f4e79" shadow={false} />
      </group>
      {/* platform and tracks */}
      <Box p={[track.x - 2.1, heightAt(track.x - 2.1, -3) + 0.1, -3]} s={[2.2, 0.35, 16]} c="#b9b4aa" />
      <Sleepers />
      {[-0.55, 0.55].map((dx) => (
        <Box key={dx} p={[track.x + dx, railY, railMid]} s={[0.1, 0.1, railLength]} c="#6d6f75" shadow={false} />
      ))}
      <group position={[track.x, railY, track.buffer]}>
        <Box p={[0, 0.5, 0]} s={[2.2, 0.9, 0.5]} c="#8b1e2d" />
        {[-0.6, 0.6].map((bx) => (
          <Box key={bx} p={[bx, 0.55, -0.35]} s={[0.35, 0.35, 0.3]} c={palette.yellow} shadow={false} />
        ))}
      </group>
      <Viaduct />
      <group ref={train} position={[track.x, railY + 0.05, track.away]}>
        <mesh geometry={box} material={glow("#fff4c8", 2)} position={[0, 1, 2.52]} scale={[0.5, 0.3, 0.05]} />
        <Box p={[0, 1.1, 0]} s={[2, 2, 5]} c="#8b1e2d" />
        <Box p={[0, 2.2, 0]} s={[2.1, 0.2, 5.1]} c="#f3e6c8" />
        <mesh geometry={box} material={glow("#fff0c2", 1)} position={[0, 1.4, 0]} scale={[2.05, 0.6, 4]} />
        <Box p={[0, 1.1, -5.4]} s={[2, 2, 5]} c="#8b1e2d" />
        <mesh geometry={box} material={glow("#fff0c2", 1)} position={[0, 1.4, -5.4]} scale={[2.05, 0.6, 4]} />
        {[2, 0.8, -0.8, -2, -3.4, -4.6, -6.2, -7.4].map((wz) => (
          <mesh key={wz} geometry={cyl} material={toon("#2b2b2b")} position={[0, 0.25, wz]} rotation-z={Math.PI / 2} scale={[0.3, 2.1, 0.3]} />
        ))}
      </group>
      {/* the station clock on its post */}
      <group position={[15, heightAt(15, -6), -6]}>
        <mesh geometry={cyl} material={toon("#2b2b2b")} position={[0, 1.4, 0]} scale={[0.07, 2.8, 0.07]} castShadow />
        <mesh geometry={cyl} material={toon("#ffffff")} position={[0, 2.9, 0]} rotation-x={Math.PI / 2} scale={[0.42, 0.12, 0.42]} castShadow />
        <mesh geometry={torus} material={toon("#1d1d24")} position={[0, 2.9, 0]} scale={0.42} />
      </group>
    </group>
  );
}

export function Uhrmacherei() {
  const at = { x: places.clockmaker.x + 1, z: places.clockmaker.z + 1.2 };
  const y = heightAt(at.x, at.z);
  const pendulum = useRef<THREE.Group>(null);
  const bird = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (pendulum.current) pendulum.current.rotation.x = Math.sin(t * 1.8) * 0.3;
    // The cuckoo pops out on the hour, which on Tannenau is every twelve seconds.
    if (bird.current) bird.current.position.x = 0.1 + Math.max(0, Math.sin((t / 12) * Math.PI * 2)) ** 12 * 0.6;
  });
  return (
    <group position={[at.x, y - 0.05, at.z]} rotation-y={facing(at, places.square)}>
      <Fachwerk w={4.4} d={5} h={4} wall="#f3e6c8" />
      {/* a giant cuckoo clock hangs on the front of the house */}
      <group position={[2.35, 3.2, 0]}>
        <Box p={[0, 0, 0]} s={[0.3, 1.8, 1.5]} c="#6b3f24" />
        <mesh geometry={prism} material={toon("#4a2c19")} position={[0, 1.15, 0]} rotation={[0, 0, 0]} scale={[0.3, 0.6, 1]} />
        <Box p={[0.05, 1.05, 0]} s={[0.3, 0.1, 1.9]} r={[0.5, 0, 0]} c="#4a2c19" />
        <Box p={[0.05, 1.05, 0]} s={[0.3, 0.1, 1.9]} r={[-0.5, 0, 0]} c="#4a2c19" />
        <mesh geometry={cyl} material={toon("#fff4e0")} position={[0.17, -0.1, 0]} rotation-z={Math.PI / 2} scale={[0.5, 0.05, 0.5]} />
        <Box p={[0.21, 0.05, 0]} s={[0.02, 0.35, 0.04]} c="#2c2a3d" shadow={false} />
        <Box p={[0.21, -0.1, 0.1]} s={[0.02, 0.04, 0.25]} c="#2c2a3d" shadow={false} />
        <Box p={[0.16, 0.6, 0]} s={[0.02, 0.3, 0.34]} c="#2c2a3d" shadow={false} />
        <group ref={bird} position={[0.1, 0.6, 0]}>
          <mesh geometry={sphere} material={toon("#f7c948")} scale={[0.14, 0.1, 0.1]} />
          <mesh geometry={cone} material={toon("#e67e22")} position={[0.15, 0, 0]} rotation-z={-Math.PI / 2} scale={[0.04, 0.1, 0.04]} />
        </group>
        {[-0.8, 0.8].map((z) => (
          <mesh key={z} geometry={sphere} material={toon("#3f7d4f")} position={[0.16, 0.7, z]} scale={[0.05, 0.14, 0.24]} />
        ))}
        <group ref={pendulum} position={[0.2, -0.9, 0]}>
          <mesh geometry={cyl} material={toon("#d9a53a")} position={[0, -0.6, 0]} scale={[0.025, 1.2, 0.025]} />
          <mesh geometry={cyl} material={toon("#d9a53a")} position={[0, -1.2, 0]} rotation-z={Math.PI / 2} scale={[0.16, 0.04, 0.16]} />
        </group>
        {[-0.35, 0.35].map((z) => (
          <mesh key={z} geometry={cone} material={toon("#6b3f24")} position={[0.2, -1.6, z]} scale={[0.07, 0.4, 0.07]} />
        ))}
      </group>
    </group>
  );
}

export function Arztpraxis() {
  const at = { x: places.doctor.x - 0.8, z: places.doctor.z + 1 };
  const y = heightAt(at.x, at.z);
  const sign = (
    <group position={[2.12, 2.3, 1.4]}>
      <Box p={[0, 0, 0]} s={[0.06, 0.5, 0.8]} c="#ffffff" shadow={false} />
      <Box p={[0.03, 0, 0]} s={[0.04, 0.34, 0.1]} c="#2f8f8f" shadow={false} />
      <Box p={[0.03, 0, 0]} s={[0.04, 0.1, 0.34]} c="#2f8f8f" shadow={false} />
    </group>
  );
  return (
    <group position={[at.x, y - 0.05, at.z]} rotation-y={facing(at, places.square)}>
      <Fachwerk w={4.2} d={5} h={3.8} wall="#ffffff" roof={colors.shingle} sign={sign} />
    </group>
  );
}

// A roof sloping down on all four sides, with a short ridge along z.
function useHipRoof(w: number, d: number, h: number) {
  return useMemo(() => {
    const W = w / 2;
    const D = d / 2;
    const r = Math.max(0, D - W * 0.8);
    const v = {
      a: [-W, 0, -D],
      b: [W, 0, -D],
      c: [W, 0, D],
      e: [-W, 0, D],
      top1: [0, h, -r],
      top2: [0, h, r],
    } as const;
    const tri = (...points: ReadonlyArray<readonly number[]>) => points.flatMap((p) => [...p]);
    const positions = [
      ...tri(v.b, v.top1, v.top2),
      ...tri(v.b, v.top2, v.c),
      ...tri(v.e, v.top2, v.top1),
      ...tri(v.e, v.top1, v.a),
      ...tri(v.a, v.top1, v.b),
      ...tri(v.c, v.top2, v.e),
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    return geometry;
  }, [w, d, h]);
}

// Hilde's farm: a Black Forest house under an enormous hipped roof.
export function Schwarzwaldhof({ open }: { open: boolean }) {
  const at = { x: places.farm.x - 2.5, z: places.farm.z - 2.6 };
  const y = heightAt(at.x, at.z);
  const roof = useHipRoof(11, 13, 6);
  return (
    <group>
      <group position={[at.x, y - 0.05, at.z]} rotation-y={facing(at, places.square)}>
        <Box p={[0, 1, 0]} s={[8, 2, 10]} c="#f3ead8" />
        <Box p={[0, 2.7, 0]} s={[8, 1.4, 10]} c="#7a4b2f" />
        <mesh geometry={roof} material={toon("#5b3d28", {})} position={[0, 3.2, 0]} castShadow receiveShadow />
        {/* the balcony that runs along the front, full of geraniums */}
        <Box p={[4.4, 2.1, 0]} s={[0.8, 0.12, 9]} c={palette.wood} />
        <Box p={[4.8, 2.5, 0]} s={[0.08, 0.7, 9]} c={palette.woodDark} />
        {[-3, -1, 1, 3].map((z) => (
          <FlowerBox key={z} position={[4.9, 2.9, z]} />
        ))}
        {[-3, 0, 3].map((z) => (
          <group key={z}>
            <Box p={[4.03, 1.1, z]} s={[0.08, 0.8, 0.7]} c={colors.beam} shadow={false} />
            <mesh geometry={box} material={glow("#ffd89a", 1)} position={[4.06, 1.1, z]} scale={[0.04, 0.6, 0.5]} />
          </group>
        ))}
        <Box p={[4.04, 0.95, 1.6]} s={[0.08, 1.7, 1]} c={colors.beam} shadow={false} />
      </group>
      {/* vegetable garden and fence */}
      <group position={[places.farm.x + 2.5, heightAt(places.farm.x + 2.5, places.farm.z + 3), places.farm.z + 3]}>
        {[
          [0, 0],
          [0, 2],
          [2.6, 1],
        ].map(([bx, bz], i) => (
          <group key={i} position={[bx, 0, bz]}>
            <Box p={[0, 0.15, 0]} s={[2.2, 0.3, 1.1]} c={palette.wood} />
            <Box p={[0, 0.3, 0]} s={[2, 0.06, 0.9]} c="#5a3d2b" shadow={false} />
            {Array.from({ length: 4 }, (_, j) => (
              <group key={j} position={[-0.75 + j * 0.5, 0.45, 0]}>
                <mesh geometry={sphere} material={toon("#4f8f3a")} scale={[0.16, open ? 0.22 : 0.1, 0.16]} />
                {open && i === 0 ? <mesh geometry={sphere} material={toon("#e0463a")} position={[0.08, 0.1, 0.1]} scale={0.08} /> : null}
              </group>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}

export function Forsthaus() {
  const at = { x: places.forest.x - 1.6, z: places.forest.z - 1 };
  const y = heightAt(at.x, at.z);
  return (
    <group position={[at.x, y - 0.05, at.z]} rotation-y={facing(at, places.square)}>
      {Array.from({ length: 7 }, (_, i) => (
        <group key={i}>
          <mesh geometry={cyl} material={toon(i % 2 ? "#7a4b2f" : "#6b3f24")} position={[0, 0.2 + i * 0.36, -1.7]} rotation-z={Math.PI / 2} scale={[0.19, 3.8, 0.19]} castShadow />
          <mesh geometry={cyl} material={toon(i % 2 ? "#6b3f24" : "#7a4b2f")} position={[0, 0.2 + i * 0.36, 1.7]} rotation-z={Math.PI / 2} scale={[0.19, 3.8, 0.19]} castShadow />
          <mesh geometry={cyl} material={toon(i % 2 ? "#7a4b2f" : "#6b3f24")} position={[1.7, 0.38 + i * 0.36, 0]} rotation-x={Math.PI / 2} scale={[0.19, 3.8, 0.19]} castShadow />
          <mesh geometry={cyl} material={toon(i % 2 ? "#6b3f24" : "#7a4b2f")} position={[-1.7, 0.38 + i * 0.36, 0]} rotation-x={Math.PI / 2} scale={[0.19, 3.8, 0.19]} castShadow />
        </group>
      ))}
      <GableRoof w={3.8} d={3.8} h={2.6} rise={1.8} color="#3f5a2a" overhang={0.6} />
      <Box p={[1.8, 0.9, 0]} s={[0.08, 1.6, 0.8]} c="#3b2616" shadow={false} />
      {/* antlers over the door */}
      <group position={[1.9, 2.1, 0]}>
        {[-1, 1].map((side) => (
          <group key={side} rotation-x={side * 0.6}>
            <mesh geometry={cyl} material={toon("#e8d5b0")} position={[0, 0.15, side * 0.15]} scale={[0.03, 0.4, 0.03]} />
            <mesh geometry={cone} material={toon("#e8d5b0")} position={[0, 0.3, side * 0.3]} rotation-x={side * 0.8} scale={[0.03, 0.2, 0.03]} />
          </group>
        ))}
      </group>
      {/* a woodpile */}
      <group position={[0.4, 0, 2.6]}>
        {[0, 1, 2].flatMap((row) =>
          [0, 1, 2, 3].map((k) => (
            <mesh key={`${row}${k}`} geometry={cyl} material={toon("#b98b5e")} position={[-0.6 + k * 0.38, 0.2 + row * 0.36, 0]} rotation-x={Math.PI / 2} scale={[0.18, 1, 0.18]} castShadow />
          )),
        )}
      </group>
    </group>
  );
}

export function Schule() {
  const at = { x: places.school.x + 1.2, z: places.school.z - 1 };
  const y = heightAt(at.x, at.z);
  const bell = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (bell.current) bell.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.2) * 0.15;
  });
  return (
    <group position={[at.x, y - 0.05, at.z]} rotation-y={facing(at, { x: 16, z: -13 })}>
      <Box p={[0, 1.7, 0]} s={[5, 3.4, 7]} c="#f2d27a" />
      <Frame w={5} d={7} h={3.4} beam="#8a5a36" />
      <GableRoof w={5} d={7} h={3.4} rise={2.6} color="#8c4a3a" />
      {[-2, 0, 2].map((z) => (
        <group key={z}>
          <Box p={[2.53, 1.9, z]} s={[0.08, 1.2, 1]} c="#ffffff" shadow={false} />
          <mesh geometry={box} material={glow("#ffe7b0", 1)} position={[2.56, 1.9, z]} scale={[0.04, 1, 0.8]} />
        </group>
      ))}
      {/* the bell tower on the ridge */}
      <group position={[0, 5.9, -2.2]}>
        <Box p={[0, 0, 0]} s={[1, 1, 1]} c="#ffffff" />
        <mesh ref={bell} geometry={cone} material={toon("#d9a53a")} position={[0, -0.05, 0]} scale={[0.3, 0.45, 0.3]} />
        <mesh geometry={cone} material={toon("#8c4a3a")} position={[0, 0.9, 0]} scale={[0.8, 0.8, 0.8]} castShadow />
      </group>
    </group>
  );
}

export function Kapelle() {
  const at = { x: places.chapel.x + 0.2, z: places.chapel.z - 1.6 };
  const y = heightAt(at.x, at.z);
  return (
    <group position={[at.x, y - 0.05, at.z]} rotation-y={facing(at, places.square)}>
      <Box p={[-0.6, 1.6, 0]} s={[5, 3.2, 3.4]} c="#ffffff" />
      <group rotation-y={Math.PI / 2} position={[-0.6, 0, 0]}>
        <GableRoof w={3.4} d={5} h={3.2} rise={2} color={colors.shingle} overhang={0.3} />
      </group>
      {/* tower with the onion dome, facing the village */}
      <group position={[2.2, 0, 0]}>
        <Box p={[0, 3, 0]} s={[1.7, 6, 1.7]} c="#ffffff" />
        <mesh geometry={cyl} material={toon("#fff4e0")} position={[0.87, 4.6, 0]} rotation-z={Math.PI / 2} scale={[0.45, 0.05, 0.45]} />
        <mesh geometry={torus} material={toon("#1d1d24")} position={[0.9, 4.6, 0]} rotation-y={Math.PI / 2} scale={0.45} />
        <mesh geometry={sphere} material={toon(colors.onion)} position={[0, 6.8, 0]} scale={[1.05, 1.1, 1.05]} castShadow />
        <mesh geometry={cone} material={toon(colors.onion)} position={[0, 8.05, 0]} scale={[0.45, 0.9, 0.45]} castShadow />
        <mesh geometry={sphere} material={toon("#d9a53a")} position={[0, 8.6, 0]} scale={0.12} />
        <Box p={[0, 9.1, 0]} s={[0.06, 0.9, 0.06]} c="#d9a53a" shadow={false} />
        <Box p={[0, 9.25, 0]} s={[0.06, 0.06, 0.45]} c="#d9a53a" shadow={false} />
      </group>
      <Box p={[3.08, 1, 0]} s={[0.08, 2, 0.8]} c={colors.beam} shadow={false} />
      <Bench position={[4.2, 0, 2.2]} rotation={-2.3} />
    </group>
  );
}

// The shores and mountains around the lake, far enough away that the fog
// turns them into soft green-blue silhouettes.
const mountains = (() => {
  const random = mulberry32(31);
  return Array.from({ length: 22 }, (_, i) => {
    const angle = (i / 22) * Math.PI * 2 + random() * 0.15;
    const radius = 175 + random() * 40;
    return {
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      height: 38 + random() * 42,
      width: 36 + random() * 26,
      snow: random() > 0.45,
    };
  });
})();

const shoreFirs = (() => {
  const random = mulberry32(8);
  return Array.from({ length: 70 }, () => {
    const angle = random() * Math.PI * 2;
    const radius = 150 + random() * 14;
    return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius, s: 2 + random() * 2 };
  });
})();

export function Mountains() {
  const shore = useMemo(() => new THREE.RingGeometry(146, 260, 64, 1), []);
  const firs = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!firs.current) return;
    const o = new THREE.Object3D();
    shoreFirs.forEach((t, i) => {
      o.position.set(t.x, t.s * 1.3, t.z);
      o.scale.set(t.s, t.s * 2.8, t.s);
      o.updateMatrix();
      firs.current!.setMatrixAt(i, o.matrix);
    });
    firs.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <group>
      <mesh geometry={shore} material={toon("#6f9f55")} rotation-x={-Math.PI / 2} position-y={0.25} />
      <instancedMesh ref={firs} args={[cone, toon("#24533a"), shoreFirs.length]} />
      {mountains.map((m, i) => (
        <group key={i} position={[m.x, 0, m.z]}>
          <mesh geometry={cone} material={toon(i % 2 ? "#3f6f55" : "#4a7a5c")} position={[0, m.height / 2, 0]} scale={[m.width, m.height, m.width]} />
          {m.snow ? (
            <mesh geometry={cone} material={toon("#f4f7f8")} position={[0, m.height * 0.86, 0]} scale={[m.width * 0.29, m.height * 0.28, m.width * 0.29]} />
          ) : null}
        </group>
      ))}
      {/* tunnel portal the train disappears into */}
      <group position={[track.x, deckY, track.portal - 3]}>
        <Box p={[0, 2.3, 0]} s={[6, 4.6, 6]} c={palette.stoneDark} shadow={false} />
        <mesh geometry={box} material={toon("#141419")} position={[0, 1.7, 3.01]} scale={[2.8, 3.4, 0.05]} />
        <Box p={[0, 4.4, 3.1]} s={[6.4, 0.4, 0.3]} c={palette.stone} shadow={false} />
      </group>
      <mesh geometry={cone} material={toon("#3f6f55")} position={[track.x, 22, track.portal - 22]} scale={[34, 44, 34]} />
    </group>
  );
}

export function Tannenau({ unlocked }: { unlocked: Record<string, boolean> }) {
  return (
    <>
      <LandingStage />
      <Marktplatz open={unlocked.marie} />
      <CafeKuckuck open={unlocked.franz} />
      <Bahnhof open={unlocked.lena} />
      <Uhrmacherei />
      <Arztpraxis />
      <Schwarzwaldhof open={unlocked.hilde} />
      <Forsthaus />
      <Schule />
      <Kapelle />
      <Cottages />
      <Mountains />
    </>
  );
}
