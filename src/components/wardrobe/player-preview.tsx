"use client";

import { useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Character, type CharacterAnim } from "@/components/game/world/character";
import { usePixelDpr } from "@/components/game/world/pixel-effect";
import type { CharacterLook } from "@/lib/game/villagers";

// The player standing on the hub: idling, glancing at the pointer and waving
// now and then. Drawn at the island's low resolution so it matches Sapling.

export function PlayerPreviewScene({ look }: { look: CharacterLook }) {
  const dpr = usePixelDpr();
  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: false, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
      camera={{ fov: 30, near: 0.1, far: 20, position: [0, 1.0, 3.9] }}
    >
      <hemisphereLight args={["#fff4e0", "#7aa86a", 1.3]} />
      <directionalLight position={[2, 4, 3]} intensity={1.7} color="#fff1d6" />
      <Idle look={look} />
    </Canvas>
  );
}

function Idle({ look }: { look: CharacterLook }) {
  const group = useRef<THREE.Group>(null);
  const anim = useRef<CharacterAnim>({ speed: 0, talking: false, lookAt: new THREE.Vector3(0, 1.2, 4) });
  const waveAt = useRef(1.5);
  useFrame(({ clock, pointer, camera }) => {
    const t = clock.elapsedTime;
    // Aimed every frame: a resize would otherwise leave the camera looking at the origin.
    camera.lookAt(0, 0.84, 0);
    if (t > waveAt.current + 1.6) waveAt.current = t + 7 + Math.random() * 6;
    anim.current.emote = t > waveAt.current ? "wave" : undefined;
    anim.current.lookAt!.set(pointer.x * 3, 1.2 + pointer.y * 1.5, 4);
    if (group.current) group.current.rotation.y = 0.35 + Math.sin(t * 0.5) * 0.08;
  });
  return (
    <group ref={group}>
      <Character look={look} getAnim={() => anim.current} />
    </group>
  );
}
