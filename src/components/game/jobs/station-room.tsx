"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { COLS, ROWS, type Corner, type Landmark, type Node } from "@/lib/game/station";
import { runtime } from "../store";
import { Character, type CharacterAnim } from "../world/character";
import { glow, palette, toon } from "../world/materials";
import { box, Box, cone, cyl, prism, sphere } from "../world/parts";
import { ShiftProjector } from "./anchors";
import { BOARD, cornerPoint, HOST_SPOT, KIOSK, NODE_X, NODE_Z, STREET, VIEWS } from "./station-layout";
import { deliver, getStation, move, stationRuntime, stationSetup, tellPlatform, tickStation, useStation, type StationSetup } from "./station-store";
import { click, emoteOf, JobCamera, JobPlayer, OutdoorSun, useHover } from "./job-scene";

// Lena's station and the little town north of it: a grid of streets with a
// church, a post office, a museum and the rest on the corners, traffic
// lights at the middle crossing, and the train waiting behind the station.

const c = { grass: "#7fae5a", road: "#8c8a86", walk: "#c9bfae", plaster: "#f6efe2", beam: "#5b3a24", roof: "#a8432f" };

export function StationRoom() {
  const setup = stationSetup();
  const inTown = useStation((s) => s.town.inTown);
  useFrame((_, delta) => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __station: unknown }).__station = { getStation, move, deliver, tellPlatform };
    tickStation(Math.min(delta, 0.05));
  });
  if (!setup) return null;
  const view = inTown ? VIEWS.town : VIEWS.counter;
  return (
    <>
      <color attach="background" args={["#a9d8ee"]} />
      <fog attach="fog" args={["#d8ecf2", 34, 90]} />
      <group>
        <hemisphereLight args={["#d6e8f5", "#6f6248", 0.75]} />
        <OutdoorSun position={[7, 16, -9]} intensity={2.1} color="#fff1d6" />
        <Ground />
        <Town setup={setup} />
        <Station />
        <Kiosk />
        <Host setup={setup} />
        <Traveller />
        <JobPlayer>
          <Suitcase />
        </JobPlayer>
        <JobCamera position={view.position} target={view.target} />
        <ShiftProjector />
      </group>
    </>
  );
}

// ---------- Streets ----------

function Ground() {
  const minX = NODE_X[0] - 4;
  const maxX = NODE_X[COLS - 1] + 4;
  const minZ = NODE_Z[ROWS - 1] - 4;
  const maxZ = NODE_Z[0] + 2;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.03} receiveShadow>
        <planeGeometry args={[80, 70]} />
        <meshToonMaterial color={c.grass} />
      </mesh>
      {/* streets east-west along each row, north-south along each column */}
      {NODE_Z.map((z) => (
        <Box key={`r${z}`} p={[(minX + maxX) / 2, 0, z]} s={[maxX - minX, 0.04, STREET]} c={c.road} t={null} shadow={false} />
      ))}
      {NODE_X.map((x) => (
        <Box key={`c${x}`} p={[x, 0.005, (minZ + maxZ) / 2]} s={[STREET, 0.04, maxZ - minZ]} c={c.road} t={null} shadow={false} />
      ))}
      {/* the square in front of the station */}
      <Box p={[0, 0.01, 6]} s={[14, 0.04, 7]} c={c.walk} t="stone" shadow={false} />
      {/* white lines at the crossings */}
      {NODE_X.flatMap((x) =>
        NODE_Z.map((z) => <mesh key={`${x}${z}`} geometry={box} material={toon("#e9e6df", { surface: null })} position={[x, 0.035, z + STREET / 2 + 0.25]} scale={[STREET, 0.01, 0.3]} />),
      )}
    </group>
  );
}

function Town({ setup }: { setup: StationSetup }) {
  const { landmarks, lights } = setup.station;
  // Every corner without a landmark gets an ordinary house, so the street looks lived in.
  const houses = useMemo(() => {
    const out: Array<{ node: Node; corner: Corner; seed: number }> = [];
    let seed = 1;
    for (let c = 0; c < COLS; c++)
      for (let r = 0; r < ROWS; r++)
        for (const corner of ["ne", "nw", "se", "sw"] as Corner[]) {
          seed++;
          if (r === 0 && corner[0] === "s") continue;
          if (landmarks.some((l) => l.node.c === c && l.node.r === r && l.corner === corner)) continue;
          // Only some corners get a house, so the landmarks stand out.
          if (seed % 3 !== 0) continue;
          out.push({ node: { c, r }, corner, seed });
        }
    return out;
  }, [landmarks]);
  return (
    <group>
      {houses.map((h, i) => (
        <House key={i} at={cornerPoint(h.node, h.corner)} seed={h.seed} />
      ))}
      {landmarks.map((l) => (
        <LandmarkBuilding key={l.slug} landmark={l} known={setup.landmarks.includes(l.slug)} />
      ))}
      {lights.map((n, i) => (
        <TrafficLight key={i} at={cornerPoint(n, "se", 1.25)} />
      ))}
    </group>
  );
}

function House({ at, seed }: { at: { x: number; z: number }; seed: number }) {
  const walls = ["#f6efe2", "#f3e3c3", "#e9d8c4", "#f1e6d6"][seed % 4];
  const roof = ["#a8432f", "#8b3a2a", "#6b4a2f"][seed % 3];
  const h = 1.5 + (seed % 2) * 0.4;
  return (
    <group position={[at.x, 0, at.z]} rotation-y={(seed % 4) * (Math.PI / 2)}>
      <Box p={[0, h / 2, 0]} s={[2.2, h, 2.2]} c={walls} t="plaster" />
      <mesh geometry={prism} material={toon(roof)} position={[0, h + 0.55, 0]} rotation-z={Math.PI / 2} rotation-y={0} scale={[0.75, 2.4, 1.35]} castShadow />
      <mesh geometry={box} material={glow("#ffe2a8", 0.5)} position={[0, h * 0.6, 1.12]} scale={[0.5, 0.55, 0.04]} />
    </group>
  );
}

// The places travellers ask for, each recognisable at a glance, clickable once you're at its crossing.
function LandmarkBuilding({ landmark, known }: { landmark: Landmark; known: boolean }) {
  const { hover, handlers } = useHover();
  const at = cornerPoint(landmark.node, landmark.corner);
  const here = useStation((s) => s.step === "way" && !s.town.walking && s.town.at.c === landmark.node.c && s.town.at.r === landmark.node.r);
  // Face the crossing.
  const rot = Math.atan2((landmark.corner[1] === "e" ? -1 : 1) * 1, (landmark.corner[0] === "n" ? 1 : -1) * 1);
  return (
    <group position={[at.x, 0, at.z]} onClick={here && known ? click(() => deliver(landmark)) : undefined} {...(here && known ? handlers : {})}>
      <group rotation-y={rot} scale={hover ? 1.04 : 1}>
        <LandmarkModel kind={landmark.kind} />
      </group>
      {here && known ? <mesh geometry={cyl} material={glow(hover ? "#ffe066" : "#ffe9a8", hover ? 1.6 : 0.9)} position={[0, 0.03, 0]} scale={[1.6, 0.02, 1.6]} /> : null}
    </group>
  );
}

function LandmarkModel({ kind }: { kind: Landmark["kind"] }) {
  switch (kind) {
    case "church":
      return (
        <group>
          <Box p={[0, 1.5, 0]} s={[1.8, 3, 2.4]} c="#f4f1ea" t="plaster" />
          <mesh geometry={prism} material={toon("#7a3b2e")} position={[0, 3.4, 0]} rotation-z={Math.PI / 2} scale={[0.8, 2, 1.3]} />
          <Box p={[0, 2.6, 1.0]} s={[0.9, 5.2, 0.9]} c="#f4f1ea" t="plaster" />
          <mesh geometry={cone} material={toon("#3f6f4a")} position={[0, 6.0, 1.0]} scale={[0.7, 1.8, 0.7]} castShadow />
          <mesh geometry={box} material={toon("#d9a53a")} position={[0, 7.1, 1.0]} scale={[0.06, 0.5, 0.06]} />
          <mesh geometry={box} material={toon("#5b3a24")} position={[0, 0.7, 1.46]} scale={[0.6, 1.3, 0.05]} />
        </group>
      );
    case "post":
      return (
        <group>
          <Box p={[0, 1.3, 0]} s={[2.2, 2.6, 2.0]} c="#f7c948" t="plaster" />
          <mesh geometry={prism} material={toon(c.roof)} position={[0, 2.95, 0]} rotation-z={Math.PI / 2} scale={[0.7, 2.4, 1.2]} />
          <Box p={[0, 2.0, 1.03]} s={[0.9, 0.4, 0.05]} c="#2b2b2b" shadow={false} />
          <mesh geometry={sphere} material={toon("#f7c948", { surface: null })} position={[0, 2.0, 1.08]} scale={[0.25, 0.12, 0.05]} />
          <Box p={[0.7, 0.5, 1.2]} s={[0.35, 0.8, 0.3]} c="#f7c948" />
        </group>
      );
    case "bank":
      return (
        <group>
          <Box p={[0, 1.4, 0]} s={[2.2, 2.8, 2.0]} c="#c9ccd0" t="stone" />
          <Box p={[0, 2.95, 0.1]} s={[2.4, 0.3, 2.3]} c="#9aa3a8" />
          {[-0.75, -0.25, 0.25, 0.75].map((x) => (
            <mesh key={x} geometry={cyl} material={toon("#eef0f2")} position={[x, 1.3, 1.1]} scale={[0.12, 2.6, 0.12]} />
          ))}
        </group>
      );
    case "pharmacy":
      return (
        <group>
          <Box p={[0, 1.3, 0]} s={[2.0, 2.6, 2.0]} c="#f4f1ea" t="plaster" />
          <mesh geometry={prism} material={toon("#6b4a2f")} position={[0, 2.95, 0]} rotation-z={Math.PI / 2} scale={[0.7, 2.2, 1.2]} />
          <mesh geometry={box} material={glow("#3fbf6f", 1.2)} position={[0, 2.1, 1.03]} scale={[0.5, 0.16, 0.05]} />
          <mesh geometry={box} material={glow("#3fbf6f", 1.2)} position={[0, 2.1, 1.03]} scale={[0.16, 0.5, 0.05]} />
        </group>
      );
    case "hotel":
      return (
        <group>
          <Box p={[0, 2.0, 0]} s={[2.2, 4.0, 2.2]} c="#7fa8d6" t="plaster" />
          <mesh geometry={prism} material={toon("#2c3e50")} position={[0, 4.4, 0]} rotation-z={Math.PI / 2} scale={[0.7, 2.4, 1.3]} />
          {[1.2, 2.2, 3.2].flatMap((y) => [-0.55, 0.55].map((x) => <mesh key={`${x}${y}`} geometry={box} material={glow("#ffe2a8", 0.7)} position={[x, y, 1.12]} scale={[0.4, 0.45, 0.04]} />))}
          <Box p={[0, 0.5, 1.4]} s={[1.2, 0.08, 0.6]} c="#c0392b" />
        </group>
      );
    case "restaurant":
      return (
        <group>
          <Box p={[0, 1.3, 0]} s={[2.2, 2.6, 2.0]} c="#f3e3c3" t="plaster" />
          <mesh geometry={prism} material={toon(c.roof)} position={[0, 2.95, 0]} rotation-z={Math.PI / 2} scale={[0.7, 2.4, 1.2]} />
          {Array.from({ length: 5 }, (_, i) => (
            <Box key={i} p={[-0.8 + i * 0.4, 1.9, 1.3]} s={[0.4, 0.06, 0.7]} r={[0.3, 0, 0]} c={i % 2 ? "#ffffff" : "#c0392b"} t="fabric" shadow={false} />
          ))}
          {[-0.6, 0.6].map((x) => (
            <mesh key={x} geometry={cyl} material={toon("#8a5a36")} position={[x, 0.4, 1.9]} scale={[0.3, 0.06, 0.3]} />
          ))}
        </group>
      );
    case "museum":
      return (
        <group>
          <Box p={[0, 1.4, 0]} s={[2.3, 2.8, 2.1]} c="#e8e2d6" t="stone" />
          <mesh geometry={prism} material={toon("#d6cfc0")} position={[0, 3.15, 0.2]} rotation-x={Math.PI / 2} rotation-z={Math.PI / 2} scale={[0.6, 2.4, 1.2]} />
          {[-0.85, -0.3, 0.3, 0.85].map((x) => (
            <mesh key={x} geometry={cyl} material={toon("#f6f1e6")} position={[x, 1.3, 1.2]} scale={[0.11, 2.6, 0.11]} />
          ))}
          <Box p={[0, 0.08, 1.4]} s={[2.4, 0.16, 0.6]} c="#d6cfc0" />
        </group>
      );
    case "park":
      return (
        <group>
          <Box p={[0, 0.03, 0]} s={[2.6, 0.06, 2.6]} c="#5f9a46" t="leaves" shadow={false} />
          {[
            [-0.7, -0.6],
            [0.7, -0.4],
            [0, 0.6],
          ].map(([x, z], i) => (
            <group key={i} position={[x, 0, z]}>
              <mesh geometry={cyl} material={toon(palette.woodDark)} position={[0, 0.6, 0]} scale={[0.12, 1.2, 0.12]} />
              <mesh geometry={sphere} material={toon("#4f8a3a", { surface: "leaves" })} position={[0, 1.5, 0]} scale={0.65} castShadow />
            </group>
          ))}
          <Box p={[0.8, 0.25, 0.9]} s={[0.9, 0.08, 0.3]} c="#8a5a36" />
        </group>
      );
    case "school":
      return (
        <group>
          <Box p={[0, 1.5, 0]} s={[2.4, 3.0, 2.0]} c="#b5652b" t="plaster" />
          <mesh geometry={prism} material={toon("#6b4a2f")} position={[0, 3.35, 0]} rotation-z={Math.PI / 2} scale={[0.7, 2.6, 1.2]} />
          <Box p={[0, 4.0, 0]} s={[0.5, 0.6, 0.5]} c="#f4f1ea" />
          <mesh geometry={sphere} material={toon("#d9a53a")} position={[0, 3.95, 0]} scale={0.14} />
          {[-0.7, 0, 0.7].map((x) => (
            <mesh key={x} geometry={box} material={glow("#ffe2a8", 0.6)} position={[x, 2.0, 1.02]} scale={[0.4, 0.5, 0.04]} />
          ))}
        </group>
      );
    case "fountain":
      return (
        <group>
          <mesh geometry={cyl} material={toon("#b8b0a2", { surface: "stone" })} position={[0, 0.3, 0]} scale={[1.0, 0.6, 1.0]} castShadow />
          <mesh geometry={cyl} material={toon("#6fc3d9", { surface: null })} position={[0, 0.62, 0]} scale={[0.85, 0.05, 0.85]} />
          <mesh geometry={cyl} material={toon("#b8b0a2")} position={[0, 1.1, 0]} scale={[0.14, 1.1, 0.14]} />
          <mesh geometry={sphere} material={toon("#9fdcf0", { surface: null })} position={[0, 1.75, 0]} scale={0.22} />
        </group>
      );
  }
}

function TrafficLight({ at }: { at: { x: number; z: number } }) {
  const lamp = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const phase = Math.floor(clock.elapsedTime / 3) % 2;
    lamp.current?.children.forEach((m, i) => ((m as THREE.Mesh).visible = (i === 0 && phase === 0) || (i === 2 && phase === 1) || i === 3));
  });
  return (
    <group position={[at.x, 0, at.z]}>
      <mesh geometry={cyl} material={toon("#3d3d3d")} position={[0, 1.2, 0]} scale={[0.07, 2.4, 0.07]} />
      <Box p={[0, 2.5, 0]} s={[0.3, 0.8, 0.25]} c="#2b2b2b" />
      <group ref={lamp}>
        <mesh geometry={sphere} material={glow("#ff4d4d", 1.6)} position={[0, 2.75, 0.13]} scale={0.08} />
        <mesh geometry={sphere} material={glow("#ffc94d", 1.6)} position={[0, 2.5, 0.13]} scale={0.08} />
        <mesh geometry={sphere} material={glow("#4dff7a", 1.6)} position={[0, 2.25, 0.13]} scale={0.08} />
        <mesh geometry={sphere} material={toon("#1a1a1a", { surface: null })} position={[0, 2.5, 0.12]} scale={[0.09, 0.3, 0.02]} />
      </group>
    </group>
  );
}

// ---------- The station ----------

function Station() {
  return (
    <group>
      {/* the station building, with its clock */}
      <group position={[0, 0, 10.6]}>
        <Box p={[0, 1.8, 0]} s={[12, 3.6, 3]} c="#f3e3c3" t="plaster" />
        <mesh geometry={prism} material={toon("#8b3a2a")} position={[0, 4.2, 0]} rotation-z={Math.PI / 2} scale={[0.9, 12.4, 1.8]} castShadow />
        {[-4, -2, 2, 4].map((x) => (
          <mesh key={x} geometry={box} material={glow("#ffe2a8", 0.5)} position={[x, 1.9, -1.52]} scale={[0.8, 1.1, 0.04]} />
        ))}
        <Box p={[0, 1.3, -1.52]} s={[1.4, 2.6, 0.05]} c="#5b3a24" shadow={false} />
        <mesh geometry={cyl} material={toon("#ffffff", { surface: null })} position={[0, 3.2, -1.55]} rotation-x={Math.PI / 2} scale={[0.45, 0.05, 0.45]} />
        <mesh geometry={box} material={toon("#2b2b2b", { surface: null })} position={[0, 3.32, -1.6]} scale={[0.04, 0.3, 0.02]} />
      </group>
      {/* the platform and a train behind the building */}
      <Box p={[-10, 0.2, 8.4]} s={[8, 0.4, 2.2]} c="#b8b0a2" t="stone" />
      <group position={[-10, 0, 10.8]}>
        <Box p={[0, 1.2, 0]} s={[9, 2.0, 2.0]} c="#c0392b" />
        <Box p={[0, 2.35, 0]} s={[9, 0.3, 2.1]} c="#2b2b2b" />
        {[-3, -1, 1, 3].map((x) => (
          <mesh key={x} geometry={box} material={glow("#dff2fb", 0.7)} position={[x, 1.5, -1.02]} scale={[1.2, 0.6, 0.04]} />
        ))}
      </group>
    </group>
  );
}

// The ticket kiosk and the timetable board beside it.
function Kiosk() {
  return (
    <group>
      <group position={[KIOSK.x, 0, KIOSK.z]}>
        <Box p={[0, 0.55, 0]} s={[1.2, 1.1, 0.7]} c="#8b1e2d" t="siding" />
        <Box p={[0, 1.13, 0]} s={[1.35, 0.08, 0.85]} c="#8a5a36" />
        <Box p={[0.3, 1.2, -0.05]} s={[0.35, 0.06, 0.25]} c="#fffaf0" shadow={false} />
      </group>
      <group position={[BOARD.x, 0, BOARD.z]}>
        {[-0.8, 0.8].map((x) => (
          <Box key={x} p={[x, 1.1, 0]} s={[0.1, 2.2, 0.1]} c="#3d3d3d" />
        ))}
        <Box p={[0, 2.0, 0]} s={[1.9, 1.1, 0.1]} c="#1c3553" />
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} geometry={box} material={glow("#f2c230", 0.8)} position={[0, 2.35 - i * 0.22, -0.06]} scale={[1.6, 0.06, 0.02]} />
        ))}
      </group>
    </group>
  );
}

// ---------- People ----------

function Host({ setup }: { setup: StationSetup }) {
  const id = setup.host.id;
  const anim = useMemo(() => (): CharacterAnim => ({ speed: 0, talking: runtime.speaking === id, emote: emoteOf(id) }), [id]);
  return (
    <group position={[HOST_SPOT.x, 0, HOST_SPOT.z]} rotation-y={Math.PI + 0.4}>
      <Character look={setup.host.look} getAnim={anim} seed={8} />
    </group>
  );
}

function Traveller() {
  const look = useStation((s) => s.look);
  const index = useStation((s) => s.index);
  const group = useRef<THREE.Group>(null);
  const anim = useMemo(() => (): CharacterAnim => ({ speed: stationRuntime.traveller.path.length ? 2.6 : 0, talking: false, emote: getStation().step === "leaving" ? "wave" : undefined }), []);
  useFrame((_, delta) => {
    const w = stationRuntime.traveller;
    if (!group.current) return;
    group.current.position.set(w.x, 0, w.z);
    const diff = THREE.MathUtils.euclideanModulo(w.rot - group.current.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    group.current.rotation.y += diff * Math.min(1, delta * 8);
  });
  return (
    <group ref={group} position={[-20, 0, 0]}>
      <Character key={index} look={look} getAnim={anim} seed={index + 11} />
    </group>
  );
}

// The suitcase you carry into town.
function Suitcase() {
  const carrying = useStation((s) => s.step === "way");
  if (!carrying) return null;
  return (
    <group position={[0.35, -0.55, -0.4]}>
      <Box p={[0, 0, 0]} s={[0.22, 0.5, 0.65]} c="#6b4a2f" shadow={false} />
      <Box p={[0, 0.3, 0]} s={[0.06, 0.08, 0.25]} c="#2b2b2b" shadow={false} />
    </group>
  );
}

export function travellerHead(): [number, number, number] {
  const w = stationRuntime.traveller;
  return [w.x + 0.3, 2.2, w.z];
}

export function hostHeadStation(): [number, number, number] {
  return [HOST_SPOT.x + 0.3, 2.3, HOST_SPOT.z];
}
