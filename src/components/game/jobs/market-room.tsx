"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { Clothing, ProduceModel, RailItem } from "@/lib/game/market";
import { runtime } from "../store";
import { Character, type CharacterAnim } from "../world/character";
import { glow, toon } from "../world/materials";
import { box, Box, cone, cyl, sphere } from "../world/parts";
import { ShiftProjector } from "./anchors";
import { BASKET_X, COUNTER, COUNTER_SPOT, crateX, hangerX, HOST_SPOT, RAIL, TILL_X, VIEWS } from "./market-layout";
import { addProduce, anythingElse, currentCustomer, getMarket, hoverCrate, marketRuntime, marketSetup, takeFromRail, takePayment, tellPrice, tickMarket, useMarket, type MarketSetup } from "./market-store";
import { click, emoteOf, JobCamera, JobPlayer, OutdoorSun, useHover } from "./job-scene";

// Marie's stall on a sunny market morning: a striped awning over crates of
// fruit and vegetables, the basket and till at the end of the counter, and a
// rail of clothes beside it. Half-timbered houses close off the square.

const c = { cobble: "#b3a690", cobbleDark: "#9c8f7a", wood: "#8a5a36", dark: "#5b3a24", plaster: "#f6efe2", beam: "#5b3a24" };

export function MarketRoom() {
  const setup = marketSetup();
  const step = useMarket((s) => s.step);
  const customer = useMarket(() => currentCustomer());
  useFrame((_, delta) => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __market: unknown }).__market = { getMarket, addProduce, anythingElse, takeFromRail, tellPrice, takePayment };
    tickMarket(Math.min(delta, 0.05));
  });
  if (!setup) return null;
  const atRail = customer?.kind === "clothes" && (step === "clothes" || step === "trying");
  const view = atRail ? VIEWS.rail : VIEWS.stall;
  return (
    <>
      <color attach="background" args={["#a9d8ee"]} />
      <fog attach="fog" args={["#d8ecf2", 30, 80]} />
      <group>
        <hemisphereLight args={["#d6e8f5", "#6f6248", 0.7]} />
        <OutdoorSun position={[6, 14, 9]} intensity={1.9} color="#fff1d6" />
        <Square />
        <Stall setup={setup} />
        <Rail />
        <Host setup={setup} />
        <Shopper />
        <JobPlayer>
          <Carried />
        </JobPlayer>
        <JobCamera position={view.position} target={view.target} />
        <ShiftProjector />
      </group>
    </>
  );
}

// ---------- The square ----------

function Square() {
  const stones = useMemo(() => {
    const items: Array<[number, number, string]> = [];
    for (let x = -12; x <= 12; x += 1.1) for (let z = -6; z <= 6; z += 1.1) items.push([x + ((z * 7) % 3) * 0.15, z, (x + z) % 3 ? c.cobble : c.cobbleDark]);
    return items;
  }, []);
  return (
    <group>
      <Box p={[0, -0.1, 0]} s={[30, 0.2, 16]} c={c.cobble} t="stone" shadow={false} />
      {stones.map(([x, z, colour], i) => (
        <mesh key={i} geometry={box} material={toon(colour, { surface: "stone" })} position={[x, 0.01, z]} scale={[1.0, 0.04, 1.0]} />
      ))}
      {/* houses closing off the back of the square */}
      {[-9, -4.5, 0, 4.5, 9].map((x, i) => (
        <group key={x} position={[x, 0, -6.5]}>
          <Box p={[0, 2.6, 0]} s={[4.2, 5.2, 2.5]} c={i % 2 ? "#f3e3c3" : c.plaster} t="plaster" />
          {[-1.4, 0, 1.4].map((bx) => (
            <Box key={bx} p={[bx, 2.6, 1.27]} s={[0.12, 5.2, 0.05]} c={c.beam} shadow={false} />
          ))}
          <Box p={[0, 2.6, 1.27]} s={[4.2, 0.12, 0.05]} c={c.beam} shadow={false} />
          <mesh geometry={cone} material={toon(i % 2 ? "#a8432f" : "#8b3a2a")} position={[0, 6.3, 0]} rotation-y={Math.PI / 4} scale={[3.3, 2.4, 2.2]} castShadow />
          {[-1, 1].map((wx) => (
            <mesh key={wx} geometry={box} material={glow("#ffe2a8", 0.6)} position={[wx * 0.8, 3.4, 1.29]} scale={[0.6, 0.8, 0.04]} />
          ))}
        </group>
      ))}
      {/* a fountain and a tub of flowers for colour */}
      <group position={[-7, 0, 1.5]}>
        <mesh geometry={cyl} material={toon("#b8b0a2", { surface: "stone" })} position={[0, 0.35, 0]} scale={[1.2, 0.7, 1.2]} />
        <mesh geometry={cyl} material={toon("#6fc3d9", { surface: null })} position={[0, 0.66, 0]} scale={[1.05, 0.06, 1.05]} />
        <mesh geometry={cyl} material={toon("#b8b0a2")} position={[0, 1.2, 0]} scale={[0.15, 1.2, 0.15]} />
      </group>
      <group position={[-5.4, 0, 3.4]}>
        <mesh geometry={cyl} material={toon(c.wood, { surface: "planks" })} position={[0, 0.3, 0]} scale={[0.6, 0.6, 0.6]} />
        {["#ff6f91", "#ffd35c", "#ffffff", "#c99ae8"].map((col, i) => (
          <mesh key={col} geometry={sphere} material={toon(col, { surface: null })} position={[Math.cos(i * 1.6) * 0.3, 0.75, Math.sin(i * 1.6) * 0.3]} scale={0.18} />
        ))}
      </group>
    </group>
  );
}

// ---------- The stall ----------

function Stall({ setup }: { setup: MarketSetup }) {
  const { minX, maxX, z, depth, top } = COUNTER;
  const width = maxX - minX;
  const mid = (minX + maxX) / 2;
  return (
    <group>
      {/* posts and the striped awning */}
      {[minX - 0.1, maxX + 0.1].flatMap((x) => [-0.9, z + depth / 2].map((pz) => <Box key={`${x}${pz}`} p={[x, 1.4, pz]} s={[0.1, 2.8, 0.1]} c={c.beam} />))}
      {Array.from({ length: 12 }, (_, i) => (
        <Box key={i} p={[minX + (i + 0.5) * (width / 12), 2.9, -0.2]} s={[width / 12, 0.08, 2.2]} r={[0.22, 0, 0]} c={i % 2 ? "#ffffff" : "#2f8f4f"} t="fabric" />
      ))}
      <Box p={[mid, 0.5, z]} s={[width, top, depth]} c={c.wood} t="planks" />
      <Box p={[mid, top + 0.03, z]} s={[width + 0.1, 0.06, depth + 0.1]} c="#a0764a" />
      {setup.market.produce.map((p, i) => (
        <Crate key={p.slug} slug={p.slug} x={crateX(i)} model={p.model} colour={p.color} enabled={setup.produce.includes(p.slug)} onPick={() => addProduce(p.slug)} />
      ))}
      <BasketModel />
      {/* the till, the cash box and the card reader */}
      <group position={[TILL_X, top, z - 0.1]}>
        <Box p={[0, 0.2, 0]} s={[0.55, 0.4, 0.45]} c="#3d3d3d" />
        <mesh geometry={box} material={glow("#9fe8b0", 0.9)} position={[0, 0.48, -0.05]} rotation-x={-0.4} scale={[0.4, 0.18, 0.02]} />
      </group>
      <PayPoint at={[TILL_X - 0.35, top, z + 0.32]} kind="cash" />
      <PayPoint at={[TILL_X + 0.3, top, z + 0.32]} kind="card" />
      {/* the price board */}
      <group position={[minX - 0.5, 0, z + 0.9]}>
        <Box p={[0, 0.9, 0]} s={[0.08, 1.8, 0.08]} c={c.beam} />
        <Box p={[0, 1.6, 0.06]} s={[1.0, 0.8, 0.06]} c="#2d3436" />
      </group>
    </group>
  );
}

function Crate({ slug, x, model, colour, enabled, onPick }: { slug: string; x: number; model: ProduceModel; colour: string; enabled: boolean; onPick: () => void }) {
  const { hover, handlers: hovering } = useHover();
  const handlers = {
    onPointerOver: (e: Parameters<typeof hovering.onPointerOver>[0]) => {
      hovering.onPointerOver(e);
      hoverCrate(slug);
    },
    onPointerOut: () => {
      hovering.onPointerOut();
      hoverCrate(null);
    },
  };
  const pieces = useMemo(() => Array.from({ length: model === "cherry" || model === "strawberry" ? 9 : 5 }, (_, i) => i), [model]);
  return (
    <group position={[x, COUNTER.top, COUNTER.z + 0.1]} onClick={enabled ? click(onPick) : undefined} {...(enabled ? handlers : {})}>
      <group rotation-x={0.35} scale={hover ? 1.1 : 1}>
        <Box p={[0, 0.1, 0]} s={[0.5, 0.2, 0.6]} c="#b98a55" t="planks" />
        {pieces.map((i) => (
          <Produce key={i} model={model} colour={colour} at={[((i % 3) - 1) * 0.13, 0.24 + Math.floor(i / 3) * 0.02, (Math.floor(i / 3) - 1) * 0.15]} />
        ))}
      </group>
      {hover ? <mesh geometry={cyl} material={glow("#ffe9a8", 1.1)} position={[0, 0.01, 0.35]} scale={[0.3, 0.01, 0.15]} /> : null}
    </group>
  );
}

// Fruit and vegetables, roughly the right shape at a glance.
function Produce({ model, colour, at }: { model: ProduceModel; colour: string; at: [number, number, number] }) {
  const m = toon(colour, { surface: null });
  switch (model) {
    case "cherry":
      return <mesh geometry={sphere} material={m} position={at} scale={0.045} />;
    case "strawberry":
    case "carrot":
      return <mesh geometry={cone} material={m} position={at} rotation-x={model === "carrot" ? Math.PI / 2 : Math.PI} scale={model === "carrot" ? [0.04, 0.22, 0.04] : [0.05, 0.08, 0.05]} />;
    case "banana":
      return <mesh geometry={cyl} material={m} position={at} rotation-z={1.2} scale={[0.035, 0.18, 0.035]} />;
    case "pear":
      return <mesh geometry={sphere} material={m} position={at} scale={[0.06, 0.085, 0.06]} />;
    case "potato":
      return <mesh geometry={sphere} material={m} position={at} scale={[0.075, 0.05, 0.06]} />;
    case "onion":
      return (
        <group position={at}>
          <mesh geometry={sphere} material={m} scale={0.065} />
          <mesh geometry={cone} material={m} position={[0, 0.07, 0]} scale={[0.02, 0.05, 0.02]} />
        </group>
      );
    default:
      return <mesh geometry={sphere} material={m} position={at} scale={model === "tomato" ? [0.07, 0.055, 0.07] : 0.065} />;
  }
}

// The wicker basket fills up as you add things.
function BasketModel() {
  const basket = useMarket((s) => s.basket);
  const setup = marketSetup();
  const items = useMemo(() => {
    const out: Array<{ model: ProduceModel; colour: string }> = [];
    for (const [slug, n] of Object.entries(basket)) {
      const p = setup?.market.produce.find((x) => x.slug === slug);
      if (p) for (let i = 0; i < Math.min(n * (p.by === "kilo" ? 3 : 1), 9); i++) out.push({ model: p.model, colour: p.color });
    }
    return out.slice(0, 14);
  }, [basket, setup]);
  return (
    <group position={[BASKET_X, COUNTER.top, COUNTER.z]}>
      <mesh geometry={cyl} material={toon("#c8a165", { surface: "planks" })} position={[0, 0.16, 0]} scale={[0.36, 0.32, 0.3]} />
      <mesh geometry={cyl} material={toon("#7a5a36", { surface: null })} position={[0, 0.33, 0]} scale={[0.37, 0.03, 0.31]} />
      <mesh geometry={box} material={toon("#7a5a36")} position={[0, 0.55, 0]} rotation-z={Math.PI / 2} scale={[0.04, 0.04, 0.04]} />
      {items.map((it, i) => (
        <Produce key={i} model={it.model} colour={it.colour} at={[((i % 4) - 1.5) * 0.12, 0.32 + Math.floor(i / 4) * 0.05, ((Math.floor(i / 4) % 2) - 0.5) * 0.12]} />
      ))}
    </group>
  );
}

function PayPoint({ at, kind }: { at: [number, number, number]; kind: "cash" | "card" }) {
  const step = useMarket((s) => s.step);
  const { hover, handlers } = useHover();
  const active = step === "pay";
  return (
    <group position={at} onClick={active ? click(() => takePayment(kind)) : undefined} {...(active ? handlers : {})} scale={hover ? 1.15 : 1}>
      {kind === "cash" ? (
        <>
          <Box p={[0, 0.09, 0]} s={[0.42, 0.18, 0.28]} c="#2f8f4f" />
          <Box p={[0, 0.19, 0]} s={[0.3, 0.02, 0.16]} c="#c8e6b4" shadow={false} />
        </>
      ) : (
        <>
          <Box p={[0, 0.1, 0]} s={[0.16, 0.2, 0.26]} r={[-0.3, 0, 0]} c="#2d3436" />
          <mesh geometry={box} material={glow("#7fc8ff", 0.8)} position={[0, 0.2, -0.02]} rotation-x={-0.3} scale={[0.12, 0.02, 0.1]} />
        </>
      )}
      {hover ? <mesh geometry={cyl} material={glow("#ffe9a8", 1.1)} position={[0, 0.005, 0]} scale={[0.3, 0.01, 0.25]} /> : null}
    </group>
  );
}

// ---------- The clothes rail ----------

function Rail() {
  const customer = useMarket(() => currentCustomer());
  const carrying = useMarket((s) => s.carrying);
  const tried = useMarket((s) => s.tried);
  const rail = customer?.kind === "clothes" ? customer.rail : [];
  return (
    <group>
      {[-1, 1].map((side) => (
        <Box key={side} p={[RAIL.x + side * RAIL.halfWidth, RAIL.y / 2, RAIL.z]} s={[0.08, RAIL.y, 0.08]} c="#9aa3a8" />
      ))}
      <mesh geometry={cyl} material={toon("#9aa3a8")} position={[RAIL.x, RAIL.y, RAIL.z]} rotation-z={Math.PI / 2} scale={[0.04, RAIL.halfWidth * 2, 0.04]} />
      {[-1, 1].map((side) => (
        <Box key={side} p={[RAIL.x + side * RAIL.halfWidth, 0.03, RAIL.z]} s={[0.15, 0.06, 0.9]} c="#7d868b" />
      ))}
      {/* a long mirror for trying things on */}
      <group position={[RAIL.x + RAIL.halfWidth + 0.9, 0, RAIL.z + 0.2]} rotation-y={-0.5}>
        <Box p={[0, 1.1, 0]} s={[0.8, 2.2, 0.08]} c={c.wood} />
        <mesh geometry={box} material={glow("#dff2fb", 0.7)} position={[0, 1.1, 0.05]} scale={[0.62, 1.95, 0.02]} />
      </group>
      {rail.map((r, i) => (r === carrying || (r === tried && getMarket().step === "trying") ? null : <Hanger key={i} index={i} n={rail.length} item={r} />))}
    </group>
  );
}

function Hanger({ index, n, item }: { index: number; n: number; item: RailItem }) {
  const { hover, handlers } = useHover();
  const x = hangerX(index, n);
  const scale = item.size === "small" ? 0.78 : 1;
  return (
    <group position={[x, RAIL.y, RAIL.z]} onClick={click(() => takeFromRail(index))} {...handlers}>
      <mesh geometry={cyl} material={toon("#6e4a2f")} position={[0, -0.08, 0]} scale={[0.01, 0.16, 0.01]} />
      <mesh geometry={box} material={toon("#6e4a2f")} position={[0, -0.17, 0]} scale={[0.6 * scale, 0.03, 0.03]} />
      <group position={[0, -0.18, 0]} scale={(hover ? 1.08 : 1) * scale * 1.55}>
        <Garment item={item.item} colour={item.colour.hex} />
      </group>
      {/* the size tag */}
      {item.item.sized ? (
        <mesh geometry={box} material={toon(item.size === "small" ? "#fff3c4" : "#c4e3ff", { surface: null })} position={[0.26 * scale, -0.36, 0.1]} scale={[0.1, 0.13, 0.01]} />
      ) : null}
    </group>
  );
}

// Each kind of clothing as a simple silhouette hanging from its top.
function Garment({ item, colour }: { item: Clothing; colour: string }) {
  const m = toon(colour, { surface: "fabric" });
  const trim = toon(new THREE.Color(colour).multiplyScalar(0.8).getStyle(), { surface: null });
  switch (item.model) {
    case "trousers":
      return (
        <group>
          <mesh geometry={box} material={m} position={[0, -0.06, 0]} scale={[0.4, 0.12, 0.08]} />
          {[-0.1, 0.1].map((x) => (
            <mesh key={x} geometry={box} material={m} position={[x, -0.45, 0]} scale={[0.17, 0.7, 0.08]} />
          ))}
        </group>
      );
    case "skirt":
      return (
        <group>
          <mesh geometry={box} material={trim} position={[0, -0.04, 0]} scale={[0.36, 0.07, 0.08]} />
          <mesh geometry={cone} material={m} position={[0, -0.3, 0]} scale={[0.32, 0.5, 0.1]} />
        </group>
      );
    case "dress":
      return (
        <group>
          <mesh geometry={box} material={m} position={[0, -0.15, 0]} scale={[0.32, 0.3, 0.08]} />
          <mesh geometry={cone} material={m} position={[0, -0.55, 0]} scale={[0.4, 0.6, 0.1]} />
        </group>
      );
    case "hat":
      return (
        <group position={[0, -0.25, 0]}>
          <mesh geometry={cyl} material={m} scale={[0.3, 0.03, 0.3]} />
          <mesh geometry={cyl} material={m} position={[0, 0.1, 0]} scale={[0.17, 0.2, 0.17]} />
          <mesh geometry={cyl} material={trim} position={[0, 0.03, 0]} scale={[0.175, 0.04, 0.175]} />
        </group>
      );
    case "beanie":
      return (
        <group position={[0, -0.22, 0]}>
          <mesh geometry={sphere} material={m} scale={[0.18, 0.16, 0.16]} />
          <mesh geometry={cyl} material={trim} position={[0, -0.08, 0]} scale={[0.18, 0.06, 0.16]} />
        </group>
      );
    case "scarf":
      return (
        <group>
          {[-0.08, 0.08].map((x) => (
            <mesh key={x} geometry={box} material={m} position={[x, -0.4, 0]} scale={[0.1, 0.75, 0.04]} />
          ))}
          {[-0.08, 0.08].map((x) => (
            <mesh key={x} geometry={box} material={trim} position={[x, -0.8, 0]} scale={[0.1, 0.05, 0.05]} />
          ))}
        </group>
      );
    default: {
      // Tops: a body and sleeves, longer for coats, short for T-shirts.
      const long = item.model === "coat" ? 0.95 : item.model === "jacket" ? 0.6 : 0.5;
      const sleeve = item.model === "tshirt" ? 0.16 : 0.42;
      return (
        <group>
          <mesh geometry={box} material={m} position={[0, -long / 2, 0]} scale={[0.4, long, 0.1]} />
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={box} material={m} position={[s * 0.26, -0.04 - sleeve / 2, 0]} rotation-z={s * 0.35} scale={[0.1, sleeve, 0.09]} />
          ))}
          {item.model === "shirt" || item.model === "coat" || item.model === "jacket" ? (
            <mesh geometry={box} material={trim} position={[0, -long / 2, 0.055]} scale={[0.02, long, 0.01]} />
          ) : null}
          {item.model === "pullover" ? <mesh geometry={box} material={trim} position={[0, -long + 0.03, 0]} scale={[0.41, 0.06, 0.11]} /> : null}
        </group>
      );
    }
  }
}

// Whatever you're carrying over from the rail.
function Carried() {
  const carrying = useMarket((s) => s.carrying);
  if (!carrying) return null;
  return (
    <group position={[0, 0.25, 0]} scale={0.8}>
      <Garment item={carrying.item} colour={carrying.colour.hex} />
    </group>
  );
}

// ---------- People ----------

function Host({ setup }: { setup: MarketSetup }) {
  const id = setup.host.id;
  const anim = useMemo(() => (): CharacterAnim => ({ speed: 0, talking: runtime.speaking === id, emote: emoteOf(id) }), [id]);
  return (
    <group position={[HOST_SPOT.x, 0, HOST_SPOT.z]} rotation-y={-0.3}>
      <Character look={setup.host.look} getAnim={anim} seed={5} />
    </group>
  );
}

function Shopper() {
  const look = useMarket((s) => s.look);
  const index = useMarket((s) => s.index);
  const tried = useMarket((s) => s.tried);
  const step = useMarket((s) => s.step);
  const group = useRef<THREE.Group>(null);
  const anim = useMemo(
    () => (): CharacterAnim => {
      const w = marketRuntime.customer;
      return { speed: w.path.length ? 2.6 : 0, talking: false, emote: getMarket().step === "leaving" ? "wave" : undefined };
    },
    [],
  );
  useFrame((_, delta) => {
    const w = marketRuntime.customer;
    if (!group.current) return;
    group.current.position.set(w.x, 0, w.z);
    const diff = THREE.MathUtils.euclideanModulo(w.rot - group.current.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    group.current.rotation.y += diff * Math.min(1, delta * 8);
  });
  return (
    <group ref={group} position={[COUNTER_SPOT.x, 0, 8]}>
      <Character key={index} look={look} getAnim={anim} seed={index + 9} />
      {/* holding up what they're trying on */}
      {tried && step === "trying" ? (
        <group position={[0, 1.1, 0.5]} scale={0.8}>
          <Garment item={tried.item} colour={tried.colour.hex} />
        </group>
      ) : null}
    </group>
  );
}

export function shopperHead(): [number, number, number] {
  const w = marketRuntime.customer;
  return [w.x + 0.3, 2.2, w.z];
}

export function hostHeadMarket(): [number, number, number] {
  return [HOST_SPOT.x + 0.3, 2.3, HOST_SPOT.z];
}
