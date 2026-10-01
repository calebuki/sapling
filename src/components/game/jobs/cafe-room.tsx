"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { cafeItem, type CafeIcon } from "@/lib/game/cafe";
import { runtime } from "../store";
import { Character, type CharacterAnim } from "../world/character";
import { glow, palette, toon } from "../world/materials";
import { box, Box, cone, cyl, FlowerBox, sphere, torus, type V3 } from "../world/parts";
import { ShiftProjector } from "./anchors";
import { COUNTER, HOST, ROOM, STAFF_DOOR, STATION_Z, stationSlugs, stationX, TRASH } from "./cafe-layout";
import { emptyTray, getShift, goToKitchen, grab, serve, shiftRuntime, shiftSetup, tickShift, useShift, type Customer, type ShiftSetup } from "./cafe-store";
import { click, emoteOf, JobCamera, JobPlayer, pointer, useHover } from "./job-scene";
import { jobPlayer } from "./walk";

// Café Kuckuck from the inside, as a cutaway diorama: no front wall and no
// ceiling, so the camera looks down over the guests at the counter, you behind
// it, the drink stations on the back wall and the host's oven to the left.

const wood = {
  floor: "#b98a5c",
  dark: "#5b3a24",
  counter: "#7a4b2f",
  top: "#e9dcc4",
  wall: "#f6efe2",
  panel: "#8a5a36",
};

export function CafeRoom() {
  const setup = shiftSetup();
  useFrame((_, delta) => tickShift(Math.min(delta, 0.05)));
  if (!setup) return null;
  const slugs = stationSlugs(setup.cafe, setup.rush);
  return (
    <group>
      <pointLight position={[0, 4.6, -0.5]} intensity={18} distance={16} decay={1.6} color="#ffd9a0" />
      <ambientLight intensity={0.35} color="#ffe6c4" />
      <Room />
      <Counter />
      {slugs.map((slug) => (
        <Station key={slug} slug={slug} x={stationX(slugs, slug)} />
      ))}
      <Kitchen setup={setup} />
      <Trash />
      <JobPlayer>
        <Tray />
      </JobPlayer>
      <Guests />
      <JobCamera position={VIEW.position} target={VIEW.target} />
      <ShiftProjector />
    </group>
  );
}

// ---------- The room ----------

function Room() {
  const { halfWidth, back, front } = ROOM;
  const depth = front - back;
  return (
    <group>
      {/* floorboards, and a step down to the dark outside the cutaway */}
      <Box p={[0, -0.1, (front + back) / 2]} s={[halfWidth * 2, 0.2, depth]} c={wood.floor} t="planks" shadow={false} />
      <Box p={[0, -0.6, (front + back) / 2 + 0.2]} s={[halfWidth * 2 + 0.4, 0.8, depth + 0.4]} c={wood.dark} shadow={false} />
      {/* back wall: wood panelling below, plaster and timber above */}
      <Box p={[0, 2.6, back - 0.1]} s={[halfWidth * 2, 5.2, 0.2]} c={wood.wall} t="plaster" />
      <Box p={[0, 0.7, back]} s={[halfWidth * 2, 1.4, 0.06]} c={wood.panel} t="siding" shadow={false} />
      {[-7.4, -3.7, 0, 3.7, 7.4].map((x) => (
        <Box key={x} p={[x, 2.6, back]} s={[0.22, 5.2, 0.12]} c={wood.dark} shadow={false} />
      ))}
      <Box p={[0, 2.95, back]} s={[halfWidth * 2, 0.18, 0.12]} c={wood.dark} shadow={false} />
      <Box p={[0, 5.1, back]} s={[halfWidth * 2, 0.22, 0.14]} c={wood.dark} shadow={false} />
      {/* shelves of jars and cups over the stations */}
      {[-2.2, 2.2].map((x) => (
        <group key={x} position={[x, 3.5, back + 0.25]}>
          <Box p={[0, 0, 0]} s={[2.8, 0.1, 0.4]} c={wood.counter} t="planks" />
          {[-1.1, -0.55, 0, 0.55, 1.1].map((jx, i) => (
            <mesh key={jx} geometry={cyl} material={toon(["#e8b04a", "#c0392b", "#f6efe2", "#3f7d4f", "#a0522d"][i], { surface: null })} position={[jx, 0.25, 0]} scale={[0.15, 0.4, 0.15]} castShadow />
          ))}
        </group>
      ))}
      <CuckooClock position={[0, 4.15, back + 0.1]} />
      {/* windows on the back wall, glowing in the evening */}
      {[-5.6, 5.6].map((x) => (
        <group key={x} position={[x, 3.6, back + 0.02]}>
          <Box p={[0, 0, 0]} s={[1.5, 1.5, 0.1]} c={wood.dark} shadow={false} />
          <mesh geometry={box} material={glow("#ffe2a8", 0.9)} position={[0, 0, 0.04]} scale={[1.2, 1.2, 0.05]} />
          <Box p={[0, 0, 0.08]} s={[0.08, 1.2, 0.04]} c={wood.dark} shadow={false} />
          <FlowerBox position={[0, -0.85, 0.2]} />
        </group>
      ))}
      {/* side walls: the left one closes the kitchen, the right one has the door */}
      <Box p={[-halfWidth - 0.1, 2.6, back + 3]} s={[0.2, 5.2, 6]} c={wood.wall} t="plaster" />
      <StaffDoor />
      <Box p={[halfWidth + 0.1, 4.4, 3.7]} s={[0.2, 1.6, 1.8]} c={wood.wall} t="plaster" />
      <Box p={[halfWidth + 0.06, 1.8, 3.7]} s={[0.1, 3.6, 1.9]} c={wood.dark} shadow={false} />
      <mesh geometry={box} material={glow("#bfe3ff", 0.7)} position={[halfWidth + 0.02, 1.7, 3.7]} scale={[0.04, 3.2, 1.5]} />
      {/* a table for guests who stay */}
      <group position={[-5.4, 0, 3.4]}>
        <mesh geometry={cyl} material={toon(wood.top)} position={[0, 0.78, 0]} scale={[0.75, 0.07, 0.75]} castShadow />
        <mesh geometry={cyl} material={toon(wood.dark)} position={[0, 0.39, 0]} scale={[0.08, 0.78, 0.08]} />
        <mesh geometry={cyl} material={glow("#ffcf7a", 1.4)} position={[0, 0.95, 0]} scale={[0.08, 0.25, 0.08]} />
        {[-1, 1].map((side) => (
          <Box key={side} p={[side * 1.05, 0.45, 0]} s={[0.5, 0.08, 0.5]} c={palette.wood} t="planks" />
        ))}
      </group>
      <mesh geometry={sphere} material={toon(palette.leaf, { surface: "leaves" })} position={[6.6, 0.9, 1.6]} scale={[0.6, 0.8, 0.6]} castShadow />
      <mesh geometry={cyl} material={toon("#b5541c")} position={[6.6, 0.25, 1.6]} scale={[0.4, 0.5, 0.4]} />
    </group>
  );
}

// The right wall, with the staff doorway you come and go through.
function StaffDoor() {
  const x = ROOM.halfWidth + 0.1;
  const { z, width } = STAFF_DOOR;
  const back = ROOM.back;
  const near = 1.8;
  const before = z - width / 2 - back;
  const after = near - (z + width / 2);
  return (
    <group>
      <Box p={[x, 2.6, back + before / 2]} s={[0.2, 5.2, before]} c={wood.wall} t="plaster" />
      <Box p={[x, 2.6, near - after / 2]} s={[0.2, 5.2, after]} c={wood.wall} t="plaster" />
      <Box p={[x, 4.2, z]} s={[0.2, 2, width]} c={wood.wall} t="plaster" />
      {/* frame, and daylight beyond */}
      {[-1, 1].map((side) => (
        <Box key={side} p={[x - 0.05, 1.6, z + side * (width / 2 + 0.06)]} s={[0.24, 3.2, 0.14]} c={wood.dark} shadow={false} />
      ))}
      <Box p={[x - 0.05, 3.25, z]} s={[0.24, 0.14, width + 0.26]} c={wood.dark} shadow={false} />
      <mesh geometry={box} material={glow("#cfe9c4", 0.8)} position={[x + 0.35, 1.6, z]} scale={[0.05, 3.2, width]} />
    </group>
  );
}

function CuckooClock({ position }: { position: V3 }) {
  const pendulum = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (pendulum.current) pendulum.current.rotation.z = Math.sin(clock.elapsedTime * 2.4) * 0.3;
  });
  return (
    <group position={position}>
      <Box p={[0, 0, 0]} s={[0.9, 0.9, 0.3]} c="#6b3f24" t="planks" />
      <mesh geometry={cone} material={toon("#4a2c1a")} position={[0, 0.65, 0]} rotation-y={Math.PI / 4} scale={[0.75, 0.45, 0.32]} />
      <mesh geometry={cyl} material={toon("#f6efe2", { surface: null })} position={[0, -0.05, 0.16]} rotation-x={Math.PI / 2} scale={[0.28, 0.04, 0.28]} />
      <Box p={[0, 0.3, 0.16]} s={[0.2, 0.16, 0.04]} c="#2b1d14" shadow={false} />
      <group ref={pendulum} position={[0, -0.45, 0.1]}>
        <mesh geometry={cyl} material={toon("#d9a53a")} position={[0, -0.4, 0]} scale={[0.02, 0.8, 0.02]} />
        <mesh geometry={cyl} material={toon("#d9a53a")} position={[0, -0.8, 0]} rotation-x={Math.PI / 2} scale={[0.1, 0.03, 0.1]} />
      </group>
    </group>
  );
}

function Counter() {
  const length = COUNTER.to - COUNTER.from;
  const mid = (COUNTER.to + COUNTER.from) / 2;
  return (
    <group position={[mid, 0, COUNTER.z]}>
      <Box p={[0, COUNTER.height / 2, 0]} s={[length, COUNTER.height, COUNTER.depth]} c={wood.counter} t="planks" />
      <Box p={[0, COUNTER.height + 0.05, 0]} s={[length + 0.2, 0.1, COUNTER.depth + 0.2]} c={wood.top} t="grain" />
      {/* a glass case of cakes and pretzels at the end, for show */}
      <group position={[-length / 2 + 0.7, COUNTER.height + 0.1, 0]}>
        <mesh geometry={box} material={toon("#dff2fb", { surface: null, transparent: true, opacity: 0.45 })} position={[0, 0.3, 0]} scale={[1, 0.6, 0.7]} />
        <mesh geometry={torus} material={toon("#a0582a")} position={[-0.2, 0.12, 0]} rotation-x={-Math.PI / 2} scale={0.16} />
        <mesh geometry={cyl} material={toon("#5a2e1c")} position={[0.22, 0.12, 0]} scale={[0.2, 0.18, 0.2]} />
        <mesh geometry={sphere} material={toon("#c0392b", { surface: null })} position={[0.22, 0.26, 0]} scale={0.05} />
      </group>
    </group>
  );
}

// ---------- Stations ----------

function Station({ slug, x }: { slug: string; x: number }) {
  const item = cafeItem(shiftSetup()!.cafe, slug)!;
  const { hover, handlers } = useHover();
  return (
    <group position={[x, 0, STATION_Z]} onClick={click(() => grab(slug))} {...handlers}>
      <Box p={[0, 0.5, 0]} s={[1.5, 1, 0.9]} c={wood.counter} t="planks" />
      <Box p={[0, 1.04, 0]} s={[1.6, 0.08, 1]} c={wood.top} />
      <group position={[0, 1.08, 0]} scale={hover ? 1.08 : 1}>
        <StationProp icon={item.icon} />
      </group>
      {hover ? <mesh geometry={cyl} material={glow("#ffe9a8", 1.1)} position={[0, 0.02, 0.9]} scale={[0.7, 0.02, 0.4]} /> : null}
    </group>
  );
}

function StationProp({ icon }: { icon: CafeIcon }) {
  switch (icon) {
    case "coffee":
      return (
        <group>
          <Box p={[0, 0.45, -0.1]} s={[0.9, 0.9, 0.55]} c="#b23a2e" />
          <Box p={[0, 0.95, -0.1]} s={[0.95, 0.1, 0.6]} c="#d8d8d8" />
          <Box p={[0, 0.6, 0.22]} s={[0.4, 0.12, 0.2]} c="#8a8f94" />
          <mesh geometry={cyl} material={toon("#ffffff", { surface: null })} position={[0, 0.12, 0.25]} scale={[0.12, 0.2, 0.12]} />
          <mesh geometry={cyl} material={toon("#6b4a2f", { surface: null })} position={[0, 0.22, 0.25]} scale={[0.1, 0.02, 0.1]} />
          {[-0.32, 0.32].map((cx) => (
            <mesh key={cx} geometry={cyl} material={toon("#ffffff", { surface: null })} position={[cx, 1.05, -0.05]} scale={[0.09, 0.14, 0.09]} />
          ))}
        </group>
      );
    case "tea":
      return (
        <group>
          <mesh geometry={sphere} material={toon("#3f7d4f", { surface: null })} position={[0, 0.3, 0]} scale={[0.32, 0.27, 0.32]} castShadow />
          <mesh geometry={cyl} material={toon("#3f7d4f", { surface: null })} position={[0.36, 0.34, 0]} rotation-z={-0.9} scale={[0.05, 0.3, 0.05]} />
          <mesh geometry={sphere} material={toon("#f6efe2", { surface: null })} position={[0, 0.58, 0]} scale={0.08} />
          {[-0.45, 0.45].map((tx, i) => (
            <Box key={tx} p={[tx, 0.2, -0.25]} s={[0.22, 0.4, 0.22]} c={["#c0392b", "#e8b04a"][i]} />
          ))}
        </group>
      );
    case "juice":
      return (
        <group>
          <mesh geometry={cyl} material={toon("#f7a531", { surface: null, transparent: true, opacity: 0.85 })} position={[0, 0.4, -0.05]} scale={[0.28, 0.8, 0.28]} castShadow />
          <mesh geometry={cyl} material={toon("#d8d8d8")} position={[0, 0.84, -0.05]} scale={[0.3, 0.08, 0.3]} />
          {[
            [-0.45, 0.1],
            [-0.32, 0.25],
            [0.42, 0.18],
          ].map(([ox, oz]) => (
            <mesh key={ox} geometry={sphere} material={toon("#f39c12", { surface: null })} position={[ox, 0.12, oz]} scale={0.12} />
          ))}
        </group>
      );
    case "milk":
      return (
        <group>
          <mesh geometry={cyl} material={toon("#f4f6f8", { surface: null })} position={[0, 0.35, 0]} scale={[0.26, 0.7, 0.26]} castShadow />
          <mesh geometry={cyl} material={toon("#3f7fd1", { surface: null })} position={[0, 0.4, 0]} scale={[0.27, 0.12, 0.27]} />
          <mesh geometry={cyl} material={toon("#d8d8d8")} position={[0, 0.76, 0]} scale={[0.17, 0.12, 0.17]} />
          <mesh geometry={cyl} material={toon("#ffffff", { surface: null })} position={[0.45, 0.14, 0.15]} scale={[0.1, 0.28, 0.1]} />
        </group>
      );
    case "water":
      return (
        <group>
          <mesh geometry={cyl} material={toon("#8fd0f0", { surface: null, transparent: true, opacity: 0.7 })} position={[0, 0.35, 0]} scale={[0.25, 0.7, 0.25]} castShadow />
          <mesh geometry={cone} material={toon("#8fd0f0", { surface: null, transparent: true, opacity: 0.7 })} position={[0, 0.8, 0]} scale={[0.25, 0.2, 0.25]} />
          <mesh geometry={sphere} material={toon("#ffd35c", { surface: null })} position={[0.45, 0.1, 0.1]} scale={0.1} />
          <mesh geometry={cyl} material={toon("#dff2fb", { surface: null, transparent: true, opacity: 0.6 })} position={[-0.42, 0.14, 0.15]} scale={[0.1, 0.28, 0.1]} />
        </group>
      );
    default:
      return (
        <group>
          <mesh geometry={cyl} material={toon("#c79a45", { surface: "planks" })} position={[0, 0.15, 0]} scale={[0.45, 0.3, 0.45]} />
          <HeldItem icon={icon} position={[0, 0.35, 0]} />
        </group>
      );
  }
}

// ---------- Kitchen and bin ----------

function Kitchen({ setup }: { setup: ShiftSetup }) {
  const host = setup.host;
  const hostId = host.id;
  const anim = useMemo(() => (): CharacterAnim => ({ speed: 0, talking: runtime.speaking === hostId, emote: emoteOf(hostId) }), [hostId]);
  const { hover, handlers } = useHover();
  const rot = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    // The host turns to you while you're at the hatch, back to the oven otherwise.
    const p = jobPlayer.walker;
    const near = Math.hypot(p.x - HOST.x, p.z - HOST.z) < 3;
    const desired = near ? Math.atan2(p.x - HOST.x, p.z - HOST.z) : 0.5;
    if (rot.current) rot.current.rotation.y = THREE.MathUtils.damp(rot.current.rotation.y, desired, 6, delta);
  });
  return (
    <group>
      {/* a tiled oven in the corner, glowing */}
      <group position={[-6.7, 0, -4.1]}>
        <Box p={[0, 1.1, 0]} s={[1.4, 2.2, 1.4]} c="#3f7d6a" t="stone" />
        <Box p={[0, 2.3, 0]} s={[1.5, 0.2, 1.5]} c="#2f5f50" />
        <mesh geometry={box} material={glow("#ff8a3c", 1.6)} position={[0.4, 0.75, 0.71]} scale={[0.6, 0.45, 0.02]} />
        <mesh geometry={cyl} material={toon("#80827c")} position={[0, 3.6, 0]} scale={[0.25, 2.6, 0.25]} />
      </group>
      {/* the pass: a little counter where the host hands things over */}
      <group position={[-5.3, 0, -2.6]} onClick={click(goToKitchen)} {...handlers}>
        <Box p={[0, 0.5, 0]} s={[0.8, 1, 1.6]} c={wood.counter} t="planks" />
        <Box p={[0, 1.04, 0]} s={[0.9, 0.08, 1.7]} c={wood.top} />
        <HeldItem icon="pretzel" position={[0, 1.15, -0.45]} />
        <HeldItem icon={setup.rush.kitchen.includes("kuchen") ? "cake" : "bun"} position={[0, 1.15, 0.4]} />
        {hover ? <mesh geometry={cyl} material={glow("#ffe9a8", 1.1)} position={[0.6, 0.02, 0]} scale={[0.4, 0.02, 0.9]} /> : null}
      </group>
      <group position={[HOST.x, 0, HOST.z]} onClick={click(goToKitchen)} {...pointer}>
        <group ref={rot} rotation-y={0.5}>
          <Character look={host.look} getAnim={anim} seed={2} />
        </group>
      </group>
    </group>
  );
}

function Trash() {
  const { hover, handlers } = useHover();
  return (
    <group position={[TRASH.x, 0, TRASH.z]} onClick={click(emptyTray)} {...handlers} scale={hover ? 1.08 : 1}>
      <mesh geometry={cyl} material={toon("#80827c")} position={[0, 0.4, 0]} scale={[0.32, 0.8, 0.32]} castShadow />
      <mesh geometry={cyl} material={toon("#5f6266")} position={[0, 0.84, 0]} scale={[0.36, 0.08, 0.36]} />
    </group>
  );
}

// ---------- People ----------

// You, behind the counter, carrying the tray.
function Tray() {
  const tray = useShift((s) => s.tray);
  if (!tray.length) return null;
  return (
    <group>
      <Box p={[0, 0, 0]} s={[0.95, 0.05, 0.6]} c="#c79a45" t="planks" />
      {tray.map((slug, i) => {
        const item = cafeItem(shiftSetup()!.cafe, slug);
        return item ? <HeldItem key={`${slug}-${i}`} icon={item.icon} position={[-0.3 + (i % 3) * 0.3, 0.03 + Math.floor(i / 3) * 0.02, -0.12 + Math.floor(i / 3) * 0.24]} small /> : null;
      })}
    </group>
  );
}

// Little 3D versions of what's on the menu, for the tray and the pass.
function HeldItem({ icon, position, small = false }: { icon: CafeIcon; position: V3; small?: boolean }) {
  const s = small ? 0.75 : 1;
  const cup = (liquid: string, rim = "#ffffff") => (
    <>
      <mesh geometry={cyl} material={toon(rim, { surface: null })} position={[0, 0.1, 0]} scale={[0.09, 0.2, 0.09]} />
      <mesh geometry={cyl} material={toon(liquid, { surface: null })} position={[0, 0.2, 0]} scale={[0.08, 0.02, 0.08]} />
    </>
  );
  return (
    <group position={position} scale={s}>
      {icon === "coffee" ? cup("#6b4a2f") : null}
      {icon === "tea" ? cup("#c79a45", "#e8f4ea") : null}
      {icon === "juice" ? cup("#f7a531", "#fff4d6") : null}
      {icon === "milk" ? cup("#ffffff", "#dfe9f3") : null}
      {icon === "water" ? cup("#8fd0f0", "#dff2fb") : null}
      {icon === "pretzel" ? <mesh geometry={torus} material={toon("#a0582a")} position={[0, 0.06, 0]} rotation-x={-Math.PI / 2} scale={0.14} /> : null}
      {icon === "cake" ? (
        <>
          <mesh geometry={cyl} material={toon("#5a2e1c")} position={[0, 0.08, 0]} scale={[0.13, 0.16, 0.13]} />
          <mesh geometry={cyl} material={toon("#fff4ea", { surface: null })} position={[0, 0.17, 0]} scale={[0.135, 0.03, 0.135]} />
          <mesh geometry={sphere} material={toon("#c0392b", { surface: null })} position={[0, 0.21, 0]} scale={0.035} />
        </>
      ) : null}
      {icon === "bun" ? <mesh geometry={sphere} material={toon("#d9954b")} position={[0, 0.07, 0]} scale={[0.14, 0.08, 0.14]} /> : null}
    </group>
  );
}

function Guests() {
  const customers = useShift((s) => s.customers);
  return (
    <>
      {customers.map((c) => (
        <Guest key={c.id} customer={c} />
      ))}
    </>
  );
}

function Guest({ customer }: { customer: Customer }) {
  const group = useRef<THREE.Group>(null);
  const anim = useMemo(
    () => (): CharacterAnim => {
      const guest = shiftRuntime.guests.get(customer.id);
      const s = getShift().customers.find((c) => c.id === customer.id)?.status;
      return {
        speed: guest?.path.length ? guest.speed : 0,
        talking: false,
        emote: s === "happy" && guest?.path.length ? undefined : s === "happy" ? "happy" : s === "angry" ? "think" : undefined,
      };
    },
    [customer.id],
  );
  useFrame((_, delta) => {
    const guest = shiftRuntime.guests.get(customer.id);
    if (!guest || !group.current) return;
    group.current.position.set(guest.x, 0, guest.z);
    const diff = THREE.MathUtils.euclideanModulo(guest.rot - group.current.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    group.current.rotation.y += diff * Math.min(1, delta * 8);
  });
  const start = shiftRuntime.guests.get(customer.id);
  return (
    <group ref={group} position={[start?.x ?? 0, 0, start?.z ?? 0]} onClick={click(() => serve(getShift().customers.find((c) => c.id === customer.id) ?? customer))} {...pointer}>
      <Character look={customer.look} getAnim={anim} seed={customer.id * 1.7} />
    </group>
  );
}

// ---------- Camera ----------

const VIEW = { position: new THREE.Vector3(0.3, 8.3, 7.9), target: new THREE.Vector3(0, 0.6, -1) };

// Just beside a guest's head, for their speech bubble.
export function guestHead(id: number): [number, number, number] | null {
  const guest = shiftRuntime.guests.get(id);
  return guest ? [guest.x + 0.35, 2.3, guest.z] : null;
}

export const HOST_HEAD: V3 = [HOST.x, 2.75, HOST.z];
