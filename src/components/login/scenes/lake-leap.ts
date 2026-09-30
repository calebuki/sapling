import * as THREE from "three";
import {
  at, clamp, clock, fir, G, group, hatOnHead, house, lerp, makeWorld, mapped, mountains, palette, part, rand, seaH, setRing,
  smooth, splashRing, stripes, Swarm, TAU, UP, V, villager, waveSea, type LoginScene,
} from "./kit";

// Hilde takes a running jump off Tannenau's landing stage and cannonballs into
// the mountain lake while her Bollenhut goes its own way. Sepp cheers.

const T = 3.6;
const JUMP_FROM = V(-2.2, 1.35, 0);
const ENTRY = V(3.8, 0, 1.2);

export function lakeLeap(): LoginScene {
  const world = makeWorld({ top: "#7fc0e2", bottom: "#dbe8e2", fog: "#d3e3de", sun: [0.3, 0.9, 0.6], water: "#5fb3a8", amp: 0.1, shadow: 22 });
  const s = world.root;
  mountains(s, 12, 70, 95, [-3.0, -0.2]);
  part(G.box, "#6f9f55", [-24, 0.4, -4], [30, 1.4, 60], s, { surface: "turf" });
  part(G.box, palette.sand, [-9.5, 0.1, -4], [3, 1, 60], s);
  for (let i = 0; i < 30; i++) s.add(at(fir(rand(1.3, 2.4), i % 3 ? "#24533a" : palette.pine), [rand(-36, -12), 1.1, rand(-30, 20)]));
  for (let i = 0; i < 24; i++) s.add(at(fir(rand(2, 3), "#2f5a48"), [rand(-20, 50), 0, rand(-55, -45)]));
  s.add(at(house({ w: 3.4, d: 3, h: 2.4, style: "fachwerk", wall: palette.blue, roof: "#4a3226" }), [-14, 1.1, -5], 0.9));
  for (let x = -11; x <= -2; x += 0.55) part(G.box, Math.round(x / 0.55) % 3 ? palette.plank : "#8a6a44", [x, 1.2, 0], [0.5, 0.14, 1.8], s, { surface: "planks" });
  for (let x = -9; x <= -2; x += 2.3) for (const z of [-0.95, 0.95]) part(G.cyl, palette.woodDark, [x, 0.3, z], [0.15, 2.4, 0.15], s, { surface: "bark" });
  part(G.box, mapped(stripes("#d42a2a", "#ffffff", 6)), [-7, 1.3, 0.3], [1.2, 0.05, 0.7], s, { r: [0, 0.2, 0] });

  const hilde = villager("hilde", { looseHat: true });
  hilde.g.rotation.y = Math.PI / 2;
  s.add(hilde.g);
  const hat = hilde.hat!;
  s.add(hat);
  const sepp = villager("sepp");
  at(sepp.g, [-8.4, 1.27, -0.4], 1.2);
  s.add(sepp.g);
  // the lake steamer, far out
  const steamer = group(s, [22, 0, -30], 0.3);
  part(G.box, "#f7f3ea", [0, 0.25, 0], [9, 1.1, 3.2], steamer);
  part(G.box, "#1f5a3a", [0, -0.15, 0], [9.05, 0.45, 3.25], steamer);
  part(G.box, "#ffffff", [0.2, 1.3, 0], [4.6, 1, 2.6], steamer);
  part(G.box, "#8b1e2d", [0.2, 1.85, 0], [5, 0.12, 2.9], steamer);
  part(G.cyl, "#1d1d24", [-0.8, 2.6, 0], [0.32, 1.4, 0.32], steamer);
  part(G.cyl, "#d9a53a", [-0.8, 3.1, 0], [0.34, 0.14, 0.34], steamer);
  const ducks = [0, 1].map(() => {
    const d = group(s);
    part(G.sph, "#8a6a44", [0, 0, 0], [0.3, 0.22, 0.4], d, { surface: null });
    part(G.sph, "#2f6f4a", [0, 0.25, 0.3], 0.15, d, { surface: null });
    part(G.cone, palette.yellow, [0, 0.24, 0.48], [0.05, 0.14, 0.05], d, { shadow: false, r: [Math.PI / 2, 0, 0], surface: null });
    return d;
  });
  const drops = new Swarm(s, G.ico, 40);
  const ring = splashRing(s);

  let p = 0;
  let prevP = 0;
  let hatFrom = V();
  let hatTurn = new THREE.Quaternion();

  return {
    island: "Tannenau",
    title: "Lake leap",
    slow: 0.55,
    beat: T * 0.985,
    warm: 0,
    fadeColor: "#dbe8e2",
    world,
    reset() {
      drops.clear();
      prevP = 0;
    },
    update(dt) {
      const t = clock.t;
      waveSea(world);
      p = (t / T) % 1;
      const prev = p < prevP ? 0 : prevP;
      prevP = p;
      if (p < 0.3) {
        const k = p / 0.3;
        hilde.g.position.set(lerp(-9.5, JUMP_FROM.x, k), 1.27 + Math.abs(Math.sin(t * 11)) * 0.08, 0);
        hilde.legL.rotation.x = Math.sin(t * 11) * 0.8;
        hilde.legR.rotation.x = -Math.sin(t * 11) * 0.8;
        hilde.armL.rotation.set(-Math.sin(t * 11) * 0.7, 0, 0);
        hilde.armR.rotation.set(Math.sin(t * 11) * 0.7, 0, 0);
        hilde.body.rotation.x = 0.15;
        hilde.g.rotation.x = 0;
        hilde.setFace("happy");
      } else {
        const f = clamp((p - 0.3) / 0.5, 0, 1);
        hilde.g.position.copy(JUMP_FROM.clone().lerp(ENTRY, f).addScaledVector(UP, Math.sin(Math.PI * f) * 3.2 - f * 1.3));
        const tuck = smooth(0.3, 0.38, p);
        hilde.legL.rotation.x = hilde.legR.rotation.x = -1.6 * tuck;
        hilde.armL.rotation.set(-1.1 * tuck, 0, 0.4 * tuck);
        hilde.armR.rotation.set(-1.1 * tuck, 0, -0.4 * tuck);
        hilde.body.rotation.x = 0.35 * tuck;
        hilde.g.rotation.x = f * 0.9;
        hilde.setFace("talk");
      }
      hilde.g.visible = p < 0.8;
      hilde.g.updateMatrixWorld(true);
      // the hat leaves at take-off and drifts down on its own arc
      const h = hatOnHead(hilde);
      const hq = clamp((p - 0.33) / 0.67, 0, 1);
      if (p < 0.33) {
        hat.position.copy(h.pos);
        hat.quaternion.copy(h.quat);
        hatFrom = h.pos.clone();
        hatTurn = h.quat.clone();
      } else {
        hat.position.copy(hatFrom).add(V(hq * 2.2, Math.sin(hq * Math.PI * 0.75) * 3.6 - hq * 1.2, hq * 1.8));
        hat.quaternion.copy(hatTurn).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(hq * 2.5, hq * 4, hq * 1.2)));
      }
      hat.scale.copy(h.scale);
      if (prev < 0.8 && p >= 0.8)
        drops.burst(26, ENTRY, (i) => {
          const a = (i / 26) * TAU;
          return { vel: V(Math.cos(a) * rand(1.5, 2.8), rand(5, 8.5), Math.sin(a) * rand(1.5, 2.8)), g: -9, life: 2, size: rand(0.2, 0.34), floor: -1 };
        });
      drops.update(dt);
      setRing(ring, ENTRY, (p - 0.8) * T, 1.6, 3.2);
      sepp.armR.rotation.z = 2.5 + Math.sin(t * 7) * 0.4;
      sepp.armL.rotation.z = -2.5 - Math.sin(t * 7) * 0.4;
      sepp.setFace("happy");
      sepp.g.position.y = 1.27 + Math.abs(Math.sin(t * 7)) * 0.12;
      steamer.position.x = 22 - t * 0.4;
      steamer.position.y = Math.sin(t * 0.8) * 0.06;
      const flee = smooth(0.8, 1, p);
      ducks.forEach((d, i) => {
        d.position.set(6.5 + i * 1.1 + flee * 2, seaH(6, 3) + 0.1, 2.6 + i * 0.6 + flee * 1.5);
        d.rotation.y = 0.9 + Math.sin(t + i) * 0.2;
      });
    },
    shot: () => ({ target: V(0.8, 2.3, 0.4), yaw: 0.52, pitch: 0.14, dist: 19, fov: 40 }),
    tags() {
      const end = 1 - smooth(0.9, 0.95, p);
      return [
        { pos: hat.position.clone().add(V(0, 0.5, 0)), word: "der Bollenhut", meaning: "the pom-pom hat", lang: "de", alpha: smooth(0.36, 0.42, p) * end },
        { pos: V(-5, 1.6, 0.9), word: "der Steg", meaning: "the jetty", lang: "de", alpha: end },
        { pos: ducks[0].position.clone().add(V(0, 0.6, 0)), word: "die Ente", meaning: "the duck", lang: "de", alpha: end },
        { pos: ENTRY.clone().add(V(1.5, 0.3, 2)), word: "der See", meaning: "the lake", lang: "de", alpha: smooth(0.82, 0.86, p) * end },
      ];
    },
    fade: () => Math.max(1 - smooth(0, 0.04, p), smooth(0.93, 1, p)),
  };
}
