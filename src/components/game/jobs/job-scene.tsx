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

// The sun for jobs played outdoors, which bring their own light instead of
// the island's time of day; its shadows cover the whole scene.
export function OutdoorSun({ position, intensity, color }: { position: [number, number, number]; intensity: number; color: string }) {
  return (
    <directionalLight
      position={position}
      intensity={intensity}
      color={color}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0006}
      shadow-normalBias={0.05}
      shadow-camera-left={-22}
      shadow-camera-right={22}
      shadow-camera-top={22}
      shadow-camera-bottom={-22}
      shadow-camera-near={1}
      shadow-camera-far={70}
    />
  );
}

// Where to put the camera so the whole of `box` shows on this screen, looking
// along `direction`, clear of the top bar and anything else along the edges
// (margins in pixels).
export type ViewMargins = { top: number; bottom: number; left: number; right: number };

export function fitView(box: THREE.Box3, direction: THREE.Vector3, screen: { width: number; height: number; fov: number }, margin: ViewMargins) {
  const dir = direction.clone().normalize();
  const forward = dir.clone().negate();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, forward);
  const center = box.getCenter(new THREE.Vector3());
  const corners = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z));
  const tanY = Math.tan(THREE.MathUtils.degToRad(screen.fov) / 2);
  const tanX = tanY * (screen.width / screen.height);
  // The part of the screen (-1..1 each way) the box may use.
  const top = 1 - (2 * margin.top) / screen.height;
  const bottom = -1 + (2 * margin.bottom) / screen.height;
  const left = -1 + (2 * margin.left) / screen.width;
  const rightEdge = 1 - (2 * margin.right) / screen.width;
  // Where the corners land on screen from distance d, the view slid by (sx, sy).
  const project = (d: number, sx: number, sy: number) => {
    const camera = center.clone().addScaledVector(right, sx).addScaledVector(up, sy).addScaledVector(dir, d);
    const p = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
    for (const c of corners) {
      const v = c.clone().sub(camera);
      const z = Math.max(0.01, v.dot(forward));
      const x = v.dot(right) / (z * tanX);
      const y = v.dot(up) / (z * tanY);
      p.x0 = Math.min(p.x0, x);
      p.x1 = Math.max(p.x1, x);
      p.y0 = Math.min(p.y0, y);
      p.y1 = Math.max(p.y1, y);
    }
    return p;
  };
  let distance = 20;
  let sx = 0;
  let sy = 0;
  // Find the nearest distance that fits, then slide the view so it sits
  // between the margins; a few rounds settle both.
  for (let round = 0; round < 4; round++) {
    let near = 1;
    let far = 200;
    for (let i = 0; i < 30; i++) {
      const mid = (near + far) / 2;
      const p = project(mid, sx, sy);
      if (p.x1 - p.x0 <= rightEdge - left && p.y1 - p.y0 <= top - bottom) far = mid;
      else near = mid;
    }
    distance = far;
    const p = project(distance, sx, sy);
    sx += ((p.x0 + p.x1) / 2 - (left + rightEdge) / 2) * distance * tanX;
    sy += ((p.y0 + p.y1) / 2 - (top + bottom) / 2) * distance * tanY;
  }
  const target = center.clone().addScaledVector(right, sx).addScaledVector(up, sy);
  return { position: target.clone().addScaledVector(dir, distance), target };
}

// A diorama camera that keeps the whole of `box` in view on any screen.
export function FitCamera({ box, direction, top = 84, bottom = 36, left = 20, right = 20 }: { box: THREE.Box3; direction: THREE.Vector3 } & Partial<ViewMargins>) {
  const { size, camera } = useThree();
  const fov = camera instanceof THREE.PerspectiveCamera ? camera.fov : 42;
  const view = useMemo(
    () => fitView(box, direction, { width: size.width, height: size.height, fov }, { top, bottom, left, right }),
    [box, direction, size.width, size.height, fov, top, bottom, left, right],
  );
  return <JobCamera position={view.position} target={view.target} />;
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
