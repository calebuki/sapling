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
  cone: new THREE.ConeGeometry(1, 1, 12),
  face: new THREE.PlaneGeometry(1, 1),
  ring: new THREE.TorusGeometry(1, 0.16, 6, 14),
};

const flat = (color: string) => toon(color, { surface: null });
const darker = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * 0.72).toString(16).padStart(2, "0")).join("")}`;
};

// ---- Faces -----------------------------------------------------------------

const FACE_W = 16;
const FACE_H = 13;
const FRAMES = ["neutral", "blink", "happy", "talk", "think"] as const;
type Frame = (typeof FRAMES)[number];

const ink = "#2b2233";
const shine = "#ffffff";
const blush = "#f39a9a";
const freckle = "#b0704f";
const lip = "#7a3030";
const tongue = "#e0707a";

type FaceStyle = NonNullable<CharacterLook["face"]>;
const plainFace: FaceStyle = { eyes: "round", cheeks: "blush" };

const sheets = new Map<string, HTMLCanvasElement>();
function faceSheet({ eyes, cheeks }: FaceStyle) {
  const key = `${eyes}-${cheeks}`;
  let sheet = sheets.get(key);
  if (sheet) return sheet;
  sheet = document.createElement("canvas");
  sheets.set(key, sheet);
  sheet.width = FACE_W * FRAMES.length;
  sheet.height = FACE_H;
  const ctx = sheet.getContext("2d")!;
  FRAMES.forEach((frame, i) => {
    const px = (x: number, y: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(i * FACE_W + x, y, 1, 1);
    };
    const eye = (x: number, lift = 0) => {
      if (eyes === "sleepy") {
        // Heavy lids: a flat line with the eye peeking out underneath.
        for (const dx of [-1, 0, 1, 2]) px(x + dx, 5 - lift, ink);
        px(x, 6 - lift, ink);
        px(x + 1, 6 - lift, ink);
        return;
      }
      for (let y = 4 - lift; y <= 6 - lift; y++) {
        px(x, y, ink);
        px(x + 1, y, ink);
      }
      px(x + 1, 4 - lift, shine);
      // A lash flicking up from the outer corner.
      if (eyes === "lashes") px(x < 8 ? x - 1 : x + 2, 3 - lift, ink);
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
    if (cheeks === "blush") for (const x of [1, 2, 13, 14]) px(x, 8, blush);
    else if (cheeks === "freckles")
      for (const [x, y] of [[2, 8], [1, 9], [3, 9], [13, 8], [12, 9], [14, 9]]) px(x, y, freckle);
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

function useFace(style: FaceStyle) {
  const { eyes, cheeks } = style;
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(faceSheet({ eyes, cheeks }));
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.repeat.set(1 / FRAMES.length, 1);
    return t;
  }, [eyes, cheeks]);
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

// ---- Cloth patterns --------------------------------------------------------

// Stripes and knits are a 16px mask that mixes in a second colour, projected
// along each face's main axis like the island's surface textures, so a sleeve
// and a torso get the same stripe width.
const PATTERN_TILE = 0.32;
type Pattern = "stripes" | "knit";

function patternMask(kind: Pattern) {
  const data = new Uint8Array(16 * 16 * 4);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      let on = false;
      let rib = 1;
      if (kind === "stripes") on = Math.floor(y / 4) % 2 === 1;
      else {
        // A band of dots, diamonds and dots, like a Nordic yoke, on a ribbed knit.
        const m = x % 4;
        on = ((y === 4 || y === 10) && m === 1) || ((y === 6 || y === 8) && m === 3) || (y === 7 && m % 2 === 0);
        rib = x % 2 ? 0.94 : 1.04;
      }
      const i = (y * 16 + x) * 4;
      data[i] = on ? 255 : 0;
      data[i + 1] = Math.round((rib / 1.1) * 255);
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, 16, 16, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapNearestFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

const masks = new Map<Pattern, THREE.DataTexture>();
const cloths = new Map<string, THREE.Material>();

function cloth(color: string, kind: CharacterLook["top"]) {
  // Everything else is plain cloth.
  if (kind !== "stripes" && kind !== "knit") return flat(color);
  const key = `${kind}|${color}`;
  const cached = cloths.get(key);
  if (cached) return cached;
  let mask = masks.get(kind);
  if (!mask) masks.set(kind, (mask = patternMask(kind)));
  const base = new THREE.Color(color);
  // Cream on dark cloth, navy on light.
  const second = new THREE.Color(base.getHSL({ h: 0, s: 0, l: 0 }).l > 0.62 ? "#2c3e50" : "#f4efe6");
  const material = new THREE.MeshToonMaterial({ color, gradientMap: toonRamp() });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uMask = { value: mask };
    shader.uniforms.uSecond = { value: second };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vClothPos;\nvarying vec3 vClothNormal;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vClothPos = position * vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz));
        vClothNormal = normal;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vClothPos;\nvarying vec3 vClothNormal;\nuniform sampler2D uMask;\nuniform vec3 uSecond;")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        vec3 clothAxis = abs(vClothNormal);
        vec2 clothUv = clothAxis.x >= clothAxis.y && clothAxis.x >= clothAxis.z ? vClothPos.zy : (clothAxis.y >= clothAxis.z ? vClothPos.xz : vClothPos.xy);
        vec4 clothMask = texture2D(uMask, clothUv / ${PATTERN_TILE.toFixed(3)});
        diffuseColor.rgb = mix(diffuseColor.rgb, uSecond, clothMask.r) * clothMask.g * 1.1;`,
      );
  };
  material.customProgramCacheKey = () => `cloth-${kind}`;
  cloths.set(key, material);
  return material;
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
  const faceMaterial = useFace(look.face ?? plainFace);
  const face = useRef<THREE.Mesh>(null);

  const m = useMemo(
    () => ({
      skin: flat(look.skin),
      hair: flat(look.hair),
      shirt: cloth(look.shirt, look.top),
      pants: flat(look.pants),
      accent: flat(look.accent),
      collar: flat(look.collar ?? look.accent),
      shoe: flat("#4a3a30"),
      apron: flat(look.apron ?? look.accent),
      scarf: flat(look.scarf ?? look.accent),
      boots: flat(look.boots ?? "#4a3a30"),
      bowtie: flat(look.bowtie ?? look.accent),
      backpack: flat(look.backpack ?? look.accent),
      strap: flat(darker(look.backpack ?? look.accent)),
      frame: flat("#2b2233"),
      button: flat("#f2c230"),
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
  const sleeves = sleevesOf(look.top);
  return (
    <group ref={root} scale={scale}>
      <group ref={body}>
        {/* Legs */}
        {[
          [legL, -0.12],
          [legR, 0.12],
        ].map(([ref, x], i) => (
          <group key={i} ref={ref as React.RefObject<THREE.Group>} position={[x as number, 0.34, 0]}>
            {look.bottom === "shorts" ? (
              <>
                <mesh geometry={g.box} material={m.pants} position={[0, -0.05, 0]} scale={[0.17, 0.11, 0.19]} castShadow />
                <mesh geometry={g.box} material={m.skin} position={[0, -0.17, 0]} scale={[0.13, 0.15, 0.14]} castShadow />
              </>
            ) : look.bottom === "skirt" ? (
              <mesh geometry={g.box} material={m.skin} position={[0, -0.14, 0]} scale={[0.13, 0.24, 0.14]} castShadow />
            ) : (
              <mesh geometry={g.box} material={m.pants} position={[0, -0.13, 0]} scale={[0.16, 0.26, 0.18]} castShadow />
            )}
            {look.boots ? (
              <>
                <mesh geometry={g.box} material={m.boots} position={[0, -0.21, 0]} scale={[0.18, 0.17, 0.2]} castShadow />
                <mesh geometry={g.round} material={m.boots} position={[0, -0.29, 0.03]} scale={[0.2, 0.11, 0.28]} castShadow />
              </>
            ) : (
              <mesh geometry={g.round} material={m.shoe} position={[0, -0.29, 0.03]} scale={[0.19, 0.1, 0.27]} castShadow />
            )}
          </group>
        ))}
        {/* Torso */}
        <mesh geometry={g.round} material={m.shirt} position={[0, 0.55, 0]} scale={[0.52, 0.46, 0.38]} castShadow />
        {look.apron ? <mesh geometry={g.box} material={m.apron} position={[0, 0.5, 0.19]} scale={[0.42, 0.36, 0.02]} /> : null}
        {look.bottom === "overalls" ? <Overalls pants={m.pants} button={m.button} /> : null}
        {look.bottom === "skirt" ? (
          <group>
            <mesh geometry={g.cylinder} material={m.pants} position={[0, 0.27, 0]} scale={[0.33, 0.2, 0.26]} castShadow />
            <mesh geometry={g.round} material={m.pants} position={[0, 0.37, 0]} scale={[0.53, 0.1, 0.39]} />
          </group>
        ) : null}
        {look.backpack ? <Backpack bag={m.backpack} strap={m.strap} /> : null}
        <mesh geometry={g.round} material={look.top === "tank" ? m.skin : m.collar} position={[0, 0.78, 0]} scale={[0.46, 0.1, 0.36]} />
        <TopDetails top={look.top} shirt={m.shirt} trim={m.collar} />
        {look.bowtie ? (
          <group position={[0, 0.76, 0.2]}>
            {[-1, 1].map((side) => (
              <mesh key={side} geometry={g.round} material={m.bowtie} position={[side * 0.065, 0, 0]} rotation-z={side * 0.25} scale={[0.11, 0.09, 0.05]} />
            ))}
            <mesh geometry={g.box} material={m.bowtie} position={[0, 0, 0.012]} scale={[0.045, 0.05, 0.05]} />
          </group>
        ) : null}
        {look.scarf ? (
          <group>
            <mesh geometry={g.round} material={m.scarf} position={[0, 0.8, 0]} scale={[0.5, 0.14, 0.42]} castShadow />
            <mesh geometry={g.round} material={m.scarf} position={[0.13, 0.62, 0.2]} rotation-z={0.12} scale={[0.12, 0.28, 0.05]} castShadow />
          </group>
        ) : null}
        {/* Arms */}
        {[
          [armL, -0.32],
          [armR, 0.32],
        ].map(([ref, x], i) => (
          <group key={i} ref={ref as React.RefObject<THREE.Group>} position={[x as number, 0.72, 0]}>
            {sleeves === "long" ? (
              <mesh geometry={g.round} material={m.shirt} position={[0, -0.12, 0]} scale={[0.14, 0.3, 0.15]} castShadow />
            ) : sleeves === "short" ? (
              <>
                <mesh geometry={g.round} material={m.shirt} position={[0, -0.04, 0]} scale={[0.15, 0.15, 0.16]} castShadow />
                <mesh geometry={g.round} material={m.skin} position={[0, -0.17, 0]} scale={[0.12, 0.18, 0.13]} castShadow />
              </>
            ) : (
              <mesh geometry={g.round} material={m.skin} position={[0, -0.12, 0]} scale={[0.12, 0.3, 0.13]} castShadow />
            )}
            <mesh geometry={g.round} material={m.skin} position={[0, -0.3, 0]} scale={[0.13, 0.11, 0.13]} castShadow />
          </group>
        ))}
        {/* Head */}
        <group position={[0, 0.8, 0]}>
          <group ref={head}>
            <mesh geometry={g.round} material={m.skin} position={[0, 0.38, 0]} scale={[0.78, 0.72, 0.68]} castShadow />
            <mesh ref={face} geometry={g.face} material={faceMaterial} position={[0, 0.34, 0.343]} scale={[0.62, 0.5, 1]} />
            {look.beard ? <mesh geometry={g.round} material={m.hair} position={[0, 0.1, 0.33]} scale={[0.52, 0.16, 0.12]} /> : null}
            {look.glasses ? <Glasses frame={m.frame} /> : null}
            <Hair look={look} hair={m.hair} accent={m.accent} />
            <Hat look={look} />
          </group>
        </group>
      </group>
    </group>
  );
}

// Villagers (no top given) keep the long sleeves they always had.
function sleevesOf(top: CharacterLook["top"]) {
  if (top === "tee" || top === "print") return "short";
  if (top === "tank") return "none";
  return "long";
}

// What makes each top more than a coloured box: hoods, collars, pockets, prints.
function TopDetails({ top, shirt, trim }: { top: CharacterLook["top"]; shirt: THREE.Material; trim: THREE.Material }) {
  switch (top) {
    case "tank":
      return (
        <group>
          {[-0.15, 0.15].map((x) => (
            <mesh key={x} geometry={g.box} material={shirt} position={[x, 0.795, 0]} scale={[0.08, 0.08, 0.37]} />
          ))}
        </group>
      );
    case "hoodie":
      return (
        <group>
          <mesh geometry={g.round} material={shirt} position={[0, 0.84, -0.17]} scale={[0.48, 0.22, 0.18]} castShadow />
          <mesh geometry={g.box} material={trim} position={[0, 0.45, 0.19]} scale={[0.3, 0.13, 0.02]} />
          {[-0.06, 0.06].map((x) => (
            <mesh key={x} geometry={g.box} material={flat("#f4efe6")} position={[x, 0.67, 0.195]} scale={[0.018, 0.12, 0.018]} />
          ))}
        </group>
      );
    case "print":
      return <mesh geometry={g.face} material={printMaterial()} position={[0, 0.58, 0.192]} scale={[0.2, 0.2, 1]} />;
    case "shirt":
      return (
        <group>
          <mesh geometry={g.box} material={trim} position={[0, 0.55, 0.191]} scale={[0.035, 0.4, 0.01]} />
          {[0.68, 0.57, 0.46].map((y) => (
            <mesh key={y} geometry={g.box} material={flat("#f4efe6")} position={[0, y, 0.197]} scale={0.026} />
          ))}
          {[-1, 1].map((side) => (
            <mesh key={side} geometry={g.box} material={trim} position={[side * 0.085, 0.77, 0.17]} rotation-z={side * 0.55} scale={[0.13, 0.055, 0.04]} />
          ))}
        </group>
      );
    // The doctor's coat: long, open down the front, with lapels and a pen in the pocket.
    case "labcoat":
      return (
        <group>
          <mesh geometry={g.cylinder} material={shirt} position={[0, 0.26, 0]} scale={[0.29, 0.26, 0.22]} castShadow />
          <mesh geometry={g.box} material={trim} position={[0, 0.42, 0.205]} scale={[0.02, 0.62, 0.01]} />
          {[-1, 1].map((side) => (
            <mesh key={side} geometry={g.box} material={trim} position={[side * 0.08, 0.72, 0.18]} rotation-z={side * 0.5} scale={[0.12, 0.2, 0.03]} />
          ))}
          <mesh geometry={g.box} material={trim} position={[0.13, 0.6, 0.193]} scale={[0.1, 0.08, 0.01]} />
          <mesh geometry={g.box} material={flat("#3f7fd1")} position={[0.11, 0.65, 0.198]} scale={[0.015, 0.06, 0.01]} />
        </group>
      );
    case "raincoat":
      return (
        <group>
          <mesh geometry={g.round} material={shirt} position={[0, 0.86, -0.18]} scale={[0.52, 0.26, 0.22]} castShadow />
          <mesh geometry={g.round} material={trim} position={[0, 0.34, 0]} scale={[0.55, 0.07, 0.41]} />
          <mesh geometry={g.box} material={trim} position={[0, 0.54, 0.191]} scale={[0.02, 0.4, 0.01]} />
          {[0.66, 0.54, 0.42].map((y) => (
            <mesh key={y} geometry={g.box} material={flat("#2b2233")} position={[0.05, y, 0.196]} scale={[0.06, 0.03, 0.02]} />
          ))}
        </group>
      );
    default:
      return null;
  }
}

// A little sprout printed on the chest, on a cream patch so it shows on any colour.
let print: THREE.Material | null = null;
function printMaterial() {
  if (print) return print;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 12;
  const ctx = canvas.getContext("2d")!;
  const px = (x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  };
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) if ((x - 5.5) ** 2 + (y - 5.5) ** 2 <= 30) px(x, y, "#f4efe6");
  for (const [x, y] of [[2, 4], [3, 3], [3, 4], [4, 4], [4, 5], [5, 5]]) px(x, y, "#4fbf7d");
  for (const [x, y] of [[9, 3], [8, 2], [8, 3], [7, 3], [7, 4], [6, 4]]) px(x, y, "#3aa56b");
  for (const [x, y] of [[6, 5], [6, 6], [6, 7], [5, 8], [5, 9]]) px(x, y, "#2f7d4f");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  print = new THREE.MeshToonMaterial({ map: texture, gradientMap: toonRamp(), alphaTest: 0.5 });
  return print;
}

// Bib, straps and a waistband over whatever top is on.
function Overalls({ pants, button }: { pants: THREE.Material; button: THREE.Material }) {
  return (
    <group>
      <mesh geometry={g.round} material={pants} position={[0, 0.38, 0]} scale={[0.53, 0.13, 0.39]} />
      <mesh geometry={g.box} material={pants} position={[0, 0.52, 0.19]} scale={[0.32, 0.26, 0.02]} />
      {[-0.12, 0.12].map((x) => (
        <group key={x}>
          <mesh geometry={g.box} material={pants} position={[x, 0.72, 0.17]} scale={[0.06, 0.16, 0.03]} />
          <mesh geometry={g.box} material={pants} position={[x, 0.6, -0.195]} scale={[0.06, 0.4, 0.02]} />
          <mesh geometry={g.box} material={button} position={[x, 0.63, 0.205]} scale={0.035} />
        </group>
      ))}
    </group>
  );
}

// A rucksack on the back, its straps over the shoulders.
function Backpack({ bag, strap }: { bag: THREE.Material; strap: THREE.Material }) {
  return (
    <group>
      <mesh geometry={g.round} material={bag} position={[0, 0.54, -0.26]} scale={[0.38, 0.42, 0.18]} castShadow />
      <mesh geometry={g.round} material={strap} position={[0, 0.69, -0.3]} scale={[0.36, 0.12, 0.14]} />
      <mesh geometry={g.box} material={strap} position={[0, 0.44, -0.355]} scale={[0.2, 0.12, 0.03]} />
      {[-0.13, 0.13].map((x) => (
        <group key={x}>
          <mesh geometry={g.box} material={strap} position={[x, 0.79, -0.02]} scale={[0.06, 0.04, 0.4]} />
          <mesh geometry={g.box} material={strap} position={[x, 0.62, 0.19]} scale={[0.06, 0.3, 0.02]} />
        </group>
      ))}
    </group>
  );
}

// Round frames over the pixel eyes, with arms back to the ears.
function Glasses({ frame }: { frame: THREE.Material }) {
  return (
    <group position={[0, 0.378, 0.37]}>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh geometry={g.ring} material={frame} position={[side * 0.155, 0, 0]} scale={0.09} />
          <mesh geometry={g.box} material={frame} position={[side * 0.4, 0.01, -0.2]} scale={[0.02, 0.02, 0.4]} />
          <mesh geometry={g.box} material={frame} position={[side * 0.32, 0.01, 0]} scale={[0.16, 0.018, 0.018]} />
        </group>
      ))}
      <mesh geometry={g.box} material={frame} position={[0, 0.01, 0]} scale={[0.07, 0.018, 0.018]} />
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
  // A beanie sits where the top of the hair would be.
  const covered = look.hat === "beanie";
  const top = covered ? null : cap;
  switch (look.hairStyle) {
    case "braid":
      return (
        <group>
          {top}
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
          {top}
          <mesh geometry={g.round} material={hair} position={[0, 0.34, -0.18]} scale={[0.9, 0.62, 0.44]} castShadow />
          {[-0.43, 0.43].map((x) => (
            <mesh key={x} geometry={g.round} material={hair} position={[x, 0.36, 0.08]} scale={[0.1, 0.6, 0.46]} />
          ))}
        </group>
      );
    case "long":
      return (
        <group>
          {top}
          <mesh geometry={g.round} material={hair} position={[0, 0.2, -0.22]} scale={[0.88, 1.0, 0.3]} castShadow />
          {[-0.42, 0.42].map((x) => (
            <mesh key={x} geometry={g.round} material={hair} position={[x, 0.26, 0.02]} scale={[0.08, 0.72, 0.5]} />
          ))}
        </group>
      );
    case "ponytail":
      return (
        <group>
          {top}
          {back}
          {sides}
          <mesh geometry={g.box} material={accent} position={[0, 0.64, -0.43]} scale={[0.14, 0.1, 0.1]} />
          <mesh geometry={g.round} material={hair} position={[0, 0.42, -0.55]} rotation-x={0.4} scale={[0.2, 0.52, 0.17]} castShadow />
        </group>
      );
    case "spacebuns":
      return (
        <group>
          {top}
          {back}
          {sides}
          {covered
            ? null
            : [-0.3, 0.3].map((x) => <mesh key={x} geometry={g.round} material={hair} position={[x, 0.84, -0.06]} scale={0.26} castShadow />)}
        </group>
      );
    // A big soft cloud of curls, bumpy on top.
    case "curly":
      return (
        <group>
          {covered ? null : (
            <>
              <mesh geometry={g.round} material={hair} position={[0, 0.72, -0.05]} scale={[0.98, 0.34, 0.88]} castShadow />
              {Array.from({ length: 9 }, (_, i) => {
                const a = (i / 9) * Math.PI * 2;
                return <mesh key={i} geometry={g.round} material={hair} position={[Math.sin(a) * 0.34, 0.86, Math.cos(a) * 0.3 - 0.05]} scale={0.16} castShadow />;
              })}
            </>
          )}
          <mesh geometry={g.round} material={hair} position={[0, 0.42, -0.3]} scale={[0.98, 0.72, 0.34]} castShadow />
          {[-0.46, 0.46].map((x) => (
            <mesh key={x} geometry={g.round} material={hair} position={[x, 0.5, -0.02]} scale={[0.12, 0.44, 0.56]} />
          ))}
        </group>
      );
    case "spiky":
      return (
        <group>
          {top}
          {back}
          {sides}
          {covered
            ? null
            : [-0.24, -0.08, 0.08, 0.24].map((x) => (
                <mesh key={x} geometry={g.cone} material={hair} position={[x, 0.88, -0.02]} rotation-z={-x * 1.4} scale={[0.1, 0.22, 0.1]} castShadow />
              ))}
        </group>
      );
    // Cropped close: just a thin layer over the top and back.
    case "buzz":
      return covered ? null : (
        <group>
          <mesh geometry={g.round} material={hair} position={[0, 0.7, -0.04]} scale={[0.8, 0.12, 0.68]} />
          <mesh geometry={g.round} material={hair} position={[0, 0.46, -0.3]} scale={[0.8, 0.42, 0.1]} />
        </group>
      );
    case "bun":
      return (
        <group>
          {top}
          {back}
          {sides}
          {covered ? null : <mesh geometry={g.round} material={hair} position={[0, 0.86, -0.2]} scale={0.3} castShadow />}
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
          {top}
          {back}
          {sides}
        </group>
      );
  }
}

const crownFlowers = ["#ffffff", "#f39ac0", "#f7d94c", "#7fb2e8", "#ffffff", "#f39ac0", "#c99ae8"];

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
    // A skipper's cap: white top, navy band, black peak and a gold badge.
    case "captain":
      return (
        <group position={[0, 0.76, 0]} rotation-x={-0.06}>
          <mesh geometry={g.round} material={flat("#f7f6f0")} position={[0, 0.1, -0.02]} scale={[0.9, 0.16, 0.82]} castShadow />
          <mesh geometry={g.cylinder} material={flat("#1c3553")} position={[0, 0, 0]} scale={[0.41, 0.09, 0.37]} />
          <mesh geometry={g.box} material={flat("#101c2c")} position={[0, -0.05, 0.42]} scale={[0.52, 0.04, 0.2]} />
          <mesh geometry={g.box} material={flat("#f2c230")} position={[0, 0.03, 0.375]} scale={[0.1, 0.08, 0.02]} />
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
    // The Vietnamese nón lá: a wide cone of palm leaves with darker rims.
    case "nonla":
      return (
        <group position={[0, 0.72, -0.02]} rotation-x={-0.06}>
          <mesh geometry={g.cone} material={flat("#ead9a2")} position={[0, 0.22, 0]} scale={[0.82, 0.44, 0.82]} castShadow />
          <mesh geometry={g.cylinder} material={flat("#c9b26e")} position={[0, 0.005, 0]} scale={[0.83, 0.02, 0.83]} />
          <mesh geometry={g.cylinder} material={flat("#c9b26e")} position={[0, 0.16, 0]} scale={[0.53, 0.015, 0.53]} />
        </group>
      );
    // A midsummer flower crown: leaves and little flowers all the way round.
    case "crown":
      return (
        <group position={[0, 0.8, -0.02]} rotation-x={-0.08}>
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2;
            const flower = i % 2 === 0;
            return (
              <mesh
                key={i}
                geometry={g.round}
                material={flat(flower ? crownFlowers[i / 2] : "#4f8f3f")}
                position={[Math.sin(a) * 0.45, flower ? 0.03 : 0, Math.cos(a) * 0.41]}
                rotation-y={a}
                scale={flower ? [0.13, 0.11, 0.1] : [0.12, 0.05, 0.08]}
                castShadow
              />
            );
          })}
          {[-0.1, 0.1].map((x) => (
            <mesh key={x} geometry={g.round} material={flat("#f7d94c")} position={[x, 0.07, 0.42]} scale={0.06} />
          ))}
        </group>
      );
    // The mũ cối, the pith helmet older men in the North still wear.
    case "pith":
      return (
        <group position={[0, 0.72, -0.02]} rotation-x={-0.08}>
          <mesh geometry={g.cylinder} material={flat(look.accent)} position={[0, 0.02, 0]} scale={[0.62, 0.04, 0.58]} castShadow />
          <mesh geometry={g.sphere} material={flat(look.accent)} position={[0, 0.08, 0]} scale={[0.5, 0.34, 0.48]} castShadow />
          <mesh geometry={g.sphere} material={flat("#5f7046")} position={[0, 0.41, 0]} scale={0.05} />
        </group>
      );
    default:
      return null;
  }
}
