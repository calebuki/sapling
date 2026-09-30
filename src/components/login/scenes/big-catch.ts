import * as THREE from "three";
import {
  at, clamp, clock, fir, flap, G, group, gull, handsMid, house, lighthouse, makeWorld, palette, part, rand, seaH, setRing,
  setTube, smooth, splashRing, Swarm, toon, UP, V, villager, waveSea, type LoginScene,
} from "./kit";

// Out by the boathouse on Lilla Ö, Nils hooks a huge fish that bursts out of
// the water mid-leap while a gull watches from a post.

const T = 3.2;
const A = V(4.6, 0, 2.4);
const B = V(8.2, 0, 3.8);

function fish() {
  const g = new THREE.Group();
  part(G.sph, "#c7d6de", [0, 0, 0], [0.28, 0.34, 1.15], g, { surface: null });
  part(G.sph, "#f7f3ea", [0, -0.1, 0.05], [0.24, 0.22, 1.0], g, { surface: null });
  part(G.sph, "#46708c", [0, 0.14, -0.05], [0.2, 0.22, 1.05], g, { surface: null });
  part(G.box, "#e98f7a", [0, 0, 0], [0.57, 0.06, 1.6], g, { shadow: false, surface: null });
  part(G.box, "#46708c", [0, 0.38, -0.1], [0.05, 0.26, 0.42], g, { r: [0.35, 0, 0], surface: null });
  part(G.box, "#46708c", [0, -0.3, -0.35], [0.05, 0.16, 0.26], g, { shadow: false, r: [-0.4, 0, 0], surface: null });
  for (const x of [-0.22, 0.22]) part(G.box, "#2c2a3d", [x, 0.08, 0.82], 0.08, g, { shadow: false, surface: null });
  const tail = group(g, [0, 0, -1.05]);
  part(G.box, "#46708c", [0, 0, -0.05], [0.06, 0.16, 0.2], tail, { shadow: false, surface: null });
  for (const sd of [-1, 1]) part(G.box, "#46708c", [0, sd * 0.24, -0.3], [0.06, 0.5, 0.34], tail, { r: [sd * 0.7, 0, 0], surface: null });
  g.scale.setScalar(1.25);
  return { g, tail };
}

function rowboat() {
  const g = new THREE.Group();
  const sh = new THREE.Shape();
  sh.moveTo(-1.7, 0);
  sh.quadraticCurveTo(-1.2, -0.75, 0, -0.8);
  sh.quadraticCurveTo(1.2, -0.75, 1.9, 0);
  sh.quadraticCurveTo(1.2, 0.75, 0, 0.8);
  sh.quadraticCurveTo(-1.2, 0.75, -1.7, 0);
  const hull = (d: number) => {
    const geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    return geo;
  };
  part(hull(0.7), palette.wood, [0, -0.35, 0], 1, g, { surface: "planks" });
  part(hull(0.05), palette.woodDark, [0, 0.33, 0], [0.86, 1, 0.8], g);
  part(G.box, palette.falu, [0, 0.2, 0], [3.2, 0.12, 1.62], g, { shadow: false });
  for (const x of [-0.6, 0.5]) part(G.box, palette.plank, [x, 0.4, 0], [0.36, 0.08, 1.4], g, { surface: "planks" });
  for (const sd of [-1, 1]) part(G.box, palette.plank, [-0.2, 0.44, sd * 0.55], [2.4, 0.06, 0.1], g, { r: [0, sd * 0.15, 0] });
  g.scale.setScalar(1.3);
  return g;
}

export function bigCatch(): LoginScene {
  const world = makeWorld({ top: "#88c8e8", bottom: "#f8e2c4", sun: [0.2, 0.9, 0.7], water: "#76cbe5", amp: 0.2, shadow: 22 });
  const s = world.root;
  const isl = group(s, [-11, 0, -13]);
  for (let i = 0; i < 9; i++) part(G.ico, i % 2 ? palette.stone : palette.stoneDark, [rand(-8, 8), rand(-0.3, 0.3), rand(-3, 4)], rand(1.4, 2.6), isl, { surface: "stone" });
  part(G.cyl, palette.leaf, [0, 0.9, -2], [9, 1.4, 6], isl, { surface: "turf" });
  isl.add(at(house({ w: 4.2, d: 3.6, h: 2.3 }), [1, 1.6, 0.2]));
  part(G.box, "#3a2a1e", [1, 0.8, 2.05], [1.8, 1.5, 0.06], isl, { shadow: false });
  for (let i = 0; i < 6; i++) isl.add(at(fir(rand(0.9, 1.4)), [rand(-8, 8), 1.6, rand(-6, -3)]));
  for (let x = -2; x <= 4; x += 0.55) part(G.box, palette.plank, [x, 0.95, 3.2], [0.5, 0.12, 1.4], isl, { surface: "planks" });
  lighthouse(s, [34, 0, -58]);

  const boat = rowboat();
  s.add(boat);
  const nils = villager("nils");
  nils.g.rotation.y = Math.PI / 2;
  s.add(nils.g);
  const rod = new THREE.Mesh(new THREE.BufferGeometry(), toon(palette.woodDark));
  rod.castShadow = true;
  s.add(rod);
  const line = new THREE.Mesh(new THREE.BufferGeometry(), toon("#f6efe0", { surface: null }));
  s.add(line);
  const { g: fishG, tail } = fish();
  s.add(fishG);
  part(G.cyl, palette.woodDark, [2.4, 0.2, -2.6], [0.18, 3, 0.18], s, { surface: "bark" });
  const watcher = gull();
  watcher.g.position.set(2.4, 1.85, -2.6);
  watcher.g.scale.setScalar(1.3);
  flap(watcher, -0.15);
  s.add(watcher.g);
  const drops = new Swarm(s, G.ico, 50);
  const rings = [splashRing(s), splashRing(s)];

  let p = 0;
  let prevP = 0;
  let trail = 0;
  let tip = V();
  const fishAt = (q: number) => {
    const leap = clamp((q - 0.15) / 0.7, 0, 1);
    if (q < 0.15) return A.clone().addScaledVector(UP, -2 + q * 10);
    if (q > 0.85) return B.clone().addScaledVector(UP, -0.4 - (q - 0.85) * 12);
    return A.clone().lerp(B, leap).addScaledVector(UP, Math.sin(Math.PI * leap) * 4 - 0.4);
  };

  return {
    island: "Lilla Ö",
    title: "Nils's big catch",
    slow: 0.5,
    beat: T * 0.985,
    warm: 0,
    fadeColor: "#f8e2c4",
    world,
    reset() {
      drops.clear();
      prevP = 0;
      trail = 0;
    },
    update(dt) {
      const t = clock.t;
      waveSea(world);
      p = (t / T) % 1;
      const prev = p < prevP ? 0 : prevP;
      prevP = p;
      const leap = clamp((p - 0.15) / 0.7, 0, 1);
      const tension = Math.sin(Math.PI * leap);
      boat.position.set(0, seaH(0, 0) * 0.8 + 0.25, 0);
      boat.rotation.set(-0.14 * tension + seaH(0, 1) * 0.05, 0, Math.sin(t * 1.1) * 0.03);
      nils.g.position.set(-0.7, boat.position.y + 0.55, 0);
      nils.body.rotation.x = -0.35 - 0.2 * tension;
      nils.armL.rotation.set(-2.0 - 0.3 * tension, 0, -0.2);
      nils.armR.rotation.set(-2.0 - 0.3 * tension, 0, 0.2);
      nils.legL.rotation.x = -0.5;
      nils.legR.rotation.x = 0.35;
      nils.setFace(leap > 0 && leap < 1 ? "talk" : "think");
      nils.g.updateMatrixWorld(true);
      const base = handsMid(nils);
      const fp = fishAt(p);
      const fn = fishAt(Math.min(0.999, p + 0.01));
      fishG.position.copy(fp);
      if (fn.distanceToSquared(fp) > 1e-6) fishG.lookAt(fn);
      tail.rotation.y = Math.sin(t * 16) * 0.5;
      fishG.visible = fp.y > -1.2;
      const toFish = fp.clone().sub(base);
      toFish.y = 0;
      toFish.normalize();
      tip = base.clone().addScaledVector(toFish, 2.2 + 0.6 * tension).addScaledVector(UP, 2.4 - 1.1 * tension);
      setTube(rod, new THREE.QuadraticBezierCurve3(base, base.clone().addScaledVector(toFish, 1.2).addScaledVector(UP, 1.8), tip), 0.06);
      const surface = seaH(fp.x, fp.z);
      const hook = fp.y > surface ? fishG.localToWorld(V(0, -0.05, 1.15)) : V(fp.x, surface, fp.z);
      setTube(line, new THREE.QuadraticBezierCurve3(tip, tip.clone().lerp(hook, 0.5).addScaledVector(UP, -0.4 * (1 - tension)), hook), 0.035);
      if (prev < 0.15 && p >= 0.15) drops.burst(14, A, () => ({ vel: V(rand(-2, 2), rand(3, 6), rand(-2, 2)), g: -9, life: 1.8, size: rand(0.18, 0.3), floor: -1 }));
      if (prev < 0.85 && p >= 0.85) drops.burst(16, B, () => ({ vel: V(rand(-2.2, 2.2), rand(3.5, 7), rand(-2.2, 2.2)), g: -9, life: 1.9, size: rand(0.18, 0.32), floor: -1 }));
      trail -= dt;
      if (leap > 0.05 && leap < 0.95 && trail <= 0) {
        trail = 0.1;
        drops.emit({ pos: fishG.localToWorld(V(0, 0, -1.2)), vel: V(rand(-0.4, 0.4), rand(-0.5, 0.5), rand(-0.4, 0.4)), g: -6, life: 1.2, size: 0.18, color: "#e3f7f6" });
      }
      drops.update(dt);
      setRing(rings[0], A, (p - 0.15) * T, 1.6);
      setRing(rings[1], B, p > 0.85 ? (p - 0.85) * T : (p + 0.15) * T, 1.6);
      watcher.g.lookAt(fp.x, watcher.g.position.y, fp.z);
    },
    shot: () => ({ target: V(3.6, 2, 1.4), yaw: 0.58, pitch: 0.17, dist: 18, fov: 40 }),
    tags() {
      const leap = clamp((p - 0.15) / 0.7, 0, 1);
      const air = smooth(0.02, 0.1, leap) * (1 - smooth(0.88, 0.97, leap));
      return [
        { pos: fishG.position.clone().add(V(0, 0.7, 0)), word: "fisken", meaning: "the fish", lang: "sv", alpha: air },
        { pos: tip, word: "spöet", meaning: "the fishing rod", lang: "sv", alpha: 1 },
        { pos: boat.position.clone().add(V(-2.4, 0.6, 1.2)), word: "båten", meaning: "the boat", lang: "sv", alpha: 1 },
        { pos: V(-10, 5.8, -11), word: "sjöboden", meaning: "the boathouse", lang: "sv", alpha: 1 },
      ];
    },
    fade: () => 0,
  };
}
