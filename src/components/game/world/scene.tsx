"use client";

import { Suspense, useRef } from "react";
import * as THREE from "three";
import { advance, Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import type { VillagerId } from "@/lib/game/villagers";
import { island } from "../island";
import { CafeRoom } from "../jobs/cafe-room";
import { HomeRoom } from "../jobs/home-room";
import type { JobId } from "../store";
import { LabelProjector } from "../world-labels";
import { CameraRig, Player, Villagers, Wildlife } from "./actors";
import { Discoverables } from "./discoverables";
import { CatBa } from "./cat-ba";
import { daylight } from "./daylight";
import { Clouds, FOG, fogColor, Sky, Terrain, Water } from "./environment";
import { setGlowBoost } from "./materials";
import { LillaO } from "./lilla-o";
import { PixelOutline, PixelPalette, usePixelDpr } from "./pixel-effect";
import { Tannenau } from "./tannenau";
import { GreatTree, Vegetation } from "./vegetation";

// Dev-only hook so automated checks can step frames when the tab is throttled.
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  (window as unknown as { __advance: typeof advance }).__advance = advance;
}

export type SceneProps = {
  treeStage: number;
  goal: VillagerId | null;
  unlocked: Record<VillagerId, boolean>;
  quality: "high" | "low";
  // A job swaps the island for that job's room.
  job?: JobId | null;
};

// Lights, fog and the sky colour follow the player's time of day (see ./daylight).
function Lights() {
  const fog = fogColor();
  const start = daylight(fog);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  useFrame(({ scene }) => {
    const light = daylight(fog);
    if (hemi.current) {
      hemi.current.color.copy(light.hemiSky);
      hemi.current.groundColor.copy(light.hemiGround);
      hemi.current.intensity = light.hemiIntensity;
    }
    if (ambient.current) {
      ambient.current.color.copy(light.ambient);
      ambient.current.intensity = light.ambientIntensity;
    }
    if (key.current) {
      key.current.position.copy(light.keyDirection).multiplyScalar(60);
      key.current.color.copy(light.key);
      key.current.intensity = light.keyIntensity;
    }
    if (rim.current) {
      rim.current.color.copy(light.rim);
      rim.current.intensity = light.rimIntensity;
    }
    if (scene.fog) scene.fog.color.copy(light.fog);
    if (scene.background instanceof THREE.Color) scene.background.copy(light.fog);
    setGlowBoost(light.glowBoost);
  });
  const sun = start.keyDirection.clone().multiplyScalar(60);
  return (
    <>
      <hemisphereLight ref={hemi} args={[start.hemiSky, start.hemiGround, start.hemiIntensity]} />
      <ambientLight ref={ambient} intensity={start.ambientIntensity} color={start.ambient} />
      <directionalLight
        ref={key}
        position={[sun.x, sun.y, sun.z]}
        intensity={start.keyIntensity}
        color={start.key}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.06}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={48}
        shadow-camera-bottom={-48}
        shadow-camera-near={1}
        shadow-camera-far={160}
      />
      {/* warm rim light from the opposite side for that storybook glow */}
      <directionalLight ref={rim} position={[40, 18, -40]} intensity={start.rimIntensity} color={start.rim} />
    </>
  );
}

// Everything outside: sky, water, the island, its people and you.
function Island({ treeStage, goal, unlocked }: Pick<SceneProps, "treeStage" | "goal" | "unlocked">) {
  const { scenery, flora } = island();
  return (
    <>
      <Sky />
      <Clouds />
      <Water />
      <Terrain />
      <Vegetation flora={flora} />
      <GreatTree stage={treeStage} />
      {scenery === "lilla-o" ? <LillaO unlocked={unlocked} /> : scenery === "cat-ba" ? <CatBa unlocked={unlocked} /> : <Tannenau unlocked={unlocked} />}
      <Discoverables />
      <Villagers goal={goal} />
      <Player />
      <Wildlife />
      <CameraRig />
      <LabelProjector />
    </>
  );
}

export function Scene({ treeStage, goal, unlocked, quality, job = null }: SceneProps) {
  const fog = daylight(fogColor()).fog.getStyle();
  const dpr = usePixelDpr();
  return (
    <Canvas
      shadows={{ type: THREE.BasicShadowMap }}
      dpr={dpr}
      gl={{ antialias: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping }}
      camera={{ fov: 42, near: 0.1, far: 700, position: [60, 40, 60] }}
      className="game-canvas"
    >
      <color attach="background" args={[fog]} />
      <fog attach="fog" args={[fog, FOG.near, FOG.far]} />
      <Suspense fallback={null}>
        <Lights />
        {job === "cafe" ? <CafeRoom /> : job === "home" ? <HomeRoom /> : <Island treeStage={treeStage} goal={goal} unlocked={unlocked} />}
      </Suspense>
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <PixelOutline />
        {quality === "high" ? <Bloom luminanceThreshold={0.95} luminanceSmoothing={0.1} intensity={0.35} /> : <></>}
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.3} darkness={0.35} />
        <PixelPalette />
      </EffectComposer>
    </Canvas>
  );
}
