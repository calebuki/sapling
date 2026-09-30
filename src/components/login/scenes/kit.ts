import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { FRAMES, faceSheet, type Frame } from "@/components/game/world/character";
import { glow, palette, toon, toonRamp, type Surface } from "@/components/game/world/materials";
import { villagers as deVillagers } from "@/content/de/villagers";
import { villagers as svVillagers } from "@/content/sv/villagers";
import type { CharacterLook } from "@/lib/game/villagers";

// Building blocks for the login scenes. They are built imperatively (not as
// React components) because every scene is a scripted, slowed-down moment:
// poses and props are driven frame by frame from one timeline.

export type Vec3 = [number, number, number];
export const TAU = Math.PI * 2;
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const UP = V(0, 1, 0);
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const bezier = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, t: number) =>
  V().addScaledVector(a, (1 - t) * (1 - t)).addScaledVector(b, 2 * (1 - t) * t).addScaledVector(c, t * t);

// Scene time, shared with the water so every wave moves in slow motion too.
export const clock = { t: 0, amp: 0.3 };
export const seaH = (x: number, z: number) =>
  clock.amp * (Math.sin(x * 0.18 + clock.t * 1.1) + 0.8 * Math.sin(z * 0.23 + clock.t * 0.8 + x * 0.05) + 0.25 * Math.sin((x + z) * 0.5 + clock.t * 1.7));

export const G = {
  round: new RoundedBoxGeometry(1, 1, 1, 2, 0.18),
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 10),
  cone: new THREE.ConeGeometry(1, 1, 8),
  sph: new THREE.SphereGeometry(1, 10, 8),
  prism: new THREE.CylinderGeometry(1, 1, 1, 3, 1, false, Math.PI / 2),
  face: new THREE.PlaneGeometry(1, 1),
  ico: new THREE.IcosahedronGeometry(1, 0),
  puff: new THREE.IcosahedronGeometry(1, 1),
};

export const flat = (color: string) => toon(color, { surface: null });
export function mapped(map: THREE.Texture, side: THREE.Side = THREE.FrontSide) {
  return new THREE.MeshToonMaterial({ map, gradientMap: toonRamp(), side });
}
export { glow, palette, toon };

type PartOptions = { shadow?: boolean; r?: Vec3; surface?: Surface | null };
export function part(geo: THREE.BufferGeometry, material: string | THREE.Material, p: Vec3, s: number | Vec3, parent?: THREE.Object3D, opts: PartOptions = {}) {
  const m = new THREE.Mesh(geo, typeof material === "string" ? toon(material, { surface: opts.surface }) : material);
  m.position.set(...p);
  if (typeof s === "number") m.scale.setScalar(s);
  else m.scale.set(...s);
  if (opts.r) m.rotation.set(...opts.r);
  m.castShadow = opts.shadow ?? true;
  m.receiveShadow = true;
  parent?.add(m);
  return m;
}
export function group(parent: THREE.Object3D, p: Vec3 = [0, 0, 0], ry = 0) {
  const g = new THREE.Group();
  g.position.set(...p);
  g.rotation.y = ry;
  parent.add(g);
  return g;
}

export function at<T extends THREE.Object3D>(o: T, p: Vec3, ry = 0, scale = 1) {
  o.position.set(...p);
  o.rotation.y = ry;
  o.scale.multiplyScalar(scale);
  return o;
}

export function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, nearest = true) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (nearest) {
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
  }
  return t;
}
export const swedishFlag = () =>
  canvasTexture(160, 100, (g) => {
    g.fillStyle = "#006aa7";
    g.fillRect(0, 0, 160, 100);
    g.fillStyle = "#fecc02";
    g.fillRect(50, 0, 20, 100);
    g.fillRect(0, 40, 160, 20);
  });
export const stripes = (a: string, b: string, n: number) =>
  canvasTexture(64, 8, (g, w) => {
    for (let i = 0; i < n; i++) {
      g.fillStyle = i % 2 ? b : a;
      g.fillRect((i * w) / n, 0, w / n + 1, 8);
    }
  });
export const checks = (a: string, b: string) =>
  canvasTexture(64, 64, (g) => {
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++) {
        g.fillStyle = (x + y) % 2 ? a : b;
        g.fillRect(x * 8, y * 8, 8, 8);
      }
  });
export const signBoard = (text: string, bg: string, fg: string, rim: string) =>
  canvasTexture(
    384,
    64,
    (g, w, h) => {
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);
      g.strokeStyle = rim;
      g.lineWidth = 4;
      g.strokeRect(4, 4, w - 8, h - 8);
      g.fillStyle = fg;
      g.font = '600 36px "Fredoka", "Arial Rounded MT Bold", sans-serif';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(text, w / 2, h / 2 + 2);
    },
    false,
  );

// ---- World ------------------------------------------------------------------

export type World = { root: THREE.Group; background: THREE.Texture; fog: THREE.Fog; sea: THREE.Mesh | null; amp: number };

// Sky, fog and the game's daytime lighting; optionally a sea that waves in scene time.
export function makeWorld({ top, bottom, fog = bottom, sun, water, amp = 0.3, shadow = 26 }: { top: string; bottom: string; fog?: string; sun: Vec3; water: string | null; amp?: number; shadow?: number }): World {
  const root = new THREE.Group();
  const background = canvasTexture(
    2,
    256,
    (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, top);
      gr.addColorStop(1, bottom);
      g.fillStyle = gr;
      g.fillRect(0, 0, 2, 256);
    },
    false,
  );
  root.add(new THREE.HemisphereLight("#d6ebff", "#6f8f4f", 1.3));
  root.add(new THREE.AmbientLight("#fff4e0", 0.25));
  const key = new THREE.DirectionalLight("#fff2de", 2.3);
  key.position.set(...sun).multiplyScalar(50);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -shadow, right: shadow, top: shadow, bottom: -shadow, near: 1, far: 160 });
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.06;
  root.add(key, key.target);
  const rim = new THREE.DirectionalLight("#ffc9a3", 0.5);
  rim.position.set(-sun[0] * 40, 18, -sun[2] * 40);
  root.add(rim);
  let sea: THREE.Mesh | null = null;
  if (water) {
    const geo = new THREE.PlaneGeometry(320, 320, 96, 96);
    geo.rotateX(-Math.PI / 2);
    const material = new THREE.MeshToonMaterial({ color: water, gradientMap: toonRamp() });
    // Faceted waves: the toon shader honours FLAT_SHADED even though its types don't list it.
    material.defines = { FLAT_SHADED: "" };
    sea = new THREE.Mesh(geo, material);
    sea.receiveShadow = true;
    sea.userData.base = Float32Array.from(geo.attributes.position.array);
    root.add(sea);
  }
  return { root, background, fog: new THREE.Fog(fog, 60, 220), sea, amp };
}

export function waveSea(world: World) {
  if (!world.sea) return;
  const p = world.sea.geometry.attributes.position as THREE.BufferAttribute;
  const base = world.sea.userData.base as Float32Array;
  for (let i = 0; i < p.count; i++) p.array[i * 3 + 1] = seaH(base[i * 3], base[i * 3 + 2]);
  p.needsUpdate = true;
}

export function splashRing(parent: THREE.Object3D) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.035, 3, 28), flat("#ffffff"));
  m.rotation.x = Math.PI / 2;
  m.visible = false;
  parent.add(m);
  return m;
}
export function setRing(m: THREE.Mesh, c: THREE.Vector3, age: number, dur = 1.8, size = 2.4) {
  if (age < 0 || age > dur) {
    m.visible = false;
    return;
  }
  const k = age / dur;
  m.visible = true;
  m.position.set(c.x, seaH(c.x, c.z) + 0.06, c.z);
  m.scale.set(0.5 + k * size, 0.5 + k * size, Math.max(0.05, 1 - k));
}
export function setTube(mesh: THREE.Mesh, curve: THREE.Curve<THREE.Vector3>, r: number) {
  mesh.geometry.dispose();
  mesh.geometry = new THREE.TubeGeometry(curve, 16, r, 5, false);
}

// ---- Scenery ----------------------------------------------------------------

export function fir(s = 1, color = palette.pine) {
  const g = new THREE.Group();
  part(G.cyl, palette.woodDark, [0, 0.4 * s, 0], [0.18 * s, 0.8 * s, 0.18 * s], g, { surface: "bark" });
  for (const [r, h, y] of [[1.1, 1.6, 1], [0.85, 1.3, 1.8], [0.55, 1.0, 2.5]]) part(G.cone, color, [0, y * s, 0], [r * s, h * s, r * s], g, { surface: "needles" });
  return g;
}

const beam = "#5b3a24";
const shutter = "#2f6f4a";
// A house with its door on the +z face: a falu-red Lilla Ö cottage or a Tannenau Fachwerk house.
export function house({ w = 3.6, d = 4.4, h = 2.4, wall = palette.falu, roof = palette.roof, style = "falu", door = 0 }: { w?: number; d?: number; h?: number; wall?: string; roof?: string; style?: "falu" | "fachwerk"; door?: number }) {
  const g = new THREE.Group();
  const wallSurface: Surface = style === "falu" ? "siding" : "plaster";
  if (style === "fachwerk") part(G.box, palette.stone, [0, 0.3, 0], [w + 0.2, 0.6, d + 0.2], g, { surface: "stone" });
  part(G.box, wall, [0, h / 2, 0], [w, h, d], g, { surface: wallSurface });
  const r = d / Math.sqrt(3);
  const rise = 1.5 * r;
  const gable = part(G.prism, wall, [0, h + 0.5 * r, 0], [r, w, r], g, { surface: wallSurface });
  gable.rotation.z = Math.PI / 2;
  const slope = Math.atan2(rise, d / 2);
  const len = Math.hypot(rise, d / 2) + 0.4;
  for (const sd of [-1, 1]) part(G.box, roof, [0, h + rise / 2 + 0.08, (sd * d) / 4], [w + 0.5, 0.16, len], g, { r: [sd * slope, 0, 0], surface: style === "falu" ? "roof" : "shingle" });
  part(G.box, palette.stoneDark, [w * 0.25, h + rise * 0.7, -d * 0.2], [0.4, 1.2, 0.4], g, { surface: "stone" });
  const fz = d / 2 + 0.03;
  if (style === "falu") {
    for (const x of [-1, 1]) for (const z of [-1, 1]) part(G.box, palette.trim, [(x * w) / 2, h / 2, (z * d) / 2], [0.18, h, 0.18], g, { shadow: false });
  } else {
    const t = 0.12;
    for (const x of [-w / 2, -w / 4, 0, w / 4, w / 2]) part(G.box, beam, [x, h / 2, fz], [t, h, t], g, { shadow: false });
    for (const y of [h * 0.5, h - 0.05]) part(G.box, beam, [0, y, fz], [w, t, t], g, { shadow: false });
    for (const x of [-w * 0.375, w * 0.375])
      for (const sd of [-1, 1]) part(G.box, beam, [x, h * 0.75, fz], [t, Math.hypot(w / 4, h / 2) * 0.95, t], g, { shadow: false, r: [0, 0, sd * Math.atan2(w / 4, h / 2)] });
  }
  part(G.box, palette.woodDark, [door, 0.75, fz], [0.8, 1.5, 0.08], g, { shadow: false, surface: "siding" });
  for (const y of style === "fachwerk" ? [h * 0.3, h * 0.72] : [h * 0.6])
    for (const x of [-w * 0.3, w * 0.3]) {
      if (Math.abs(x - door) < 0.7 && y < 1.6) continue;
      part(G.box, style === "falu" ? palette.trim : beam, [x, y, fz], [0.8, 0.8, 0.08], g, { shadow: false });
      part(G.box, glow("#ffd89a", 1.05), [x, y, fz + 0.03], [0.6, 0.6, 0.04], g, { shadow: false });
      if (style === "fachwerk") for (const sd of [-1, 1]) part(G.box, shutter, [x + sd * 0.46, y, fz + 0.02], [0.28, 0.72, 0.05], g, { shadow: false });
    }
  return g;
}

export type Gull = { g: THREE.Group; wl: THREE.Group; wr: THREE.Group };
// Faces +z so lookAt() points it along its flight path.
export function gull(): Gull {
  const g = new THREE.Group();
  part(G.sph, flat("#ffffff"), [0, 0, 0], [0.24, 0.22, 0.45], g);
  part(G.sph, flat("#ffffff"), [0, 0.15, 0.45], 0.18, g);
  part(G.cone, flat("#ffc93c"), [0, 0.12, 0.68], [0.05, 0.24, 0.05], g, { r: [Math.PI / 2, 0, 0] });
  for (const x of [-0.1, 0.1]) part(G.box, flat("#2c2a3d"), [x, 0.2, 0.58], 0.045, g, { shadow: false });
  part(G.box, flat("#d9dde3"), [0, 0.02, -0.52], [0.3, 0.05, 0.34], g);
  const wing = (sd: number) => {
    const p = new THREE.Group();
    p.position.set(0.18 * sd, 0.1, 0);
    part(G.box, flat("#eef1f4"), [0.3 * sd, 0, 0], [0.6, 0.04, 0.42], p);
    part(G.box, flat("#8a93a0"), [0.84 * sd, 0, -0.04], [0.52, 0.035, 0.3], p);
    g.add(p);
    return p;
  };
  return { g, wl: wing(-1), wr: wing(1) };
}
export const flap = (gm: Gull, up: number) => {
  gm.wl.rotation.z = -up;
  gm.wr.rotation.z = up;
};

export function cloud(s = 1) {
  const g = new THREE.Group();
  const white = toon("#ffffff", { surface: null, emissive: "#ffffff", emissiveIntensity: 0.35 });
  for (const [x, y, z, r] of [[0, 0, 0, 2.4], [2.6, -0.4, 0.3, 1.9], [-2.4, -0.5, 0.2, 1.8], [0.9, 1.1, -0.2, 1.7]]) part(G.puff, white, [x, y, z], r, g, { shadow: false });
  g.scale.setScalar(s);
  return g;
}

export function mountains(parent: THREE.Object3D, n: number, rMin: number, rMax: number, arc: [number, number]) {
  for (let i = 0; i < n; i++) {
    const a = lerp(arc[0], arc[1], i / (n - 1)) + rand(-0.05, 0.05);
    const r = rand(rMin, rMax);
    const h = rand(26, 48);
    const w = rand(22, 34);
    const m = group(parent, [Math.cos(a) * r, 0, Math.sin(a) * r]);
    part(G.cone, i % 2 ? "#3f6f55" : "#4a7a5c", [0, h / 2, 0], [w, h, w], m, { shadow: false });
    if (i % 3 !== 1) part(G.cone, "#f4f7f8", [0, h * 0.86, 0], [w * 0.29, h * 0.28, w * 0.29], m, { shadow: false, surface: null });
  }
}

export function lighthouse(parent: THREE.Object3D, p: Vec3) {
  const lh = group(parent, p);
  part(G.ico, palette.stone, [0, 0, 0], 4, lh, { surface: "stone" });
  part(G.cyl, "#ffffff", [0, 5.5, 0], [1.1, 7, 1.1], lh);
  part(G.cyl, palette.falu, [0, 6, 0], [1.15, 1.2, 1.15], lh);
  part(G.cyl, glow("#ffd27a", 1.4), [0, 9.5, 0], [0.7, 1, 0.7], lh);
  return lh;
}

// ---- Particles ----------------------------------------------------------------

export type Particle = {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  spin: THREE.Vector3;
  color: THREE.Color;
  g: number;
  drag: number;
  life: number;
  age: number;
  size: number;
  grow: number;
  flutter: number;
  ph: number;
  floor: number;
  fadeIn: number;
  tag?: { word: string; meaning: string };
};
type Emit = Partial<Omit<Particle, "color">> & { pos: THREE.Vector3; color?: string };

const dummy = new THREE.Object3D();
// A handful of instanced bits simulated in scene time, so they hang in slow motion.
export class Swarm {
  list: Particle[] = [];
  mesh: THREE.InstancedMesh;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry, private max: number, material: THREE.Material = flat("#ffffff")) {
    this.mesh = new THREE.InstancedMesh(geo, material, max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;
    const white = new THREE.Color("#ffffff");
    for (let i = 0; i < max; i++) this.mesh.setColorAt(i, white);
    this.mesh.count = 0;
    parent.add(this.mesh);
  }
  emit(o: Emit) {
    if (this.list.length >= this.max) this.list.shift();
    const p: Particle = {
      vel: V(),
      rot: new THREE.Euler(rand(0, TAU), rand(0, TAU), rand(0, TAU)),
      spin: V(),
      g: 0,
      drag: 0,
      life: 1,
      age: 0,
      size: 1,
      grow: 0,
      flutter: 0,
      ph: rand(0, TAU),
      floor: -Infinity,
      fadeIn: 0,
      ...o,
      color: new THREE.Color(o.color ?? "#ffffff"),
    };
    this.list.push(p);
    return p;
  }
  burst(n: number, at: THREE.Vector3, make: (i: number) => Omit<Emit, "pos">) {
    for (let i = 0; i < n; i++) this.emit({ color: pick(["#ffffff", "#e3f7f6"]), ...make(i), pos: at.clone() });
  }
  update(dt: number) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.age += dt;
      if (p.age > p.life) {
        this.list.splice(i, 1);
        continue;
      }
      p.vel.y += p.g * dt;
      p.vel.multiplyScalar(Math.exp(-p.drag * dt));
      p.pos.addScaledVector(p.vel, dt);
      if (p.flutter) {
        p.pos.x += Math.sin(p.age * 2.3 + p.ph) * p.flutter * dt;
        p.pos.y += Math.cos(p.age * 1.7 + p.ph) * p.flutter * 0.6 * dt;
      }
      if (p.pos.y < p.floor) {
        p.pos.y = p.floor;
        p.vel.set(0, 0, 0);
        p.spin.set(0, 0, 0);
      }
      p.rot.x += p.spin.x * dt;
      p.rot.y += p.spin.y * dt;
      p.rot.z += p.spin.z * dt;
      p.size += p.grow * dt;
    }
    this.list.forEach((p, i) => {
      const s = Math.max(1e-4, p.size * (1 - smooth(0.7, 1, p.age / p.life)) * (p.fadeIn ? smooth(0, p.fadeIn, p.age) : 1));
      dummy.position.copy(p.pos);
      dummy.rotation.copy(p.rot);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
      this.mesh.setColorAt(i, p.color);
    });
    this.mesh.count = this.list.length;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
  clear() {
    this.list.length = 0;
    this.update(0);
  }
}
export const leafGeometry = (() => {
  const g = new THREE.CircleGeometry(0.22, 6);
  g.scale(1.8, 1, 1);
  return g;
})();
export const doubleSided = () => new THREE.MeshToonMaterial({ color: "#ffffff", gradientMap: toonRamp(), side: THREE.DoubleSide });

// A thrown prop (cup, bun, apple, basket): simple ballistic flight that stops on the floor.
export type Body = { obj: THREE.Object3D; pos: THREE.Vector3; vel: THREE.Vector3; spin: THREE.Vector3; rest: boolean; g: number; floor: number };
export const body = (obj: THREE.Object3D, floor: number, g = -4.5): Body => ({ obj, pos: V(), vel: V(), spin: V(), rest: false, g, floor });
export function stepBody(b: Body, dt: number) {
  if (b.rest) return;
  b.vel.y += b.g * dt;
  b.pos.addScaledVector(b.vel, dt);
  b.obj.rotation.x += b.spin.x * dt;
  b.obj.rotation.y += b.spin.y * dt;
  b.obj.rotation.z += b.spin.z * dt;
  if (b.pos.y < b.floor) {
    b.pos.y = b.floor;
    b.vel.set(0, 0, 0);
    b.spin.set(0, 0, 0);
    b.rest = true;
  }
  b.obj.position.copy(b.pos);
}

// ---- Villagers ----------------------------------------------------------------

// Everyone reads a touch larger than on the island so faces carry at login size.
const LOGIN_SCALE = 1.35;

export function look(id: string): CharacterLook {
  const found = [...svVillagers, ...deVillagers].find((v) => v.id === id);
  if (!found) throw new Error(`No villager called ${id}`);
  return found.look;
}

// The same chunky villager as character.tsx, built outside React so each limb
// can be posed from the scene's timeline.
export type Villager = {
  g: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  handL: THREE.Mesh;
  handR: THREE.Mesh;
  hat: THREE.Group | null;
  setFace: (frame: Frame) => void;
};

function faceMaterial() {
  const t = new THREE.CanvasTexture(faceSheet());
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.repeat.set(1 / FRAMES.length, 1);
  return new THREE.MeshToonMaterial({ map: t, gradientMap: toonRamp(), alphaTest: 0.5 });
}

function addHair(head: THREE.Group, l: CharacterLook) {
  const h = flat(l.hair);
  const back = () => part(G.round, h, [0, 0.42, -0.26], [0.84, 0.58, 0.24], head);
  const sides = () => [-0.41, 0.41].forEach((x) => part(G.box, h, [x, 0.5, 0.02], [0.06, 0.34, 0.5], head, { shadow: false }));
  const cap = () => {
    part(G.round, h, [0, 0.68, -0.03], [0.86, 0.26, 0.76], head);
    part(G.box, h, [-0.08, 0.61, 0.32], [0.66, 0.12, 0.08], head, { shadow: false });
    part(G.box, h, [0.28, 0.57, 0.32], [0.16, 0.18, 0.08], head, { shadow: false });
  };
  switch (l.hairStyle) {
    case "braid":
      cap();
      back();
      sides();
      for (let i = 0; i < 4; i++) part(G.round, h, [0.16, 0.24 - i * 0.14, -0.38 - i * 0.02], 0.15 - i * 0.012, head);
      part(G.box, flat(l.accent), [0.16, -0.24, -0.44], 0.08, head);
      break;
    case "bob":
      cap();
      part(G.round, h, [0, 0.34, -0.18], [0.9, 0.62, 0.44], head);
      [-0.43, 0.43].forEach((x) => part(G.round, h, [x, 0.36, 0.08], [0.1, 0.6, 0.46], head));
      break;
    case "bun":
      cap();
      back();
      sides();
      part(G.round, h, [0, 0.86, -0.2], 0.3, head);
      break;
    case "beanie":
      back();
      sides();
      break;
    default:
      cap();
      back();
      sides();
  }
}

function makeHat(l: CharacterLook) {
  const g = new THREE.Group();
  switch (l.hat) {
    case "chef":
      g.position.set(0, 0.78, -0.02);
      part(G.cyl, flat("#ffffff"), [0, 0.1, 0], [0.34, 0.22, 0.32], g);
      part(G.round, flat("#ffffff"), [0, 0.28, 0], [0.62, 0.24, 0.56], g);
      break;
    case "sunhat":
      g.position.set(0, 0.76, -0.02);
      g.rotation.x = -0.1;
      part(G.cyl, flat("#e8cf8a"), [0, 0, 0], [0.74, 0.04, 0.74], g);
      part(G.round, flat("#e8cf8a"), [0, 0.12, 0], [0.66, 0.24, 0.6], g);
      part(G.box, flat(l.accent), [0, 0.05, 0], [0.67, 0.06, 0.61], g);
      break;
    case "beanie":
      g.position.set(0, 0.6, -0.02);
      part(G.round, flat(l.accent), [0, 0.1, 0], [0.86, 0.36, 0.76], g);
      part(G.box, flat(l.hair), [0, -0.06, 0.01], [0.88, 0.1, 0.78], g);
      part(G.round, flat("#ffffff"), [0, 0.34, 0], 0.18, g);
      break;
    case "cap":
      g.position.set(0, 0.74, 0);
      g.rotation.x = -0.08;
      part(G.round, flat(l.accent), [0, 0.04, -0.02], [0.86, 0.22, 0.76], g);
      part(G.box, flat(l.accent), [0, -0.04, 0.44], [0.5, 0.04, 0.26], g);
      part(G.box, flat("#3f6f4a"), [0.4, 0.16, -0.1], [0.04, 0.26, 0.06], g);
      break;
    case "conductor":
      g.position.set(0, 0.76, 0);
      part(G.round, flat("#1c3553"), [0, 0.06, -0.02], [0.86, 0.2, 0.78], g);
      part(G.box, flat("#f2c230"), [0, 0, 0], [0.87, 0.05, 0.79], g);
      part(G.box, flat("#101c2c"), [0, -0.05, 0.44], [0.56, 0.04, 0.2], g);
      break;
    case "bollenhut":
      g.position.set(0, 0.76, -0.02);
      g.rotation.x = -0.06;
      part(G.cyl, flat("#f3ead8"), [0, 0, 0], [0.6, 0.04, 0.6], g);
      part(G.cyl, flat("#f3ead8"), [0, 0.07, 0], [0.4, 0.1, 0.4], g);
      for (const p of [[0, 0.26, 0.16], [-0.22, 0.2, 0.12], [0.22, 0.2, 0.12], [-0.16, 0.22, -0.16], [0.16, 0.22, -0.16], [0, 0.26, -0.2], [-0.34, 0.12, -0.02], [0.34, 0.12, -0.02]] as Vec3[])
        part(G.round, flat("#d42a2a"), p, 0.2, g);
      break;
  }
  return g;
}

// A loose hat comes back separately so it can fly off; park it with hatOnHead().
export function villager(id: string, { looseHat = false } = {}): Villager {
  const l = look(id);
  const g = new THREE.Group();
  const bodyGroup = new THREE.Group();
  g.add(bodyGroup);
  const leg = (x: number) => {
    const p = group(bodyGroup, [x, 0.34, 0]);
    part(G.box, flat(l.pants), [0, -0.13, 0], [0.16, 0.26, 0.18], p);
    part(G.round, flat("#4a3a30"), [0, -0.29, 0.03], [0.19, 0.1, 0.27], p);
    return p;
  };
  const legL = leg(-0.12);
  const legR = leg(0.12);
  part(G.round, flat(l.shirt), [0, 0.55, 0], [0.52, 0.46, 0.38], bodyGroup);
  if (l.apron) part(G.box, flat(l.apron), [0, 0.5, 0.19], [0.42, 0.36, 0.02], bodyGroup, { shadow: false });
  part(G.round, flat(l.accent), [0, 0.78, 0], [0.46, 0.1, 0.36], bodyGroup);
  const arm = (x: number) => {
    const p = group(bodyGroup, [x, 0.72, 0]);
    part(G.round, flat(l.shirt), [0, -0.12, 0], [0.14, 0.3, 0.15], p);
    const hand = part(G.round, flat(l.skin), [0, -0.3, 0], [0.13, 0.11, 0.13], p);
    return { p, hand };
  };
  const armL = arm(-0.32);
  const armR = arm(0.32);
  const neck = group(bodyGroup, [0, 0.8, 0]);
  const head = group(neck);
  part(G.round, flat(l.skin), [0, 0.38, 0], [0.78, 0.72, 0.68], head);
  const fm = faceMaterial();
  const face = new THREE.Mesh(G.face, fm);
  face.position.set(0, 0.34, 0.343);
  face.scale.set(0.62, 0.5, 1);
  head.add(face);
  if (l.beard) part(G.round, flat(l.hair), [0, 0.1, 0.33], [0.52, 0.16, 0.12], head);
  addHair(head, l);
  let hat: THREE.Group | null = null;
  if (l.hat) {
    hat = makeHat(l);
    if (looseHat) {
      hat.userData.local = new THREE.Matrix4().compose(hat.position.clone(), hat.quaternion.clone(), V(1, 1, 1));
      hat.position.set(0, 0, 0);
      hat.rotation.set(0, 0, 0);
    } else {
      head.add(hat);
      hat = null;
    }
  }
  g.scale.setScalar((l.scale ?? 1) * LOGIN_SCALE);
  const map = fm.map!;
  return {
    g,
    body: bodyGroup,
    head,
    legL,
    legR,
    armL: armL.p,
    armR: armR.p,
    handL: armL.hand,
    handR: armR.hand,
    hat,
    setFace: (frame) => {
      map.offset.x = FRAMES.indexOf(frame) / FRAMES.length;
    },
  };
}

const _m = new THREE.Matrix4();
export function hatOnHead(v: Villager, out = { pos: V(), quat: new THREE.Quaternion(), scale: V() }) {
  v.head.updateWorldMatrix(true, false);
  _m.copy(v.head.matrixWorld).multiply(v.hat!.userData.local as THREE.Matrix4).decompose(out.pos, out.quat, out.scale);
  return out;
}
export const handsMid = (v: Villager) => v.handL.getWorldPosition(V()).add(v.handR.getWorldPosition(V())).multiplyScalar(0.5);

// ---- Scene contract ----------------------------------------------------------------

export type Tag = { pos: THREE.Vector3; word: string; meaning: string; lang: "sv" | "de"; alpha: number };
export type Shot = { target: THREE.Vector3; yaw: number; pitch: number; dist: number; fov: number };
export type LoginScene = {
  island: string;
  title: string;
  // Slow-motion speed (0.5–0.7) and how much scene time one turn in the reel shows.
  slow: number;
  beat: number;
  // Scene time to run before the turn starts.
  warm: number;
  fadeColor: string;
  world: World;
  reset(): void;
  update(dt: number): void;
  shot(): Shot;
  tags(): Tag[];
  // The scene's own fade at the ends of its loop (0 = clear).
  fade(): number;
};
