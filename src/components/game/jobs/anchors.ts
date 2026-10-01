"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

// Speech bubbles and labels in the café are DOM elements pinned to points in
// the room, moved every frame after the room renders (like ../world-labels).

type Anchor = {
  el: HTMLElement;
  at: () => [number, number, number] | null;
  // 0..1 left of a guest's patience, written to --left for the bar.
  left?: () => number | null;
  // "side" hangs the element to the right of its point instead of centred above it.
  align: "center" | "side";
};

const anchors = new Map<string, Anchor>();

export function useShiftAnchor<T extends HTMLElement = HTMLDivElement>(id: string, at: Anchor["at"], left?: Anchor["left"], align: Anchor["align"] = "center") {
  const ref = useRef<T>(null);
  const getters = useRef({ at, left });
  useEffect(() => {
    getters.current = { at, left };
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    anchors.set(id, { el, at: () => getters.current.at(), left: () => getters.current.left?.() ?? null, align });
    return () => {
      anchors.delete(id);
    };
  }, [id, align]);
  return ref;
}

const point = new THREE.Vector3();

export function ShiftProjector() {
  useFrame(({ camera, size, scene }) => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __shift: unknown }).__shift = { camera, scene };
    camera.updateMatrixWorld();
    for (const anchor of anchors.values()) {
      const at = anchor.at();
      const style = anchor.el.style;
      if (!at) {
        style.opacity = "0";
        continue;
      }
      point.set(at[0], at[1], at[2]).project(camera);
      // Behind the camera: nothing to show.
      if (point.z > 1) {
        style.opacity = "0";
        continue;
      }
      const x = (point.x * 0.5 + 0.5) * size.width;
      const y = (-point.y * 0.5 + 0.5) * size.height;
      const shift = anchor.align === "side" ? "translate(-22px, -100%)" : "translate(-50%, -100%)";
      style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) ${shift}`;
      style.opacity = "1";
      const left = anchor.left?.();
      if (left !== null && left !== undefined) {
        style.setProperty("--left", left.toFixed(3));
        anchor.el.dataset.low = left < 0.33 ? "1" : "";
      }
    }
  }, 2);
  return null;
}
