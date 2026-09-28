"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { world } from "@/content/sv/world";
import { mulberry32 } from "@/lib/game/world";
import { glow, palette, toon } from "./materials";
import { Bench, box, Box, cone, cyl, FlowerBox, Lantern, prism, sphere, torus, type V3 } from "./parts";

// Lilla Ö's buildings: falu-red cottages, Café Kanel, the station with its
// bridge to the mainland, Astrid's garden, the lookout flag, Nils's boathouse,
// Maja's shop, the health centre, the library and the lighthouse.

const { cottages, dock, heightAt, places } = world;

function Gable({ width, depth, height, wall, roof, doorSide = 1 }: { width: number; depth: number; height: number; wall: string; roof: string; doorSide?: 1 | -1 }) {
  const roofHeight = width * 0.42;
  return (
    <group>
      <Box p={[0, height / 2, 0]} s={[width, height, depth]} c={wall} />
      {/* White corner trims make the falu-red read as Swedish */}
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([x, z]) => (
        <Box key={`${x}${z}`} p={[(x * width) / 2, height / 2, (z * depth) / 2]} s={[0.18, height, 0.18]} c={palette.trim} shadow={false} />
      ))}
      {/* gable ends */}
      <mesh geometry={prism} material={toon(wall)} position={[0, height + roofHeight / 3, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[width / Math.sqrt(3), depth, roofHeight / 1.5]} castShadow />
      {/* roof slabs */}
      {[-1, 1].map((side) => {
        const slope = Math.atan2(roofHeight, width / 2);
        const length = Math.hypot(roofHeight, width / 2) + 0.35;
        return (
          <Box
            key={side}
            p={[(side * width) / 4, height + roofHeight / 2 + 0.08, 0]}
            s={[length, 0.16, depth + 0.5]}
            r={[0, 0, -side * slope]}
            c={roof}
          />
        );
      })}
      {/* door + windows on the front (+x or -x) */}
      <Box p={[(doorSide * width) / 2 + doorSide * 0.03, 0.75, 0]} s={[0.08, 1.5, 0.8]} c={palette.woodDark} shadow={false} />
      {[-1, 1].map((z) => (
        <group key={z}>
          <Box p={[(doorSide * width) / 2 + doorSide * 0.03, height * 0.6, z * depth * 0.3]} s={[0.1, 0.8, 0.8]} c={palette.trim} shadow={false} />
          <mesh geometry={box} material={glow("#ffd89a", 1.1)} position={[(doorSide * width) / 2 + doorSide * 0.07, height * 0.6, z * depth * 0.3]} scale={[0.05, 0.6, 0.6]} />
        </group>
      ))}
      <Box p={[width * 0.2, height + roofHeight * 0.7, depth * 0.25]} s={[0.4, 1.2, 0.4]} c={palette.stoneDark} />
    </group>
  );
}

export function Cottages() {
  return (
    <>
      {cottages.map((c, i) => (
        <group key={i} position={[c.x, heightAt(c.x, c.z) - 0.05, c.z]} rotation-y={c.rot} scale={c.size}>
          <Gable width={3.6} depth={4.4} height={2.4} wall={c.color} roof={i % 2 ? palette.roofTile : palette.roof} />
          <FlowerBox position={[1.95, 0.35, -1.2]} />
        </group>
      ))}
    </>
  );
}

export function Dock() {
  const planks = useMemo(() => {
    const items: number[] = [];
    for (let z = dock.zStart; z <= dock.zEnd; z += 0.55) items.push(z);
    return items;
  }, []);
  return (
    <group>
      {planks.map((z, i) => (
        <Box key={z} p={[dock.x, dock.height - 0.08, z]} s={[dock.halfWidth * 2, 0.14, 0.5]} c={i % 3 ? palette.plank : "#a87c52"} />
      ))}
      {[27, 31, 35, 38].flatMap((z) =>
        [-1, 1].map((side) => (
          <mesh key={`${z}${side}`} geometry={cyl} material={toon(palette.woodDark)} position={[side * (dock.halfWidth + 0.1), 0.3, z]} scale={[0.14, 2, 0.14]} castShadow />
        )),
      )}
      <Ferry />
      <Box p={[-2.2, 1.3, 25.5]} s={[0.14, 2.2, 0.14]} c={palette.woodDark} />
    </group>
  );
}

function Ferry() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = 0.05 + Math.sin(t * 0.9) * 0.08;
    ref.current.rotation.z = Math.sin(t * 0.7) * 0.02;
  });
  return (
    <group ref={ref} position={[3.9, 0, 36]}>
      <Box p={[0, 0.3, 0]} s={[3, 1.2, 8]} c="#f4f1ea" />
      <Box p={[0, -0.1, 0]} s={[3.05, 0.5, 8.05]} c="#1f4e79" />
      <Box p={[0, 1.4, -0.8]} s={[2.4, 1.2, 3.2]} c="#ffffff" />
      <mesh geometry={box} material={glow("#bfe6f0", 0.9)} position={[0, 1.55, -0.8]} scale={[2.45, 0.45, 3.1]} />
      <Box p={[0, 2.3, -0.4]} s={[0.6, 0.9, 0.6]} c="#c0392b" />
      <Box p={[0, 2.8, -0.4]} s={[0.66, 0.2, 0.66]} c="#1d1d24" />
    </group>
  );
}

export function Cafe({ open }: { open: boolean }) {
  const { x, z } = places.cafe;
  const y = heightAt(x, z);
  return (
    <group position={[x - 1, y - 0.05, z - 1]}>
      <Gable width={6} depth={7} height={3.2} wall={palette.falu} roof={palette.roof} doorSide={1} />
      {/* striped awning */}
      {Array.from({ length: 7 }, (_, i) => (
        <Box key={i} p={[3.6, 2.7, -3 + i]} s={[1.4, 0.1, 1]} r={[0, 0, -0.35]} c={i % 2 ? "#ffffff" : "#d64545"} />
      ))}
      {/* outdoor tables come out once the café opens */}
      {open && [
        [5.2, -2.4],
        [7.6, 0.4],
      ].map(([tx, tz]) => (
        <group key={tx} position={[tx, 0, tz]}>
          <mesh geometry={cyl} material={toon(palette.trim)} position={[0, 0.75, 0]} scale={[0.6, 0.06, 0.6]} castShadow />
          <mesh geometry={cyl} material={toon(palette.woodDark)} position={[0, 0.37, 0]} scale={[0.06, 0.74, 0.06]} />
          <mesh geometry={cone} material={toon("#d64545")} position={[0, 2.3, 0]} scale={[1.3, 0.5, 1.3]} castShadow />
          <mesh geometry={cyl} material={toon(palette.trim)} position={[0, 1.5, 0]} scale={[0.04, 1.6, 0.04]} />
          {[-0.9, 0.9].map((cx) => (
            <Box key={cx} p={[cx, 0.4, 0]} s={[0.45, 0.08, 0.45]} c={palette.wood} />
          ))}
        </group>
      ))}
      {/* coffee cart next to Bosse */}
      <group position={[6.3, 0, 6.8]} rotation-y={-0.5}>
        <Box p={[0, 0.55, 0]} s={[1.6, 1.1, 0.8]} c="#7a4b2f" />
        <Box p={[0, 1.15, 0]} s={[1.7, 0.1, 0.9]} c={palette.trim} />
        <mesh geometry={cyl} material={toon("#c9c9c9")} position={[-0.4, 1.45, 0]} scale={[0.18, 0.5, 0.18]} castShadow />
        {[0.2, 0.55].map((bx) => (
          <mesh key={bx} geometry={sphere} material={toon("#c98a4b")} position={[bx, 1.3, 0.1]} scale={[0.14, 0.08, 0.14]} />
        ))}
      </group>
    </group>
  );
}

// The line runs from a buffer stop on the island, over a low stone bridge, into
// a tunnel on the mainland. The train keeps a timetable once Stina opens up.
const track = { x: 24.6, buffer: 11.5, shore: -12.5, portal: -170, park: -2, away: -192 };
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
    // Sleepers sit right under the rails; on land the terrain buries their feet.
    zs.forEach((z, i) => {
      m.compose(new THREE.Vector3(track.x, railY - 0.11, z), new THREE.Quaternion(), new THREE.Vector3(2, 0.12, 0.3));
      mesh.current!.setMatrixAt(i, m);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [zs]);
  return <instancedMesh ref={mesh} args={[box, toon(palette.woodDark), zs.length]} receiveShadow />;
}

function Bridge() {
  const length = track.shore - track.portal;
  const mid = (track.shore + track.portal) / 2;
  const piers = useMemo(() => {
    const items: number[] = [];
    for (let z = track.shore - 6; z > track.portal + 4; z -= 9) items.push(z);
    return items;
  }, []);
  return (
    <group>
      {/* stone abutment where the line leaves the island */}
      <Box p={[track.x, deckY - 1, track.shore - 1]} s={[3.4, 2.2, 5]} c={palette.stoneDark} />
      <Box p={[track.x, deckY - 0.15, mid]} s={[3, 0.3, length]} c={palette.stone} shadow={false} />
      {[-1, 1].map((side) => (
        <Box key={side} p={[track.x + side * 1.45, deckY + 0.12, mid]} s={[0.18, 0.28, length]} c={palette.stoneDark} shadow={false} />
      ))}
      {piers.map((z) => (
        <group key={z}>
          <Box p={[track.x, deckY - 1.2, z]} s={[2.4, 2.2, 1.1]} c={palette.stoneDark} shadow={false} />
          <mesh geometry={cyl} material={toon("#d9f1f0")} position={[track.x, 0.04, z]} scale={[1.6, 0.04, 0.9]} />
        </group>
      ))}
    </group>
  );
}

const mainlandTrees = (() => {
  const random = mulberry32(19);
  return Array.from({ length: 36 }, () => {
    const x = -110 + random() * 220;
    const z = -176 - random() * 14;
    const s = 1.6 + random() * 1.8;
    return Math.abs(x - track.x) < 6 ? null : { x, z, s };
  }).filter((t): t is { x: number; z: number; s: number } => t !== null);
})();

// Far enough away that the fog turns it into a soft blue-green shore.
function Mainland() {
  const hills: Array<[number, number, number, number, number, number, string]> = [
    [0, -4, -206, 170, 14, 34, "#6f9f55"],
    [-70, -6, -196, 44, 22, 24, "#5f8f4a"],
    [-18, -5, -200, 30, 16, 22, "#79a95c"],
    [track.x, -4, -195, 28, 20, 24, "#5f8f4a"],
    [70, -6, -198, 40, 24, 26, "#6a9a50"],
  ];
  return (
    <group>
      <mesh geometry={cyl} material={toon(palette.sand)} position={[0, 0.05, -200]} scale={[165, 0.2, 36]} />
      {hills.map(([hx, hy, hz, sx, sy, sz, c]) => (
        <mesh key={hx} geometry={sphere} material={toon(c)} position={[hx, hy, hz]} scale={[sx, sy, sz]} />
      ))}
      {mainlandTrees.map((t) => (
        <mesh key={t.x} geometry={cone} material={toon(palette.pine)} position={[t.x, t.s * 1.2, t.z]} scale={[t.s, t.s * 2.6, t.s]} />
      ))}
      {[-44, -36, 48, 55].map((hx, i) => (
        <group key={hx} position={[hx, 0.2, -171 - (i % 2) * 3]}>
          <Box p={[0, 1, 0]} s={[3, 2, 2.4]} c={i % 2 ? palette.trim : palette.falu} shadow={false} />
          <Box p={[0, 2.3, 0]} s={[3.3, 0.6, 2.6]} c={palette.roof} shadow={false} />
        </group>
      ))}
      {/* tunnel portal the train disappears into */}
      <group position={[track.x, deckY, track.portal - 3]}>
        <Box p={[0, 2.3, 0]} s={[6, 4.6, 6]} c={palette.stoneDark} shadow={false} />
        <mesh geometry={box} material={toon("#141419")} position={[0, 1.7, 3.01]} scale={[2.8, 3.4, 0.05]} />
        <Box p={[0, 4.4, 3.1]} s={[6.4, 0.4, 0.3]} c={palette.stone} shadow={false} />
      </group>
    </group>
  );
}

export function Station({ open }: { open: boolean }) {
  const { x, z } = places.station;
  const y = heightAt(x, z);
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
      <group position={[x + 0.5, y - 0.05, z - 1.5]}>
        <Gable width={5} depth={7} height={3} wall="#e8c35a" roof={palette.roofTile} doorSide={-1} />
      </group>
      {/* platform and tracks */}
      <Box p={[22.6, heightAt(22.6, -4) + 0.1, -4]} s={[2.2, 0.35, 20]} c="#b9b4aa" />
      <Sleepers />
      {[-0.55, 0.55].map((dx) => (
        <Box key={dx} p={[track.x + dx, railY, railMid]} s={[0.1, 0.1, railLength]} c="#6d6f75" shadow={false} />
      ))}
      {/* buffer stop at the island end of the line */}
      <group position={[track.x, railY, track.buffer]}>
        <Box p={[0, 0.5, 0]} s={[2.2, 0.9, 0.5]} c={palette.falu} />
        {[-0.6, 0.6].map((bx) => (
          <Box key={bx} p={[bx, 0.55, -0.35]} s={[0.35, 0.35, 0.3]} c={palette.yellow} shadow={false} />
        ))}
      </group>
      <Bridge />
      <Mainland />
      <group ref={train} position={[track.x, railY + 0.05, track.away]}>
        <mesh geometry={box} material={glow("#fff4c8", 2)} position={[0, 1, -2.52]} scale={[0.5, 0.3, 0.05]} />
        <Box p={[0, 1.1, 0]} s={[2, 2, 5]} c="#c0392b" />
        <Box p={[0, 2.2, 0]} s={[2.1, 0.2, 5.1]} c="#1d1d24" />
        <mesh geometry={box} material={glow("#fff0c2", 1)} position={[0, 1.4, 0]} scale={[2.05, 0.6, 4]} />
        <Box p={[0, 1.1, 5.4]} s={[2, 2, 5]} c="#1f4e79" />
        <mesh geometry={box} material={glow("#fff0c2", 1)} position={[0, 1.4, 5.4]} scale={[2.05, 0.6, 4]} />
        {[-2, -0.8, 0.8, 2, 3.4, 4.6, 6.2, 7.4].map((wz) => (
          <mesh key={wz} geometry={cyl} material={toon("#2b2b2b")} position={[0, 0.25, wz]} rotation-z={Math.PI / 2} scale={[0.3, 2.1, 0.3]} />
        ))}
      </group>
      {/* the station clock */}
      <group position={[14.2, heightAt(14.2, -5.2), -5.2]}>
        <mesh geometry={cyl} material={toon("#2b2b2b")} position={[0, 1.4, 0]} scale={[0.07, 2.8, 0.07]} castShadow />
        <mesh geometry={cyl} material={toon("#ffffff")} position={[0, 2.9, 0]} rotation-x={Math.PI / 2} scale={[0.42, 0.12, 0.42]} castShadow />
        <mesh geometry={torus} material={toon("#1d1d24")} position={[0, 2.9, 0]} scale={0.42} />
      </group>
    </group>
  );
}

export function Square() {
  const { x, z } = places.square;
  const y = heightAt(x, z);
  return (
    <group>
      {/* stone circle */}
      <mesh geometry={cyl} material={toon("#c9c2b4")} position={[x, y - 0.02, z]} scale={[5.2, 0.08, 5.2]} receiveShadow />
      <mesh geometry={torus} material={toon(palette.stone)} position={[x, y + 0.06, z]} rotation-x={Math.PI / 2} scale={[1.6, 1.6, 1.4]} />
      <Maypole position={[4.2, heightAt(4.2, 2.2), 2.2]} />
      {[
        [-3.8, 8.4, 0.3],
        [3.8, 8.6, -0.3],
      ].map(([bx, bz, r]) => (
        <Bench key={bx} position={[bx, heightAt(bx, bz), bz]} rotation={r} />
      ))}
      {[
        [1.6, 14],
        [-1.6, 19],
        [5.5, 1.5],
        [-5.5, 3.5],
        [-1.8, -6],
        [9, -1],
      ].map(([lx, lz]) => (
        <Lantern key={`${lx}${lz}`} position={[lx, heightAt(lx, lz), lz]} />
      ))}
    </group>
  );
}

function Maypole({ position }: { position: V3 }) {
  const leaf = toon("#4f8f3a");
  return (
    <group position={position}>
      <mesh geometry={cyl} material={leaf} position={[0, 2.8, 0]} scale={[0.14, 5.6, 0.14]} castShadow />
      <mesh geometry={cyl} material={leaf} position={[0, 4.4, 0]} rotation-z={Math.PI / 2} scale={[0.1, 2.6, 0.1]} castShadow />
      {[-1.05, 1.05].map((rx) => (
        <group key={rx} position={[rx, 3.7, 0]}>
          <mesh geometry={torus} material={leaf} scale={0.5} castShadow />
          <mesh geometry={sphere} material={toon("#ffd35c")} position={[0, -0.5, 0]} scale={0.12} />
        </group>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} geometry={sphere} material={toon(i % 2 ? "#ffffff" : "#ffd35c")} position={[Math.sin(i) * 0.18, 0.8 + i * 0.6, Math.cos(i) * 0.18]} scale={0.1} />
      ))}
      <Box p={[0, 5.4, 0.25]} s={[0.02, 0.6, 0.35]} c={palette.blue} shadow={false} />
      <Box p={[0, 5.4, -0.2]} s={[0.02, 0.6, 0.35]} c={palette.yellow} shadow={false} />
    </group>
  );
}

export function Garden({ open }: { open: boolean }) {
  const { x, z } = places.garden;
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      {/* greenhouse */}
      <group position={[-3.2, 0, -2.5]} rotation-y={0.3}>
        <mesh geometry={box} material={toon(palette.glass, { transparent: true, opacity: 0.45 })} position={[0, 1.1, 0]} scale={[3, 2.2, 3.6]} />
        {[-1.5, 1.5].flatMap((bx) =>
          [-1.8, 1.8].map((bz) => <Box key={`${bx}${bz}`} p={[bx, 1.3, bz]} s={[0.08, 2.6, 0.08]} c="#ffffff" />),
        )}
        <mesh geometry={prism} material={toon(palette.glass, { transparent: true, opacity: 0.45 })} position={[0, 2.6, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.75, 3.6, 0.8]} />
        {[0.6, -0.4, -1.2].map((pz, i) => (
          <mesh key={pz} geometry={sphere} material={toon(["#7fb65a", "#e05a47", "#6aa04d"][i])} position={[0.3, 0.6, pz]} scale={0.35} />
        ))}
      </group>
      {/* vegetable beds */}
      {[
        [2.5, -1.5],
        [2.5, 1.5],
        [-0.5, 3.5],
      ].map(([bx, bz], i) => (
        <group key={i} position={[bx, 0, bz]}>
          <Box p={[0, 0.15, 0]} s={[2.4, 0.3, 1.2]} c={palette.wood} />
          <Box p={[0, 0.3, 0]} s={[2.2, 0.06, 1]} c="#5a3d2b" shadow={false} />
          {Array.from({ length: 5 }, (_, j) => (
            <group key={j} position={[-0.9 + j * 0.45, 0.45, 0]}>
              <mesh geometry={sphere} material={toon("#4f8f3a")} scale={[0.16, open ? 0.22 : 0.1, 0.16]} />
              {open && i === 0 ? <mesh geometry={sphere} material={toon("#e0463a")} position={[0.08, 0.1, 0.1]} scale={0.08} /> : null}
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

export function Lookout() {
  const { x, z } = places.lookout;
  const flag = useRef<THREE.Mesh>(null);
  const flagGeometry = useMemo(() => new THREE.PlaneGeometry(1.8, 1.1, 12, 6), []);
  const base = useMemo(() => Float32Array.from(flagGeometry.attributes.position.array), [flagGeometry]);
  const flagTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 100;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#006aa7";
    ctx.fillRect(0, 0, 160, 100);
    ctx.fillStyle = "#fecc02";
    ctx.fillRect(50, 0, 20, 100);
    ctx.fillRect(0, 40, 160, 20);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
  useFrame((state) => {
    if (!flag.current) return;
    const t = state.clock.elapsedTime;
    const geometry = flag.current.geometry;
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const px = base[i * 3];
      const k = (px + 0.9) / 1.8;
      position.setZ(i, Math.sin(px * 3 - t * 4) * 0.15 * k);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
  });
  const y = heightAt(x + 0.3, z - 0.4);
  return (
    <group position={[x + 0.3, y, z - 0.4]}>
      <mesh geometry={cyl} material={toon("#ffffff")} position={[0, 3.5, 0]} scale={[0.08, 7, 0.08]} castShadow />
      <mesh geometry={sphere} material={toon("#ffd35c")} position={[0, 7.05, 0]} scale={0.14} />
      <mesh ref={flag} geometry={flagGeometry} position={[0.95, 6.3, 0]} castShadow>
        <meshToonMaterial map={flagTexture} side={THREE.DoubleSide} />
      </mesh>
      <Bench position={[1.6, 0, 1.8]} rotation={-2.4} />
    </group>
  );
}

// Nils's red boathouse at the water's edge, with a jetty, a rowboat and nets
// drying on a rack.
export function Boathouse() {
  const { x, z } = places.boathouse;
  const y = heightAt(x + 0.4, z + 0.5);
  const jetty = useMemo(() => Array.from({ length: 10 }, (_, i) => i * 0.55), []);
  return (
    <group>
      <group position={[x + 0.4, y - 0.05, z + 0.5]}>
        <Gable width={3.8} depth={5} height={2.4} wall={palette.falu} roof={palette.roof} doorSide={-1} />
        {/* net rack */}
        <group position={[1, 0, -3.8]}>
          {[-0.9, 0.9].map((nx) => (
            <Box key={nx} p={[nx, 0.8, 0]} s={[0.1, 1.6, 0.1]} c={palette.woodDark} />
          ))}
          <Box p={[0, 1.55, 0]} s={[2, 0.08, 0.08]} c={palette.woodDark} />
          <Box p={[0, 1.05, 0.02]} s={[1.7, 0.95, 0.03]} c="#5b6f7a" shadow={false} />
        </group>
        {/* fish crates and a buoy */}
        {[
          [-2.3, -1.2, 0],
          [-2.3, -1.9, 0],
          [-2.3, -1.55, 1],
        ].map(([cx, cz, level], i) => (
          <Box key={i} p={[cx, 0.22 + level * 0.44, cz]} s={[0.6, 0.44, 0.65]} c="#3f6fa0" />
        ))}
        <mesh geometry={sphere} material={toon("#ff7a3d")} position={[-2.4, 0.3, 0.4]} scale={0.28} castShadow />
      </group>
      {/* jetty out over the water */}
      <group position={[15.4, 0, 27.4]} rotation-y={0.52}>
        {jetty.map((jz, i) => (
          <Box key={jz} p={[0, 0.62, jz]} s={[1.3, 0.12, 0.48]} c={i % 3 ? palette.plank : "#a87c52"} />
        ))}
        {[0.4, 2.6, 4.8].flatMap((jz) =>
          [-1, 1].map((side) => <Box key={`${jz}${side}`} p={[side * 0.7, 0.2, jz]} s={[0.14, 1.4, 0.14]} c={palette.woodDark} />),
        )}
        <Rowboat position={[1.5, 0.08, 3.6]} />
      </group>
    </group>
  );
}

function Rowboat({ position }: { position: V3 }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 1.3) * 0.05;
    ref.current.rotation.z = Math.sin(t * 1.1) * 0.04;
  });
  return (
    <group ref={ref} position={position}>
      <Box p={[0, 0.15, 0]} s={[1, 0.35, 2.6]} c="#f4f1ea" />
      <Box p={[0, 0.02, 0]} s={[1.02, 0.12, 2.62]} c={palette.blue} shadow={false} />
      <Box p={[0, 0.3, 0.2]} s={[0.95, 0.06, 0.35]} c={palette.wood} shadow={false} />
    </group>
  );
}

// Lanthandeln: the island's ochre-yellow village shop. Crates of apples and
// potatoes come out front while Maja is open.
export function Shop({ open }: { open: boolean }) {
  const { x, z } = places.shop;
  const y = heightAt(x - 0.3, z + 0.4);
  return (
    <group position={[x - 0.3, y - 0.05, z + 0.4]}>
      <Gable width={5} depth={6.4} height={3} wall="#d9a441" roof={palette.roof} doorSide={1} />
      {/* shop window with goods */}
      <mesh geometry={box} material={glow("#ffe2a8", 1)} position={[2.56, 1.3, 1.9]} scale={[0.05, 1.1, 1.4]} />
      <Box p={[2.6, 0.2, 0]} s={[0.9, 0.12, 2.6]} c={palette.plank} />
      {open &&
        [
          [3.4, -1.9, "#d8412f"],
          [3.4, 1.3, "#c79a52"],
          [3.9, 0.1, "#7fb65a"],
        ].map(([cx, cz, fruit]) => (
          <group key={`${cx}${cz}`} position={[cx as number, 0, cz as number]}>
            <Box p={[0, 0.3, 0]} s={[0.8, 0.6, 0.6]} c={palette.wood} />
            {[-0.2, 0, 0.2].map((fx) => (
              <mesh key={fx} geometry={sphere} material={toon(fruit as string)} position={[fx, 0.66, 0]} scale={0.13} />
            ))}
          </group>
        ))}
    </group>
  );
}

// Vårdcentralen: a small white health centre with a sign by the door.
export function HealthCentre() {
  const { x, z } = places.health;
  const y = heightAt(x - 0.3, z + 0.3);
  return (
    <group position={[x - 0.3, y - 0.05, z + 0.3]}>
      <Gable width={4.6} depth={5.6} height={2.8} wall="#eef1f2" roof="#566270" doorSide={1} />
      {/* sign post with a heart */}
      <group position={[3.4, 0, 1.8]}>
        <Box p={[0, 0.8, 0]} s={[0.1, 1.6, 0.1]} c={palette.woodDark} />
        <Box p={[0, 1.65, 0]} s={[0.08, 0.6, 0.9]} c="#ffffff" />
        <mesh geometry={sphere} material={toon("#2e86c1")} position={[0.06, 1.68, 0]} scale={[0.02, 0.16, 0.2]} />
      </group>
      {[-1, 1].map((pz) => (
        <group key={pz} position={[2.8, 0, pz]}>
          <mesh geometry={cyl} material={toon(palette.roofTile)} position={[0, 0.25, 0]} scale={[0.28, 0.5, 0.28]} castShadow />
          <mesh geometry={sphere} material={toon(palette.leaf)} position={[0, 0.7, 0]} scale={0.38} />
        </group>
      ))}
    </group>
  );
}

// Biblioteket: a red library with a book cart outside while Leo reads.
export function Library({ open }: { open: boolean }) {
  const { x, z } = places.library;
  const y = heightAt(x - 0.4, z - 0.4);
  const books = ["#c0392b", "#2f6fb5", "#f7c948", "#3f8f5a", "#8e44ad", "#e67e22"];
  return (
    <group position={[x - 0.4, y - 0.05, z - 0.4]}>
      <Gable width={5.2} depth={6.8} height={3.1} wall={palette.faluDark} roof={palette.roof} doorSide={1} />
      <mesh geometry={box} material={glow("#ffe7b8", 1)} position={[2.64, 1.5, -2]} scale={[0.05, 1.3, 1.6]} />
      {open ? (
        <group position={[3.4, 0, -2.4]} rotation-y={0.3}>
          <Box p={[0, 0.5, 0]} s={[0.6, 1, 1.6]} c={palette.wood} />
          {books.map((c, i) => (
            <Box key={c} p={[0, 1.15, -0.65 + i * 0.26]} s={[0.4, 0.34 + (i % 3) * 0.05, 0.18]} c={c} shadow={false} />
          ))}
        </group>
      ) : null}
      <Bench position={[3.3, 0, 0.6]} rotation={Math.PI / 2} />
    </group>
  );
}

// Fyren: the white-and-red lighthouse on the northern point. Once Olle is
// home its lamp turns and sweeps the sea.
const towerRadius = (h: number) => 1.3 - (0.5 * h) / 7;
const towerBands = ([
  [0, 3, "#ffffff"],
  [3, 5, "#c0392b"],
  [5, 7, "#ffffff"],
] as const).map(([from, to, color]) => ({
  geometry: new THREE.CylinderGeometry(towerRadius(to), towerRadius(from), to - from, 20),
  y: 0.4 + (from + to) / 2,
  color,
}));

export function Lighthouse({ lit }: { lit: boolean }) {
  const { x, z } = places.lighthouse;
  const y = heightAt(x, z);
  const beam = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (beam.current) beam.current.rotation.y += delta * 0.8;
  });
  return (
    <group position={[x, y - 0.1, z]}>
      <mesh geometry={cyl} material={toon(palette.stone)} position={[0, 0.2, 0]} scale={[1.9, 0.4, 1.9]} receiveShadow />
      {towerBands.map((band) => (
        <mesh key={band.y} geometry={band.geometry} material={toon(band.color)} position={[0, band.y, 0]} castShadow />
      ))}
      {/* gallery, lamp room and cap */}
      <mesh geometry={cyl} material={toon("#2b2b2b")} position={[0, 7.5, 0]} scale={[1.05, 0.12, 1.05]} castShadow />
      <mesh geometry={cyl} material={lit ? glow("#fff1b0", 2.4) : toon(palette.glass, { transparent: true, opacity: 0.6 })} position={[0, 8.05, 0]} scale={[0.6, 1, 0.6]} />
      <mesh geometry={cone} material={toon("#c0392b")} position={[0, 8.85, 0]} scale={[0.75, 0.6, 0.75]} castShadow />
      <mesh geometry={sphere} material={toon("#2b2b2b")} position={[0, 9.2, 0]} scale={0.1} />
      <Box p={[0, 1.1, 1.26]} s={[0.7, 1.3, 0.1]} c={palette.woodDark} shadow={false} />
      {lit ? (
        <group ref={beam} position={[0, 8.05, 0]}>
          <mesh geometry={box} material={toon("#fff6c8", { transparent: true, opacity: 0.18, emissive: "#fff1b0", emissiveIntensity: 1 })} position={[0, 0, 6]} scale={[0.5, 0.35, 12]} />
        </group>
      ) : null}
      {/* keeper's cottage */}
      <group position={[-3.7, 0, 1]} scale={0.75}>
        <Gable width={3.4} depth={4} height={2.2} wall="#f4f1ea" roof={palette.roofTile} doorSide={1} />
      </group>
      <Bench position={[-1.2, 0, 2.8]} rotation={-2.8} />
    </group>
  );
}

export function LillaO({ unlocked }: { unlocked: Record<string, boolean> }) {
  return (
    <>
      <Dock />
      <Square />
      <Cafe open={unlocked.bosse} />
      <Station open={unlocked.stina} />
      <Garden open={unlocked.astrid} />
      <Lookout />
      <Boathouse />
      <Shop open={unlocked.maja} />
      <HealthCentre />
      <Library open={unlocked.leo} />
      <Lighthouse lit={unlocked.olle} />
      <Cottages />
    </>
  );
}
