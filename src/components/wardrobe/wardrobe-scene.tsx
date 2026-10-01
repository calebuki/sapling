"use client";

import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Character, type CharacterAnim } from "@/components/game/world/character";
import { glow, toon } from "@/components/game/world/materials";
import { PixelOutline, PixelPalette, usePixelDpr } from "@/components/game/world/pixel-effect";
import type { CharacterLook } from "@/lib/game/villagers";

// A corner of a cosy room: plank floor, a window, a mirror and an open
// wardrobe, with the player on a round rug in the middle. Drag to turn them;
// the camera leans in for hats and faces.

export type Focus = "body" | "head";

const views: Record<Focus, { position: THREE.Vector3; target: THREE.Vector3 }> = {
  body: { position: new THREE.Vector3(0, 1.45, 5.4), target: new THREE.Vector3(0, 0.85, 0) },
  head: { position: new THREE.Vector3(0, 1.6, 3.9), target: new THREE.Vector3(0, 1.18, 0) },
};

export type Spin = { yaw: number; velocity: number; dragging: boolean; lastInput: number };

export function WardrobeScene({ look, focus, hopAt, spinRef }: { look: CharacterLook; focus: Focus; hopAt: number; spinRef: RefObject<Spin> }) {
  const dpr = usePixelDpr();
  return (
    <Canvas
      dpr={dpr}
      shadows={{ type: THREE.BasicShadowMap }}
      gl={{ antialias: false, toneMapping: THREE.NoToneMapping }}
      camera={{ fov: 32, near: 0.1, far: 60, position: views.body.position.toArray() }}
      className="wardrobe-canvas"
    >
      <color attach="background" args={["#e9d6b8"]} />
      <hemisphereLight args={["#fff4e0", "#b48a62", 1.1]} />
      <ambientLight intensity={0.35} color="#ffe9cc" />
      <directionalLight
        position={[-3.5, 5, 3]}
        intensity={1.6}
        color="#fff1d6"
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <Room />
      <Player look={look} hopAt={hopAt} spinRef={spinRef} />
      <CameraRig focus={focus} />
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <PixelOutline />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <PixelPalette />
      </EffectComposer>
    </Canvas>
  );
}

function CameraRig({ focus }: { focus: Focus }) {
  const camera = useThree((s) => s.camera);
  const target = useRef(views.body.target.clone());
  useFrame((_, delta) => {
    const view = views[focus];
    const k = 1 - Math.exp(-delta * 6);
    camera.position.lerp(view.position, k);
    target.current.lerp(view.target, k);
    camera.lookAt(target.current);
  });
  return null;
}

function Player({ look, hopAt, spinRef }: { look: CharacterLook; hopAt: number; spinRef: RefObject<Spin> }) {
  const group = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera);
  const anim = useRef<CharacterAnim>({ speed: 0, talking: false, lookAt: null });
  useFrame((state, delta) => {
    const now = performance.now();
    const spin = spinRef.current;
    if (!spin.dragging) {
      spin.yaw += spin.velocity * delta;
      spin.velocity *= Math.exp(-delta * 4);
      // After a moment alone they turn back to face you, at a slight angle.
      if (now - spin.lastInput > 2200 && Math.abs(spin.velocity) < 0.2) {
        const rest = -0.35 + Math.sin(state.clock.elapsedTime * 0.4) * 0.12;
        const nearest = rest + Math.round((spin.yaw - rest) / (Math.PI * 2)) * Math.PI * 2;
        spin.yaw = THREE.MathUtils.lerp(spin.yaw, nearest, 1 - Math.exp(-delta * 2.5));
      }
    }
    if (group.current) group.current.rotation.y = spin.yaw;
    anim.current.emote = now - hopAt < 900 ? "happy" : undefined;
    // Look at the camera while roughly facing it.
    anim.current.lookAt = camera.position;
  });
  return (
    <group ref={group}>
      <Character look={look} getAnim={() => anim.current} />
    </group>
  );
}

// ---- The room ----------------------------------------------------------------

const wood = "#9a6a44";
const woodDark = "#6b4830";

function Room() {
  const m = useMemo(
    () => ({
      floor: toon("#c79a6a", { surface: "planks" }),
      wall: toon("#f3e6cf", { surface: "plaster" }),
      skirting: toon("#e6cfa8", { surface: null }),
      wood: toon(wood),
      woodDark: toon(woodDark),
      rug: toon("#c8574a", { surface: "fabric" }),
      rugEdge: toon("#f2c35a", { surface: "fabric" }),
      sky: glow("#bfe3f5", 1.1),
      glass: toon("#cfe6ee", { surface: null }),
      pot: toon("#c06a43", { surface: null }),
      leaf: toon("#5c9a47", { surface: "leaves" }),
      brass: toon("#e2b84a", { surface: null }),
    }),
    [],
  );
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const cylinder = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 24), []);
  return (
    <group>
      {/* Floor and walls */}
      <mesh geometry={box} material={m.floor} position={[0, -0.05, 0]} scale={[12, 0.1, 10]} receiveShadow />
      <mesh geometry={box} material={m.wall} position={[0, 2.4, -2.6]} scale={[12, 5, 0.1]} receiveShadow />
      <mesh geometry={box} material={m.wall} position={[-3.6, 2.4, 0]} scale={[0.1, 5, 10]} receiveShadow />
      <mesh geometry={box} material={m.skirting} position={[0, 0.08, -2.53]} scale={[12, 0.16, 0.06]} />
      <mesh geometry={box} material={m.skirting} position={[-3.53, 0.08, 0]} scale={[0.06, 0.16, 10]} />

      {/* Window on the back wall */}
      <group position={[-0.9, 1.85, -2.54]}>
        <mesh geometry={box} material={m.sky} scale={[1.1, 1.2, 0.02]} />
        <mesh geometry={box} material={m.wood} position={[0, 0, 0.03]} scale={[1.24, 0.08, 0.06]} />
        <mesh geometry={box} material={m.wood} position={[0, 0, 0.03]} scale={[0.08, 1.34, 0.06]} />
        <mesh geometry={box} material={m.wood} position={[0, 0.64, 0.03]} scale={[1.24, 0.08, 0.06]} />
        <mesh geometry={box} material={m.wood} position={[0, -0.64, 0.05]} scale={[1.36, 0.08, 0.16]} />
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} geometry={box} material={m.wood} position={[x, 0, 0.03]} scale={[0.08, 1.34, 0.06]} />
        ))}
      </group>

      {/* Rug */}
      <mesh geometry={cylinder} material={m.rugEdge} position={[0, 0.01, 0]} scale={[1.15, 0.02, 1.0]} receiveShadow />
      <mesh geometry={cylinder} material={m.rug} position={[0, 0.02, 0]} scale={[1.0, 0.02, 0.86]} receiveShadow />

      <Wardrobe m={m} box={box} />
      <Mirror m={m} box={box} />

      {/* A sapling in a pot by the window */}
      <group position={[-1.05, 0, -2.25]}>
        <mesh geometry={cylinder} material={m.pot} position={[0, 0.22, 0]} scale={[0.22, 0.44, 0.22]} castShadow />
        <mesh geometry={box} material={m.leaf} position={[-0.12, 0.62, 0]} rotation-z={0.6} scale={[0.34, 0.14, 0.2]} castShadow />
        <mesh geometry={box} material={m.leaf} position={[0.13, 0.7, 0.02]} rotation-z={-0.6} scale={[0.36, 0.15, 0.2]} castShadow />
        <mesh geometry={box} material={m.leaf} position={[0, 0.84, -0.04]} rotation-z={0.1} scale={[0.16, 0.3, 0.16]} castShadow />
      </group>
    </group>
  );
}

type RoomMaterials = Record<"wood" | "woodDark" | "brass" | "glass", THREE.Material>;

// Doors swung open, a rail of hanging clothes and a drawer below.
function Wardrobe({ m, box }: { m: RoomMaterials; box: THREE.BufferGeometry }) {
  const hanging = ["#3f7fd1", "#f7c948", "#c0392b", "#27ae60", "#9b59b6"];
  return (
    <group position={[1.55, 0, -1.85]} rotation-y={-0.3}>
      <mesh geometry={box} material={m.woodDark} position={[0, 1.2, -0.3]} scale={[1.6, 2.4, 0.06]} />
      <mesh geometry={box} material={m.wood} position={[-0.78, 1.2, 0]} scale={[0.08, 2.4, 0.66]} castShadow />
      <mesh geometry={box} material={m.wood} position={[0.78, 1.2, 0]} scale={[0.08, 2.4, 0.66]} castShadow />
      <mesh geometry={box} material={m.wood} position={[0, 2.44, 0]} scale={[1.74, 0.1, 0.72]} castShadow />
      <mesh geometry={box} material={m.wood} position={[0, 0.3, 0]} scale={[1.56, 0.6, 0.64]} castShadow />
      <mesh geometry={box} material={m.brass} position={[0, 0.34, 0.33]} scale={[0.24, 0.05, 0.03]} />
      <mesh geometry={box} material={m.brass} position={[0, 2.1, 0]} scale={[1.5, 0.03, 0.03]} />
      {hanging.map((color, i) => (
        <group key={color} position={[-0.56 + i * 0.28, 1.62, 0]} rotation-y={(i % 2 ? 0.25 : -0.2)}>
          <mesh geometry={box} material={m.brass} position={[0, 0.44, 0]} scale={[0.02, 0.1, 0.02]} />
          <mesh geometry={box} material={toon(color, { surface: "fabric" })} scale={[0.08, 0.8, 0.46]} castShadow />
        </group>
      ))}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.8, 1.2, 0.33]} rotation-y={side * 1.9}>
          <mesh geometry={box} material={m.wood} position={[-side * 0.39, 0, 0]} scale={[0.78, 2.3, 0.05]} castShadow />
          <mesh geometry={box} material={m.brass} position={[-side * 0.7, 0, 0.04]} scale={[0.04, 0.16, 0.04]} />
        </group>
      ))}
    </group>
  );
}

function Mirror({ m, box }: { m: RoomMaterials; box: THREE.BufferGeometry }) {
  return (
    <group position={[-1.55, 0, -1.3]} rotation-y={0.5}>
      <mesh geometry={box} material={m.wood} position={[0, 1.05, 0]} scale={[0.82, 1.9, 0.08]} castShadow />
      <mesh geometry={box} material={m.glass} position={[0, 1.08, 0.045]} scale={[0.66, 1.72, 0.02]} />
      <mesh geometry={box} material={m.wood} position={[0, 0.05, 0.2]} scale={[0.7, 0.1, 0.5]} castShadow />
    </group>
  );
}
