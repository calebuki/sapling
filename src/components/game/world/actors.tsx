"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { discoveries } from "@/lib/game/discoveries";
import { villagers, type CharacterLook, type Villager, type VillagerId } from "@/lib/game/villagers";
import { groundAt, resolveMove, spawn, type Collider } from "@/lib/game/world";
import { interact } from "../actions";
import { sound } from "../audio/sfx";
import { getGame, runtime, setGame, useGame, type Interactable } from "../store";
import { Character, type CharacterAnim } from "./character";
import { glow } from "./materials";

export const outfits: CharacterLook[] = [
  { skin: "#f1c7a5", hair: "#5b3a24", hairStyle: "beanie", shirt: "#3f7fd1", pants: "#2c3e50", accent: "#ff6b6b", hat: "beanie" },
  { skin: "#c68a62", hair: "#2b1d14", hairStyle: "beanie", shirt: "#27ae60", pants: "#34495e", accent: "#f7c948", hat: "beanie" },
  { skin: "#8a5a3c", hair: "#1c1410", hairStyle: "beanie", shirt: "#e67e22", pants: "#2c3e50", accent: "#6c5ce7", hat: "beanie" },
  { skin: "#f6d7c0", hair: "#c0392b", hairStyle: "beanie", shirt: "#9b59b6", pants: "#3d3d3d", accent: "#00b894", hat: "beanie" },
];

const villagerColliders: Collider[] = villagers.map((v) => ({ x: v.position[0], z: v.position[1], r: 0.5 }));
const lookTarget = new THREE.Vector3();

function emoteFor(who: VillagerId | "player") {
  const e = runtime.emote[who];
  return e && e.until > performance.now() ? e.kind : undefined;
}

export function Player() {
  const outfit = useGame((s) => s.save.outfit);
  const group = useRef<THREE.Group>(null);
  const velocity = useRef(new THREE.Vector2());
  const stepDistance = useRef(0);
  const look = outfits[outfit % outfits.length];

  useEffect(() => {
    runtime.player.x = spawn.x;
    runtime.player.z = spawn.z;
    runtime.player.rot = spawn.facing;
  }, []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const game = getGame();
    const p = runtime.player;
    const free = game.phase === "explore" && !game.overlay;
    let ix = 0;
    let iz = 0;
    if (free) {
      const k = runtime.keys;
      const f = (k.has("w") || k.has("arrowup") ? 1 : 0) - (k.has("s") || k.has("arrowdown") ? 1 : 0);
      const r = (k.has("d") || k.has("arrowright") ? 1 : 0) - (k.has("a") || k.has("arrowleft") ? 1 : 0);
      if (f || r) {
        runtime.walkTarget = null;
        const yaw = runtime.cameraYaw;
        ix = -Math.sin(yaw) * f + Math.cos(yaw) * r;
        iz = -Math.cos(yaw) * f - Math.sin(yaw) * r;
      } else if (runtime.walkTarget) {
        const target = runtime.walkTarget;
        const dx = target.x - p.x;
        const dz = target.z - p.z;
        const d = Math.hypot(dx, dz);
        const arrive = target.then ? 2.1 : 0.25;
        if (d < arrive) {
          runtime.walkTarget = null;
          if (target.then) interact(target.then);
        } else {
          ix = dx / d;
          iz = dz / d;
        }
      }
    } else if (game.phase !== "dialogue") {
      runtime.walkTarget = null;
    }
    const length = Math.hypot(ix, iz);
    if (length > 1) {
      ix /= length;
      iz /= length;
    }
    const maxSpeed = runtime.keys.has("shift") ? 7.2 : 4.4;
    velocity.current.x = THREE.MathUtils.damp(velocity.current.x, ix * maxSpeed, 12, delta);
    velocity.current.y = THREE.MathUtils.damp(velocity.current.y, iz * maxSpeed, 12, delta);
    const speed = velocity.current.length();
    if (speed > 0.05) {
      const [nx, nz] = resolveMove(p.x, p.z, p.x + velocity.current.x * delta, p.z + velocity.current.y * delta, villagerColliders);
      const moved = Math.hypot(nx - p.x, nz - p.z);
      p.x = nx;
      p.z = nz;
      stepDistance.current += moved;
      if (stepDistance.current > (maxSpeed > 5 ? 1.4 : 1.05)) {
        stepDistance.current = 0;
        sound.play("step");
      }
      if (moved > 0.001) {
        const desired = Math.atan2(velocity.current.x, velocity.current.y);
        const diff = THREE.MathUtils.euclideanModulo(desired - p.rot + Math.PI, Math.PI * 2) - Math.PI;
        p.rot += diff * Math.min(1, delta * 12);
      }
    }
    // In conversation, turn to face whoever is talking.
    if (game.phase === "dialogue" && game.talkingTo) {
      const v = villagers.find((x) => x.id === game.talkingTo)!;
      const desired = Math.atan2(v.position[0] - p.x, v.position[1] - p.z);
      const diff = THREE.MathUtils.euclideanModulo(desired - p.rot + Math.PI, Math.PI * 2) - Math.PI;
      p.rot += diff * Math.min(1, delta * 6);
    }
    p.speed = speed;
    p.y = THREE.MathUtils.damp(p.y, groundAt(p.x, p.z), 18, delta);
    if (group.current) {
      group.current.position.set(p.x, p.y, p.z);
      group.current.rotation.y = p.rot;
    }
    scanNearby();
  });

  const anim = useMemo(
    () => (): CharacterAnim => ({ speed: runtime.player.speed, talking: runtime.speaking === "player", emote: emoteFor("player") }),
    [],
  );

  return (
    <group ref={group}>
      <Character look={look} getAnim={anim} seed={0.3} />
      <mesh rotation-x={-Math.PI / 2} position-y={0.03}>
        <circleGeometry args={[0.45, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  );
}

let lastNearbyKey = "";
function scanNearby() {
  const game = getGame();
  if (game.phase !== "explore") {
    if (lastNearbyKey) {
      lastNearbyKey = "";
      setGame({ nearby: null });
    }
    return;
  }
  const p = runtime.player;
  let best: Interactable | null = null;
  let bestDistance = Infinity;
  for (const v of villagers) {
    const d = Math.hypot(v.position[0] - p.x, v.position[1] - p.z);
    if (d < 3.1 && d < bestDistance) {
      best = { kind: "villager", id: v.id };
      bestDistance = d;
    }
  }
  for (const item of discoveries) {
    const d = Math.hypot(item.x - p.x, item.z - p.z) - (item.prop === "none" ? 0.8 : 0);
    if (d < 2.7 && d + 0.4 < bestDistance) {
      best = { kind: "discovery", id: item.id };
      bestDistance = d + 0.4;
    }
  }
  const key = best ? `${best.kind}:${best.id}` : "";
  if (key !== lastNearbyKey) {
    lastNearbyKey = key;
    setGame({ nearby: best });
  }
}

export function Villagers({ goal }: { goal: VillagerId | null }) {
  return (
    <>
      {villagers.map((v, i) => (
        <VillagerActor key={v.id} villager={v} seed={i + 1} isGoal={goal === v.id} />
      ))}
    </>
  );
}

function VillagerActor({ villager, seed, isGoal }: { villager: Villager; seed: number; isGoal: boolean }) {
  const group = useRef<THREE.Group>(null);
  const marker = useRef<THREE.Group>(null);
  const [x, z] = villager.position;
  const y = groundAt(x, z);
  const rot = useRef(villager.facing);
  const talkingTo = useGame((s) => s.talkingTo);

  useFrame((state, delta) => {
    const p = runtime.player;
    const d = Math.hypot(p.x - x, p.z - z);
    const engaged = talkingTo === villager.id;
    const desired = d < 7 || engaged ? Math.atan2(p.x - x, p.z - z) : villager.facing;
    const diff = THREE.MathUtils.euclideanModulo(desired - rot.current + Math.PI, Math.PI * 2) - Math.PI;
    rot.current += diff * Math.min(1, delta * 4);
    if (group.current) group.current.rotation.y = rot.current;
    if (marker.current) {
      const t = state.clock.elapsedTime;
      marker.current.visible = isGoal && !engaged;
      marker.current.position.y = 3.35 + Math.abs(Math.sin(t * 3)) * 0.3;
      marker.current.rotation.y = t * 2;
    }
  });

  const anim = useMemo(
    () => (): CharacterAnim => {
      lookTarget.set(runtime.player.x, runtime.player.y + 1.3, runtime.player.z);
      const d = Math.hypot(runtime.player.x - x, runtime.player.z - z);
      return {
        speed: 0,
        talking: runtime.speaking === villager.id,
        emote: emoteFor(villager.id) ?? (d < 5 && d > 3.2 && getGame().phase === "explore" ? "wave" : undefined),
        lookAt: d < 9 ? lookTarget : null,
      };
    },
    [villager.id, x, z],
  );

  return (
    <group position={[x, y, z]}>
      <group
        ref={group}
        onClick={(e) => {
          if (e.delta > 6 || getGame().phase !== "explore") return;
          e.stopPropagation();
          runtime.walkTarget = { x, z, then: { kind: "villager", id: villager.id } };
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <Character look={villager.look} getAnim={anim} seed={seed} />
      </group>
      <group ref={marker}>
        <mesh material={glow("#ffc93c", 2.2)} position={[0, 0.28, 0]} scale={[0.11, 0.3, 0.11]}>
          <capsuleGeometry args={[1, 1, 4, 10]} />
        </mesh>
        <mesh material={glow("#ffc93c", 2.2)} position={[0, -0.28, 0]} scale={0.12}>
          <sphereGeometry args={[1, 12, 10]} />
        </mesh>
      </group>
    </group>
  );
}

// Third-person follow camera with drag-to-orbit and scroll-to-zoom.
export function CameraRig() {
  const { camera, gl } = useThree();
  const target = useRef(new THREE.Vector3(0, 2, 20));
  const position = useRef(new THREE.Vector3(60, 40, 60));
  const drag = useRef<{ x: number; moved: number } | null>(null);
  const arrivalStart = useRef<number | null>(null);

  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      drag.current = { x: e.clientX, moved: 0 };
    };
    const move = (e: PointerEvent) => {
      if (!drag.current || !(e.buttons & 1 || e.buttons & 2)) return;
      const dx = e.clientX - drag.current.x;
      drag.current.x = e.clientX;
      drag.current.moved += Math.abs(dx);
      if (drag.current.moved > 4 && getGame().phase === "explore") runtime.cameraYaw -= dx * 0.006;
    };
    const up = () => {
      drag.current = null;
    };
    const wheel = (e: WheelEvent) => {
      if (getGame().phase !== "explore") return;
      runtime.cameraDistance = THREE.MathUtils.clamp(runtime.cameraDistance + e.deltaY * 0.012, 7, 26);
    };
    const menu = (e: Event) => e.preventDefault();
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    el.addEventListener("wheel", wheel, { passive: true });
    el.addEventListener("contextmenu", menu);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("contextmenu", menu);
    };
  }, [gl]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const game = getGame();
    const t = state.clock.elapsedTime;
    const p = runtime.player;
    const wantTarget = new THREE.Vector3();
    const wantPosition = new THREE.Vector3();
    let lambda = 4;

    if (game.phase === "title") {
      const a = t * 0.05;
      wantTarget.set(0, 2, 4);
      wantPosition.set(Math.sin(a) * 58, 26, Math.cos(a) * 58);
      lambda = 1.2;
      arrivalStart.current = null;
    } else if (game.phase === "dialogue" && game.talkingTo) {
      // Over the player's shoulder onto the villager's face, framed above the dialogue panel.
      const v = villagers.find((x) => x.id === game.talkingTo)!;
      const [vx, vz] = v.position;
      const vy = groundAt(vx, vz);
      const toPlayer = new THREE.Vector3(p.x - vx, 0, p.z - vz).normalize();
      const side = new THREE.Vector3(toPlayer.z, 0, -toPlayer.x);
      if (side.dot(position.current.clone().sub(new THREE.Vector3(vx, vy, vz))) < 0) side.negate();
      wantTarget.set(vx, vy + 0.55, vz).addScaledVector(toPlayer, 0.9);
      wantPosition.set(vx, vy + 3.1, vz).addScaledVector(toPlayer, 6.8).addScaledVector(side, 3.4);
      lambda = 3;
    } else {
      if (game.phase === "arrival" && arrivalStart.current === null) arrivalStart.current = t;
      const pitch = 0.58;
      const d = runtime.cameraDistance;
      wantTarget.set(p.x, p.y + 1.3, p.z);
      wantPosition.set(
        p.x + Math.sin(runtime.cameraYaw) * d * Math.cos(pitch),
        p.y + 1.3 + d * Math.sin(pitch),
        p.z + Math.cos(runtime.cameraYaw) * d * Math.cos(pitch),
      );
      lambda = game.phase === "arrival" ? 1.4 : 5;
    }
    const floor = groundAt(wantPosition.x, wantPosition.z) + 1.2;
    if (wantPosition.y < floor) wantPosition.y = floor;
    position.current.x = THREE.MathUtils.damp(position.current.x, wantPosition.x, lambda, delta);
    position.current.y = THREE.MathUtils.damp(position.current.y, wantPosition.y, lambda, delta);
    position.current.z = THREE.MathUtils.damp(position.current.z, wantPosition.z, lambda, delta);
    target.current.x = THREE.MathUtils.damp(target.current.x, wantTarget.x, lambda * 1.3, delta);
    target.current.y = THREE.MathUtils.damp(target.current.y, wantTarget.y, lambda * 1.3, delta);
    target.current.z = THREE.MathUtils.damp(target.current.z, wantTarget.z, lambda * 1.3, delta);
    camera.position.copy(position.current);
    camera.lookAt(target.current);
  });
  return null;
}

// Gulls circling over the water and butterflies over the meadows.
export function Wildlife() {
  const gulls = useRef<THREE.Group>(null);
  const butterflies = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    gulls.current?.children.forEach((g, i) => {
      const a = t * (0.18 + i * 0.03) + i * 2.1;
      const r = 20 + i * 9;
      g.position.set(Math.cos(a) * r, 13 + i * 2 + Math.sin(t + i) * 1.2, Math.sin(a) * r + 8);
      g.rotation.y = -a;
      const flap = Math.sin(t * 5 + i) * 0.5;
      g.children[1].rotation.z = flap;
      g.children[2].rotation.z = -flap;
    });
    butterflies.current?.children.forEach((b, i) => {
      const cx = [-5, 8, -12, 3, 12][i];
      const cz = [10, 8, -6, -8, -12][i];
      b.position.set(cx + Math.sin(t * 0.7 + i) * 2.5, groundAt(cx, cz) + 1 + Math.sin(t * 2.3 + i) * 0.4, cz + Math.cos(t * 0.5 + i * 2) * 2.5);
      b.rotation.y = t * 0.7 + i;
      const flap = Math.sin(t * 18 + i) * 0.9;
      b.children[0].rotation.z = flap;
      b.children[1].rotation.z = -flap;
    });
  });
  const white = useMemo(() => new THREE.MeshToonMaterial({ color: "#ffffff" }), []);
  const grey = useMemo(() => new THREE.MeshToonMaterial({ color: "#c8d0d6" }), []);
  return (
    <>
      <group ref={gulls}>
        {[0, 1, 2].map((i) => (
          <group key={i}>
            <mesh material={white} scale={[0.25, 0.22, 0.6]}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
            <group>
              <mesh material={grey} position={[0.7, 0, 0]} scale={[0.7, 0.04, 0.25]}>
                <boxGeometry />
              </mesh>
            </group>
            <group>
              <mesh material={grey} position={[-0.7, 0, 0]} scale={[0.7, 0.04, 0.25]}>
                <boxGeometry />
              </mesh>
            </group>
          </group>
        ))}
      </group>
      <group ref={butterflies}>
        {["#ffd35c", "#ffffff", "#ff9ecb", "#8fd3ff", "#ffb347"].map((c) => (
          <group key={c}>
            <mesh position={[0.09, 0, 0]} scale={[0.12, 0.01, 0.1]}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshToonMaterial color={c} />
            </mesh>
            <mesh position={[-0.09, 0, 0]} scale={[0.12, 0.01, 0.1]}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshToonMaterial color={c} />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
}

// Keyboard: movement keys live in runtime.keys; E / Space / Enter talks.
export function useKeyboard() {
  useEffect(() => {
    const typing = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
    };
    const down = (e: KeyboardEvent) => {
      if (typing(e)) return;
      const key = e.key.toLowerCase();
      const game = getGame();
      if ((key === "e" || key === " " || key === "enter") && game.phase === "explore" && !game.overlay && game.nearby) {
        e.preventDefault();
        interact(game.nearby);
        return;
      }
      if (key === "escape" && game.overlay) {
        setGame({ overlay: null });
        return;
      }
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"].includes(key)) {
        if (key.startsWith("arrow")) e.preventDefault();
        runtime.keys.add(key);
      }
    };
    const up = (e: KeyboardEvent) => runtime.keys.delete(e.key.toLowerCase());
    const blur = () => runtime.keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
}

