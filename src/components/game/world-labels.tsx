"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { WorldSign } from "@/content/types";
import type { VillagerId } from "@/lib/game/villagers";
import { island, villagerById, useIsland } from "./island";
import { getGame, runtime, useGame } from "./store";
import { baseHeight } from "./world/discoverables";
import { Glossed } from "./ui/glossed";

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

function Sign({ spec }: { spec: WorldSign }) {
  const ref = useAnchor(`sign:${spec.id}`, spec.x, spec.y, spec.z, spec.far ?? 26);
  return (
    <div ref={ref} className="world-anchor">
      <div className="world-sign">
        <Glossed text={spec.line.t} en={spec.line.en} />
      </div>
    </div>
  );
}

function VillagerTag({ id, unlocked }: { id: VillagerId; unlocked: boolean }) {
  const villager = villagerById(id);
  const [x, z] = villager.position;
  const [hidden] = useState(() => () => getGame().talkingTo === id);
  const ref = useAnchor(`villager:${id}`, x, island().world.groundAt(x, z) + 2.2 * (villager.look.scale ?? 1), z, 11, hidden);
  const [chatter, setChatter] = useState(0);
  const index = island().villagers.indexOf(villager);
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
            <Glossed text={line.t} en={line.en} />
          </div>
        ) : null}
        <span className="villager-name">{villager.name}</span>
      </div>
    </div>
  );
}

function FoundLabel({ id }: { id: string }) {
  const item = island().discoveries.find((d) => d.id === id)!;
  const base = item.prop === "rowboat" ? island().world.groundAt(item.x, item.z) : baseHeight(item);
  const ref = useAnchor(`found:${id}`, item.x, Math.max(0, base) + item.lift, item.z, 9);
  return (
    <div ref={ref} className="world-anchor">
      <div className="world-label">
        <Glossed text={item.t} en={item.en} />
      </div>
    </div>
  );
}

export function WorldLabels({ unlocked }: { unlocked: Record<VillagerId, boolean> }) {
  const discovered = useGame((s) => s.save.discovered);
  const { signs, villagers, discoveries } = useIsland();
  return (
    <div className="world-labels" aria-hidden={false}>
      {signs.map((spec) => {
        const line = spec.openWith && !unlocked[spec.openWith] && spec.closedLine ? spec.closedLine : spec.line;
        return <Sign key={spec.id + line.t} spec={{ ...spec, line }} />;
      })}
      {villagers.map((v) => (
        <VillagerTag key={v.id} id={v.id} unlocked={unlocked[v.id]} />
      ))}
      {discovered
        .filter((id) => discoveries.some((d) => d.id === id))
        .map((id) => (
          <FoundLabel key={id} id={id} />
        ))}
    </div>
  );
}
