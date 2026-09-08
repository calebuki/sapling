"use client";
import { useEffect, useRef, useState } from "react";
import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { characterMesh } from "./character-mesh";
import { disposeGroup } from "./build-mesh";
import { elinAppearance, type Appearance } from "@/lib/island/appearance";

export function CharacterScene({
  appearance = elinAppearance,
  sceneId = "portrait",
}: {
  appearance?: Appearance;
  sceneId?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      queueMicrotask(() => setUnavailable(true));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    const scene = new T.Scene();
    const camera = new T.OrthographicCamera(-3, 3, 2, -2, 0.1, 50);
    const portrait = sceneId === "portrait";
    camera.position.set(portrait ? 0.6 : 3.2, portrait ? 1.6 : 3, 6);
    camera.lookAt(0, portrait ? 0.95 : 0.9, 0);
    scene.add(new T.HemisphereLight("#fff8e3", "#78978a", 2.5));
    const sun = new T.DirectionalLight("#fff2d6", 3);
    sun.position.set(-3, 6, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);
    const person = characterMesh(appearance);
    scene.add(person);
    person.rotation.y = 0.2;
    function object(
      geometry: T.BufferGeometry,
      color: string,
      x: number,
      y: number,
      z: number,
    ) {
      const m = new T.Mesh(
        geometry,
        new T.MeshStandardMaterial({ color, roughness: 0.9 }),
      );
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
      return m;
    }
    function box(
      w: number,
      h: number,
      d: number,
      color: string,
      x: number,
      y: number,
      z: number,
    ) {
      return object(new RoundedBoxGeometry(w, h, d, 2, 0.04), color, x, y, z);
    }
    object(
      new T.CylinderGeometry(
        portrait ? 0.65 : 4,
        portrait ? 0.7 : 4.1,
        0.2,
        64,
      ),
      "#a9bc80",
      0,
      -0.13,
      0,
    );
    if (!portrait) {
      if (sceneId.includes("station")) {
        for (let i = 0; i < 10; i++)
          box(
            3.5,
            0.12,
            0.34,
            i % 2 ? "#bd9a72" : "#d2b18a",
            0,
            0,
            i * 0.38 - 1.7,
          );
        for (const x of [-1.6, 1.6])
          box(0.12, 1.1, 0.12, "#947351", x, 0.48, -1.5);
        box(3.2, 0.09, 0.1, "#b79870", 0, 0.9, -1.5);
      } else {
        for (const x of [-2.1, 2.3]) {
          object(
            new T.CylinderGeometry(0.13, 0.2, 1.6, 12),
            "#947351",
            x,
            0.7,
            -1.6,
          );
          const crown = object(
            new T.SphereGeometry(0.85, 20, 16),
            "#86a76a",
            x,
            2,
            -1.6,
          );
          crown.scale.y = 1.2;
          if (sceneId === "meet-elin")
            for (const d of [-0.4, 0.3])
              object(
                new T.SphereGeometry(0.12, 12, 10),
                "#c76652",
                x + d,
                1.8 + d,
                -0.9,
              );
        }
        if (sceneId === "fika-order") {
          box(1.1, 0.12, 0.75, "#c6a177", 1.15, 0.75, 0.1);
          for (const x of [0.75, 1.55])
            box(0.09, 0.75, 0.55, "#a0825d", x, 0.35, 0.1);
          object(
            new T.CylinderGeometry(0.1, 0.075, 0.18, 20),
            "#fff6db",
            1,
            0.9,
            0.15,
          );
          object(
            new T.SphereGeometry(0.12, 16, 10),
            "#bf8851",
            1.4,
            0.85,
            0.15,
          ).scale.y = 0.5;
        } else if (sceneId === "make-weekend-plans") {
          for (let i = 0; i < 14; i++) {
            const x = Math.sin(i * 2.4) * 2.5,
              z = Math.cos(i * 2.4) * 1.6;
            if (Math.abs(x) < 0.7) continue;
            box(0.025, 0.3, 0.025, "#698958", x, 0.15, z);
            object(
              new T.SphereGeometry(0.11, 10, 8),
              i % 2 ? "#f3d684" : "#d6a6bd",
              x,
              0.34,
              z,
            ).scale.y = 0.4;
          }
        }
      }
    }
    function render() {
      const width = el!.clientWidth,
        height = Math.max(1, el!.clientHeight);
      const half = portrait ? 1.08 : 1.8;
      camera.left = (-half * width) / height;
      camera.right = (half * width) / height;
      camera.top = half;
      camera.bottom = -half;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.render(scene, camera);
    }
    const observer = new ResizeObserver(render);
    observer.observe(el);
    render();
    return () => {
      observer.disconnect();
      disposeGroup(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [appearance, sceneId]);
  return (
    <div
      ref={host}
      className={`character-scene ${sceneId === "portrait" ? "is-portrait" : ""}`}
      aria-hidden="true"
    >
      {unavailable ? (
        <span className="character-fallback">
          {sceneId === "portrait"
            ? "Your island look"
            : "A moment on the island"}
        </span>
      ) : null}
    </div>
  );
}
