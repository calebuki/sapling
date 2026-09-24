"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { discoveries } from "@/lib/game/discoveries";
import { villagers, type Line, type VillagerId } from "@/lib/game/villagers";
import { dock, groundAt, heightAt, places } from "@/lib/game/world";
import { getGame, runtime, useGame } from "./store";
import { Sv } from "./ui/sv";

// World-space labels (signs, names, found words) are ordinary DOM elements in
// the main React tree, positioned every frame from their 3D anchor.

type Anchor = { el: HTMLElement; x: number; y: number; z: number; far: number; hidden?: () => boolean };
const anchors = new Map<string, Anchor>();

function useAnchor(id: string, x: number, y: number, z: number, far: number, hidden?: () => boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    anchors.set(id, { el, x, y, z, far, hidden });
    return () => {
      anchors.delete(id);
    };
  }, [id, x, y, z, far, hidden]);
  return ref;
}

const projected = new THREE.Vector3();

// Lives inside the Canvas and runs after the frame renders (priority 2, after the
// effect composer), so labels use this frame's camera rather than the last one.
export function LabelProjector() {
  useFrame(({ camera, size }) => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __game: unknown }).__game = { camera, size, anchors, runtime };
    camera.updateMatrixWorld();
    const title = getGame().phase === "title";
    for (const anchor of anchors.values()) {
      projected.set(anchor.x, anchor.y, anchor.z).project(camera);
      const playerDistance = Math.hypot(runtime.player.x - anchor.x, runtime.player.z - anchor.z);
      const visible =
        !title && projected.z < 1 && playerDistance < anchor.far && !(anchor.hidden?.() ?? false);
      const style = anchor.el.style;
      if (!visible) {
        if (style.opacity !== "0") {
          style.opacity = "0";
          style.pointerEvents = "none";
        }
        continue;
      }
      const cameraDistance = camera.position.distanceTo(projected.set(anchor.x, anchor.y, anchor.z));
      projected.project(camera);
      const x = (projected.x * 0.5 + 0.5) * size.width;
      const y = (-projected.y * 0.5 + 0.5) * size.height;
      const scale = THREE.MathUtils.clamp(15 / cameraDistance, 0.5, 1.15);
      style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%) scale(${scale.toFixed(3)})`;
      style.zIndex = String(Math.round(1000 - cameraDistance * 10));
      if (style.opacity !== "1") {
        style.opacity = "1";
        style.pointerEvents = "auto";
      }
    }
  }, 2);
  return null;
}

type SignSpec = { id: string; line: Line; x: number; y: number; z: number; far?: number };

export function signs(cafeOpen: boolean): SignSpec[] {
  const cafeY = heightAt(places.cafe.x, places.cafe.z);
  const stationY = heightAt(places.station.x, places.station.z);
  const gardenY = heightAt(places.garden.x, places.garden.z);
  return [
    { id: "dock", line: { sv: "Lilla Ö", en: "Little Island" }, x: -2.2, y: 2.9, z: 25.5 },
    { id: "ferry", line: { sv: "Färjan", en: "The ferry" }, x: 5.7, y: 2.6, z: 37.6, far: 16 },
    { id: "cafe", line: { sv: "Café Kanel", en: "Café Cinnamon" }, x: -13.7, y: cafeY + 4.2, z: 1 },
    {
      id: "cafe-open",
      line: cafeOpen ? { sv: "Öppet", en: "Open" } : { sv: "Stängt", en: "Closed" },
      x: -13.6,
      y: cafeY + 1.8,
      z: 2.4,
      far: 12,
    },
    { id: "station", line: { sv: "Stationen", en: "The station" }, x: 15.6, y: stationY + 3.9, z: -6.5 },
    { id: "garden", line: { sv: "Astrids trädgård", en: "Astrid's garden" }, x: -0.5, y: gardenY + 2.7, z: -14 },
  ];
}

function Sign({ spec }: { spec: SignSpec }) {
  const ref = useAnchor(`sign:${spec.id}`, spec.x, spec.y, spec.z, spec.far ?? 26);
  return (
    <div ref={ref} className="world-anchor">
      <div className="world-sign">
        <Sv text={spec.line.sv} en={spec.line.en} />
      </div>
    </div>
  );
}

function VillagerTag({ id, unlocked }: { id: VillagerId; unlocked: boolean }) {
  const villager = villagers.find((v) => v.id === id)!;
  const [x, z] = villager.position;
  const [hidden] = useState(() => () => getGame().talkingTo === id);
  const ref = useAnchor(`villager:${id}`, x, groundAt(x, z) + 2.35 * (villager.look.scale ?? 1), z, 11, hidden);
  const [chatter, setChatter] = useState(0);
  const index = villagers.indexOf(villager);
  useEffect(() => {
    const timer = window.setInterval(() => setChatter((c) => c + 1), 6500 + index * 900);
    return () => window.clearInterval(timer);
  }, [index]);
  const line = unlocked && chatter > 0 ? villager.chatter[(chatter - 1) % villager.chatter.length] : null;
  return (
    <div ref={ref} className="world-anchor">
      <div className="villager-tag">
        {line ? (
          <div key={chatter} className="villager-bubble">
            <Sv text={line.sv} en={line.en} />
          </div>
        ) : null}
        <span className="villager-name">{villager.name}</span>
      </div>
    </div>
  );
}

function FoundLabel({ id }: { id: string }) {
  const item = discoveries.find((d) => d.id === id)!;
  const base = item.y !== undefined ? groundAt(item.x, item.z) + item.y : item.prop === "gull" || item.prop === "bucket" ? dock.height : groundAt(item.x, item.z);
  const ref = useAnchor(`found:${id}`, item.x, Math.max(0, base) + item.lift, item.z, 9);
  return (
    <div ref={ref} className="world-anchor">
      <div className="world-label">
        <Sv text={item.sv} en={item.en} />
      </div>
    </div>
  );
}

export function WorldLabels({ unlocked }: { unlocked: Record<VillagerId, boolean> }) {
  const discovered = useGame((s) => s.save.discovered);
  return (
    <div className="world-labels" aria-hidden={false}>
      {signs(unlocked.bosse).map((spec) => (
        <Sign key={spec.id + spec.line.sv} spec={spec} />
      ))}
      {villagers.map((v) => (
        <VillagerTag key={v.id} id={v.id} unlocked={unlocked[v.id]} />
      ))}
      {discovered.map((id) => (
        <FoundLabel key={id} id={id} />
      ))}
    </div>
  );
}
