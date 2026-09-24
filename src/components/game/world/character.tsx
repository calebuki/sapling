"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { CharacterLook } from "@/lib/game/villagers";
import { toon } from "./materials";

export type CharacterAnim = {
  speed: number;
  talking: boolean;
  emote?: "happy" | "think" | "wave";
  // World-space point the head should turn toward, if any.
  lookAt?: THREE.Vector3 | null;
};

const g = {
  sphere: new THREE.SphereGeometry(1, 20, 16),
  lowSphere: new THREE.SphereGeometry(1, 12, 10),
  capsule: new THREE.CapsuleGeometry(1, 1, 6, 12),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 18),
  disc: new THREE.CircleGeometry(1, 16),
  cone: new THREE.ConeGeometry(1, 1, 16),
  topHalf: new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
  torus: new THREE.TorusGeometry(1, 0.35, 8, 20),
};

const black = "#1d1d24";

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
  const eyes = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const walkPhase = useRef(seed * 3.1);
  const blinkAt = useRef(2 + seed);
  const temp = useMemo(() => ({ v: new THREE.Vector3(), q: new THREE.Quaternion(), e: new THREE.Euler() }), []);

  const m = useMemo(
    () => ({
      skin: toon(look.skin),
      hair: toon(look.hair),
      shirt: toon(look.shirt),
      pants: toon(look.pants),
      accent: toon(look.accent),
      shoe: toon("#3b2f2a"),
      eye: toon(black),
      white: toon("#ffffff"),
      cheek: toon("#ff9a9a", { transparent: true, opacity: 0.55 }),
      mouth: toon("#6b2b2b"),
      apron: toon(look.apron ?? look.accent),
    }),
    [look],
  );

  useFrame((state, delta) => {
    const anim = getAnim();
    const t = state.clock.elapsedTime + seed * 10;
    const moving = Math.min(1, anim.speed / 4);
    walkPhase.current += delta * (6 + anim.speed * 2.2) * (moving > 0.05 ? 1 : 0);
    const w = walkPhase.current;
    const swing = Math.sin(w) * 0.75 * moving;
    if (legL.current && legR.current) {
      legL.current.rotation.x = THREE.MathUtils.lerp(legL.current.rotation.x, swing, 0.4);
      legR.current.rotation.x = THREE.MathUtils.lerp(legR.current.rotation.x, -swing, 0.4);
    }
    let armLz = -0.12 - Math.sin(t * 1.6) * 0.03;
    let armRz = 0.12 + Math.sin(t * 1.6) * 0.03;
    let armLx = -swing * 0.9;
    let armRx = swing * 0.9;
    let hop = Math.abs(Math.sin(w)) * 0.07 * moving;
    let headTilt = Math.sin(t * 0.7) * 0.04;
    let headNod = 0;

    if (anim.emote === "happy") {
      hop = Math.abs(Math.sin(t * 9)) * 0.28;
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
      headNod = 0.08;
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
      body.current.rotation.x = THREE.MathUtils.lerp(body.current.rotation.x, moving * 0.12, 0.2);
      body.current.scale.y = 1 + Math.sin(t * 2.2) * 0.012 * (1 - moving);
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
    if (eyes.current) {
      if (t > blinkAt.current + 0.13) blinkAt.current = t + 2.2 + Math.random() * 3.5;
      const blinking = t > blinkAt.current;
      const happyEyes = anim.emote === "happy";
      eyes.current.scale.y = THREE.MathUtils.lerp(eyes.current.scale.y, blinking || happyEyes ? 0.15 : 1, 0.6);
    }
    if (mouth.current) {
      const open = anim.talking ? 0.35 + Math.abs(Math.sin(t * 16)) * 0.9 : anim.emote === "happy" ? 1.1 : 0.35;
      mouth.current.scale.y = THREE.MathUtils.lerp(mouth.current.scale.y, open * 0.05, 0.5);
    }
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
          <group key={i} ref={ref as React.RefObject<THREE.Group>} position={[x as number, 0.42, 0]}>
            <mesh geometry={g.capsule} material={m.pants} position={[0, -0.16, 0]} scale={[0.085, 0.12, 0.085]} castShadow />
            <mesh geometry={g.sphere} material={m.shoe} position={[0, -0.36, 0.05]} scale={[0.1, 0.07, 0.15]} castShadow />
          </group>
        ))}
        {/* Torso */}
        <mesh geometry={g.capsule} material={m.shirt} position={[0, 0.72, 0]} scale={[0.25, 0.14, 0.21]} castShadow />
        {look.apron ? (
          <mesh geometry={g.capsule} material={m.apron} position={[0, 0.64, 0.05]} scale={[0.23, 0.12, 0.18]} />
        ) : null}
        <mesh geometry={g.torus} material={m.accent} position={[0, 0.95, 0]} rotation-x={Math.PI / 2} scale={[0.17, 0.17, 0.12]} />
        {/* Arms */}
        {[
          [armL, -0.29, 1],
          [armR, 0.29, -1],
        ].map(([ref, x], i) => (
          <group key={i} ref={ref as React.RefObject<THREE.Group>} position={[x as number, 0.9, 0]}>
            <mesh geometry={g.capsule} material={m.shirt} position={[0, -0.17, 0]} scale={[0.07, 0.12, 0.07]} castShadow />
            <mesh geometry={g.sphere} material={m.skin} position={[0, -0.36, 0]} scale={0.075} castShadow />
          </group>
        ))}
        {/* Head */}
        <group position={[0, 1.08, 0]}>
          <group ref={head}>
            <mesh geometry={g.sphere} material={m.skin} position={[0, 0.3, 0]} scale={[0.37, 0.35, 0.34]} castShadow />
            <group ref={eyes} position={[0, 0.33, 0.3]}>
              {[-0.12, 0.12].map((x) => (
                <group key={x} position={[x, 0, 0]}>
                  <mesh geometry={g.sphere} material={m.eye} scale={[0.045, 0.06, 0.03]} />
                  <mesh geometry={g.lowSphere} material={m.white} position={[0.015, 0.022, 0.022]} scale={0.014} />
                </group>
              ))}
            </group>
            {[-0.2, 0.2].map((x) => (
              <mesh key={x} geometry={g.disc} material={m.cheek} position={[x, 0.22, 0.29]} rotation-y={x * 1.6} scale={0.05} />
            ))}
            <mesh ref={mouth} geometry={g.sphere} material={m.mouth} position={[0, 0.17, 0.315]} scale={[0.05, 0.02, 0.02]} />
            <mesh geometry={g.lowSphere} material={m.skin} position={[0, 0.25, 0.34]} scale={[0.035, 0.03, 0.03]} />
            {look.beard ? (
              <mesh geometry={g.capsule} material={m.hair} position={[0, 0.2, 0.33]} rotation-z={Math.PI / 2} scale={[0.03, 0.08, 0.03]} />
            ) : null}
            <Hair look={look} hair={m.hair} />
            <Hat look={look} />
          </group>
        </group>
      </group>
    </group>
  );
}

function Hair({ look, hair }: { look: CharacterLook; hair: THREE.Material }) {
  const cap = <mesh geometry={g.topHalf} material={hair} position={[0, 0.33, -0.015]} scale={[0.39, 0.37, 0.37]} castShadow />;
  switch (look.hairStyle) {
    case "braid":
      return (
        <group>
          {cap}
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} geometry={g.sphere} material={hair} position={[0.1, 0.18 - i * 0.12, -0.3 - i * 0.02]} scale={0.075 - i * 0.008} castShadow />
          ))}
          <mesh geometry={g.sphere} material={toon(look.accent)} position={[0.1, -0.24, -0.37]} scale={0.04} />
        </group>
      );
    case "bob":
      return (
        <group>
          {cap}
          <mesh geometry={g.sphere} material={hair} position={[0, 0.24, -0.05]} scale={[0.4, 0.28, 0.35]} castShadow />
        </group>
      );
    case "bun":
      return (
        <group>
          {cap}
          <mesh geometry={g.sphere} material={hair} position={[0, 0.62, -0.18]} scale={0.14} castShadow />
        </group>
      );
    case "beanie":
      return null;
    default:
      return <mesh geometry={g.topHalf} material={hair} position={[0, 0.36, -0.02]} scale={[0.375, 0.3, 0.36]} castShadow />;
  }
}

function Hat({ look }: { look: CharacterLook }) {
  switch (look.hat) {
    case "chef":
      return (
        <group position={[0, 0.6, -0.02]}>
          <mesh geometry={g.cylinder} material={toon("#ffffff")} scale={[0.25, 0.18, 0.25]} castShadow />
          <mesh geometry={g.sphere} material={toon("#ffffff")} position={[0, 0.16, 0]} scale={[0.32, 0.18, 0.32]} castShadow />
        </group>
      );
    case "conductor":
      return (
        <group position={[0, 0.6, 0]}>
          <mesh geometry={g.cylinder} material={toon("#1c3553")} scale={[0.33, 0.13, 0.33]} castShadow />
          <mesh geometry={g.cylinder} material={toon("#f2c230")} position={[0, -0.02, 0]} scale={[0.335, 0.04, 0.335]} />
          <mesh geometry={g.cylinder} material={toon("#101c2c")} position={[0, -0.07, 0.2]} scale={[0.22, 0.02, 0.16]} />
        </group>
      );
    case "sunhat":
      return (
        <group position={[0, 0.58, -0.02]} rotation-x={-0.12}>
          <mesh geometry={g.cylinder} material={toon("#e8cf8a")} scale={[0.62, 0.025, 0.62]} castShadow />
          <mesh geometry={g.topHalf} material={toon("#e8cf8a")} scale={[0.3, 0.28, 0.3]} castShadow />
          <mesh geometry={g.cylinder} material={toon(look.accent)} position={[0, 0.05, 0]} scale={[0.305, 0.05, 0.305]} />
        </group>
      );
    case "beanie":
      return (
        <group position={[0, 0.34, -0.01]}>
          <mesh geometry={g.topHalf} material={toon(look.accent)} scale={[0.4, 0.42, 0.39]} castShadow />
          <mesh geometry={g.cylinder} material={toon(look.hair)} position={[0, 0.02, 0]} scale={[0.405, 0.07, 0.395]} />
          <mesh geometry={g.sphere} material={toon("#ffffff")} position={[0, 0.44, 0]} scale={0.09} castShadow />
        </group>
      );
    default:
      return null;
  }
}
