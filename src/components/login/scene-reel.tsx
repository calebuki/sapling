"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { PixelOutline, PixelPalette, usePixelDpr } from "@/components/game/world/pixel-effect";
import { bigCatch } from "./scenes/big-catch";
import { fikaHeist } from "./scenes/fika-heist";
import { ferryArriving } from "./scenes/ferry-arriving";
import { clamp, clock, smooth, type LoginScene } from "./scenes/kit";
import { lakeLeap } from "./scenes/lake-leap";
import { pretzelPass } from "./scenes/pretzel-pass";
import { wordsOnTheWind } from "./scenes/words-on-the-wind";

// The login page's backdrop: six slowed-down moments from the islands, one
// loop each, cross-fading into the next. Moving the mouse swings the camera;
// pointing at a word tag holds the moment still so it can be read.

const SCENES = [wordsOnTheWind, ferryArriving, fikaHeist, bigCatch, pretzelPass, lakeLeap];
const TAG_COUNT = 8;
const FADE_IN = 0.6;
const FADE_OUT = 0.7;

const projected = new THREE.Vector3();

type Overlay = {
  tags: (HTMLDivElement | null)[];
  fade: HTMLDivElement | null;
  progress: HTMLDivElement | null;
  hold: boolean;
  pointer: { x: number; y: number };
};

function Director({ overlay, still }: { overlay: RefObject<Overlay>; still: boolean }) {
  const { scene, camera, gl, size } = useThree();
  const built = useRef<(LoginScene | null)[]>(SCENES.map(() => null));
  const reel = useRef({ index: -1, shown: 0, since: 0, speed: 0, px: 0, py: 0, drift: 0, prepared: -1 });

  const get = (i: number) => (built.current[i] ??= SCENES[i]());

  // Build the next scene and compile its shaders ahead of time so the cut doesn't stutter.
  const prepare = (i: number) => {
    const next = get(i);
    const staging = new THREE.Scene();
    staging.add(next.world.root);
    gl.compile(staging, camera);
    staging.remove(next.world.root);
  };

  const show = (i: number) => {
    const r = reel.current;
    if (r.index >= 0) scene.remove(get(r.index).world.root);
    const next = get(i);
    scene.add(next.world.root);
    scene.background = next.world.background;
    scene.fog = next.world.fog;
    if (overlay.current?.fade) overlay.current.fade.style.background = next.fadeColor;
    clock.amp = next.world.amp;
    clock.t = 0;
    next.reset();
    for (let t = 0; t < next.warm; t += 1 / 30) {
      clock.t += 1 / 30;
      next.update(1 / 30);
    }
    Object.assign(r, { index: i, shown: 0, since: 0, speed: still ? 0 : next.slow, prepared: -1 });
  };

  useEffect(() => {
    show(0);
    if (still) {
      // Reduced motion: one clear moment, held.
      const first = get(0);
      for (let t = 0; t < 1.5; t += 1 / 30) {
        clock.t += 1 / 30;
        first.update(1 / 30);
      }
    }
    const r = reel.current;
    return () => {
      if (r.index >= 0) scene.remove(get(r.index).world.root);
      r.index = -1;
    };
    // show/get only touch refs; the reel starts once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still]);

  useFrame((_, delta) => {
    const r = reel.current;
    const o = overlay.current;
    if (r.index < 0 || !o) return;
    const dtR = Math.min(0.05, delta);
    const current = get(r.index);
    const hold = o.hold;

    // time: scene speed eases to zero while a tag is held
    const target = hold || still ? 0 : current.slow;
    r.speed += (target - r.speed) * (1 - Math.exp(-dtR * (hold ? 14 : 5)));
    const dt = dtR * r.speed;
    clock.t += dt;
    current.update(dt);

    // rotation: one loop per scene, paused while a tag is held
    r.since += dtR;
    if (!hold && !still) r.shown += dtR;
    const dwell = current.beat / current.slow;
    if (!still && r.prepared < 0 && r.shown > 1) {
      r.prepared = (r.index + 1) % SCENES.length;
      prepare(r.prepared);
    }
    if (!still && r.shown >= dwell) {
      show((r.index + 1) % SCENES.length);
      return;
    }

    // camera: the scene's shot, swung by the mouse, with a little handheld drift
    if (!hold) {
      r.px += (o.pointer.x - r.px) * (1 - Math.exp(-dtR * 2.2));
      r.py += (o.pointer.y - r.py) * (1 - Math.exp(-dtR * 2.2));
      r.drift += dtR;
    }
    const shot = current.shot();
    const cam = camera as THREE.PerspectiveCamera;
    const yaw = shot.yaw + r.px * 0.28;
    const pitch = clamp(shot.pitch - r.py * 0.1, 0.02, 0.6);
    if (cam.fov !== shot.fov) {
      cam.fov = shot.fov;
      cam.updateProjectionMatrix();
    }
    cam.position.set(
      shot.target.x + Math.sin(yaw) * Math.cos(pitch) * shot.dist + Math.sin(r.drift * 0.7) * 0.08,
      shot.target.y + Math.sin(pitch) * shot.dist + Math.sin(r.drift * 1.1) * 0.06,
      shot.target.z + Math.cos(yaw) * Math.cos(pitch) * shot.dist,
    );
    cam.lookAt(shot.target);
    cam.updateMatrixWorld();

    // overlay: cross-fade, progress and word tags
    const cross = still ? 0 : Math.max(1 - smooth(0, FADE_IN, r.since), smooth(dwell - FADE_OUT, dwell, r.shown));
    if (o.fade) o.fade.style.opacity = Math.max(current.fade(), cross).toFixed(3);
    if (o.progress) o.progress.style.transform = `scaleX(${clamp(r.shown / dwell, 0, 1).toFixed(4)})`;
    const placed: { x: number; y: number; w: number }[] = [];
    let n = 0;
    for (const tag of current.tags()) {
      const el = o.tags[n];
      if (!el) break;
      const alpha = tag.alpha * (1 - cross);
      if (alpha <= 0.01) continue;
      projected.copy(tag.pos).project(cam);
      if (projected.z > 1 || Math.abs(projected.x) > 1.05 || Math.abs(projected.y) > 1.05) continue;
      const x = ((projected.x + 1) / 2) * size.width + 8;
      const w = 26 + tag.word.length * 9;
      let y = ((1 - projected.y) / 2) * size.height - 30;
      // nudge tags up until they stop overlapping the ones already placed
      for (let k = 0; k < 6; k++) {
        const hit = placed.find((b) => x < b.x + b.w && x + w > b.x && Math.abs(y - b.y) < 28);
        if (!hit) break;
        y = hit.y - 30;
      }
      placed.push({ x, y, w });
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      el.style.opacity = (el.matches(":hover") ? 1 : alpha).toFixed(3);
      const key = `${tag.lang}:${tag.word}`;
      if (el.dataset.key !== key) {
        el.dataset.key = key;
        el.lang = tag.lang;
        (el.firstElementChild as HTMLElement).textContent = tag.word;
        (el.lastElementChild as HTMLElement).textContent = `${tag.meaning} · ${tag.lang === "sv" ? "Swedish" : "German"}`;
      }
      el.hidden = false;
      n++;
    }
    for (; n < o.tags.length; n++) {
      const el = o.tags[n];
      if (el) el.hidden = true;
    }
  });

  return null;
}

export function SceneReel() {
  const dpr = usePixelDpr();
  const still = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const overlay = useRef<Overlay>({ tags: [], fade: null, progress: null, hold: false, pointer: { x: 0, y: 0 } });
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const r = stage.current?.getBoundingClientRect();
      if (!r) return;
      overlay.current.pointer.x = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1.3, 1.2);
      overlay.current.pointer.y = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1.2, 1.2);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <div className="reel" ref={stage}>
      <Canvas
        shadows={{ type: THREE.BasicShadowMap }}
        dpr={dpr}
        gl={{ antialias: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping }}
        camera={{ fov: 38, near: 0.1, far: 600, position: [20, 10, 20] }}
      >
        <Director overlay={overlay} still={still} />
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <PixelOutline />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette offset={0.3} darkness={0.35} />
          <PixelPalette />
        </EffectComposer>
      </Canvas>
      <div className="reel-fade" ref={(el) => void (overlay.current.fade = el)} />
      <div className="reel-tags">
        {Array.from({ length: TAG_COUNT }, (_, i) => (
          <div
            key={i}
            className="reel-tag"
            hidden
            ref={(el) => void (overlay.current.tags[i] = el)}
            onPointerEnter={() => (overlay.current.hold = true)}
            onPointerLeave={() => (overlay.current.hold = false)}
          >
            <b />
            <span />
          </div>
        ))}
      </div>
      {still ? null : (
        <div className="reel-progress">
          <div ref={(el) => void (overlay.current.progress = el)} />
        </div>
      )}
    </div>
  );
}
