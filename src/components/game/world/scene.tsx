"use client";

import { Suspense } from "react";
import * as THREE from "three";
import { advance, Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import type { VillagerId } from "@/lib/game/villagers";
import { LabelProjector } from "../world-labels";
import { CameraRig, Player, Villagers, Wildlife } from "./actors";
import { Discoverables } from "./discoverables";
import { Clouds, FOG, Sky, SUN_DIRECTION, Terrain, Water } from "./environment";
import { GreatTree, Vegetation } from "./vegetation";
import { Cafe, Cottages, Dock, Garden, Lookout, Square, Station } from "./village";

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
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
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
  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={quality === "high" ? [1, 2] : [1, 1.25]}
      gl={{ antialias: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping }}
      camera={{ fov: 42, near: 0.1, far: 700, position: [60, 40, 60] }}
      className="game-canvas"
    >
      <color attach="background" args={[FOG.color]} />
      <fog attach="fog" args={[FOG.color, FOG.near, FOG.far]} />
      <Suspense fallback={null}>
        <Lights />
        <Sky />
        <Clouds />
        <Water />
        <Terrain />
        <Vegetation />
        <Dock />
        <Square />
        <GreatTree stage={treeStage} />
        <Cafe open={unlocked.bosse} />
        <Station open={unlocked.stina} />
        <Garden open={unlocked.astrid} />
        <Lookout />
        <Cottages />
        <Discoverables />
        <Villagers goal={goal} />
        <Player />
        <Wildlife />
        <CameraRig />
        <LabelProjector />
      </Suspense>
      <EffectComposer multisampling={0} enableNormalPass={false}>
        {quality === "high" ? <N8AO halfRes aoRadius={1.6} intensity={1.6} distanceFalloff={0.6} color="#2a3a4a" /> : <></>}
        <Bloom mipmapBlur luminanceThreshold={0.92} luminanceSmoothing={0.2} intensity={0.55} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.28} darkness={0.42} />
        <SMAA />
      </EffectComposer>
    </Canvas>
  );
}
