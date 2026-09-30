"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useFrame } from "@react-three/fiber";
import type { CharacterLook } from "@/lib/game/villagers";
import { toon, toonRamp } from "./materials";

export type CharacterAnim = {
  speed: number;
  talking: boolean;
  emote?: "happy" | "think" | "wave";
  // World-space point the head should turn toward, if any.
  lookAt?: THREE.Vector3 | null;
};

// Chunky, big-headed villagers: a rounded-cube head about as tall as the rest
// of the body, stubby limbs, and a pixel-art face that swaps expressions like
// a sprite sheet.
const g = {
  round: new RoundedBoxGeometry(1, 1, 1, 2, 0.18),
  box: new THREE.BoxGeometry(1, 1, 1),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 10),
  sphere: new THREE.SphereGeometry(1, 8, 6),
  face: new THREE.PlaneGeometry(1, 1),
};

const flat = (color: string) => toon(color, { surface: null });

// ---- Faces -----------------------------------------------------------------

const FACE_W = 16;
const FACE_H = 13;
const FRAMES = ["neutral", "blink", "happy", "talk", "think"] as const;
type Frame = (typeof FRAMES)[number];

const ink = "#2b2233";
const shine = "#ffffff";
const blush = "#f39a9a";
const lip = "#7a3030";
const tongue = "#e0707a";

let sheet: HTMLCanvasElement | null = null;
function faceSheet() {
  if (sheet) return sheet;
  sheet = document.createElement("canvas");
  sheet.width = FACE_W * FRAMES.length;
  sheet.height = FACE_H;
  const ctx = sheet.getContext("2d")!;
  FRAMES.forEach((frame, i) => {
    const px = (x: number, y: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(i * FACE_W + x, y, 1, 1);
    };
    const eye = (x: number, lift = 0) => {
      for (let y = 4 - lift; y <= 6 - lift; y++) {
        px(x, y, ink);
        px(x + 1, y, ink);
      }
      px(x + 1, 4 - lift, shine);
    };
    const closed = (x: number) => {
      px(x - 1, 6, ink);
      px(x, 6, ink);
      px(x + 1, 6, ink);
      px(x + 2, 6, ink);
    };
    const arch = (x: number) => {
      px(x - 1, 6, ink);
      px(x, 5, ink);
      px(x + 1, 5, ink);
      px(x + 2, 6, ink);
    };
    // Rosy cheeks on every face.
    for (const x of [1, 2, 13, 14]) px(x, 8, blush);
    if (frame === "blink") [3, 11].forEach(closed);
    else if (frame === "happy") [3, 11].forEach(arch);
    else if (frame === "think") [3, 11].forEach((x) => eye(x, 1));
    else [3, 11].forEach((x) => eye(x));

    if (frame === "talk") {
      for (const x of [7, 8]) px(x, 9, lip);
      for (const x of [6, 7, 8, 9]) px(x, 10, lip);
      for (const x of [7, 8]) px(x, 11, tongue);
    } else if (frame === "happy") {
      for (const x of [6, 7, 8, 9]) px(x, 9, lip);
      for (const x of [7, 8]) px(x, 10, tongue);
    } else if (frame === "think") {
      px(8, 10, lip);
      px(9, 10, lip);
    } else {
      px(6, 9, lip);
      px(7, 10, lip);
      px(8, 10, lip);
      px(9, 9, lip);
    }
  });
  return sheet;
}

function useFace() {
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(faceSheet());
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.repeat.set(1 / FRAMES.length, 1);
    return t;
  }, []);
  const material = useMemo(
    () => new THREE.MeshToonMaterial({ map: texture, gradientMap: toonRamp(), alphaTest: 0.5, transparent: false }),
    [texture],
  );
  useEffect(
    () => () => {
      texture.dispose();
      material.dispose();
    },
    [texture, material],
  );
  return material;
}

function showFrame(mesh: THREE.Mesh | null, frame: Frame) {
  const map = (mesh?.material as THREE.MeshToonMaterial | undefined)?.map;
  if (map) map.offset.x = FRAMES.indexOf(frame) / FRAMES.length;
}

// ---- Body ------------------------------------------------------------------

export function Character({
  look,
  getAnim,
  seed = 0,
}: {
  look: CharacterLook;
  getAnim: () => CharacterAnim;
  seed?: number;
}) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const walkPhase = useRef(seed * 3.1);
  const blinkAt = useRef(2 + seed);
  const temp = useMemo(() => ({ v: new THREE.Vector3(), q: new THREE.Quaternion(), e: new THREE.Euler() }), []);
  const faceMaterial = useFace();
  const face = useRef<THREE.Mesh>(null);

  const m = useMemo(
    () => ({
      skin: flat(look.skin),
      hair: flat(look.hair),
      shirt: flat(look.shirt),
      pants: flat(look.pants),
      accent: flat(look.accent),
      shoe: flat("#4a3a30"),
      apron: flat(look.apron ?? look.accent),
    }),
    [look],
  );

  useFrame((state, delta) => {
    const anim = getAnim();
    const t = state.clock.elapsedTime + seed * 10;
    const moving = Math.min(1, anim.speed / 4);
    walkPhase.current += delta * (6 + anim.speed * 2.2) * (moving > 0.05 ? 1 : 0);
    const w = walkPhase.current;
    const swing = Math.sin(w) * 0.7 * moving;
    if (legL.current && legR.current) {
      legL.current.rotation.x = THREE.MathUtils.lerp(legL.current.rotation.x, swing, 0.4);
      legR.current.rotation.x = THREE.MathUtils.lerp(legR.current.rotation.x, -swing, 0.4);
    }
    let armLz = -0.1 - Math.sin(t * 1.6) * 0.03;
    let armRz = 0.1 + Math.sin(t * 1.6) * 0.03;
    let armLx = -swing * 0.9;
    let armRx = swing * 0.9;
    let hop = Math.abs(Math.sin(w)) * 0.06 * moving;
    let headTilt = Math.sin(t * 0.7) * 0.04;
    let headNod = 0;

    if (anim.emote === "happy") {
      hop = Math.abs(Math.sin(t * 9)) * 0.22;
      armLz = -2.5 - Math.sin(t * 18) * 0.2;
      armRz = 2.5 + Math.sin(t * 18) * 0.2;
      armLx = 0;
      armRx = 0;
    } else if (anim.emote === "wave") {
      armRz = 2.6 + Math.sin(t * 12) * 0.35;
      armRx = 0;
      headTilt = 0.12;
    } else if (anim.emote === "think") {
      armRz = 0.4;
      armRx = -1.9;
      headTilt = 0.22;
      headNod = -0.06;
    }
    if (anim.talking) headNod += Math.sin(t * 7) * 0.05;

    if (armL.current && armR.current) {
      armL.current.rotation.z = THREE.MathUtils.lerp(armL.current.rotation.z, armLz, 0.25);
      armR.current.rotation.z = THREE.MathUtils.lerp(armR.current.rotation.z, armRz, 0.25);
      armL.current.rotation.x = THREE.MathUtils.lerp(armL.current.rotation.x, armLx, 0.3);
      armR.current.rotation.x = THREE.MathUtils.lerp(armR.current.rotation.x, armRx, 0.3);
    }
    if (body.current) {
      body.current.position.y = THREE.MathUtils.lerp(body.current.position.y, hop, 0.5);
      body.current.rotation.x = THREE.MathUtils.lerp(body.current.rotation.x, moving * 0.1, 0.2);
      body.current.scale.y = 1 + Math.sin(t * 2.2) * 0.015 * (1 - moving);
    }
    if (head.current) {
      let yaw = 0;
      if (anim.lookAt && root.current) {
        head.current.parent!.getWorldPosition(temp.v);
        const worldYaw = Math.atan2(anim.lookAt.x - temp.v.x, anim.lookAt.z - temp.v.z);
        temp.e.setFromQuaternion(root.current.getWorldQuaternion(temp.q), "YXZ");
        yaw = THREE.MathUtils.euclideanModulo(worldYaw - temp.e.y + Math.PI, Math.PI * 2) - Math.PI;
        yaw = THREE.MathUtils.clamp(yaw, -1.1, 1.1);
      }
      head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, yaw, 0.12);
      head.current.rotation.z = THREE.MathUtils.lerp(head.current.rotation.z, headTilt, 0.1);
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, headNod, 0.3);
    }

    // Pick this frame's face.
    if (t > blinkAt.current + 0.13) blinkAt.current = t + 2.2 + Math.random() * 3.5;
    const blinking = t > blinkAt.current;
    const frame: Frame =
      anim.emote === "happy" ? "happy" : anim.emote === "think" ? "think" : anim.talking && Math.sin(t * 16) > -0.2 ? "talk" : blinking ? "blink" : "neutral";
    showFrame(face.current, frame);
  });

  const scale = look.scale ?? 1;
  return (
    <group ref={root} scale={scale}>
      <group ref={body}>
        {/* Legs */}
        {[
          [legL, -0.12],
          [legR, 0.12],
        ].map(([ref, x], i) => (
          <group key={i} ref={ref as React.RefObject<THREE.Group>} position={[x as number, 0.34, 0]}>
            <mesh geometry={g.box} material={m.pants} position={[0, -0.13, 0]} scale={[0.16, 0.26, 0.18]} castShadow />
            <mesh geometry={g.round} material={m.shoe} position={[0, -0.29, 0.03]} scale={[0.19, 0.1, 0.27]} castShadow />
          </group>
        ))}
        {/* Torso */}
        <mesh geometry={g.round} material={m.shirt} position={[0, 0.55, 0]} scale={[0.52, 0.46, 0.38]} castShadow />
        {look.apron ? <mesh geometry={g.box} material={m.apron} position={[0, 0.5, 0.19]} scale={[0.42, 0.36, 0.02]} /> : null}
        <mesh geometry={g.round} material={m.accent} position={[0, 0.78, 0]} scale={[0.46, 0.1, 0.36]} />
        {/* Arms */}
        {[
          [armL, -0.32],
          [armR, 0.32],
        ].map(([ref, x], i) => (
          <group key={i} ref={ref as React.RefObject<THREE.Group>} position={[x as number, 0.72, 0]}>
            <mesh geometry={g.round} material={m.shirt} position={[0, -0.12, 0]} scale={[0.14, 0.3, 0.15]} castShadow />
            <mesh geometry={g.round} material={m.skin} position={[0, -0.3, 0]} scale={[0.13, 0.11, 0.13]} castShadow />
          </group>
        ))}
        {/* Head */}
        <group position={[0, 0.8, 0]}>
          <group ref={head}>
            <mesh geometry={g.round} material={m.skin} position={[0, 0.38, 0]} scale={[0.78, 0.72, 0.68]} castShadow />
            <mesh ref={face} geometry={g.face} material={faceMaterial} position={[0, 0.34, 0.343]} scale={[0.62, 0.5, 1]} />
            {look.beard ? <mesh geometry={g.round} material={m.hair} position={[0, 0.1, 0.33]} scale={[0.52, 0.16, 0.12]} /> : null}
            <Hair look={look} hair={m.hair} accent={m.accent} />
            <Hat look={look} />
          </group>
        </group>
      </group>
    </group>
  );
}

function Hair({ look, hair, accent }: { look: CharacterLook; hair: THREE.Material; accent: THREE.Material }) {
  const back = <mesh geometry={g.round} material={hair} position={[0, 0.42, -0.26]} scale={[0.84, 0.58, 0.24]} castShadow />;
  const sides = [-0.41, 0.41].map((x) => (
    <mesh key={x} geometry={g.box} material={hair} position={[x, 0.5, 0.02]} scale={[0.06, 0.34, 0.5]} />
  ));
  const cap = (
    <>
      <mesh geometry={g.round} material={hair} position={[0, 0.68, -0.03]} scale={[0.86, 0.26, 0.76]} castShadow />
      <mesh geometry={g.box} material={hair} position={[-0.08, 0.61, 0.32]} scale={[0.66, 0.12, 0.08]} />
      <mesh geometry={g.box} material={hair} position={[0.28, 0.57, 0.32]} scale={[0.16, 0.18, 0.08]} />
    </>
  );
  switch (look.hairStyle) {
    case "braid":
      return (
        <group>
          {cap}
          {back}
          {sides}
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} geometry={g.round} material={hair} position={[0.16, 0.24 - i * 0.14, -0.38 - i * 0.02]} scale={0.15 - i * 0.012} castShadow />
          ))}
          <mesh geometry={g.box} material={accent} position={[0.16, -0.24, -0.44]} scale={0.08} />
        </group>
      );
    case "bob":
      return (
        <group>
          {cap}
          <mesh geometry={g.round} material={hair} position={[0, 0.34, -0.18]} scale={[0.9, 0.62, 0.44]} castShadow />
          {[-0.43, 0.43].map((x) => (
            <mesh key={x} geometry={g.round} material={hair} position={[x, 0.36, 0.08]} scale={[0.1, 0.6, 0.46]} />
          ))}
        </group>
      );
    case "bun":
      return (
        <group>
          {cap}
          {back}
          {sides}
          <mesh geometry={g.round} material={hair} position={[0, 0.86, -0.2]} scale={0.3} castShadow />
        </group>
      );
    case "beanie":
      return (
        <group>
          {back}
          {sides}
        </group>
      );
    default:
      return (
        <group>
          {cap}
          {back}
          {sides}
        </group>
      );
  }
}

function Hat({ look }: { look: CharacterLook }) {
  switch (look.hat) {
    case "chef":
      return (
        <group position={[0, 0.78, -0.02]}>
          <mesh geometry={g.cylinder} material={flat("#ffffff")} position={[0, 0.1, 0]} scale={[0.34, 0.22, 0.32]} castShadow />
          <mesh geometry={g.round} material={flat("#ffffff")} position={[0, 0.28, 0]} scale={[0.62, 0.24, 0.56]} castShadow />
        </group>
      );
    case "conductor":
      return (
        <group position={[0, 0.76, 0]}>
          <mesh geometry={g.round} material={flat("#1c3553")} position={[0, 0.06, -0.02]} scale={[0.86, 0.2, 0.78]} castShadow />
          <mesh geometry={g.box} material={flat("#f2c230")} position={[0, 0, 0]} scale={[0.87, 0.05, 0.79]} />
          <mesh geometry={g.box} material={flat("#101c2c")} position={[0, -0.05, 0.44]} scale={[0.56, 0.04, 0.2]} />
        </group>
      );
    case "sunhat":
      return (
        <group position={[0, 0.76, -0.02]} rotation-x={-0.1}>
          <mesh geometry={g.cylinder} material={flat("#e8cf8a")} scale={[0.74, 0.04, 0.74]} castShadow />
          <mesh geometry={g.round} material={flat("#e8cf8a")} position={[0, 0.12, 0]} scale={[0.66, 0.24, 0.6]} castShadow />
          <mesh geometry={g.box} material={flat(look.accent)} position={[0, 0.05, 0]} scale={[0.67, 0.06, 0.61]} />
        </group>
      );
    case "beanie":
      return (
        <group position={[0, 0.6, -0.02]}>
          <mesh geometry={g.round} material={flat(look.accent)} position={[0, 0.1, 0]} scale={[0.86, 0.36, 0.76]} castShadow />
          <mesh geometry={g.box} material={flat(look.hair)} position={[0, -0.06, 0.01]} scale={[0.88, 0.1, 0.78]} />
          <mesh geometry={g.round} material={flat("#ffffff")} position={[0, 0.34, 0]} scale={0.18} castShadow />
        </group>
      );
    case "cap":
      return (
        <group position={[0, 0.74, 0]} rotation-x={-0.08}>
          <mesh geometry={g.round} material={flat(look.accent)} position={[0, 0.04, -0.02]} scale={[0.86, 0.22, 0.76]} castShadow />
          <mesh geometry={g.box} material={flat(look.accent)} position={[0, -0.04, 0.44]} scale={[0.5, 0.04, 0.26]} />
          <mesh geometry={g.box} material={flat("#3f6f4a")} position={[0.4, 0.16, -0.1]} scale={[0.04, 0.26, 0.06]} />
        </group>
      );
    // The Black Forest Bollenhut: a straw hat crowned with red woollen pom-poms.
    case "bollenhut":
      return (
        <group position={[0, 0.76, -0.02]} rotation-x={-0.06}>
          <mesh geometry={g.cylinder} material={flat("#f3ead8")} scale={[0.6, 0.04, 0.6]} castShadow />
          <mesh geometry={g.cylinder} material={flat("#f3ead8")} position={[0, 0.07, 0]} scale={[0.4, 0.1, 0.4]} castShadow />
          {[
            [0, 0.26, 0.16],
            [-0.22, 0.2, 0.12],
            [0.22, 0.2, 0.12],
            [-0.16, 0.22, -0.16],
            [0.16, 0.22, -0.16],
            [0, 0.26, -0.2],
            [-0.34, 0.12, -0.02],
            [0.34, 0.12, -0.02],
          ].map(([x, y, z], i) => (
            <mesh key={i} geometry={g.round} material={flat("#d42a2a")} position={[x, y, z]} scale={0.2} castShadow />
          ))}
        </group>
      );
    default:
      return null;
  }
}
