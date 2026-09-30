import * as THREE from "three";
import {
  at, clock, cloud, doubleSided, fir, G, group, hatOnHead, house, leafGeometry, makeWorld, palette, part, pick, rand, smooth,
  Swarm, TAU, UP, V, villager, waveSea, type LoginScene, type Tag,
} from "./kit";

// A gale through the Great Tree on Lilla Ö: Astrid's sunhat takes off, leaves
// blow past the camera and the sapling clings to the trunk.

const LEAF = ["#5c9a47", "#8ec25e", "#3f7d4f", "#f4c24a", "#e0913a"];
const BLOBS = [[0, 0, 0, 2.6], [1.9, -0.4, 0.6, 2], [-1.9, -0.2, 0.4, 2.1], [0.6, 1.3, -0.6, 1.9], [-0.8, 1, 1.2, 1.7], [0.4, -0.6, -1.9, 1.9], [-1.2, -0.9, -1.2, 1.6]];
const windDir = V(-0.28, 0, 1).normalize();
const windSide = V(windDir.z, 0, -windDir.x);
const HAT_LOOP = 6;

export function wordsOnTheWind(): LoginScene {
  const world = makeWorld({ top: "#7cc4e2", bottom: "#f3dcb8", sun: [-0.7, 0.9, 0.2], water: "#76cbe5", amp: 0.3 });
  const s = world.root;
  part(G.cyl, palette.sand, [0, 0.2, 0], [11, 1.6, 11], s);
  part(G.cyl, palette.leaf, [0, 1.2, 0], [9.2, 0.8, 9.2], s, { surface: "turf" });
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05 + 0.3;
    part(G.ico, palette.stone, [Math.cos(a) * 10.6, 0.6, Math.sin(a) * 10.6], rand(0.6, 1.1), s, { surface: "stone" });
  }
  for (const [x, z, sc] of [[-5, -4, 1.1], [-6.6, -0.8, 0.9], [-3, -6.4, 1.2], [5.5, -5, 1]]) s.add(at(fir(sc), [x, 1.6, z]));
  const cottage = house({ w: 3.6, d: 3.2, h: 2.2 });
  cottage.position.set(-6.5, 1.6, -5.5);
  cottage.rotation.y = 0.5;
  cottage.scale.setScalar(0.8);
  s.add(cottage);

  const tree = group(s, [2, 1.6, -2]);
  part(G.cyl, palette.woodDark, [0, 3, 0], [0.7, 6, 0.7], tree, { surface: "bark" });
  part(G.cyl, palette.woodDark, [-0.9, 4.6, 0], [0.22, 2.6, 0.22], tree, { r: [0, 0, 0.9], surface: "bark" });
  part(G.cyl, palette.woodDark, [1, 4.3, 0.3], [0.2, 2.4, 0.2], tree, { r: [0, 0, -0.9], surface: "bark" });
  const canopy = group(tree, [0, 6.9, 0]);
  const blobs = BLOBS.map(([x, y, z, r], i) => {
    const m = part(G.sph, [palette.leaf, palette.leafLight, "#4f8a3e"][i % 3], [x, y, z], r, canopy, { surface: "leaves" });
    m.userData.base = m.position.clone();
    m.userData.r = r;
    return m;
  });
  const tufts = Array.from({ length: 28 }, (_, i) => {
    const a = rand(0, TAU);
    const r = Math.sqrt(Math.random()) * 8;
    return part(G.cone, i % 2 ? "#4f8a3e" : palette.leafLight, [Math.cos(a) * r, 1.85, Math.sin(a) * r], [0.14, 0.6, 0.14], s, { shadow: false });
  });

  const astrid = villager("astrid", { looseHat: true });
  astrid.g.position.set(-3.2, 1.6, 3);
  astrid.g.rotation.y = 0.75;
  s.add(astrid.g);
  const hat = astrid.hat!;
  s.add(hat);

  // the sapling, holding on
  const sap = group(s, [2.1, 2.3, -1.05]);
  part(G.round, "#7cc97a", [0, 0, 0], 0.9, sap, { surface: null });
  part(G.round, "#b9e6a6", [0, -0.12, 0.3], [0.6, 0.45, 0.3], sap, { surface: null });
  for (const x of [-0.16, 0.16]) part(G.box, "#2c2a3d", [x, 0.12, 0.46], [0.08, 0.13, 0.04], sap, { shadow: false, surface: null });
  part(G.cyl, "#26794c", [0, 0.6, 0], [0.05, 0.36, 0.05], sap);
  const sapLeaves = [-1, 1].map((sd) => {
    const p = group(sap, [0, 0.76, 0]);
    part(G.sph, sd > 0 ? "#4fbf7d" : "#3aa56b", [0.3 * sd, 0, 0], [0.35, 0.07, 0.18], p, { surface: null });
    return p;
  });

  const leaves = new Swarm(s, leafGeometry, 40, doubleSided());
  const streaks = Array.from({ length: 5 }, () => {
    const geo = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 7 }, (_, k) => V(0, Math.sin(k * 0.8) * 0.18, k * 0.9)));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.55 }));
    line.rotation.y = Math.atan2(windDir.x, windDir.z);
    line.userData = { o: rand(0, 60), y: rand(3, 10), x: rand(-12, 12), sp: rand(12, 16) };
    s.add(line);
    return line;
  });
  for (const [x, z, r] of [[-40, -70, 9], [30, -80, 12], [70, -55, 7]]) part(G.sph, palette.leaf, [x, 0, z], [r, r * 0.3, r], s, { shadow: false });
  const clouds = [[-30, 22, -70, 2], [15, 26, -90, 2.6], [50, 20, -60, 1.6]].map(([x, y, z, sc]) => {
    const c = cloud(sc);
    c.position.set(x, y, z);
    c.userData.x = x;
    s.add(c);
    return c;
  });

  let acc = 0;
  let n = 0;
  let q = 0;
  const gust = () => 0.62 + 0.38 * Math.sin(clock.t * 0.45) + 0.12 * Math.sin(clock.t * 1.7);
  const spawn = (dt: number, g: number) => {
    acc += dt * (1.6 + 2.2 * g);
    tree.updateMatrixWorld(true);
    while (acc > 1) {
      acc -= 1;
      const b = pick(blobs);
      const pos = b.getWorldPosition(V()).add(V(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar((b.userData.r as number) * 0.9));
      const tagged = n++ % 4 === 0;
      leaves.emit({
        pos,
        vel: windDir.clone().multiplyScalar(rand(4, 7) * g).add(V(rand(-1.2, 1.2), rand(0, 1.8), 0)),
        g: -0.6,
        drag: 0.04,
        flutter: rand(0.8, 2),
        spin: V(rand(-3, 3), rand(-3, 3), rand(-3, 3)),
        life: rand(6, 8),
        size: tagged ? 1.9 : rand(1.2, 1.6),
        color: tagged ? palette.yellow : pick(LEAF),
        tag: tagged ? { word: "lövet", meaning: "the leaf" } : undefined,
        fadeIn: 0.3,
      });
    }
  };

  return {
    island: "Lilla Ö",
    title: "Words on the wind",
    slow: 0.6,
    beat: HAT_LOOP * 0.98,
    warm: 0,
    fadeColor: "#f3dcb8",
    world,
    reset() {
      leaves.clear();
      acc = 0;
      n = 0;
      // open mid-gale: blow a few seconds of leaves without moving the hat
      for (let t = 0; t < 3; t += 1 / 30) {
        spawn(1 / 30, 0.8);
        leaves.update(1 / 30);
      }
    },
    update(dt) {
      const g = gust();
      const t = clock.t;
      waveSea(world);
      tree.rotation.x = 0.035 * g + Math.sin(t * 1.3) * 0.02 * g;
      blobs.forEach((b, i) => b.position.copy(b.userData.base as THREE.Vector3).addScaledVector(windDir, 0.35 * g + Math.sin(t * 2.1 + i) * 0.22 * g));
      tufts.forEach((tuft, i) => {
        tuft.rotation.x = 0.55 * g + Math.sin(t * 3 + i) * 0.15;
        tuft.rotation.z = 0.15 * g;
      });
      q = (t % HAT_LOOP) / HAT_LOOP;
      astrid.body.rotation.x = 0.22 * g;
      astrid.armR.rotation.set(-0.4, 0, 2.4 + Math.sin(t * 3) * 0.2);
      astrid.armL.rotation.z = -1.0 - Math.sin(t * 5) * 0.3;
      astrid.legR.rotation.x = -0.35;
      astrid.legL.rotation.x = 0.3;
      astrid.head.rotation.x = -0.25;
      astrid.setFace(q > 0.05 && q < 0.8 ? "talk" : "think");
      const h = hatOnHead(astrid);
      hat.position.copy(h.pos).addScaledVector(windDir, q * q * 26).addScaledVector(UP, Math.sin(q * Math.PI) * 3.5 + q * 3).addScaledVector(windSide, Math.sin(q * 5) * 1.2);
      hat.quaternion.copy(h.quat).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(q * 7, q * 3, Math.sin(q * 6) * 1.1)));
      hat.scale.copy(h.scale).multiplyScalar(smooth(0, 0.04, q) * (1 - smooth(0.88, 1, q)) + 1e-3);
      sapLeaves[0].rotation.z = 0.5 + Math.sin(t * 24) * 0.5 * g;
      sapLeaves[1].rotation.z = -0.5 - Math.sin(t * 24 + 1) * 0.5 * g;
      sap.rotation.x = 0.3 * g;
      sap.scale.set(1, 0.92, 1.1);
      spawn(dt, g);
      leaves.update(dt);
      for (const l of streaks) {
        const u = l.userData as { o: number; y: number; x: number; sp: number };
        const d = ((t * u.sp + u.o) % 60) - 30;
        l.position.set(u.x + windDir.x * d, u.y + Math.sin(t + u.o) * 0.3, windDir.z * d);
      }
      clouds.forEach((c, i) => {
        c.position.x = (c.userData.x as number) + t * (0.6 + i * 0.2);
      });
    },
    shot: () => ({ target: V(0, 3.4, 0), yaw: 0.62, pitch: 0.24, dist: 27, fov: 38 }),
    tags() {
      // one leaf tagged at a time, plus the things around the island
      const out: Tag[] = [];
      const leaf = leaves.list.find((p) => p.tag && p.age / p.life < 0.9);
      if (leaf?.tag) out.push({ pos: leaf.pos, word: leaf.tag.word, meaning: leaf.tag.meaning, lang: "sv", alpha: smooth(0.4, 1.2, leaf.age) * (1 - smooth(0.75, 0.9, leaf.age / leaf.life)) });
      out.push({ pos: V(2, 11.2, -2), word: "trädet", meaning: "the tree", lang: "sv", alpha: 1 });
      out.push({ pos: V(-14, 0.4, 3), word: "havet", meaning: "the sea", lang: "sv", alpha: 1 });
      out.push({ pos: V(-6.5, 5.2, -5.5), word: "stugan", meaning: "the cottage", lang: "sv", alpha: 1 });
      out.push({ pos: hat.position, word: "solhatten", meaning: "the sunhat", lang: "sv", alpha: smooth(0.08, 0.16, q) * (1 - smooth(0.7, 0.82, q)) });
      return out;
    },
    fade: () => 0,
  };
}
