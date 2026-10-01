"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { BodyPart, HerbColor } from "@/lib/game/clinic";
import { runtime } from "../store";
import { Character, type CharacterAnim } from "../world/character";
import { glow, palette, toon } from "../world/materials";
import { box, Box, cone, cyl, FlowerBox, sphere } from "../world/parts";
import { ShiftProjector } from "./anchors";
import { BODY, CAULDRON, COUNTER_Z, HERB_COLORS, HOST_SPOT, JARS, JUG_X, KETTLE_X, PATIENT_SPOT, ROOM, SUGAR_X, VIEWS } from "./clinic-layout";
import { addHerb, addSugar, addWater, clinicRuntime, clinicSetup, finishBrew, getClinic, point, tickClinic, useClinic, type ClinicSetup } from "./clinic-store";
import { click, emoteOf, JobCamera, JobPlayer, pointer, useHover } from "./job-scene";

// Aylin's surgery as a cutaway: white walls with teal panelling, a cot and a
// height chart in the examination corner, and a cauldron bubbling over a fire
// with jars of coloured herbs on the counter behind it.

const c = { floor: "#c9b28c", wall: "#f4f1ea", panel: "#2f8f8f", wood: "#8a5a36", dark: "#5b3a24", top: "#e9dcc4" };

export function ClinicRoom() {
  const setup = clinicSetup();
  const step = useClinic((s) => s.step);
  useFrame((_, delta) => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __clinic: unknown }).__clinic = { getClinic, point, addHerb, addWater, addSugar, finishBrew };
    tickClinic(Math.min(delta, 0.05));
  });
  if (!setup) return null;
  const view = step === "where" ? VIEWS.exam : VIEWS.room;
  return (
    <group>
      <pointLight position={[0, 4.4, 0]} intensity={16} distance={16} decay={1.6} color="#fff1d6" />
      <ambientLight intensity={0.4} color="#fff1e0" />
      <Room />
      <Counter />
      <Cauldron />
      <Host setup={setup} />
      <Patient />
      <JobPlayer>
        <Potion />
      </JobPlayer>
      <JobCamera position={view.position} target={view.target} />
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
      <Box p={[0, -0.1, (front + back) / 2]} s={[halfWidth * 2, 0.2, depth]} c={c.floor} t="planks" shadow={false} />
      <Box p={[0, -0.6, (front + back) / 2 + 0.2]} s={[halfWidth * 2 + 0.4, 0.8, depth + 0.4]} c={c.dark} shadow={false} />
      <Box p={[0, 2.6, back - 0.1]} s={[halfWidth * 2, 5.2, 0.2]} c={c.wall} t="plaster" />
      <Box p={[0, 0.6, back]} s={[halfWidth * 2, 1.2, 0.06]} c={c.panel} t="siding" shadow={false} />
      <Box p={[-halfWidth - 0.1, 2.6, (back + 1.8) / 2]} s={[0.2, 5.2, 1.8 - back]} c={c.wall} t="plaster" />
      <Box p={[-halfWidth, 0.6, (back + 1.8) / 2]} s={[0.06, 1.2, 1.8 - back]} c={c.panel} t="siding" shadow={false} />
      {/* right wall with the door patients come through */}
      <Box p={[halfWidth + 0.1, 2.6, (back + 1.6) / 2]} s={[0.2, 5.2, 1.6 - back]} c={c.wall} t="plaster" />
      <Box p={[halfWidth + 0.1, 4.25, 2.4]} s={[0.2, 1.9, 1.6]} c={c.wall} t="plaster" />
      <Box p={[halfWidth + 0.06, 1.6, 2.4]} s={[0.1, 3.2, 1.7]} c={c.dark} shadow={false} />
      <mesh geometry={box} material={glow("#cfe9c4", 0.8)} position={[halfWidth + 0.02, 1.6, 2.4]} scale={[0.04, 3.0, 1.4]} />
      {/* the examination corner: a cot, a height chart, a red cross */}
      <group position={[-5.4, 0, -2.8]}>
        <Box p={[0, 0.55, 0]} s={[2.4, 0.15, 1.0]} c="#ffffff" t="fabric" />
        <Box p={[0, 0.68, 0]} s={[2.2, 0.1, 0.9]} c="#cfe6ee" t="fabric" />
        <Box p={[-0.95, 0.85, 0]} s={[0.4, 0.2, 0.8]} c="#ffffff" t="fabric" />
        {[-1.1, 1.1].map((x) => [-0.4, 0.4].map((z) => <Box key={`${x}${z}`} p={[x, 0.25, z]} s={[0.08, 0.5, 0.08]} c="#9aa3a8" />))}
      </group>
      <group position={[-3.6, 2.6, back + 0.04]}>
        <Box p={[0, 0, 0]} s={[1.2, 1.2, 0.05]} c="#ffffff" shadow={false} />
        <Box p={[0, 0, 0.04]} s={[0.8, 0.25, 0.04]} c="#d64545" shadow={false} />
        <Box p={[0, 0, 0.04]} s={[0.25, 0.8, 0.04]} c="#d64545" shadow={false} />
      </group>
      {/* window and plants */}
      <group position={[5.2, 3.0, back + 0.02]}>
        <Box p={[0, 0, 0]} s={[1.8, 1.5, 0.1]} c={c.dark} shadow={false} />
        <mesh geometry={box} material={glow("#ffe2a8", 0.9)} position={[0, 0, 0.04]} scale={[1.5, 1.2, 0.05]} />
        <FlowerBox position={[0, -0.9, 0.2]} />
      </group>
      {/* bundles of herbs drying from a beam */}
      <Box p={[1.5, 4.2, back + 0.5]} s={[6, 0.12, 0.12]} c={c.dark} />
      {(["red", "yellow", "green", "blue", "green", "red"] as HerbColor[]).map((color, i) => (
        <group key={i} position={[-0.8 + i * 0.9, 3.75, back + 0.5]}>
          <mesh geometry={cyl} material={toon(c.dark)} position={[0, 0.25, 0]} scale={[0.015, 0.4, 0.015]} />
          <mesh geometry={cone} material={toon(HERB_COLORS[color], { surface: "leaves" })} rotation-x={Math.PI} scale={[0.18, 0.4, 0.18]} />
        </group>
      ))}
      <mesh geometry={sphere} material={toon(palette.leaf, { surface: "leaves" })} position={[-6.4, 0.8, 3.0]} scale={[0.5, 0.7, 0.5]} castShadow />
      <mesh geometry={cyl} material={toon("#b5541c")} position={[-6.4, 0.25, 3.0]} scale={[0.35, 0.5, 0.35]} />
    </group>
  );
}

// ---------- The counter: herbs, sugar, hot and cold water ----------

function Counter() {
  return (
    <group>
      <Box p={[2, 0.5, COUNTER_Z]} s={[7.6, 1, 0.9]} c={c.wood} t="planks" />
      <Box p={[2, 1.04, COUNTER_Z]} s={[7.7, 0.08, 1]} c={c.top} />
      {(Object.keys(JARS) as HerbColor[]).map((color) => (
        <Clickable key={color} at={[JARS[color], 1.08, COUNTER_Z]} onClick={() => addHerb(color)}>
          <mesh geometry={cyl} material={toon("#dff2fb", { surface: null, transparent: true, opacity: 0.55 })} position={[0, 0.35, 0]} scale={[0.28, 0.7, 0.28]} />
          <mesh geometry={sphere} material={toon(HERB_COLORS[color], { surface: "leaves" })} position={[0, 0.3, 0]} scale={[0.24, 0.26, 0.24]} />
          <mesh geometry={cyl} material={toon(c.dark)} position={[0, 0.74, 0]} scale={[0.3, 0.08, 0.3]} />
        </Clickable>
      ))}
      <Clickable at={[SUGAR_X, 1.08, COUNTER_Z]} onClick={addSugar}>
        <mesh geometry={cyl} material={toon("#3f7fd1", { surface: null })} position={[0, 0.15, 0]} scale={[0.3, 0.3, 0.3]} />
        <mesh geometry={sphere} material={toon("#ffffff", { surface: null })} position={[0, 0.3, 0]} scale={[0.26, 0.1, 0.26]} />
      </Clickable>
      {/* hot water: a kettle on a little stove */}
      <group position={[KETTLE_X, 0, COUNTER_Z]}>
        <Box p={[0, 0.5, 0]} s={[1, 1, 0.9]} c="#2d3436" />
        <mesh geometry={box} material={glow("#ff8a3c", 1.4)} position={[0, 0.4, 0.46]} scale={[0.4, 0.25, 0.02]} />
      </group>
      <Clickable at={[KETTLE_X, 1.0, COUNTER_Z]} onClick={() => addWater("hot")}>
        <mesh geometry={sphere} material={toon("#c0392b", { surface: null })} position={[0, 0.25, 0]} scale={[0.3, 0.25, 0.3]} />
        <mesh geometry={cyl} material={toon("#c0392b", { surface: null })} position={[0.32, 0.32, 0]} rotation-z={-0.9} scale={[0.05, 0.3, 0.05]} />
        <Steam y={0.6} />
      </Clickable>
      {/* cold water: a jug */}
      <Clickable at={[JUG_X, 1.08, COUNTER_Z]} onClick={() => addWater("cold")}>
        <mesh geometry={cyl} material={toon("#8fd0f0", { surface: null, transparent: true, opacity: 0.75 })} position={[0, 0.3, 0]} scale={[0.24, 0.6, 0.24]} />
        <mesh geometry={cyl} material={toon("#dff2fb", { surface: null })} position={[0, 0.62, 0]} scale={[0.2, 0.06, 0.2]} />
      </Clickable>
    </group>
  );
}

function Clickable({ at, onClick, children }: { at: [number, number, number]; onClick: () => void; children: React.ReactNode }) {
  const { hover, handlers } = useHover();
  return (
    <group position={at} onClick={click(onClick)} {...handlers}>
      <group scale={hover ? 1.12 : 1}>{children}</group>
      {hover ? <mesh geometry={cyl} material={glow("#ffe9a8", 1.1)} position={[0, 0.01, 0.35]} scale={[0.36, 0.01, 0.2]} /> : null}
    </group>
  );
}

function Steam({ y }: { y: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    group.current?.children.forEach((child, i) => {
      const t = (clock.elapsedTime * 0.6 + i / 3) % 1;
      child.position.y = y + t * 0.6;
      child.scale.setScalar(0.06 + t * 0.08);
    });
  });
  return (
    <group ref={group}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} geometry={sphere} material={toon("#ffffff", { surface: null, transparent: true, opacity: 0.6 })} position={[0.05 * i, y, 0]} />
      ))}
    </group>
  );
}

// ---------- The cauldron ----------

function Cauldron() {
  const pot = useClinic((s) => s.pot);
  const step = useClinic((s) => s.step);
  const brew = useRef<THREE.Mesh>(null);
  const bubbles = useRef<THREE.Group>(null);
  const { hover, handlers } = useHover();
  // The brew takes the colour of what's in it.
  const color = useMemo(() => {
    const mix = new THREE.Color(0, 0, 0);
    let n = 0;
    for (const [herb, count] of Object.entries(pot.herbs) as Array<[HerbColor, number]>) {
      mix.add(new THREE.Color(HERB_COLORS[herb]).multiplyScalar(count));
      n += count;
    }
    if (!n) return pot.water ? "#8fd0f0" : "#3b2a20";
    return `#${mix.multiplyScalar(1 / n).getHexString()}`;
  }, [pot]);
  const full = Object.values(pot.herbs).some(Boolean) || pot.water !== null || pot.sugar > 0;
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (brew.current) brew.current.position.y = 0.95 + Math.sin(t * 3) * 0.02;
    bubbles.current?.children.forEach((b, i) => {
      const k = (t * 0.8 + i * 0.37) % 1;
      b.position.set(Math.sin(i * 2.1) * 0.35, 0.98 + k * 0.25, Math.cos(i * 2.1) * 0.35);
      b.scale.setScalar(full ? 0.05 + k * 0.05 : 0);
    });
  });
  return (
    <group position={[CAULDRON.x, 0, CAULDRON.z]} onClick={click(() => step === "brew" && finishBrew())} {...handlers}>
      {/* the fire */}
      {[0, 1, 2, 3].map((i) => (
        <Box key={i} p={[Math.cos(i * 1.6) * 0.35, 0.08, Math.sin(i * 1.6) * 0.35]} s={[0.7, 0.12, 0.14]} r={[0, i * 1.6, 0]} c={c.dark} />
      ))}
      <mesh geometry={cone} material={glow("#ff8a3c", 1.8)} position={[0, 0.3, 0]} scale={[0.35, 0.45, 0.35]} />
      <mesh geometry={sphere} material={toon("#2d3436", { surface: null })} position={[0, 0.65, 0]} scale={[0.7, 0.45, 0.7]} castShadow />
      <mesh geometry={cyl} material={toon("#2d3436", { surface: null })} position={[0, 0.92, 0]} scale={[0.6, 0.1, 0.6]} />
      <mesh ref={brew} geometry={cyl} material={toon(color, { surface: null })} position={[0, 0.95, 0]} scale={[0.52, 0.02, 0.52]} />
      <group ref={bubbles}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} geometry={sphere} material={toon(color, { surface: null })} />
        ))}
      </group>
      {hover && step === "brew" ? <mesh geometry={cyl} material={glow("#ffe9a8", 1.1)} position={[0, 0.01, 0]} scale={[0.95, 0.01, 0.95]} /> : null}
    </group>
  );
}

function Potion() {
  const step = useClinic((s) => s.step);
  return step === "carry" ? (
    <group>
      <mesh geometry={sphere} material={toon("#9b59b6", { surface: null, transparent: true, opacity: 0.85 })} position={[0, 0.12, 0]} scale={0.14} />
      <mesh geometry={cyl} material={toon("#dff2fb", { surface: null })} position={[0, 0.3, 0]} scale={[0.05, 0.14, 0.05]} />
      <mesh geometry={cyl} material={toon(c.dark)} position={[0, 0.39, 0]} scale={[0.06, 0.05, 0.06]} />
    </group>
  ) : null;
}

// ---------- People ----------

function Host({ setup }: { setup: ClinicSetup }) {
  const id = setup.host.id;
  const anim = useMemo(() => (): CharacterAnim => ({ speed: 0, talking: runtime.speaking === id, emote: emoteOf(id) }), [id]);
  return (
    <group position={[HOST_SPOT.x, 0, HOST_SPOT.z]} rotation-y={-0.5}>
      <Character look={setup.host.look} getAnim={anim} seed={4} />
    </group>
  );
}

function Patient() {
  const look = useClinic((s) => s.look);
  const step = useClinic((s) => s.step);
  const index = useClinic((s) => s.index);
  const group = useRef<THREE.Group>(null);
  const anim = useMemo(
    () => (): CharacterAnim => {
      const p = clinicRuntime.patient;
      const s = getClinic().step;
      // Held still while you point, so the face lines up with what you click.
      return { speed: p.path.length ? 2.6 : 0, talking: false, emote: s === "leaving" ? "happy" : undefined };
    },
    [],
  );
  useFrame((_, delta) => {
    const p = clinicRuntime.patient;
    if (!group.current) return;
    group.current.position.set(p.x, 0, p.z);
    const diff = THREE.MathUtils.euclideanModulo(p.rot - group.current.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    group.current.rotation.y += diff * Math.min(1, delta * 8);
  });
  return (
    <group ref={group} position={[PATIENT_SPOT.x, 0, 8]}>
      <Character key={index} look={look} getAnim={anim} seed={index + 7} />
      {/* a nose and ears to point at */}
      <mesh geometry={box} material={toon(shade(look.skin), { surface: null })} position={[0, 1.08, 0.37]} scale={[0.08, 0.07, 0.07]} />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={sphere} material={toon(shade(look.skin), { surface: null })} position={[s * 0.47, 1.14, 0]} scale={[0.06, 0.11, 0.09]} />
      ))}
      {step === "where" ? <BodyTargets /> : null}
    </group>
  );
}

function shade(skin: string) {
  return `#${new THREE.Color(skin).multiplyScalar(0.88).getHexString()}`;
}

// Invisible boxes over the body; the one under the mouse glows.
function BodyTargets() {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <>
      {(Object.keys(BODY) as BodyPart[]).flatMap((part) =>
        BODY[part].map((b, i) => {
          const key = `${part}${i}`;
          return (
            <mesh
              key={key}
              geometry={box}
              position={b.at}
              scale={b.size}
              material={hover === key ? glowTarget : hidden}
              onClick={click(() => point(part))}
              onPointerOver={(e) => {
                pointer.onPointerOver(e);
                setHover(key);
              }}
              onPointerOut={() => {
                pointer.onPointerOut();
                setHover((h) => (h === key ? null : h));
              }}
            />
          );
        }),
      )}
    </>
  );
}

const hidden = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
const glowTarget = new THREE.MeshBasicMaterial({ color: "#ffe066", transparent: true, opacity: 0.45, depthWrite: false });

export function patientHead(): [number, number, number] {
  const p = clinicRuntime.patient;
  return [p.x + 0.4, 1.75, p.z];
}

export function hostHeadClinic(): [number, number, number] {
  return [HOST_SPOT.x + 0.35, 2.3, HOST_SPOT.z];
}
