"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { FurnitureModel, Placement, ThingModel } from "@/lib/game/home";
import { runtime } from "../store";
import { Character, type CharacterAnim } from "../world/character";
import { glow, palette, toon } from "../world/materials";
import { box, Box, cone, cyl, FlowerBox, sphere, torus } from "../world/parts";
import { ShiftProjector } from "./anchors";
import { FURNITURE, ROOM, spotPosition } from "./home-layout";
import { getHome, homeRuntime, homeSetup, take, tell, tickHome, useHome, type HomeSetup } from "./home-store";
import { click, emoteOf, JobCamera, JobPlayer, useHover } from "./job-scene";

// The host's parlour as a cutaway diorama: no front wall, no ceiling. Wood
// panelling, a tiled stove in the kitchen corner, a red-checked tablecloth
// and things lying everywhere they shouldn't.

const wood = { floor: "#a9784e", dark: "#5b3a24", mid: "#8a5a36", light: "#c49a6c", wall: "#f3ead8" };
const VIEW = { position: new THREE.Vector3(0.2, 8.6, 8.4), target: new THREE.Vector3(0, 0.5, -0.4) };

export function HomeRoom() {
  const setup = homeSetup();
  useFrame((_, delta) => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __home: unknown }).__home = { getHome, take, tell };
    tickHome(Math.min(delta, 0.05));
  });
  if (!setup) return null;
  return (
    <group>
      <pointLight position={[0, 4.4, 0]} intensity={16} distance={16} decay={1.6} color="#ffd9a0" />
      <ambientLight intensity={0.35} color="#ffe6c4" />
      <Room />
      {(Object.keys(FURNITURE) as FurnitureModel[]).map((model) => (
        <Furniture key={model} model={model} />
      ))}
      <Things />
      <Host setup={setup} />
      <JobPlayer>
        <Carried />
      </JobPlayer>
      <JobCamera position={VIEW.position} target={VIEW.target} />
      <ShiftProjector />
    </group>
  );
}

// ---------- The room ----------

function Room() {
  const { halfWidth, back, front } = ROOM;
  const depth = front - back;
  const door = FURNITURE.door;
  return (
    <group>
      <Box p={[0, -0.1, (front + back) / 2]} s={[halfWidth * 2, 0.2, depth]} c={wood.floor} t="planks" shadow={false} />
      <Box p={[0, -0.6, (front + back) / 2 + 0.2]} s={[halfWidth * 2 + 0.4, 0.8, depth + 0.4]} c={wood.dark} shadow={false} />
      {/* a rag rug in the middle */}
      <mesh geometry={cyl} material={toon("#c0392b", { surface: "fabric" })} position={[-0.5, 0.02, 1.4]} scale={[2.2, 0.02, 1.5]} receiveShadow />
      <mesh geometry={cyl} material={toon("#f3ead8", { surface: "fabric" })} position={[-0.5, 0.03, 1.4]} scale={[1.6, 0.02, 1.0]} receiveShadow />
      {/* back wall: panelling below, plaster and beams above */}
      <Box p={[0, 2.6, back - 0.1]} s={[halfWidth * 2, 5.2, 0.2]} c={wood.wall} t="plaster" />
      <Box p={[0, 0.75, back]} s={[halfWidth * 2, 1.5, 0.06]} c={wood.mid} t="siding" shadow={false} />
      {[-7, -2.8, 1.6, 7].map((x) => (
        <Box key={x} p={[x, 2.6, back]} s={[0.22, 5.2, 0.12]} c={wood.dark} shadow={false} />
      ))}
      <Box p={[0, 5.1, back]} s={[halfWidth * 2, 0.22, 0.14]} c={wood.dark} shadow={false} />
      {/* plates on a rail, and a cuckoo clock */}
      <Box p={[-1, 3.4, back + 0.15]} s={[4, 0.08, 0.25]} c={wood.mid} />
      {[-2.5, -1.75, -1, -0.25, 0.5].map((x, i) => (
        <mesh key={x} geometry={cyl} material={toon(i % 2 ? "#3f7fd1" : "#f6efe2", { surface: null })} position={[x, 3.75, back + 0.12]} rotation-x={Math.PI / 2} scale={[0.3, 0.04, 0.3]} />
      ))}
      <group position={[1.6, 3.6, back + 0.12]}>
        <Box p={[0, 0, 0]} s={[0.8, 0.8, 0.3]} c="#6b3f24" t="planks" />
        <mesh geometry={cone} material={toon("#4a2c1a")} position={[0, 0.6, 0]} rotation-y={Math.PI / 4} scale={[0.7, 0.4, 0.3]} />
        <mesh geometry={cyl} material={toon("#f6efe2", { surface: null })} position={[0, -0.05, 0.16]} rotation-x={Math.PI / 2} scale={[0.25, 0.04, 0.25]} />
      </group>
      {/* left wall, with the front door you come in through */}
      <Box p={[-halfWidth - 0.1, 2.6, (back + door.z - 0.8) / 2]} s={[0.2, 5.2, door.z - 0.8 - back]} c={wood.wall} t="plaster" />
      <Box p={[-halfWidth - 0.1, 2.6, (door.z + 0.8 + 1.8) / 2]} s={[0.2, 5.2, 1.8 - (door.z + 0.8)]} c={wood.wall} t="plaster" />
      <Box p={[-halfWidth - 0.1, 4.25, door.z]} s={[0.2, 1.9, 1.6]} c={wood.wall} t="plaster" />
      {/* right wall */}
      <Box p={[halfWidth + 0.1, 2.6, (back + 1.8) / 2]} s={[0.2, 5.2, 1.8 - back]} c={wood.wall} t="plaster" />
      <Box p={[halfWidth, 3.2, -0.8]} s={[0.06, 1.2, 1.2]} c={wood.dark} shadow={false} />
      <mesh geometry={box} material={glow("#ffe2a8", 0.8)} position={[halfWidth - 0.04, 3.2, -0.8]} scale={[0.04, 0.95, 0.95]} />
    </group>
  );
}

function Furniture({ model }: { model: FurnitureModel }) {
  const { x, z, rot } = FURNITURE[model];
  return (
    <group position={[x, 0, z]} rotation-y={rot}>
      <FurnitureModelView model={model} />
    </group>
  );
}

function FurnitureModelView({ model }: { model: FurnitureModel }) {
  switch (model) {
    case "table":
      return (
        <group>
          <Box p={[0, 0.78, 0]} s={[1.8, 0.08, 1.1]} c={wood.light} t="planks" />
          {/* red-checked cloth */}
          <Box p={[0, 0.81, 0]} s={[1.3, 0.02, 1.15]} c="#d64545" t="fabric" shadow={false} />
          {[
            [-0.8, -0.45],
            [0.8, -0.45],
            [-0.8, 0.45],
            [0.8, 0.45],
          ].map(([lx, lz]) => (
            <Box key={`${lx}${lz}`} p={[lx, 0.38, lz]} s={[0.1, 0.76, 0.1]} c={wood.dark} />
          ))}
        </group>
      );
    case "chair":
      return (
        <group>
          <Box p={[0, 0.46, 0]} s={[0.6, 0.07, 0.6]} c={wood.light} t="planks" />
          <Box p={[0, 0.95, -0.27]} s={[0.6, 0.85, 0.08]} c={wood.mid} t="planks" />
          <mesh geometry={sphere} material={toon("#d64545")} position={[0, 1.05, -0.22]} scale={[0.12, 0.12, 0.04]} />
          {[
            [-0.25, -0.25],
            [0.25, -0.25],
            [-0.25, 0.25],
            [0.25, 0.25],
          ].map(([lx, lz]) => (
            <Box key={`${lx}${lz}`} p={[lx, 0.22, lz]} s={[0.07, 0.44, 0.07]} c={wood.dark} />
          ))}
        </group>
      );
    case "bed":
      return (
        <group>
          <Box p={[0, 0.48, 0]} s={[1.5, 0.12, 2.5]} c={wood.mid} t="planks" />
          <Box p={[0, 0.6, 0.05]} s={[1.4, 0.14, 2.3]} c="#f6efe2" t="fabric" />
          <Box p={[0, 0.66, 0.35]} s={[1.42, 0.06, 1.6]} c="#3f7fd1" t="fabric" />
          <Box p={[0, 0.72, -0.85]} s={[0.9, 0.12, 0.4]} c="#ffffff" t="fabric" />
          <Box p={[0, 0.85, -1.27]} s={[1.5, 1.1, 0.1]} c={wood.dark} t="planks" />
          {[
            [-0.7, -1.2],
            [0.7, -1.2],
            [-0.7, 1.2],
            [0.7, 1.2],
          ].map(([lx, lz]) => (
            <Box key={`${lx}${lz}`} p={[lx, 0.22, lz]} s={[0.1, 0.44, 0.1]} c={wood.dark} />
          ))}
        </group>
      );
    case "sofa":
      return (
        <group>
          <Box p={[0, 0.3, 0]} s={[2.3, 0.4, 0.9]} c="#3f7d4f" t="fabric" />
          <Box p={[0, 0.75, -0.38]} s={[2.3, 0.6, 0.2]} c="#356b43" t="fabric" />
          {[-1.1, 1.1].map((ax) => (
            <Box key={ax} p={[ax, 0.55, 0]} s={[0.2, 0.5, 0.9]} c="#356b43" t="fabric" />
          ))}
          <Box p={[-0.6, 0.6, -0.15]} s={[0.4, 0.3, 0.12]} c="#f4c24a" t="fabric" />
        </group>
      );
    case "cupboard":
      return (
        <group>
          <Box p={[0, 1.1, 0]} s={[1.6, 2.2, 0.8]} c={wood.mid} t="planks" />
          {/* open doors, so you can see in */}
          <Box p={[0, 1.1, 0.36]} s={[1.4, 2.0, 0.06]} c="#3b2616" shadow={false} />
          <Box p={[0, 0.98, 0.3]} s={[1.4, 0.06, 0.2]} c={wood.light} shadow={false} />
          {[-1, 1].map((side) => (
            <Box key={side} p={[side * 1.05, 1.1, 0.75]} s={[0.06, 2.0, 0.7]} r={[0, side * -0.5, 0]} c="#8b3a2e" t="planks" />
          ))}
          <mesh geometry={cone} material={toon(wood.dark)} position={[0, 2.3, 0]} rotation-y={Math.PI / 4} scale={[1.2, 0.15, 0.6]} />
        </group>
      );
    case "stove":
      return (
        <group>
          <Box p={[0, 0.45, 0]} s={[1.3, 0.9, 0.85]} c="#3f7d6a" t="stone" />
          <Box p={[0, 0.94, 0]} s={[1.35, 0.08, 0.9]} c="#2d3436" />
          <mesh geometry={box} material={glow("#ff8a3c", 1.4)} position={[0.3, 0.4, 0.43]} scale={[0.35, 0.25, 0.02]} />
          <mesh geometry={cyl} material={toon("#80827c")} position={[0.45, 2.6, -0.2]} scale={[0.15, 3.2, 0.15]} />
          <mesh geometry={cyl} material={toon("#2d3436")} position={[0.35, 1.05, 0.1]} scale={[0.22, 0.16, 0.22]} />
        </group>
      );
    case "fridge":
      return (
        <group>
          <Box p={[0, 0.85, 0]} s={[1.0, 1.7, 0.8]} c="#efe6cf" t="grain" />
          {/* door ajar, shelf inside */}
          <Box p={[0, 0.85, 0.36]} s={[0.8, 1.5, 0.06]} c="#cfe6ee" shadow={false} />
          <Box p={[0, 0.93, 0.3]} s={[0.8, 0.05, 0.2]} c="#ffffff" shadow={false} />
          <Box p={[0.75, 0.85, 0.65]} s={[0.06, 1.6, 0.7]} r={[0, -0.6, 0]} c="#efe6cf" t="grain" />
          <Box p={[0, 1.72, 0]} s={[1.05, 0.06, 0.85]} c="#d8d0b8" />
        </group>
      );
    case "window":
      return (
        <group position={[0, 2.3, 0.02]}>
          <Box p={[0, 0, 0]} s={[1.8, 1.6, 0.1]} c={wood.dark} shadow={false} />
          <mesh geometry={box} material={glow("#ffe2a8", 0.9)} position={[0, 0, 0.04]} scale={[1.5, 1.3, 0.05]} />
          <Box p={[0, 0, 0.08]} s={[0.08, 1.3, 0.04]} c={wood.dark} shadow={false} />
          {[-1, 1].map((side) => (
            <Box key={side} p={[side * 1.2, 0, 0.06]} s={[0.5, 1.5, 0.05]} c="#3f7d4f" shadow={false} />
          ))}
          <FlowerBox position={[0, -0.95, 0.2]} />
        </group>
      );
    case "lamp":
      return (
        <group>
          <mesh geometry={cyl} material={toon(wood.dark)} position={[0, 0.04, 0]} scale={[0.3, 0.08, 0.3]} />
          <mesh geometry={cyl} material={toon(wood.dark)} position={[0, 0.9, 0]} scale={[0.04, 1.7, 0.04]} />
          <mesh geometry={cone} material={toon("#f4c24a", { surface: "fabric" })} position={[0, 1.85, 0]} scale={[0.4, 0.45, 0.4]} castShadow />
          <mesh geometry={sphere} material={glow("#ffd98f", 2)} position={[0, 1.65, 0]} scale={0.12} />
        </group>
      );
    case "door":
      return (
        <group>
          <Box p={[0.08, 1.6, 0]} s={[0.1, 3.2, 1.6]} c={wood.dark} shadow={false} />
          <mesh geometry={box} material={glow("#cfe9c4", 0.8)} position={[-0.3, 1.5, 0]} scale={[0.05, 3, 1.4]} />
          <Box p={[0.25, 1.5, 1.05]} s={[0.08, 3.0, 0.5]} r={[0, 0.9, 0]} c="#8b3a2e" t="planks" />
        </group>
      );
  }
}

// ---------- Things ----------

function Things() {
  const room = useHome((s) => s.room);
  return (
    <>
      {room.map((p) => (
        <Thing key={p.id} placement={p} />
      ))}
    </>
  );
}

function Thing({ placement }: { placement: Placement }) {
  const [x, y, z] = spotPosition(placement.anchor.model, placement.spot);
  const { hover, handlers } = useHover();
  const group = useRef<THREE.Group>(null);
  const seed = placement.id * 1.7;
  useFrame(({ clock }) => {
    // Cats and dogs breathe; everything else stays put.
    if (group.current && (placement.thing.model === "cat" || placement.thing.model === "dog")) group.current.scale.y = 1 + Math.sin(clock.elapsedTime * 2 + seed) * 0.04;
  });
  return (
    <group position={[x, y, z]} rotation-y={(seed % 1.2) - 0.6} onClick={click(() => take(placement))} {...handlers}>
      <group ref={group} scale={hover ? THING_SCALE * 1.15 : THING_SCALE}>
        <ThingView model={placement.thing.model} />
      </group>
      {hover ? <mesh geometry={cyl} material={glow("#ffe9a8", 1.2)} position={[0, 0.01, 0]} scale={[0.55, 0.01, 0.55]} /> : null}
    </group>
  );
}

// Things are drawn a little larger than life so they read from the camera.
const THING_SCALE = 1.35;

export function ThingView({ model }: { model: ThingModel }) {
  switch (model) {
    case "cat":
      return (
        <group>
          <mesh geometry={sphere} material={toon("#e08a3c")} position={[0, 0.16, 0]} scale={[0.26, 0.16, 0.18]} castShadow />
          <mesh geometry={sphere} material={toon("#e08a3c")} position={[0.24, 0.3, 0]} scale={0.13} castShadow />
          {[-1, 1].map((side) => (
            <mesh key={side} geometry={cone} material={toon("#c06a24")} position={[0.26, 0.44, side * 0.07]} scale={[0.05, 0.08, 0.05]} />
          ))}
          <mesh geometry={cyl} material={toon("#c06a24")} position={[-0.28, 0.22, 0]} rotation-z={0.9} scale={[0.03, 0.3, 0.03]} />
        </group>
      );
    case "dog":
      return (
        <group>
          <mesh geometry={sphere} material={toon("#8a5a36")} position={[0, 0.2, 0]} scale={[0.3, 0.18, 0.18]} castShadow />
          <mesh geometry={sphere} material={toon("#8a5a36")} position={[0.3, 0.34, 0]} scale={0.14} castShadow />
          <mesh geometry={sphere} material={toon("#2b1d14", { surface: null })} position={[0.44, 0.33, 0]} scale={0.04} />
          {[-1, 1].map((side) => (
            <Box key={side} p={[0.27, 0.36, side * 0.13]} s={[0.08, 0.16, 0.04]} c="#5b3a24" shadow={false} />
          ))}
        </group>
      );
    case "key":
      return (
        <group position={[0, 0.03, 0]}>
          <mesh geometry={torus} material={toon("#d9a53a", { surface: null })} rotation-x={-Math.PI / 2} position={[-0.12, 0, 0]} scale={0.08} />
          <Box p={[0.05, 0, 0]} s={[0.22, 0.03, 0.04]} c="#d9a53a" t={null} />
          <Box p={[0.14, 0, 0.04]} s={[0.04, 0.03, 0.06]} c="#d9a53a" t={null} />
        </group>
      );
    case "cup":
      return (
        <group>
          <mesh geometry={cyl} material={toon("#ffffff", { surface: null })} position={[0, 0.1, 0]} scale={[0.1, 0.2, 0.1]} castShadow />
          <mesh geometry={torus} material={toon("#ffffff", { surface: null })} position={[0.11, 0.1, 0]} scale={0.06} />
          <mesh geometry={cyl} material={toon("#3f7fd1", { surface: null })} position={[0, 0.15, 0]} scale={[0.102, 0.03, 0.102]} />
        </group>
      );
    case "bag":
      return (
        <group>
          <Box p={[0, 0.15, 0]} s={[0.36, 0.28, 0.16]} c="#b5541c" t="fabric" />
          <mesh geometry={torus} material={toon("#7a3a14")} position={[0, 0.3, 0]} scale={[0.13, 0.12, 0.12]} />
        </group>
      );
    case "book":
      return (
        <group>
          <Box p={[0, 0.04, 0]} s={[0.34, 0.08, 0.26]} c="#2f6fb5" t={null} />
          <Box p={[0.01, 0.04, 0]} s={[0.32, 0.06, 0.25]} c="#f6efe2" t={null} shadow={false} />
        </group>
      );
    case "clock":
      return (
        <group>
          <mesh geometry={cyl} material={toon("#c0392b", { surface: null })} position={[0, 0.16, 0]} rotation-x={Math.PI / 2} scale={[0.15, 0.08, 0.15]} castShadow />
          <mesh geometry={cyl} material={toon("#ffffff", { surface: null })} position={[0, 0.16, 0.042]} rotation-x={Math.PI / 2} scale={[0.12, 0.01, 0.12]} />
          {[-1, 1].map((side) => (
            <mesh key={side} geometry={sphere} material={toon("#d9a53a", { surface: null })} position={[side * 0.1, 0.31, 0]} scale={0.05} />
          ))}
        </group>
      );
    case "flower":
      return (
        <group>
          <mesh geometry={cyl} material={toon("#3f7fd1", { surface: null })} position={[0, 0.1, 0]} scale={[0.08, 0.2, 0.08]} castShadow />
          <mesh geometry={cyl} material={toon(palette.leaf)} position={[0, 0.3, 0]} scale={[0.015, 0.25, 0.015]} />
          <mesh geometry={sphere} material={toon("#ff6f91", { surface: null })} position={[0, 0.45, 0]} scale={0.08} />
          <mesh geometry={sphere} material={toon("#ffd35c", { surface: null })} position={[0, 0.45, 0.05]} scale={0.035} />
        </group>
      );
  }
}

function Carried() {
  const carrying = useHome((s) => s.carrying);
  return carrying ? (
    <group position={[0, -0.05, -0.1]}>
      <ThingView model={carrying.thing.model} />
    </group>
  ) : null;
}

// ---------- The host ----------

function Host({ setup }: { setup: HomeSetup }) {
  const host = setup.host;
  const id = host.id;
  const group = useRef<THREE.Group>(null);
  const anim = useMemo(() => (): CharacterAnim => ({ speed: homeRuntime.host.speed, talking: runtime.speaking === id, emote: emoteOf(id) }), [id]);
  useFrame((_, delta) => {
    const h = homeRuntime.host;
    if (!group.current) return;
    group.current.position.set(h.x, 0, h.z);
    const diff = THREE.MathUtils.euclideanModulo(h.rot - group.current.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    group.current.rotation.y += diff * Math.min(1, delta * 8);
  });
  return (
    <group ref={group}>
      <Character look={host.look} getAnim={anim} seed={2} />
    </group>
  );
}

export function hostHead(): [number, number, number] {
  const h = homeRuntime.host;
  return [h.x + 0.35, 2.3, h.z];
}

export const SPOT_LABEL_HEIGHT: Record<FurnitureModel, number> = {
  table: 1.5,
  chair: 1.7,
  bed: 1.6,
  sofa: 1.5,
  cupboard: 2.9,
  stove: 1.6,
  fridge: 2.3,
  window: 3.5,
  lamp: 2.5,
  door: 3.5,
};
