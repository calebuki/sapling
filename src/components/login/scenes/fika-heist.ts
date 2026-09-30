import * as THREE from "three";
import {
  at, bezier, body, checks, clamp, clock, doubleSided, fir, flap, G, group, gull, house, leafGeometry, lerp, makeWorld, mapped,
  palette, part, pick, rand, signBoard, smooth, stepBody, stripes, Swarm, V, villager, waveSea, type Body, type LoginScene, type Tag,
} from "./kit";

// Bosse carries fika across the pier at Café Kanel; a gull dives in for a
// cinnamon bun and the tray, cups and buns hang in the air.

const T = 3.4;
const HIT = 0.33;

function cup() {
  const g = new THREE.Group();
  part(G.cyl, "#ffffff", [0, 0.02, 0], [0.26, 0.04, 0.26], g, { surface: null });
  part(G.cyl, "#ffffff", [0, 0.19, 0], [0.16, 0.3, 0.16], g, { surface: null });
  part(G.cyl, "#5a3522", [0, 0.335, 0], [0.14, 0.02, 0.14], g, { surface: null });
  part(new THREE.TorusGeometry(0.08, 0.03, 5, 8), "#ffffff", [0.2, 0.2, 0], 1, g, { surface: null });
  return g;
}
function bun() {
  const g = new THREE.Group();
  part(G.sph, "#c98a4b", [0, 0.12, 0], [0.27, 0.15, 0.27], g);
  part(new THREE.TorusGeometry(0.13, 0.05, 5, 10), "#9b6230", [0, 0.22, 0], 1, g, { r: [Math.PI / 2, 0, 0] });
  for (let i = 0; i < 5; i++) part(G.box, "#ffffff", [Math.cos(i * 1.3) * 0.12, 0.26, Math.sin(i * 1.3) * 0.12], 0.05, g, { shadow: false, surface: null });
  return g;
}

type Item = Body & { local: THREE.Vector3; word?: string; meaning?: string; kind: "cup" | "bun" | "stolen" };

export function fikaHeist(): LoginScene {
  const world = makeWorld({ top: "#94cfe8", bottom: "#fbe5c6", sun: [0.45, 0.9, 0.55], water: "#76cbe5", amp: 0.22, shadow: 16 });
  const s = world.root;
  for (let z = -6.2; z <= 4.3; z += 0.55) part(G.box, Math.round(z / 0.55) % 3 ? palette.plank : "#a87c52", [0, 0.95, z], [18, 0.5, 0.5], s, { surface: "planks" });
  for (const x of [-8.5, -3, 3, 8.5]) for (const z of [-6.2, 4.2]) part(G.cyl, palette.woodDark, [x, -0.8, z], [0.22, 3.4, 0.22], s, { surface: "bark" });
  for (const x of [-8.8, 8.8]) {
    for (let z = -5.5; z <= 4; z += 1.9) part(G.box, palette.woodDark, [x, 1.65, z], [0.12, 0.9, 0.12], s);
    part(G.box, palette.wood, [x, 2.1, -0.8], [0.16, 0.1, 10], s);
  }
  s.add(at(house({ w: 10, d: 4, h: 3.2, door: 2.6 }), [-1, 1.2, -5.2]));
  part(new THREE.PlaneGeometry(4, 0.8), mapped(signBoard("CAFÉ KANEL", "#3f7d4f", "#fffaf0", palette.yellow)), [-1, 3.95, -3.12], 1, s, { shadow: false });
  part(G.box, mapped(stripes(palette.falu, "#ffffff", 8)), [-2.8, 2.9, -2.55], [3.4, 0.08, 1.4], s, { r: [0.4, 0, 0] });
  const table = group(s, [4.2, 1.2, 0.2]);
  part(G.cyl, mapped(checks("#ffffff", palette.blue)), [0, 1.0, 0], [1.1, 0.08, 1.1], table);
  part(G.cyl, "#3a3d45", [0, 0.5, 0], [0.08, 1, 0.08], table);
  part(G.cyl, palette.blue, [0.3, 1.19, -0.2], [0.1, 0.3, 0.1], table);
  part(G.sph, palette.yellow, [0.3, 1.42, -0.2], 0.14, table);
  part(G.cyl, "#f3efe6", [0, 1.7, 0], [0.05, 3.4, 0.05], table);
  part(G.cone, mapped(stripes(palette.yellow, "#ffffff", 8)), [0, 3.5, 0], [2.3, 0.9, 2.3], table);
  for (const [x, z, r] of [[1.3, 0.3, -1.6], [-0.2, 1.3, 0.1]]) {
    const ch = group(table, [x, 0, z], r);
    part(G.box, palette.blue, [0, 0.6, 0], [0.7, 0.08, 0.7], ch);
    part(G.box, palette.blue, [0, 1.0, 0.31], [0.7, 0.8, 0.08], ch);
    for (const lx of [-0.3, 0.3]) for (const lz of [-0.3, 0.3]) part(G.box, "#3a3d45", [lx, 0.3, lz], [0.06, 0.6, 0.06], ch);
  }
  const far = group(s, [-14, 0, -42]);
  part(G.cyl, palette.leaf, [0, 0.2, 0], [17, 2, 17], far, { surface: "turf" });
  for (const [x, z, c] of [[-6, 0, palette.falu], [-1, -3, palette.yellow], [4, 1, palette.falu]] as const) far.add(at(house({ wall: c }), [x, 1.2, z + 6]));
  for (let i = 0; i < 10; i++) far.add(at(fir(rand(1, 1.6)), [rand(-13, 13), 1.2, rand(-10, 0)]));

  const bosse = villager("bosse");
  bosse.g.rotation.y = Math.PI / 2;
  s.add(bosse.g);
  const tray = group(s);
  part(G.box, "#c79a62", [0, 0, 0], [1.5, 0.06, 1.0], tray, { surface: "planks" });
  for (const [x, z, w, d] of [[0, 0.5, 1.5, 0.05], [0, -0.5, 1.5, 0.05], [0.75, 0, 0.05, 1], [-0.75, 0, 0.05, 1]]) part(G.box, "#a67c4a", [x, 0.05, z], [w, 0.1, d], tray);
  const item = (obj: THREE.Object3D, local: [number, number, number], kind: Item["kind"], word?: string, meaning?: string): Item => {
    s.add(obj);
    return { ...body(obj, 1.22), local: V(...local), kind, word, meaning };
  };
  const items: Item[] = [
    item(cup(), [-0.35, 0.03, -0.2], "cup", "kaffe", "coffee"),
    item(cup(), [0.38, 0.03, 0.22], "cup"),
    item(bun(), [0.32, 0.03, -0.24], "bun", "kanelbulle", "cinnamon bun"),
    item(bun(), [-0.3, 0.03, 0.26], "bun"),
    item(bun(), [0.02, 0.03, 0.02], "stolen"),
  ];
  const trayBody = body(tray, 1.26);
  const gm = gull();
  gm.g.scale.setScalar(1.7);
  s.add(gm.g);
  const coffee = new Swarm(s, G.ico, 40);
  const feathers = new Swarm(s, leafGeometry, 6, doubleSided());

  let p = 0;
  let prevP = 0;
  let launched = false;
  let hitPos = V(0.9, 2.9, 1.2);
  const gullAt = (q: number) => {
    const hit = hitPos.clone().add(V(0.1, 0.45, 0));
    return q < HIT ? bezier(V(10, 9, -7), V(5, 2.2, 4), hit, smooth(0, HIT, q)) : bezier(hit, V(-2, 3.2, 3.5), V(-14, 9, 5), clamp((q - HIT) / 0.6, 0, 1));
  };
  const reset = () => {
    coffee.clear();
    feathers.clear();
    launched = false;
    prevP = 0;
    for (const it of items) {
      it.rest = false;
      it.obj.rotation.set(0, 0, 0);
    }
    trayBody.rest = false;
  };
  const launch = () => {
    launched = true;
    tray.updateMatrixWorld(true);
    trayBody.pos.copy(tray.position);
    trayBody.vel.set(1.2, 2.6, 0.4);
    trayBody.spin.set(0.6, 0.4, 3.2);
    for (const it of items) {
      it.pos.copy(tray.localToWorld(it.local.clone()));
      it.rest = false;
      it.vel.set(rand(-0.6, 3.2), rand(3, 5.6), rand(-2.2, 2.4));
      it.spin.set(rand(-4, 4), rand(-3, 3), rand(-5, 5));
      if (it.kind === "cup")
        coffee.burst(12, it.pos.clone().add(V(0, 0.3, 0)), () => ({
          vel: it.vel.clone().multiplyScalar(rand(0.7, 1.05)).add(V(rand(-0.7, 0.7), rand(-0.2, 1), rand(-0.7, 0.7))),
          g: -4.5,
          drag: 0.2,
          life: rand(2.4, 3),
          size: rand(0.08, 0.13),
          color: pick(["#5a3522", "#7a4a2c"]),
          floor: 1.25,
        }));
    }
    for (let i = 0; i < 5; i++)
      feathers.emit({ pos: gm.g.position.clone(), vel: V(rand(-1.5, 1.5), rand(-0.5, 1.5), rand(-1.5, 1.5)), g: -0.6, drag: 0.8, flutter: 1.5, spin: V(rand(-3, 3), rand(-3, 3), rand(-3, 3)), life: 3.5, size: rand(0.6, 0.9), color: pick(["#ffffff", "#b8bfc8"]) });
  };

  return {
    island: "Lilla Ö",
    title: "Fika heist",
    slow: 0.5,
    beat: T * 0.985,
    warm: 0,
    fadeColor: "#fbe5c6",
    world,
    reset,
    update(dt) {
      const t = clock.t;
      waveSea(world);
      p = (t / T) % 1;
      if (p < prevP) reset();
      const walk = clamp(p / HIT, 0, 1);
      bosse.g.position.set(p < HIT ? lerp(-4.6, 0.1, walk) : 0.1 + smooth(HIT, 0.6, p) * 0.7, 1.2, 1.2);
      if (p < HIT) {
        const ph = t * 9;
        bosse.legL.rotation.x = Math.sin(ph) * 0.5;
        bosse.legR.rotation.x = -Math.sin(ph) * 0.5;
        bosse.armL.rotation.set(-1.35, 0, 0);
        bosse.armR.rotation.set(-1.35, 0, 0);
        bosse.body.rotation.set(0.05, 0, 0);
        bosse.g.position.y = 1.2 + Math.abs(Math.sin(ph)) * 0.05;
        bosse.setFace("happy");
      } else {
        const k = smooth(HIT, HIT + 0.08, p);
        bosse.body.rotation.set(-0.4 * k, 0, Math.sin(t * 3) * 0.08 * k);
        bosse.armL.rotation.set(lerp(-1.35, -2.9, k) + Math.sin(t * 7) * 0.25 * k, 0, -0.4 * k);
        bosse.armR.rotation.set(lerp(-1.35, -2.6, k) - Math.sin(t * 6) * 0.25 * k, 0, 0.5 * k);
        bosse.legL.rotation.x = lerp(0, -0.7, k);
        bosse.legR.rotation.x = lerp(0, 0.5, k);
        bosse.setFace("talk");
      }
      bosse.g.updateMatrixWorld(true);
      if (!launched) {
        const hl = bosse.handL.getWorldPosition(V());
        const hr = bosse.handR.getWorldPosition(V());
        tray.position.copy(hl).add(hr).multiplyScalar(0.5).add(V(0.15, 0.1, 0));
        tray.rotation.set(0, 0, Math.sin(t * 9) * 0.02);
        hitPos = tray.position.clone();
        tray.updateMatrixWorld(true);
        for (const it of items) {
          it.obj.position.copy(tray.localToWorld(it.local.clone()));
          it.obj.rotation.copy(tray.rotation);
        }
      }
      const prev = prevP;
      prevP = p;
      if (!launched && prev < HIT && p >= HIT) launch();
      const gp = gullAt(p);
      const gn = gullAt(Math.min(0.999, p + 0.01));
      gm.g.position.copy(gp);
      if (gn.distanceToSquared(gp) > 1e-6) gm.g.lookAt(gn);
      flap(gm, p < HIT - 0.06 ? 0.15 : p < HIT + 0.05 ? 0.9 : Math.sin(t * 13) * 0.9);
      if (launched) {
        stepBody(trayBody, dt);
        gm.g.updateMatrixWorld(true);
        for (const it of items) {
          if (it.kind === "stolen") {
            it.obj.position.copy(gm.g.localToWorld(V(0, -0.1, 0.75)));
            it.obj.rotation.set(0.6, t, 0);
          } else stepBody(it, dt);
        }
      }
      coffee.update(dt);
      feathers.update(dt);
    },
    shot() {
      const push = smooth(0.18, 0.45, p);
      return { target: V(lerp(-0.8, 1.4, push), 2.8, 1.0), yaw: 0.95, pitch: 0.13, dist: 15 - push * 2.5, fov: 40 };
    },
    tags() {
      const a = smooth(HIT + 0.02, HIT + 0.08, p) * (1 - smooth(0.86, 0.92, p));
      const out: Tag[] = [];
      for (const it of items) if (it.word && it.meaning) out.push({ pos: it.obj.position.clone().add(V(0, 0.35, 0)), word: it.word, meaning: it.meaning, lang: "sv", alpha: a });
      out.push({ pos: gm.g.position.clone().add(V(0, 0.6, 0)), word: "måsen", meaning: "the gull", lang: "sv", alpha: smooth(0.08, 0.16, p) * (1 - smooth(0.8, 0.88, p)) });
      return out;
    },
    fade: () => Math.max(1 - smooth(0, 0.05, p), smooth(0.92, 0.99, p)),
  };
}
