import * as THREE from "three";
import {
  at, bezier, clamp, clock, cloud, fir, flap, G, glow, group, gull, house, lerp, lighthouse, makeWorld, mapped, palette,
  part, pick, rand, seaH, setTube, smooth, swedishFlag, Swarm, toon, UP, V, villager, waveSea, type LoginScene, type Tag,
} from "./kit";

// The ferry swings in to the Lilla Ö dock, bow slamming through the swell,
// and Olle throws the mooring rope across to Elin while Leo waves.

const P0 = V(-44, 0, -18);
const P1 = V(-24, 0, 8);
const P2 = V(0, 0, 5.3);
const tangent = (t: number) => V().addScaledVector(P1.clone().sub(P0), 2 * (1 - t)).addScaledVector(P2.clone().sub(P1), 2 * t);
const T = 8;

function buildFerry() {
  const g = new THREE.Group();
  g.rotation.order = "YXZ";
  const shape = new THREE.Shape();
  shape.moveTo(-4.5, -1.5);
  shape.lineTo(2.2, -1.5);
  shape.quadraticCurveTo(4.4, -1.3, 5.3, 0);
  shape.quadraticCurveTo(4.4, 1.3, 2.2, 1.5);
  shape.lineTo(-4.5, 1.5);
  shape.lineTo(-4.5, -1.5);
  const hull = (depth: number) => {
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    return geo;
  };
  part(hull(0.5), "#2c2a3d", [0, -0.6, 0], [0.98, 1, 0.97], g);
  part(hull(1.3), "#f7f3ea", [0, -0.3, 0], 1, g);
  part(hull(0.24), "#1f5a3a", [0, 0.3, 0], [1.012, 1, 1.03], g);
  part(hull(0.08), palette.plank, [0, 1.0, 0], [0.96, 1, 0.94], g, { surface: "planks" });
  part(G.box, "#ffffff", [-1.2, 1.7, 0], [4.2, 1.3, 2.4], g);
  part(G.box, glow("#bfe6f0", 0.9), [-1.2, 1.85, 0], [4.0, 0.42, 2.45], g, { shadow: false });
  part(G.box, "#8b1e2d", [-1.2, 2.44, 0], [4.6, 0.18, 2.8], g);
  part(G.box, "#ffffff", [0.3, 3.0, 0], [1.5, 1, 2], g);
  part(G.box, "#8b1e2d", [0.3, 3.55, 0], [1.8, 0.14, 2.3], g);
  part(G.cyl, "#1d1d24", [-2.6, 3.3, 0], [0.38, 1.7, 0.38], g);
  part(G.cyl, "#d9a53a", [-2.6, 3.8, 0], [0.4, 0.2, 0.4], g);
  part(G.cyl, "#e6e0d4", [-4.3, 1.9, 0], [0.04, 1.8, 0.04], g);
  part(new THREE.PlaneGeometry(0.8, 0.5), mapped(swedishFlag(), THREE.DoubleSide), [-4.72, 2.55, 0], 1, g);
  const crew = villager("olle");
  crew.g.scale.multiplyScalar(0.9);
  at(crew.g, [3.0, 1.04, -0.4], Math.PI);
  g.add(crew.g);
  return { g, crew };
}

export function ferryArriving(): LoginScene {
  const world = makeWorld({ top: "#8ecfea", bottom: "#f8e2c4", sun: [0.55, 0.85, 0.55], water: "#76cbe5", amp: 0.45, shadow: 34 });
  const s = world.root;
  const isl = group(s, [17, 0, -9]);
  part(G.cyl, palette.sand, [0, 0.3, 0], [16, 1.6, 16], isl);
  part(G.cyl, palette.leaf, [0, 1.4, 0], [14, 1, 14], isl, { surface: "turf" });
  ([[-8, -1.2, -0.4, palette.falu], [-3, 0.5, 0.2, palette.yellow], [2, 4.5, -0.2, palette.falu], [-5, -6.5, 0.5, "#f3efe6"], [6.5, 1.5, 0.1, palette.falu]] as const).forEach(([x, z, r, c], i) =>
    isl.add(at(house({ wall: c, roof: i % 2 ? palette.roofTile : palette.roof }), [x, 1.9, z], r, 0.75)),
  );
  for (let i = 0; i < 12; i++) isl.add(at(fir(rand(0.8, 1.3)), [rand(-11, 12), 1.9, rand(-12, -6)]));
  part(G.cyl, "#e6e0d4", [6.5, 4.8, 1], [0.1, 6, 0.1], s);
  const flag = part(new THREE.PlaneGeometry(2.4, 1.5, 12, 1), mapped(swedishFlag(), THREE.DoubleSide), [6.5, 7, 1], 1, s);
  flag.geometry.translate(1.2, 0, 0);
  const flagBase = Float32Array.from(flag.geometry.attributes.position.array);
  lighthouse(s, [-34, 0, -52]);
  for (let x = -5.5; x <= 5; x += 0.55) part(G.box, Math.round(x / 0.55) % 3 ? palette.plank : "#a87c52", [x, 1.32, 2], [0.5, 0.14, 2.4], s, { surface: "planks" });
  for (let x = -5.5; x <= 4.5; x += 2) for (const z of [0.9, 3.1]) part(G.cyl, palette.woodDark, [x, 0.1, z], [0.15, 3.4, 0.15], s, { surface: "bark" });

  const elin = villager("elin");
  at(elin.g, [-2.4, 1.4, 2.7]);
  s.add(elin.g);
  const leo = villager("leo");
  at(leo.g, [1.4, 1.4, 1.6], -0.2);
  s.add(leo.g);
  const { g: ferry, crew } = buildFerry();
  s.add(ferry);
  const spray = new Swarm(s, G.ico, 90);
  const smoke = new Swarm(s, G.puff, 16);
  const rope = new THREE.Mesh(new THREE.BufferGeometry(), toon("#d8b878"));
  rope.castShadow = true;
  s.add(rope);
  const coil = part(new THREE.TorusGeometry(0.22, 0.07, 5, 10), "#d8b878", [0, 0, 0], 1, s);
  const gulls = [0, 1].map(() => {
    const gm = gull();
    gm.g.scale.setScalar(1.3);
    s.add(gm.g);
    return gm;
  });
  const clouds = [[-40, 24, -80, 2.4], [20, 28, -95, 3]].map(([x, y, z, sc]) => {
    const c = at(cloud(sc), [x, y, z]);
    c.userData.x = x;
    s.add(c);
    return c;
  });

  let p = 0;
  let acc = 0;
  let smokeT = 0;
  let prevBow: number | null = null;
  let ropeHead: THREE.Vector3 | null = null;

  return {
    island: "Lilla Ö",
    title: "Ferry arriving",
    slow: 0.7,
    beat: T * 0.98,
    warm: 0,
    fadeColor: "#f8e2c4",
    world,
    reset() {
      spray.clear();
      smoke.clear();
      acc = 0;
      smokeT = 0;
      prevBow = null;
      ropeHead = null;
    },
    update(dt) {
      const t = clock.t;
      waveSea(world);
      p = (t / T) % 1;
      const lin = clamp(p / 0.74, 0, 1);
      const e = 1 - Math.pow(1 - lin, 2.4);
      const pos = bezier(P0, P1, P2, e);
      const tan = tangent(e);
      const fwd = tan.clone().normalize();
      const speed = (tan.length() * (p < 0.74 ? (2.4 * Math.pow(1 - lin, 1.4)) / 0.74 : 0)) / T;
      const sp = clamp(speed / 16, 0, 1);
      const heading = Math.atan2(-fwd.z, fwd.x);
      const ahead = tangent(Math.min(1, e + 0.02));
      const turn = Math.atan2(-ahead.z, ahead.x) - heading;
      const bow = pos.clone().addScaledVector(fwd, 4.8);
      const stern = pos.clone().addScaledVector(fwd, -4.2);
      const side = V(-fwd.z, 0, fwd.x);
      const bowH = seaH(bow.x, bow.z);
      const sternH = seaH(stern.x, stern.z);
      ferry.position.set(pos.x, (bowH + sternH) * 0.42 + 0.05, pos.z);
      ferry.rotation.set(clamp(-turn * 6, -0.25, 0.25) * sp, heading, Math.atan2(bowH - sternH, 9) + sp * 0.05);
      ferry.updateMatrixWorld(true);
      // spray: a steady sheet plus a burst whenever the bow drops into a swell
      const dBow = prevBow === null || dt === 0 ? 0 : (bowH - prevBow) / dt;
      if (dt > 0) prevBow = bowH;
      acc += dt * sp * (24 + 50 * Math.max(0, -dBow));
      const bowW = ferry.localToWorld(V(4.3, 0.6, 0));
      while (acc > 1) {
        acc -= 1;
        const sd = Math.random() < 0.5 ? -1 : 1;
        spray.emit({
          pos: bowW.clone().addScaledVector(fwd, -rand(0, 1.5)).addScaledVector(side, sd * rand(0.7, 1.3)),
          vel: side.clone().multiplyScalar(sd * rand(2, 5) * (0.4 + sp)).add(V(0, rand(3, 7) * (0.4 + sp), 0)).addScaledVector(fwd, speed * rand(0.2, 0.5)),
          g: -9,
          drag: 0.5,
          life: rand(1.2, 1.8),
          size: rand(0.2, 0.32),
          color: pick(["#ffffff", "#e3f7f6"]),
        });
      }
      smokeT -= dt;
      if (smokeT <= 0) {
        smokeT = 0.45;
        smoke.emit({ pos: ferry.localToWorld(V(-2.6, 4.3, 0)), vel: V(0, 1.4, 0).addScaledVector(fwd, -speed * 0.35).add(V(-0.5, 0, 0.4)), drag: 0.35, grow: 0.8, size: 0.45, life: 5, color: "#eee8dc" });
      }
      spray.update(dt);
      smoke.update(dt);
      // the rope throw
      const windUp = smooth(0.52, 0.62, p);
      const throwing = smooth(0.62, 0.7, p);
      crew.armR.rotation.x = lerp(0.9 * windUp, -2.6, throwing);
      crew.armL.rotation.x = -0.6 - throwing * 0.4;
      crew.body.rotation.x = -0.2 * windUp + 0.35 * throwing;
      crew.setFace(p > 0.55 && p < 0.75 ? "talk" : "neutral");
      const r = smooth(0.64, 0.82, p);
      elin.armL.rotation.x = elin.armR.rotation.x = -1.3 - smooth(0.7, 0.82, p) * 0.9 + (p > 0.82 ? 0.6 : 0);
      elin.body.rotation.x = p > 0.82 ? -0.25 : 0.1;
      elin.setFace(p > 0.82 ? "happy" : "think");
      leo.armR.rotation.z = 2.5 + Math.sin(t * 6) * 0.45;
      leo.setFace("happy");
      crew.g.updateMatrixWorld(true);
      elin.g.updateMatrixWorld(true);
      const from = crew.handR.getWorldPosition(V());
      const to = elin.handR.getWorldPosition(V());
      if (p < 0.64) {
        rope.visible = false;
        coil.visible = true;
        coil.position.copy(from);
        coil.rotation.set(t * 2, 0.5, 0);
        ropeHead = null;
      } else {
        rope.visible = true;
        coil.visible = r < 1;
        const head = from.clone().lerp(to, r).addScaledVector(UP, Math.sin(Math.PI * r) * 3.2);
        const mid = from.clone().lerp(head, 0.5).addScaledVector(UP, r < 1 ? Math.sin(Math.PI * r) * 1.2 : -0.9);
        setTube(rope, new THREE.QuadraticBezierCurve3(from, mid, head), 0.07);
        coil.position.copy(head);
        coil.rotation.set(t * 5, 0.5, t * 3);
        ropeHead = head;
      }
      gulls.forEach((gm, i) => {
        const a = t * 0.55 + i * 3;
        const rr = 7 + i * 2;
        const c = V(-3 + Math.cos(a) * rr, 9 + i, 1 + Math.sin(a) * rr * 0.7);
        gm.g.position.copy(c);
        gm.g.lookAt(-3 + Math.cos(a + 0.1) * rr, 9 + i, 1 + Math.sin(a + 0.1) * rr * 0.7);
        gm.g.rotation.z += 0.3;
        flap(gm, Math.sin(t * 6 + i * 2) * 0.6);
      });
      const fp = flag.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < fp.count; i++) {
        const x = flagBase[i * 3];
        fp.array[i * 3 + 2] = Math.sin(t * 4 - x * 2.2) * 0.2 * (x / 2.4);
      }
      fp.needsUpdate = true;
      clouds.forEach((c, i) => {
        c.position.x = (c.userData.x as number) + t * (0.5 + i * 0.2);
      });
    },
    shot: () => ({ target: V(lerp(1, ferry.position.x, 0.45), 2.4, lerp(1, ferry.position.z, 0.45)), yaw: 0.42, pitch: 0.18, dist: 34, fov: 36 }),
    tags() {
      const end = 1 - smooth(0.9, 0.94, p);
      const out: Tag[] = [
        { pos: ferry.localToWorld(V(0.3, 4.4, 0)), word: "färjan", meaning: "the ferry", lang: "sv", alpha: smooth(0.06, 0.14, p) * end },
        { pos: V(-4.8, 1.8, 2.2), word: "bryggan", meaning: "the dock", lang: "sv", alpha: smooth(0.2, 0.3, p) * end },
      ];
      if (ropeHead) out.push({ pos: ropeHead, word: "repet", meaning: "the rope", lang: "sv", alpha: smooth(0.64, 0.68, p) * (1 - smooth(0.88, 0.93, p)) });
      return out;
    },
    fade: () => Math.max(1 - smooth(0, 0.04, p), smooth(0.94, 1, p)),
  };
}
