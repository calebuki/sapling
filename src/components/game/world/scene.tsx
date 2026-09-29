"use client";

import { Suspense } from "react";
import * as THREE from "three";
import { advance, Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import type { VillagerId } from "@/lib/game/villagers";
import { island } from "../island";
import { LabelProjector } from "../world-labels";
import { CameraRig, Player, Villagers, Wildlife } from "./actors";
import { Discoverables } from "./discoverables";
import { Clouds, FOG, fogColor, Sky, SUN_DIRECTION, Terrain, Water } from "./environment";
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
};

function Lights() {
  const sun = SUN_DIRECTION.clone().multiplyScalar(60);
  return (
    <>
      <hemisphereLight args={["#cfe8ff", "#6f8f4f", 1.35]} />
      <ambientLight intensity={0.25} color="#fff4e0" />
      <directionalLight
        position={[sun.x, sun.y, sun.z]}
        intensity={2.6}
        color="#fff0d6"
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
      <directionalLight position={[40, 18, -40]} intensity={0.55} color="#ffc9a3" />
    </>
  );
}

export function Scene({ treeStage, goal, unlocked, quality }: SceneProps) {
  const { scenery, flora } = island();
  const fog = fogColor();
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
        <Sky />
        <Clouds />
        <Water />
        <Terrain />
        <Vegetation flora={flora} />
        <GreatTree stage={treeStage} />
        {scenery === "lilla-o" ? <LillaO unlocked={unlocked} /> : <Tannenau unlocked={unlocked} />}
        <Discoverables />
        <Villagers goal={goal} />
        <Player />
        <Wildlife />
        <CameraRig />
        <LabelProjector />
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
