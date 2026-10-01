"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { outfitOf, useWearRecord } from "@/components/wardrobe/store";
import { lookOf } from "@/lib/game/wardrobe";
import { runtime } from "../store";
import { Character, type CharacterAnim } from "../world/character";
import { jobPlayer, stepPlayer } from "./walk";

// 3D pieces every job's room shares: clicking things, you walking about with
// whatever you're carrying, and a fixed diorama camera.

export const click = (action: () => void) => (e: ThreeEvent<MouseEvent>) => {
  if (e.delta > 6) return;
  e.stopPropagation();
  action();
};

export const pointer = {
  onPointerOver: (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
  },
  onPointerOut: () => {
    document.body.style.cursor = "";
  },
};

export function useHover() {
  const [hover, setHover] = useState(false);
  return {
    hover,
    handlers: {
      onPointerOver: (e: ThreeEvent<PointerEvent>) => {
        pointer.onPointerOver(e);
        setHover(true);
      },
      onPointerOut: () => {
        pointer.onPointerOut();
        setHover(false);
      },
    },
  };
}

export function emoteOf(who: string) {
  const e = runtime.emote[who];
  return e && e.until > performance.now() ? e.kind : undefined;
}

// You, in your own clothes, carrying whatever the job hands you (children sit at your hands).
export function JobPlayer({ children }: { children?: ReactNode }) {
  const wardrobe = useWearRecord();
  const look = useMemo(() => lookOf(outfitOf(wardrobe)), [wardrobe]);
  const group = useRef<THREE.Group>(null);
  const anim = useMemo(() => (): CharacterAnim => ({ speed: jobPlayer.walker.speed, talking: runtime.speaking === "player", emote: emoteOf("player") }), []);
  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const p = jobPlayer.walker;
    // Arrow keys and WASD work too; the camera looks straight in, so up is away.
    const k = runtime.keys;
    const ix = (k.has("d") || k.has("arrowright") ? 1 : 0) - (k.has("a") || k.has("arrowleft") ? 1 : 0);
    const iz = (k.has("s") || k.has("arrowdown") ? 1 : 0) - (k.has("w") || k.has("arrowup") ? 1 : 0);
    if ((ix || iz) && !jobPlayer.locked) {
      const { bounds } = jobPlayer;
      p.path = [];
      jobPlayer.arrive = null;
      const len = Math.hypot(ix, iz);
      p.x = THREE.MathUtils.clamp(p.x + (ix / len) * 5.2 * delta, bounds.minX, bounds.maxX);
      p.z = THREE.MathUtils.clamp(p.z + (iz / len) * 5.2 * delta, bounds.minZ, bounds.maxZ);
      p.rot = Math.atan2(ix, iz);
      p.speed = 5.2;
    } else {
      stepPlayer(delta);
    }
    if (group.current) {
      group.current.position.set(p.x, 0, p.z);
      const diff = THREE.MathUtils.euclideanModulo(p.rot - group.current.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
      group.current.rotation.y += diff * Math.min(1, delta * 12);
    }
  });
  return (
    <group ref={group}>
      <Character look={look} getAnim={anim} seed={0.3} />
      <mesh rotation-x={-Math.PI / 2} position-y={0.03}>
        <circleGeometry args={[0.45, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      {children ? <group position={[0, 1.02, 0.55]}>{children}</group> : null}
    </group>
  );
}

// A fixed diorama view that swoops in from above when the room opens.
export function JobCamera({ position, target }: { position: THREE.Vector3; target: THREE.Vector3 }) {
  const { camera } = useThree();
  const look = useRef(target.clone().add(new THREE.Vector3(0, 2, 0)));
  const at = useRef(new THREE.Vector3(0, 16, 16));
  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    at.current.lerp(position, 1 - Math.exp(-3 * delta));
    look.current.lerp(target, 1 - Math.exp(-3 * delta));
    camera.position.copy(at.current);
    camera.lookAt(look.current);
    if (camera instanceof THREE.PerspectiveCamera && camera.view?.enabled) camera.clearViewOffset();
  });
  return null;
}
