import * as THREE from "three";
import {
  at, bezier, body, clamp, clock, fir, G, glow, group, handsMid, house, lerp, makeWorld, mapped, mountains, palette, part,
  rand, signBoard, smooth, stepBody, Swarm, toon, UP, V, villager, type LoginScene,
} from "./kit";

// In Tannenau's square, Franz flings a pretzel out of Café Kuckuck just as the
// cuckoo bursts out of the clock, and Marie dives across the cobbles to catch it.

const T = 3.4;
const LEAP_FROM = V(5.6, 0, 2.4);
const LAND = V(0.6, 0, 0.9);
const RUN_FROM = V(10.5, 0, 3.2);

function pretzel() {
  const g = new THREE.Group();
  const dough = toon("#a4582a");
  const loop = new THREE.CatmullRomCurve3(
    [[-0.5, 0.1], [-0.45, 0.42], [-0.2, 0.52], [0, 0.28], [0.2, 0.52], [0.45, 0.42], [0.5, 0.1], [0.3, -0.25], [0, -0.35], [-0.3, -0.25]].map(([x, y]) => V(x, y, 0)),
    true,
  );
  g.add(new THREE.Mesh(new THREE.TubeGeometry(loop, 40, 0.08, 6, true), dough));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-0.3, -0.3, 0.04), V(0, -0.02, 0.08), V(0.22, 0.24, 0)]), 10, 0.075, 6), dough));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0.3, -0.3, -0.04), V(0, -0.02, -0.08), V(-0.22, 0.24, 0)]), 10, 0.075, 6), dough));
  for (const c of g.children) c.castShadow = true;
  for (let i = 0; i < 6; i++) part(G.box, "#ffffff", [Math.cos(i) * 0.35, Math.sin(i * 1.7) * 0.3 + 0.1, 0.08], 0.05, g, { shadow: false, surface: null });
  g.scale.setScalar(1.2);
  return g;
}

export function pretzelPass(): LoginScene {
  const world = makeWorld({ top: "#86c3e3", bottom: "#e6ede4", fog: "#d3e3de", sun: [0.4, 0.9, 0.6], water: null, shadow: 20 });
  const s = world.root;
  part(G.cyl, "#6f9f55", [0, -0.5, 0], [140, 1, 140], s, { shadow: false, surface: "turf" });
  part(G.box, "#b9b2a2", [0, -0.02, -1], [22, 0.06, 14], s, { surface: "cobble" });
  mountains(s, 9, 80, 110, [-2.6, -0.5]);
  for (let i = 0; i < 26; i++) s.add(at(fir(rand(1.4, 2.4), i % 3 ? "#24533a" : palette.pine), [rand(-40, 40), 0, rand(-40, -16)]));
  s.add(at(house({ w: 9, d: 5, h: 4.2, style: "fachwerk", wall: "#f6efe2", roof: "#4a3226", door: -2.6 }), [0, 0, -6.5]));
  part(new THREE.PlaneGeometry(3.6, 0.7), mapped(signBoard("CAFÉ KUCKUCK", "#6b3f24", "#fff4e0", palette.yellow)), [-2.6, 2.1, -3.9], 1, s, { shadow: false });
  s.add(at(house({ w: 6, d: 5, h: 4, style: "fachwerk", wall: "#f3e0c0", roof: "#4a3226" }), [-12, 0, -8], 0.35));
  s.add(at(house({ w: 6, d: 5, h: 4, style: "fachwerk", wall: "#eaf0e6", roof: "#3b3b44" }), [12.5, 0, -8.5], -0.4));
  // the Maibaum
  const pole = group(s, [8, 0, -3]);
  for (let i = 0; i < 12; i++) part(G.cyl, i % 2 ? "#ffffff" : "#c8a23a", [0, 0.35 + i * 0.6, 0], [0.13, 0.6, 0.13], pole);
  part(G.cone, "#3f7d4f", [0, 8, 0], [0.6, 1.4, 0.6], pole, { surface: "needles" });
  for (const y of [3.4, 5.6]) part(new THREE.TorusGeometry(0.75, 0.12, 6, 16), "#3f7d4f", [0, y, 0], 1, pole, { r: [Math.PI / 2, 0, 0] });

  // the cuckoo clock on the café's upper floor
  const clockFace = group(s, [1.8, 3.2, -3.9]);
  part(G.box, "#6b3f24", [0, 0, 0.2], [1.5, 1.8, 0.4], clockFace);
  for (const sd of [-1, 1]) part(G.box, "#4a2a18", [sd * 0.45, 1.15, 0.2], [1.1, 0.12, 0.6], clockFace, { r: [0, 0, -sd * 0.65] });
  for (const sd of [-1, 1]) part(G.box, "#3f7d4f", [sd * 0.4, 0.95, 0.42], [0.25, 0.12, 0.05], clockFace, { shadow: false });
  part(G.cyl, "#fff4e0", [0, -0.2, 0.42], [0.5, 0.05, 0.5], clockFace, { shadow: false, r: [Math.PI / 2, 0, 0], surface: null });
  const hands = [0.4, 0.28].map((len) => part(G.box, "#2c2a3d", [0, -0.2, 0.47], [0.05, len, 0.03], clockFace, { shadow: false, surface: null }));
  const doors = [-1, 1].map((sd) => {
    const d = group(clockFace, [sd * 0.25, 0.55, 0.41]);
    part(G.box, "#4a2a18", [-sd * 0.12, 0, 0], [0.24, 0.36, 0.04], d, { shadow: false });
    return d;
  });
  part(G.box, glow("#1b120c", 1), [0, 0.55, 0.39], [0.48, 0.36, 0.02], clockFace, { shadow: false });
  const bird = group(clockFace);
  part(G.sph, palette.blue, [0, 0, 0], [0.17, 0.15, 0.22], bird, { surface: null });
  part(G.sph, palette.blue, [0, 0.13, 0.14], 0.11, bird, { surface: null });
  part(G.cone, palette.yellow, [0, 0.12, 0.3], [0.04, 0.14, 0.04], bird, { shadow: false, r: [Math.PI / 2, 0, 0], surface: null });
  part(G.box, "#2f6f4a", [0, 0.02, -0.22], [0.2, 0.04, 0.16], bird, { shadow: false });
  const pendulum = group(clockFace, [0, -0.9, 0.3]);
  part(G.box, "#c8a23a", [0, -0.5, 0], [0.04, 1, 0.03], pendulum, { shadow: false });
  part(G.cyl, "#c8a23a", [0, -1.0, 0], [0.16, 0.04, 0.16], pendulum, { shadow: false, r: [Math.PI / 2, 0, 0] });
  for (const x of [-0.3, 0.3]) part(G.cone, "#3a2414", [x, -1.5, 0.3], [0.1, 0.35, 0.1], clockFace, { shadow: false, r: [Math.PI, 0, 0] });

  const franz = villager("franz");
  at(franz.g, [-2.6, 0, -3.4], 0.7);
  s.add(franz.g);
  const marieWrap = group(s);
  const marie = villager("marie");
  marieWrap.add(marie.g);
  const bread = pretzel();
  s.add(bread);
  const basket = group(s);
  part(G.cyl, "#b07a3c", [0, 0.18, 0], [0.34, 0.36, 0.28], basket, { surface: "fabric" });
  part(new THREE.TorusGeometry(0.3, 0.035, 4, 12), "#8a5a2c", [0, 0.45, 0], 1, basket, { shadow: false });
  const basketBody = body(basket, 0.02, -7);
  const apples = Array.from({ length: 4 }, () => {
    const a = group(s);
    part(G.sph, "#d42a2a", [0, 0, 0], 0.17, a, { surface: null });
    part(G.box, palette.woodDark, [0, 0.17, 0], [0.03, 0.08, 0.03], a, { shadow: false });
    return body(a, 0.17, -7);
  });
  const dust = new Swarm(s, G.puff, 10);

  let p = 0;
  let prevP = 0;
  let spilled = false;
  let released = V();
  const marieAt = (q: number) => {
    const dir = LAND.clone().sub(LEAP_FROM).normalize();
    const f = clamp((q - 0.42) / 0.43, 0, 1);
    let pos = q < 0.42 ? RUN_FROM.clone().lerp(LEAP_FROM, q / 0.42) : LEAP_FROM.clone().lerp(LAND, f).addScaledVector(UP, Math.sin(Math.PI * f) * 1.5);
    if (q > 0.85) pos = LAND.clone().addScaledVector(dir, smooth(0.85, 0.95, q) * 0.7);
    return { pos, dir };
  };
  const reset = () => {
    dust.clear();
    prevP = 0;
    spilled = false;
    basketBody.rest = false;
    for (const a of apples) a.rest = false;
  };

  return {
    island: "Tannenau",
    title: "Pretzel pass",
    slow: 0.5,
    beat: T * 0.985,
    warm: 0,
    fadeColor: "#e6ede4",
    world,
    reset,
    update(dt) {
      const t = clock.t;
      p = (t / T) % 1;
      if (p < prevP) reset();
      const prev = prevP;
      prevP = p;
      // Franz winds up, flings, then jumps at the cuckoo
      const windUp = smooth(0.05, 0.17, p);
      const release = smooth(0.17, 0.22, p);
      const scare = smooth(0.25, 0.32, p);
      franz.armR.rotation.set(lerp(lerp(0, 1.1, windUp), -2.4, release), 0, 0.2);
      franz.armL.rotation.set(-0.4 - scare * 2.2, 0, -0.3 * scare);
      franz.body.rotation.x = 0.15 * windUp - 0.3 * scare;
      franz.g.position.y = Math.sin(Math.PI * smooth(0.25, 0.4, p)) * 0.35;
      franz.head.rotation.y = scare * 0.9;
      franz.setFace(scare > 0.2 ? "talk" : "happy");
      // the clock
      const open = smooth(0.22, 0.28, p) * (1 - smooth(0.8, 0.88, p));
      const out = smooth(0.24, 0.32, p) * (1 - smooth(0.78, 0.86, p));
      doors[0].rotation.y = -open * 1.6;
      doors[1].rotation.y = open * 1.6;
      bird.position.set(0, 0.55 + out * 0.05, 0.3 + out * 1.1 + Math.sin(t * 22) * 0.06 * out);
      bird.visible = out > 0.02;
      bird.rotation.x = -0.3 + Math.sin(t * 22) * 0.2 * out;
      pendulum.rotation.z = Math.sin(t * 3) * 0.3;
      hands[0].rotation.z = t * 0.2;
      hands[1].rotation.z = t * 0.02;
      // Marie: run, plant, take off only slightly tipped, stretch out to catch
      const m = marieAt(p);
      marieWrap.position.copy(m.pos);
      marieWrap.rotation.y = Math.atan2(m.dir.x, m.dir.z);
      const plant = smooth(0.34, 0.42, p) * (1 - smooth(0.42, 0.47, p));
      const stretch = smooth(0.42, 0.72, p);
      const runFade = smooth(0.38, 0.46, p);
      marie.g.rotation.x = 0.3 * smooth(0.34, 0.42, p) + 1.05 * stretch + 0.15 * smooth(0.85, 0.92, p);
      marieWrap.position.y -= plant * 0.14;
      const run = t * 11;
      const kick = smooth(0.4, 0.46, p) * (1 - smooth(0.5, 0.64, p));
      marie.legL.rotation.x = lerp(Math.sin(run) * 0.8, lerp(0.3, 0.75, kick), runFade);
      marie.legR.rotation.x = lerp(-Math.sin(run) * 0.8, lerp(0.1, -0.5, kick), runFade);
      const reach = smooth(0.4, 0.62, p);
      marie.armL.rotation.x = lerp(Math.sin(run) * 0.8 * (1 - runFade), -2.9, reach);
      marie.armR.rotation.x = lerp(-Math.sin(run) * 0.8 * (1 - runFade), -2.9, reach);
      marie.setFace(p < 0.72 ? "talk" : "happy");
      marieWrap.updateMatrixWorld(true);
      franz.g.updateMatrixWorld(true);
      const catchAt = handsMid(marie);
      const throwFrom = franz.handR.getWorldPosition(V());
      // the pretzel: in Franz's hand, flying to Marie's hands, then caught
      if (p < 0.2) {
        bread.position.copy(throwFrom).add(V(0, 0.2, 0));
        released = bread.position.clone();
        bread.rotation.set(0, 0.7, 0);
      } else if (p < 0.72) {
        const f = smooth(0.2, 0.72, p) * 0.2 + ((p - 0.2) / 0.52) * 0.8;
        bread.position.copy(bezier(released, released.clone().lerp(catchAt, 0.5).add(V(0, 4.2, 0)), catchAt, f));
        bread.rotation.set(0.4, 0.7 + (p - 0.2) * 16, 0);
      } else bread.position.copy(catchAt).add(V(0, 0.1, 0));
      // the basket goes flying when she dives
      if (!spilled) {
        basket.position.copy(marie.handL.getWorldPosition(V())).add(V(0, -0.35, 0));
        apples.forEach((a, i) => a.obj.position.copy(basket.position).add(V((i - 1.5) * 0.14, 0.45, 0)));
      }
      if (!spilled && prev < 0.44 && p >= 0.44) {
        spilled = true;
        basketBody.pos.copy(basket.position);
        basketBody.vel.copy(m.dir).multiplyScalar(-1.5).add(V(0, 3.2, 1.4));
        basketBody.spin.set(3, 1, 2);
        basketBody.rest = false;
        for (const a of apples) {
          a.pos.copy(a.obj.position);
          a.vel.set(rand(-1.5, 1.5), rand(3.5, 5.5), rand(0.4, 2.4));
          a.spin.set(rand(-4, 4), 0, rand(-4, 4));
          a.rest = false;
        }
      }
      if (spilled) {
        stepBody(basketBody, dt);
        for (const a of apples) stepBody(a, dt);
      }
      if (prev < 0.85 && p >= 0.85) for (let i = 0; i < 6; i++) dust.emit({ pos: LAND.clone().add(V(rand(-0.6, 0.6), 0.2, rand(-0.6, 0.6))), vel: V(rand(-1, 1), rand(0.3, 1), rand(-1, 1)), drag: 1.2, grow: 0.9, size: 0.3, life: 1.8, color: "#e8e0cc" });
      dust.update(dt);
    },
    shot: () => ({ target: V(2.6, 2.3, -0.4), yaw: 0.3, pitch: 0.14, dist: 17.5, fov: 40 }),
    tags() {
      const end = 1 - smooth(0.9, 0.95, p);
      clockFace.updateMatrixWorld(true);
      return [
        { pos: bread.position.clone().add(V(0, 0.6, 0)), word: "die Brezel", meaning: "the pretzel", lang: "de", alpha: smooth(0.22, 0.28, p) * end },
        { pos: clockFace.localToWorld(bird.position.clone()).add(V(0, 0.3, 0)), word: "der Kuckuck", meaning: "the cuckoo", lang: "de", alpha: smooth(0.28, 0.33, p) * (1 - smooth(0.74, 0.8, p)) },
        { pos: apples[0].obj.position.clone().add(V(0, 0.3, 0)), word: "der Apfel", meaning: "the apple", lang: "de", alpha: smooth(0.46, 0.52, p) * end },
        { pos: basket.position.clone().add(V(0, 0.6, 0)), word: "der Korb", meaning: "the basket", lang: "de", alpha: smooth(0.5, 0.56, p) * end },
      ];
    },
    fade: () => Math.max(1 - smooth(0, 0.04, p), smooth(0.93, 1, p)),
  };
}
