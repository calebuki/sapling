"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { AnimalModel, Terrain, Tile, Weather } from "@/lib/game/forest";
import type { CharacterLook } from "@/lib/game/villagers";
import { runtime } from "../store";
import { Character, type CharacterAnim } from "../world/character";
import { glow, palette, toon } from "../world/materials";
import { box, Box, cone, cyl, sphere } from "../world/parts";
import { ShiftProjector } from "./anchors";
import { GAP, stationOf, TILE, TILE_HEIGHT, tileCenter, VIEW_DIRECTION, viewBox } from "./forest-layout";
import { answer, currentTask, forestRuntime, forestSetup, getForest, jumpToTask, pointAt, tickForest, useForest, type ForestSetup } from "./forest-store";
import { click, emoteOf, FitCamera, JobPlayer, OutdoorSun, useHover } from "./job-scene";

// The rescue map: a grid of little landscapes, each under its own sky, so
// you can see at a glance where it's raining and where the fox is.

const DAY = new THREE.Color("#a9d8ef");
const DUSK = new THREE.Color("#4a5578");
const HALF = TILE / 2;

export function ForestRoom() {
  const setup = forestSetup();
  const tiles = useForest((s) => s.tiles);
  const sky = useRef<THREE.Color>(null);
  const fill = useRef<THREE.HemisphereLight>(null);
  useFrame((_, delta) => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __forest: unknown }).__forest = { getForest, pointAt, answer, jumpToTask };
    tickForest(Math.min(delta, 0.05));
    // The sky darkens as the evening comes on.
    const dark = 1 - forestRuntime.seconds / Math.max(1, forestRuntime.total);
    if (sky.current) sky.current.lerpColors(DAY, DUSK, dark * 0.85);
    if (fill.current) fill.current.intensity = 1.0 - dark * 0.45;
  });
  if (!setup) return null;
  return (
    <>
      <color ref={sky} attach="background" args={["#a9d8ef"]} />
      <group>
        <hemisphereLight ref={fill} args={["#e4f2ff", "#4f6a3a", 1.0]} />
        <OutdoorSun position={[6, 16, 9]} intensity={2.1} color="#fff3dc" />
        <mesh rotation-x={-Math.PI / 2} position-y={-0.02} receiveShadow>
          <planeGeometry args={[90, 70]} />
          <meshToonMaterial color="#5b7a45" />
        </mesh>
        {tiles.map((tile) => (
          <MapTile key={tile.id} tile={tile} n={tiles.length} />
        ))}
        <Station setup={setup} n={tiles.length} />
        <MapCamera n={tiles.length || 6} />
        <ShiftProjector />
      </group>
    </>
  );
}

// The radio card sits at the left on wide screens and along the bottom on
// narrow ones; the map keeps clear of it.
function MapCamera({ n }: { n: number }) {
  const width = useThree((s) => s.size.width);
  const box3 = useMemo(() => viewBox(n), [n]);
  const wide = width >= WIDE;
  return <FitCamera box={box3} direction={VIEW_DIRECTION} top={92} bottom={wide ? 40 : 190} left={wide ? 330 : 16} right={wide ? 24 : 16} />;
}

// Matches the radio card's breakpoint in globals.css.
const WIDE = 760;

// ---------- A tile ----------

const ground: Record<Terrain, string> = { lake: "#7fb35a", meadow: "#9cc95f", forest: "#5f9145", mountain: "#8ea86a", river: "#86b95b" };

function MapTile({ tile, n }: { tile: Tile; n: number }) {
  const [x, z] = tileCenter(tile.id, n);
  const { hover, handlers } = useHover();
  const lift = useRef<THREE.Group>(null);
  const rescued = useForest((s) => s.rescued.includes(tile.id));
  const asked = useForest((s) => s.status === "running" && currentTask()?.kind === "weather" && currentTask()?.tile === tile.id);
  const snowy = tile.weather === "snow";
  useFrame((_, delta) => {
    if (lift.current) lift.current.position.y = THREE.MathUtils.lerp(lift.current.position.y, hover && !rescued ? 0.12 : 0, Math.min(1, delta * 12));
  });
  return (
    <group position={[x, 0, z]}>
      <group ref={lift} onClick={click(() => pointAt(tile.id))} {...handlers}>
        {/* the block of earth, and its top */}
        <Box p={[0, TILE_HEIGHT / 2 - 0.05, 0]} s={[TILE, TILE_HEIGHT - 0.1, TILE]} c="#7a5a3a" t="stone" />
        <Box p={[0, TILE_HEIGHT - 0.04, 0]} s={[TILE, 0.08, TILE]} c={snowy ? "#eef3f6" : ground[tile.terrain]} t={snowy ? null : "turf"} />
        {hover && !rescued ? <mesh geometry={box} material={glow("#fff3c4", 0.5)} position={[0, TILE_HEIGHT + 0.005, 0]} scale={[TILE + 0.12, 0.01, TILE + 0.12]} /> : null}
        <group position={[0, TILE_HEIGHT, 0]}>
          <Scenery terrain={tile.terrain} weather={tile.weather} />
          {tile.animal ? (
            <group position={[0.85, 0, 0.85]} rotation-y={-0.6} scale={ANIMAL_SCALE[tile.animal.model]}>
              <AnimalModelMesh model={tile.animal.model} />
            </group>
          ) : null}
          <TileWeather weather={tile.weather} seed={tile.id} />
          {rescued ? <Rescued seed={tile.id} /> : null}
          <WrongMark id={tile.id} />
          {asked ? <AskedFrame /> : null}
        </group>
      </group>
    </group>
  );
}

// Small animals are drawn bigger so they read on the map.
const ANIMAL_SCALE: Record<AnimalModel, number> = { deer: 0.95, horse: 0.8, cow: 0.85, sheep: 1.2, fox: 1.35, hedgehog: 2.0, squirrel: 2.2, bird: 2.6, duck: 1.9 };

// ---------- Scenery ----------

function Scenery({ terrain, weather }: { terrain: Terrain; weather: Weather }) {
  const snowy = weather === "snow";
  const windy = weather === "wind" || weather === "storm";
  switch (terrain) {
    case "lake":
      return (
        <group>
          <mesh rotation-x={-Math.PI / 2} position={[-0.35, 0.02, -0.35]} scale={[1.35, 1.0, 1]}>
            <circleGeometry args={[1, 28]} />
            <meshToonMaterial color={snowy ? "#a9cfe0" : "#3f8fc0"} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position={[-0.35, 0.015, -0.35]} scale={[1.5, 1.15, 1]}>
            <circleGeometry args={[1, 28]} />
            <meshToonMaterial color="#c9b483" />
          </mesh>
          <Box p={[-0.35, 0.08, 0.75]} s={[0.35, 0.06, 0.9]} c={palette.woodDark} t="planks" />
          {[-1.4, -1.25, 0.95].map((rx, i) => (
            <Reed key={i} x={rx} z={-1.2 + i * 0.3} windy={windy} />
          ))}
        </group>
      );
    case "river":
      return (
        <group>
          <mesh rotation-x={-Math.PI / 2} rotation-z={0.5} position={[-0.2, 0.02, -0.2]} scale={[0.75, TILE * 1.1, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshToonMaterial color={snowy ? "#a9cfe0" : "#4a9ccc"} />
          </mesh>
          {/* a little bridge over it */}
          <group position={[-0.2, 0.12, -0.2]} rotation-y={0.5 - Math.PI / 2}>
            <Box p={[0, 0, 0]} s={[1.4, 0.08, 0.5]} c={palette.woodDark} t="planks" />
            {[-0.25, 0.25].map((rz) => (
              <Box key={rz} p={[0, 0.2, rz]} s={[1.4, 0.05, 0.05]} c={palette.woodDark} />
            ))}
          </group>
          <Fir x={-1.25} z={0.9} snowy={snowy} windy={windy} s={0.6} />
        </group>
      );
    case "forest":
      return (
        <group>
          {[
            [-1.15, -1.1, 0.85],
            [-0.2, -1.25, 1],
            [0.85, -1.05, 0.8],
            [-1.25, 0.0, 0.9],
            [-0.35, -0.3, 0.7],
            [-1.1, 1.05, 0.75],
          ].map(([fx, fz, s], i) => (
            <Fir key={i} x={fx} z={fz} snowy={snowy} windy={windy} s={s} />
          ))}
        </group>
      );
    case "meadow":
      return (
        <group>
          {Array.from({ length: 14 }, (_, i) => (
            <mesh key={i} geometry={sphere} material={toon(snowy ? "#ffffff" : ["#ffffff", "#ffd35c", "#ff6f91", "#c99ae8"][i % 4], { surface: null })} position={[-1.4 + ((i * 37) % 26) / 10, 0.07, -1.4 + ((i * 23) % 22) / 10]} scale={0.07} />
          ))}
          {/* a stretch of fence along the back */}
          {[-1.3, -0.5, 0.3, 1.1].map((fx) => (
            <Box key={fx} p={[fx, 0.25, -1.35]} s={[0.08, 0.5, 0.08]} c={palette.woodDark} />
          ))}
          <Box p={[-0.1, 0.38, -1.35]} s={[2.5, 0.06, 0.05]} c={palette.woodDark} shadow={false} />
          <mesh geometry={sphere} material={toon(snowy ? "#f4f4f0" : "#d9b45a", { surface: null })} position={[-1.0, 0.25, -0.5]} scale={[0.4, 0.3, 0.4]} castShadow />
        </group>
      );
    case "mountain":
      return (
        <group>
          <mesh geometry={cone} material={toon("#8a8f94", { surface: "stone" })} position={[-0.45, 1.0, -0.5]} scale={[1.1, 2.0, 1.1]} castShadow />
          <mesh geometry={cone} material={toon("#f4f7f9", { surface: null })} position={[-0.45, 1.67, -0.5]} scale={[0.45, 0.66, 0.45]} />
          <mesh geometry={cone} material={toon("#7d8388", { surface: "stone" })} position={[0.9, 0.45, -1.0]} scale={[0.6, 0.9, 0.6]} castShadow />
          <mesh geometry={sphere} material={toon("#8a8f94", { surface: "stone" })} position={[-1.2, 0.12, 1.1]} scale={[0.3, 0.2, 0.25]} />
        </group>
      );
  }
}

function Fir({ x, z, s, snowy, windy }: { x: number; z: number; s: number; snowy: boolean; windy: boolean }) {
  const top = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (top.current) top.current.rotation.z = Math.sin(clock.elapsedTime * 2.2 + x * 3 + z) * (windy ? 0.12 : 0.01);
  });
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh geometry={cyl} material={toon(palette.woodDark)} position={[0, 0.2, 0]} scale={[0.1, 0.4, 0.1]} />
      <group ref={top}>
        <mesh geometry={cone} material={toon("#2f6a3a", { surface: "leaves" })} position={[0, 0.85, 0]} scale={[0.5, 1.2, 0.5]} castShadow />
        {snowy ? <mesh geometry={cone} material={toon("#f4f7f9", { surface: null })} position={[0, 1.2, 0]} scale={[0.32, 0.5, 0.32]} /> : null}
      </group>
    </group>
  );
}

function Reed({ x, z, windy }: { x: number; z: number; windy: boolean }) {
  const stalk = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (stalk.current) stalk.current.rotation.z = Math.sin(clock.elapsedTime * 3 + x) * (windy ? 0.25 : 0.04);
  });
  return (
    <group ref={stalk} position={[x, 0, z]}>
      <mesh geometry={cyl} material={toon("#5f7f3a")} position={[0, 0.3, 0]} scale={[0.03, 0.6, 0.03]} />
      <mesh geometry={cyl} material={toon("#6b4a2f")} position={[0, 0.6, 0]} scale={[0.06, 0.18, 0.06]} />
    </group>
  );
}

// ---------- Weather over a tile ----------

function TileWeather({ weather, seed }: { weather: Weather; seed: number }) {
  return (
    <group>
      {weather === "sun" ? <Sun /> : null}
      {weather === "clouds" || weather === "rain" || weather === "snow" || weather === "storm" ? (
        <Cloud colour={weather === "storm" ? "#5d6470" : weather === "rain" ? "#8f99a3" : weather === "snow" ? "#dfe6ec" : "#f6f8fa"} seed={seed} />
      ) : null}
      {weather === "clouds" ? (
        <group position={[1.0, 0, 0.4]} scale={0.7}>
          <Cloud colour="#f6f8fa" seed={seed + 3} />
        </group>
      ) : null}
      {weather === "rain" || weather === "storm" || weather === "snow" ? <Falling snow={weather === "snow"} seed={seed} /> : null}
      {weather === "storm" ? <Lightning seed={seed} /> : null}
      {weather === "fog" ? <Fog seed={seed} /> : null}
      {weather === "wind" ? <Gusts seed={seed} /> : null}
    </group>
  );
}

function Sun() {
  const rays = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (rays.current) rays.current.rotation.z += delta * 0.6;
  });
  return (
    <group position={[0.85, 1.3, -1.0]}>
      <mesh geometry={sphere} material={glow("#ffd84a", 1.4)} scale={0.34} />
      <group ref={rays}>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} geometry={box} material={glow("#ffe27a", 1.2)} rotation-z={(i * Math.PI) / 4} position={[Math.cos((i * Math.PI) / 4) * 0.55, Math.sin((i * Math.PI) / 4) * 0.55, 0]} scale={[0.2, 0.06, 0.06]} />
        ))}
      </group>
    </group>
  );
}

function Cloud({ colour, seed }: { colour: string; seed: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.position.x = 0.45 + Math.sin(clock.elapsedTime * 0.4 + seed) * 0.25;
  });
  const m = toon(colour, { surface: null });
  return (
    <group ref={group} position={[0.45, 1.35, -0.85]}>
      <mesh geometry={sphere} material={m} position={[0, 0, 0]} scale={[0.7, 0.36, 0.5]} castShadow />
      <mesh geometry={sphere} material={m} position={[-0.55, -0.08, 0.05]} scale={[0.45, 0.28, 0.4]} />
      <mesh geometry={sphere} material={m} position={[0.55, -0.06, 0.02]} scale={[0.5, 0.3, 0.42]} />
    </group>
  );
}

// Rain or snow falling from the cloud, only over this tile.
function Falling({ snow, seed }: { snow: boolean; seed: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const count = snow ? 46 : 60;
  const drops = useRef(Array.from({ length: count }, (_, i) => ({ x: (((i * 7919 + seed * 31) % 260) / 100) - 1.3, z: (((i * 104729 + seed * 17) % 200) / 100) - 1.4, y: ((i * 37) % 120) / 100, s: 0.7 + ((i * 13) % 6) / 10 })));
  const matrix = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }, delta) => {
    const m = mesh.current;
    if (!m) return;
    const speed = snow ? 0.6 : 4.5;
    for (let i = 0; i < count; i++) {
      const p = drops.current[i];
      p.y -= delta * speed * p.s;
      if (p.y < 0) p.y += 1.2;
      const drift = snow ? Math.sin(clock.elapsedTime * 1.3 + i) * 0.12 : 0;
      matrix.position.set(p.x + drift, p.y, p.z);
      matrix.rotation.set(0, 0, snow ? 0 : 0.12);
      matrix.scale.set(snow ? 0.07 : 0.025, snow ? 0.07 : 0.22, snow ? 0.07 : 0.025);
      matrix.updateMatrix();
      m.setMatrixAt(i, matrix.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[box, undefined, count]}>
      <meshBasicMaterial color={snow ? "#ffffff" : "#5f9fe0"} transparent opacity={snow ? 0.95 : 0.85} />
    </instancedMesh>
  );
}

function Lightning({ seed }: { seed: number }) {
  const bolt = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime + seed * 0.7) % 2.6;
    if (bolt.current) bolt.current.visible = t < 0.12 || (t > 0.22 && t < 0.3);
  });
  return (
    <group ref={bolt} position={[0.25, 0.85, -0.6]}>
      {[
        [0, 0.45, 0.4],
        [0.12, 0.1, -0.5],
        [0.02, -0.25, 0.4],
      ].map(([bx, by, r], i) => (
        <mesh key={i} geometry={box} material={glow("#ffe84a", 2.2)} position={[bx, by, 0]} rotation-z={r} scale={[0.07, 0.42, 0.07]} />
      ))}
    </group>
  );
}

// Bands of mist drifting low over this tile only, drawn like the weather
// symbol, so whatever is on the tile still shows between them.
function Fog({ seed }: { seed: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.children.forEach((c, i) => (c.position.x = Math.sin(clock.elapsedTime * 0.45 + i * 2 + seed) * 0.3));
  });
  return (
    <group ref={group}>
      {[0.4, 0.75, 1.1].map((y, i) => (
        <mesh key={i} geometry={sphere} material={fogMaterial} position={[0.15, y, 0.9 - i * 0.35]} scale={[1.45 - i * 0.12, 0.09, 0.18]} />
      ))}
    </group>
  );
}

const fogMaterial = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.85, depthWrite: false });

// White streaks blowing across, and leaves with them.
function Gusts({ seed }: { seed: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.children.forEach((c, i) => {
      const t = (clock.elapsedTime * (0.9 + i * 0.13) + i * 0.29 + seed) % 1;
      c.position.x = -1.5 + t * 3.0;
      if (i >= 3) c.rotation.z = clock.elapsedTime * 6 + i;
      c.visible = t > 0.04 && t < 0.96;
    });
  });
  return (
    <group ref={group}>
      {[0.6, 1.0, 1.35].map((y, i) => (
        <mesh key={i} geometry={box} material={glow("#ffffff", 1.0)} position={[0, y, -1.1 + i * 0.35]} scale={[0.95, 0.05, 0.05]} />
      ))}
      {[0.7, 1.15].map((y, i) => (
        <mesh key={`leaf${i}`} geometry={box} material={toon(i ? "#d98f2a" : "#c0392b", { surface: null })} position={[0, y, -0.4 + i * 0.5]} scale={[0.16, 0.05, 0.12]} />
      ))}
    </group>
  );
}

// ---------- Marks on the map ----------

const hikerLooks: CharacterLook[] = [
  { skin: "#e8b48f", hair: "#3a2a1e", hairStyle: "short", shirt: "#c0392b", pants: "#2c3e50", accent: "#27ae60", hat: "cap", top: "raincoat", backpack: "#27ae60" },
  { skin: "#f1c9a5", hair: "#c98a3a", hairStyle: "bob", shirt: "#2f80c0", pants: "#3a3a3a", accent: "#f4c24a", top: "raincoat", backpack: "#f4c24a" },
  { skin: "#c68e5e", hair: "#1e1a16", hairStyle: "short", shirt: "#e67e22", pants: "#34495e", accent: "#8e44ad", hat: "cap", backpack: "#8e44ad" },
];

// Someone found: they wave from where they were, under a green flag.
function Rescued({ seed }: { seed: number }) {
  const look = hikerLooks[seed % hikerLooks.length];
  const anim = useMemo(() => (): CharacterAnim => ({ speed: 0, talking: false, emote: "wave" }), []);
  return (
    <group position={[-0.95, 0, 1.0]}>
      <group scale={0.55} rotation-y={0.3}>
        <Character look={look} getAnim={anim} seed={seed + 20} />
      </group>
      <mesh geometry={cyl} material={toon("#f6efe2", { surface: null })} position={[0.45, 0.6, -0.1]} scale={[0.03, 1.2, 0.03]} />
      <mesh geometry={box} material={toon("#2ecc71", { surface: null })} position={[0.66, 1.05, -0.1]} scale={[0.4, 0.26, 0.03]} />
    </group>
  );
}

// A red cross when you point at the wrong place; it fades by itself.
function WrongMark({ id }: { id: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const wrong = getForest().wrongTile;
    const since = wrong && wrong.id === id ? performance.now() / 1000 - wrong.at : 99;
    if (group.current) {
      group.current.visible = since < 1.4;
      group.current.scale.setScalar(since < 0.15 ? since / 0.15 : 1);
    }
  });
  return (
    <group ref={group} position={[0, 1.0, 0]} visible={false}>
      {[-1, 1].map((r) => (
        <mesh key={r} geometry={box} material={glow("#ff4d4d", 1.2)} rotation-z={(r * Math.PI) / 4} scale={[1.1, 0.18, 0.18]} />
      ))}
    </group>
  );
}

// The place the forester asks about is framed in gold.
function AskedFrame() {
  const frame = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (frame.current) frame.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 4) * 0.025);
  });
  const edge = HALF + GAP / 2 - 0.05;
  return (
    <group ref={frame} position={[0, 0.06, 0]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} geometry={box} material={glow("#ffcf3a", 1.6)} rotation-y={(i * Math.PI) / 2} position={[Math.sin((i * Math.PI) / 2) * edge, 0, Math.cos((i * Math.PI) / 2) * edge]} scale={[edge * 2 + 0.12, 0.08, 0.12]} />
      ))}
    </group>
  );
}

// ---------- At the radio ----------

function Station({ setup, n }: { setup: ForestSetup; n: number }) {
  const { host, radio } = stationOf(n);
  const id = setup.host.id;
  const anim = useMemo(() => (): CharacterAnim => ({ speed: 0, talking: runtime.speaking === id, emote: emoteOf(id) }), [id]);
  return (
    <group>
      <group position={[host.x, 0, host.z]} rotation-y={-Math.PI / 2 + 0.6}>
        <Character look={setup.host.look} getAnim={anim} seed={6} />
      </group>
      <JobPlayer />
      <Radio at={radio} />
    </group>
  );
}

function Radio({ at }: { at: [number, number, number] }) {
  const light = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const since = performance.now() / 1000 - forestRuntime.calledAt;
    if (light.current) light.current.visible = since < 4 && Math.sin(clock.elapsedTime * 14) > 0;
  });
  const [x, y, z] = at;
  return (
    <group position={[x, 0, z]}>
      <mesh geometry={cyl} material={toon(palette.woodDark)} position={[0, y / 2 - 0.1, 0]} scale={[0.12, y - 0.2, 0.12]} />
      <Box p={[0, y - 0.12, 0]} s={[0.6, 0.06, 0.5]} c={palette.woodDark} t="planks" />
      <Box p={[0, y + 0.08, 0]} s={[0.42, 0.34, 0.22]} c="#2d3436" />
      <mesh geometry={cyl} material={toon("#636e72")} position={[0.14, y + 0.42, 0]} scale={[0.02, 0.4, 0.02]} />
      <mesh geometry={box} material={toon("#f6efe2", { surface: null })} position={[-0.05, y + 0.12, 0.115]} scale={[0.22, 0.12, 0.01]} />
      <mesh ref={light} geometry={sphere} material={glow("#ff3b30", 2)} position={[0.14, y + 0.64, 0]} scale={0.05} />
    </group>
  );
}

export function hostHeadForest(n: number): [number, number, number] {
  const { host } = stationOf(n);
  return [host.x + 0.3, 2.3, host.z];
}

export function tileTop(id: number, n: number): [number, number, number] {
  const [x, z] = tileCenter(id, n);
  return [x, TILE_HEIGHT + 2.1, z];
}

// ---------- Animals ----------

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
