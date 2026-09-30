import * as THREE from "three";

// The login screen's backdrop: six short, looping moments from the islands, each
// with a few words tagged in the language spoken there. Plain three.js rather
// than the game's React scene, so the whole reel stays one small, self-contained
// module that starts and stops with the page.

type V3 = THREE.Vector3;
type Word = { w: string; m: string };
type Label = { pos: V3; w: string; m: string; l: "Swedish" | "German"; a: number };
type View = { target: V3; yaw: number; pitch: number; dist: number; fov: number };
type World = { scene: THREE.Scene; sea: THREE.Mesh | null; amp: number };
type Reel = {
  world: World;
  slow: number;
  beat: number;
  fadeColor: string;
  reset(): void;
  update(dt: number): void;
  cam(): View;
  labels(): Label[];
  fade(): number;
};

const TAU = Math.PI * 2;
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
const S = 1.35; // villagers read a touch larger than in the game so faces carry at login size

// Reel time and the current sea's swell, shared by every scene.
let st = 0;
let seaAmp = 0.3;
let displayFont = '"Arial Rounded MT Bold", sans-serif';

// ---------- Toon materials (the game's three-step ramp) ----------
let ramp: THREE.DataTexture | null = null;
function RAMP() {
  if (!ramp) {
    ramp = new THREE.DataTexture(new Uint8Array([110, 175, 255]), 3, 1, THREE.RedFormat);
    ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
    ramp.generateMipmaps = false;
    ramp.needsUpdate = true;
  }
  return ramp;
}
type ToonOpts = { emissive?: string; ei?: number; side?: THREE.Side; map?: THREE.Texture; flat?: boolean };
const mats = new Map<string, THREE.Material>();
function toon(color: string, o: ToonOpts = {}) {
  const key = `${color}|${o.emissive || ""}|${o.ei || 0}|${o.side || 0}|${o.map ? o.map.uuid : ""}|${o.flat ? 1 : 0}`;
  let m = mats.get(key);
  if (!m) {
    const t = new THREE.MeshToonMaterial({ color, gradientMap: RAMP(), emissive: o.emissive || "#000000", emissiveIntensity: o.ei || 0, side: o.side || THREE.FrontSide, map: o.map || null });
    // Toon has no typed flatShading, but the renderer honours the flag on any material.
    if (o.flat) Object.assign(t, { flatShading: true });
    mats.set(key, (m = t));
  }
  return m;
}
function glow(color: string, k = 1.1) {
  const key = "glow" + color + k;
  let m = mats.get(key);
  if (!m) mats.set(key, (m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k) })));
  return m;
}
const pal = { falu: "#a83a2f", trim: "#f6efe0", roof: "#3d3f4a", roofTile: "#9a4f3a", wood: "#9a6a44", woodDark: "#6b4830", plank: "#be9163", stone: "#aaa89e", stoneDark: "#80827c", leaf: "#5c9a47", leafLight: "#8ec25e", pine: "#2f6a4a", sand: "#ead6a4", blue: "#3570b3", yellow: "#f4c24a", plaster: "#f6efe2", beam: "#5b3a24", tRoof: "#4a3226", shutter: "#2f6f4a" };

function roundedBox(r = 0.18, seg = 4) {
  const g = new THREE.BoxGeometry(1, 1, 1, seg, seg, seg), p = g.attributes.position, h = 0.5 - r, v = V(), c = V();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    c.set(clamp(v.x, -h, h), clamp(v.y, -h, h), clamp(v.z, -h, h));
    v.sub(c);
    if (v.lengthSq() > 0) v.normalize().multiplyScalar(r);
    p.setXYZ(i, c.x + v.x, c.y + v.y, c.z + v.z);
  }
  g.computeVertexNormals();
  return g;
}
const G = {
  round: roundedBox(),
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 10),
  cone: new THREE.ConeGeometry(1, 1, 8),
  sph: new THREE.SphereGeometry(1, 10, 8),
  prism: new THREE.CylinderGeometry(1, 1, 1, 3, 1, false, Math.PI / 2),
  face: new THREE.PlaneGeometry(1, 1),
  ico: new THREE.IcosahedronGeometry(1, 0),
};
type Tuple = [number, number, number];
function part(geo: THREE.BufferGeometry, color: string | THREE.Material, p: Tuple, s: number | Tuple, parent?: THREE.Object3D | null, shadow = true, r?: Tuple) {
  const m = new THREE.Mesh(geo, typeof color === "string" ? toon(color) : color);
  m.position.set(p[0], p[1], p[2]);
  if (typeof s === "number") m.scale.setScalar(s);
  else m.scale.set(s[0], s[1], s[2]);
  if (r) m.rotation.set(r[0], r[1], r[2]);
  m.castShadow = shadow;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
function tex(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, nearest = true) {
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
let flagTexture: THREE.Texture | null = null;
const flagTex = () => (flagTexture ??= tex(160, 100, (g) => { g.fillStyle = "#006aa7"; g.fillRect(0, 0, 160, 100); g.fillStyle = "#fecc02"; g.fillRect(50, 0, 20, 100); g.fillRect(0, 40, 160, 20); }));
const stripes = (a: string, b: string, n: number) => tex(64, 8, (g, w) => { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect((i * w) / n, 0, w / n + 1, 8); } });
function signTex(text: string, bg: string, fg: string, rim: string) {
  return tex(384, 64, (g, W, H) => {
    g.fillStyle = bg; g.fillRect(0, 0, W, H); g.strokeStyle = rim; g.lineWidth = 4; g.strokeRect(4, 4, W - 8, H - 8);
    g.fillStyle = fg; g.font = `600 36px ${displayFont}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, W / 2, H / 2 + 2);
  }, false);
}

// ---------- Villagers, built like the game's Character ----------
const FACE_W = 16, FACE_H = 13, FRAMES = ["neutral", "blink", "happy", "talk", "think"] as const;
type Face = (typeof FRAMES)[number];
let sheet: HTMLCanvasElement | null = null;
function faceSheet() {
  if (sheet) return sheet;
  const c = document.createElement("canvas");
  c.width = FACE_W * FRAMES.length;
  c.height = FACE_H;
  const ctx = c.getContext("2d")!;
  FRAMES.forEach((frame, i) => {
    const px = (x: number, y: number, col: string) => { ctx.fillStyle = col; ctx.fillRect(i * FACE_W + x, y, 1, 1); };
    const eye = (x: number, lift = 0) => { for (let y = 4 - lift; y <= 6 - lift; y++) { px(x, y, "#2b2233"); px(x + 1, y, "#2b2233"); } px(x + 1, 4 - lift, "#ffffff"); };
    const closed = (x: number) => [x - 1, x, x + 1, x + 2].forEach((xx) => px(xx, 6, "#2b2233"));
    const arch = (x: number) => { px(x - 1, 6, "#2b2233"); px(x, 5, "#2b2233"); px(x + 1, 5, "#2b2233"); px(x + 2, 6, "#2b2233"); };
    for (const x of [1, 2, 13, 14]) px(x, 8, "#f39a9a");
    if (frame === "blink") [3, 11].forEach(closed);
    else if (frame === "happy") [3, 11].forEach(arch);
    else if (frame === "think") [3, 11].forEach((x) => eye(x, 1));
    else [3, 11].forEach((x) => eye(x));
    if (frame === "talk") { [7, 8].forEach((x) => px(x, 9, "#7a3030")); [6, 7, 8, 9].forEach((x) => px(x, 10, "#7a3030")); [7, 8].forEach((x) => px(x, 11, "#e0707a")); }
    else if (frame === "happy") { [6, 7, 8, 9].forEach((x) => px(x, 9, "#7a3030")); [7, 8].forEach((x) => px(x, 10, "#e0707a")); }
    else if (frame === "think") { px(8, 10, "#7a3030"); px(9, 10, "#7a3030"); }
    else { px(6, 9, "#7a3030"); px(7, 10, "#7a3030"); px(8, 10, "#7a3030"); px(9, 9, "#7a3030"); }
  });
  return (sheet = c);
}
function faceMaterial() {
  const t = new THREE.CanvasTexture(faceSheet());
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.repeat.set(1 / FRAMES.length, 1);
  const m = new THREE.MeshToonMaterial({ map: t, gradientMap: RAMP(), alphaTest: 0.5 });
  return { m, set: (f: Face) => { t.offset.x = FRAMES.indexOf(f) / FRAMES.length; } };
}
type Look = { skin: string; hair: string; hairStyle: string; shirt: string; pants: string; accent: string; hat?: string; beard?: boolean; apron?: string; scale?: number };
function addHair(head: THREE.Object3D, look: Look) {
  const h = look.hair;
  const back = () => part(G.round, h, [0, 0.42, -0.26], [0.84, 0.58, 0.24], head);
  const sides = () => [-0.41, 0.41].forEach((x) => part(G.box, h, [x, 0.5, 0.02], [0.06, 0.34, 0.5], head, false));
  const cap = () => { part(G.round, h, [0, 0.68, -0.03], [0.86, 0.26, 0.76], head); part(G.box, h, [-0.08, 0.61, 0.32], [0.66, 0.12, 0.08], head, false); part(G.box, h, [0.28, 0.57, 0.32], [0.16, 0.18, 0.08], head, false); };
  switch (look.hairStyle) {
    case "braid": cap(); back(); sides(); for (let i = 0; i < 4; i++) part(G.round, h, [0.16, 0.24 - i * 0.14, -0.38 - i * 0.02], 0.15 - i * 0.012, head); part(G.box, look.accent, [0.16, -0.24, -0.44], 0.08, head); break;
    case "bun": cap(); back(); sides(); part(G.round, h, [0, 0.86, -0.2], 0.3, head); break;
    case "beanie": back(); sides(); break;
    default: cap(); back(); sides();
  }
}
function makeHat(kind: string, look: Look) {
  const g = new THREE.Group();
  switch (kind) {
    case "chef": g.position.set(0, 0.78, -0.02); part(G.cyl, "#ffffff", [0, 0.1, 0], [0.34, 0.22, 0.32], g); part(G.round, "#ffffff", [0, 0.28, 0], [0.62, 0.24, 0.56], g); break;
    case "sunhat": g.position.set(0, 0.76, -0.02); g.rotation.x = -0.1; part(G.cyl, "#e8cf8a", [0, 0, 0], [0.74, 0.04, 0.74], g); part(G.round, "#e8cf8a", [0, 0.12, 0], [0.66, 0.24, 0.6], g); part(G.box, look.accent, [0, 0.05, 0], [0.67, 0.06, 0.61], g); break;
    case "beanie": g.position.set(0, 0.6, -0.02); part(G.round, look.accent, [0, 0.1, 0], [0.86, 0.36, 0.76], g); part(G.box, look.hair, [0, -0.06, 0.01], [0.88, 0.1, 0.78], g); part(G.round, "#ffffff", [0, 0.34, 0], 0.18, g); break;
    case "cap": g.position.set(0, 0.74, 0); g.rotation.x = -0.08; part(G.round, look.accent, [0, 0.04, -0.02], [0.86, 0.22, 0.76], g); part(G.box, look.accent, [0, -0.04, 0.44], [0.5, 0.04, 0.26], g); part(G.box, "#3f6f4a", [0.4, 0.16, -0.1], [0.04, 0.26, 0.06], g); break;
    case "bollenhut":
      g.position.set(0, 0.76, -0.02); g.rotation.x = -0.06;
      part(G.cyl, "#f3ead8", [0, 0, 0], [0.6, 0.04, 0.6], g); part(G.cyl, "#f3ead8", [0, 0.07, 0], [0.4, 0.1, 0.4], g);
      ([[0, 0.26, 0.16], [-0.22, 0.2, 0.12], [0.22, 0.2, 0.12], [-0.16, 0.22, -0.16], [0.16, 0.22, -0.16], [0, 0.26, -0.2], [-0.34, 0.12, -0.02], [0.34, 0.12, -0.02]] as Tuple[]).forEach((p) => part(G.round, "#d42a2a", p, 0.2, g));
      break;
  }
  return g;
}
type Limb = THREE.Group & { userData: { hand: THREE.Mesh } };
// Loose hats come off: built separately, parked on the head until they fly.
function character(look: Look, opts: { looseHat?: boolean } = {}) {
  const g = new THREE.Group(), body = new THREE.Group();
  g.add(body);
  const leg = (x: number) => { const l = new THREE.Group(); l.position.set(x, 0.34, 0); part(G.box, look.pants, [0, -0.13, 0], [0.16, 0.26, 0.18], l); part(G.round, "#4a3a30", [0, -0.29, 0.03], [0.19, 0.1, 0.27], l); body.add(l); return l; };
  const legL = leg(-0.12), legR = leg(0.12);
  part(G.round, look.shirt, [0, 0.55, 0], [0.52, 0.46, 0.38], body);
  if (look.apron) part(G.box, look.apron, [0, 0.5, 0.19], [0.42, 0.36, 0.02], body, false);
  part(G.round, look.accent, [0, 0.78, 0], [0.46, 0.1, 0.36], body);
  const arm = (x: number) => { const a = new THREE.Group() as Limb; a.position.set(x, 0.72, 0); part(G.round, look.shirt, [0, -0.12, 0], [0.14, 0.3, 0.15], a); a.userData.hand = part(G.round, look.skin, [0, -0.3, 0], [0.13, 0.11, 0.13], a); body.add(a); return a; };
  const armL = arm(-0.32), armR = arm(0.32);
  const neck = new THREE.Group();
  neck.position.y = 0.8;
  body.add(neck);
  const head = new THREE.Group();
  neck.add(head);
  part(G.round, look.skin, [0, 0.38, 0], [0.78, 0.72, 0.68], head);
  const fm = faceMaterial();
  const face = new THREE.Mesh(G.face, fm.m);
  face.position.set(0, 0.34, 0.343);
  face.scale.set(0.62, 0.5, 1);
  head.add(face);
  if (look.beard) part(G.round, look.hair, [0, 0.1, 0.33], [0.52, 0.16, 0.12], head);
  addHair(head, look);
  let hat: THREE.Group | null = null;
  if (look.hat && !opts.looseHat) head.add(makeHat(look.hat, look));
  if (look.hat && opts.looseHat) {
    hat = makeHat(look.hat, look);
    hat.userData.local = new THREE.Matrix4().compose(hat.position.clone(), hat.quaternion.clone(), V(1, 1, 1));
    hat.position.set(0, 0, 0);
    hat.rotation.set(0, 0, 0);
  }
  g.scale.setScalar((look.scale || 1) * S);
  return { g, body, head, legL, legR, armL, armR, hat, setFace: fm.set };
}
type Villager = ReturnType<typeof character>;
const _m = new THREE.Matrix4();
function hatOnHead(ch: Villager, hat: THREE.Object3D) {
  const out = { pos: V(), quat: new THREE.Quaternion(), scale: V() };
  ch.head.updateWorldMatrix(true, false);
  _m.copy(ch.head.matrixWorld).multiply(hat.userData.local as THREE.Matrix4).decompose(out.pos, out.quat, out.scale);
  return out;
}
const LOOKS: Record<string, Look> = {
  astrid: { skin: "#f0c4a4", hair: "#e6e6e6", hairStyle: "bun", shirt: "#7aa65a", pants: "#6b5a4a", accent: "#e76f8a", hat: "sunhat", scale: 0.95 },
  elin: { skin: "#f3c9a8", hair: "#f2d27a", hairStyle: "braid", shirt: "#ffcf3f", pants: "#3c5a8a", accent: "#2f6fb5" },
  leo: { skin: "#f3d0b0", hair: "#e8c96a", hairStyle: "short", shirt: "#e76f51", pants: "#3c5a8a", accent: "#264653", hat: "cap", scale: 0.88 },
  olle: { skin: "#e9b996", hair: "#eeeeee", hairStyle: "short", shirt: "#1f3a5f", pants: "#3a3a3a", accent: "#f4f4f4", hat: "cap", beard: true },
  bosse: { skin: "#e8b48f", hair: "#6b4a2f", hairStyle: "short", shirt: "#f4efe6", pants: "#4a3a2e", accent: "#c0392b", hat: "chef", beard: true, apron: "#c0392b", scale: 1.08 },
  nils: { skin: "#e8b89a", hair: "#9a9a9a", hairStyle: "beanie", shirt: "#f2c230", pants: "#2c3e50", accent: "#c0392b", hat: "beanie", beard: true, scale: 1.04 },
  franz: { skin: "#eab896", hair: "#5b3a24", hairStyle: "short", shirt: "#f4efe6", pants: "#4a3a2e", accent: "#b5541c", hat: "chef", beard: true, apron: "#b5541c", scale: 1.08 },
  marie: { skin: "#f6d7c0", hair: "#b5542c", hairStyle: "bun", shirt: "#f7c948", pants: "#3d3d3d", accent: "#c0392b", apron: "#6fae4f" },
  hilde: { skin: "#f0c4a4", hair: "#e6e6e6", hairStyle: "bun", shirt: "#1f2a3a", pants: "#2c2a3d", accent: "#d42a2a", hat: "bollenhut", apron: "#f6f1e7", scale: 0.95 },
  sepp: { skin: "#e0a986", hair: "#6b4a2f", hairStyle: "short", shirt: "#5f7f3a", pants: "#4a3a2e", accent: "#3f5a2a", hat: "cap", beard: true, scale: 1.05 },
};
const hand = (limb: Limb) => limb.userData.hand.getWorldPosition(V());
const between = (a: Limb, b: Limb) => hand(a).add(hand(b)).multiplyScalar(0.5);

// ---------- Scenery ----------
function fir(s = 1, color = pal.pine) {
  const g = new THREE.Group();
  part(G.cyl, pal.woodDark, [0, 0.4 * s, 0], [0.18 * s, 0.8 * s, 0.18 * s], g);
  ([[1.1, 1.6, 1], [0.85, 1.3, 1.8], [0.55, 1.0, 2.5]] as Tuple[]).forEach(([r, h, y]) => part(G.cone, color, [0, y * s, 0], [r * s, h * s, r * s], g));
  return g;
}
// A house with its door on the +z face. 'falu' = Lilla Ö cottage, 'fachwerk' = Tannenau.
function house({ w = 3.6, d = 4.4, h = 2.4, wall = pal.falu, roof = pal.roof, style = "falu", door = 0 }: { w?: number; d?: number; h?: number; wall?: string; roof?: string; style?: "falu" | "fachwerk"; door?: number }) {
  const g = new THREE.Group();
  if (style === "fachwerk") part(G.box, pal.stone, [0, 0.3, 0], [w + 0.2, 0.6, d + 0.2], g);
  part(G.box, wall, [0, h / 2, 0], [w, h, d], g);
  const r = d / Math.sqrt(3), rise = 1.5 * r;
  const gable = part(G.prism, wall, [0, h + 0.5 * r, 0], [r, w, r], g);
  gable.rotation.z = Math.PI / 2;
  const slope = Math.atan2(rise, d / 2), len = Math.hypot(rise, d / 2) + 0.4;
  [-1, 1].forEach((sd) => part(G.box, roof, [0, h + rise / 2 + 0.08, (sd * d) / 4], [w + 0.5, 0.16, len], g, true, [sd * slope, 0, 0]));
  part(G.box, pal.stoneDark, [w * 0.25, h + rise * 0.7, -d * 0.2], [0.4, 1.2, 0.4], g);
  const fz = d / 2 + 0.03;
  if (style === "falu") {
    for (const x of [-1, 1]) for (const z of [-1, 1]) part(G.box, pal.trim, [(x * w) / 2, h / 2, (z * d) / 2], [0.18, h, 0.18], g, false);
  } else {
    const t = 0.12;
    for (const x of [-w / 2, -w / 4, 0, w / 4, w / 2]) part(G.box, pal.beam, [x, h / 2, fz], [t, h, t], g, false);
    for (const y of [h * 0.5, h - 0.05]) part(G.box, pal.beam, [0, y, fz], [w, t, t], g, false);
    for (const x of [-w * 0.375, w * 0.375]) for (const sd of [-1, 1]) part(G.box, pal.beam, [x, h * 0.75, fz], [t, Math.hypot(w / 4, h / 2) * 0.95, t], g, false, [0, 0, sd * Math.atan2(w / 4, h / 2)]);
  }
  part(G.box, pal.woodDark, [door, 0.75, fz], [0.8, 1.5, 0.08], g, false);
  const winY = style === "fachwerk" ? [h * 0.3, h * 0.72] : [h * 0.6];
  for (const y of winY) for (const x of [-w * 0.3, w * 0.3]) {
    if (Math.abs(x - door) < 0.7 && y < 1.6) continue;
    part(G.box, style === "falu" ? pal.trim : pal.beam, [x, y, fz], [0.8, 0.8, 0.08], g, false);
    part(G.box, glow("#ffd89a", 1.05), [x, y, fz + 0.03], [0.6, 0.6, 0.04], g, false);
    if (style === "fachwerk") for (const sd of [-1, 1]) part(G.box, pal.shutter, [x + sd * 0.46, y, fz + 0.02], [0.28, 0.72, 0.05], g, false);
  }
  return g;
}
// The Sapling mascot: a sprout with the villagers' pixel face, stubby arms and feet.
function saplingModel(scale = 1) {
  const g = new THREE.Group(), body = new THREE.Group();
  g.add(body);
  const leg = (x: number) => { const l = new THREE.Group(); l.position.set(x, 0.18, 0); part(G.round, "#2f7d4f", [0, -0.08, 0.03], [0.2, 0.12, 0.26], l); body.add(l); return l; };
  const legL = leg(-0.15), legR = leg(0.15);
  part(G.round, "#7cc97a", [0, 0.55, 0], [0.8, 0.76, 0.7], body);
  part(G.round, "#b9e6a6", [0, 0.32, 0.17], [0.5, 0.3, 0.3], body);
  const fm = faceMaterial();
  const face = new THREE.Mesh(G.face, fm.m);
  face.position.set(0, 0.64, 0.353);
  face.scale.set(0.56, 0.45, 1);
  body.add(face);
  part(G.cyl, "#26794c", [0, 1.02, 0], [0.05, 0.2, 0.05], body);
  const leaves = [-1, 1].map((sd) => { const l = new THREE.Group(); l.position.set(0, 1.1, 0); part(G.sph, sd > 0 ? "#4fbf7d" : "#3aa56b", [0.28 * sd, 0.04, 0], [0.32, 0.07, 0.17], l, true, [0, 0, sd * 0.35]); body.add(l); return l; });
  const arm = (x: number) => { const a = new THREE.Group() as Limb; a.position.set(x, 0.58, 0); part(G.round, "#6bb869", [0, -0.13, 0], [0.13, 0.28, 0.13], a); a.userData.hand = part(G.round, "#6bb869", [0, -0.27, 0], 0.1, a); body.add(a); return a; };
  const armL = arm(-0.44), armR = arm(0.44);
  g.scale.setScalar(S * scale);
  return { g, body, legL, legR, armL, armR, leaves, setFace: fm.set };
}
type Sprout = ReturnType<typeof saplingModel>;
// Leaves on his head: a steady tilt plus a flutter.
function leafFlutter(sap: Sprout, tilt: number, spread: number, flutter: number) {
  sap.leaves[0].rotation.set(tilt, 0, spread + Math.sin(st * 22) * flutter);
  sap.leaves[1].rotation.set(tilt, 0, -spread - Math.sin(st * 22 + 1) * flutter);
}
function gullModel() {
  const g = new THREE.Group();
  part(G.sph, "#ffffff", [0, 0, 0], [0.24, 0.22, 0.45], g);
  part(G.sph, "#ffffff", [0, 0.15, 0.45], 0.18, g);
  part(G.cone, "#ffc93c", [0, 0.12, 0.68], [0.05, 0.24, 0.05], g, true, [Math.PI / 2, 0, 0]);
  for (const x of [-0.1, 0.1]) part(G.box, "#2c2a3d", [x, 0.2, 0.58], 0.045, g, false);
  part(G.box, "#d9dde3", [0, 0.02, -0.52], [0.3, 0.05, 0.34], g);
  const wing = (sd: number) => { const p = new THREE.Group(); p.position.set(0.18 * sd, 0.1, 0); part(G.box, "#eef1f4", [0.3 * sd, 0, 0], [0.6, 0.04, 0.42], p); part(G.box, "#8a93a0", [0.84 * sd, 0, -0.04], [0.52, 0.035, 0.3], p); g.add(p); return p; };
  return { g, wl: wing(-1), wr: wing(1) };
}
type Gull = ReturnType<typeof gullModel>;
const flap = (gm: Gull, up: number) => { gm.wl.rotation.z = -up; gm.wr.rotation.z = up; };
function cloudModel(s = 1) {
  const g = new THREE.Group();
  ([[0, 0, 0, 2.4], [2.6, -0.4, 0.3, 1.9], [-2.4, -0.5, 0.2, 1.8], [0.9, 1.1, -0.2, 1.7]] as const).forEach(([x, y, z, r]) => part(G.ico, toon("#ffffff", { emissive: "#ffffff", ei: 0.35, flat: true }), [x, y, z], r, g, false));
  g.scale.setScalar(s);
  return g;
}
function mountains(scene: THREE.Scene, n: number, rMin: number, rMax: number, arc: [number, number] = [0, TAU]) {
  for (let i = 0; i < n; i++) {
    const a = lerp(arc[0], arc[1], i / (n - 1)) + rand(-0.05, 0.05), r = rand(rMin, rMax), h = rand(26, 48), w = rand(22, 34);
    const g = new THREE.Group();
    g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    part(G.cone, i % 2 ? "#3f6f55" : "#4a7a5c", [0, h / 2, 0], [w, h, w], g, false);
    if (i % 3 !== 1) part(G.cone, "#f4f7f8", [0, h * 0.86, 0], [w * 0.29, h * 0.28, w * 0.29], g, false);
    scene.add(g);
  }
}
// A landing net built along +z from the grip: butt end behind the fist, hoop at the tip, mesh bag hanging toward -y.
let netMat: THREE.Material | null = null;
function landingNet() {
  netMat ??= (() => {
    const t = tex(16, 16, (g) => { g.fillStyle = "#f3ead8"; g.fillRect(0, 0, 16, 4); g.fillRect(0, 0, 4, 16); });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(9, 4);
    return new THREE.MeshToonMaterial({ map: t, gradientMap: RAMP(), alphaTest: 0.5, side: THREE.DoubleSide });
  })();
  const g = new THREE.Group(), R = 0.34, L = 1.25, butt = 0.4;
  part(G.cyl, pal.wood, [0, 0, (L - butt) / 2], [0.045, L + butt, 0.045], g, true, [Math.PI / 2, 0, 0]);
  part(G.cyl, "#2c2a3d", [0, 0, -butt], [0.06, 0.08, 0.06], g, true, [Math.PI / 2, 0, 0]);
  part(new THREE.TorusGeometry(R, 0.035, 5, 18), "#3a3d45", [0, 0, L + R], 1, g, true, [Math.PI / 2, 0, 0]);
  const bag = new THREE.Mesh(new THREE.SphereGeometry(R, 16, 6, 0, TAU, Math.PI / 2, Math.PI / 2), netMat);
  bag.position.set(0, 0, L + R);
  bag.scale.set(1, 1.5, 1);
  g.add(bag);
  g.userData.hoopZ = L + R;
  return g;
}

// ---------- Water + world ----------
const seaH = (x: number, z: number, t: number) => seaAmp * (Math.sin(x * 0.18 + t * 1.1) + 0.8 * Math.sin(z * 0.23 + t * 0.8 + x * 0.05) + 0.25 * Math.sin((x + z) * 0.5 + t * 1.7));
function makeWorld({ top, bottom, fog = bottom, sun, water, amp = 0.3, shadow = 26 }: { top: string; bottom: string; fog?: string; sun: Tuple; water: string | null; amp?: number; shadow?: number }): World {
  const scene = new THREE.Scene();
  scene.background = tex(2, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, 2, 256); }, false);
  scene.fog = new THREE.Fog(fog, 60, 220);
  scene.add(new THREE.HemisphereLight("#eaf6ff", "#a08c64", 1.5));
  const light = new THREE.DirectionalLight("#fff3dc", 2.4);
  light.position.set(...sun).multiplyScalar(50);
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  Object.assign(light.shadow.camera, { left: -shadow, right: shadow, top: shadow, bottom: -shadow, near: 1, far: 150 });
  light.shadow.bias = -0.0004;
  light.shadow.normalBias = 0.03;
  scene.add(light, light.target);
  let sea: THREE.Mesh | null = null;
  if (water) {
    const geo = new THREE.PlaneGeometry(320, 320, 96, 96);
    geo.rotateX(-Math.PI / 2);
    sea = new THREE.Mesh(geo, toon(water, { flat: true }));
    sea.receiveShadow = true;
    sea.userData.base = Float32Array.from(geo.attributes.position.array);
    scene.add(sea);
  }
  return { scene, sea, amp };
}
function waveSea(w: World) {
  if (!w.sea) return;
  const p = w.sea.geometry.attributes.position, b = w.sea.userData.base as Float32Array;
  for (let i = 0; i < p.count; i++) p.array[i * 3 + 1] = seaH(b[i * 3], b[i * 3 + 2], st);
  p.needsUpdate = true;
}
function splashRing(scene: THREE.Scene) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.035, 3, 28), toon("#ffffff"));
  m.rotation.x = Math.PI / 2;
  m.visible = false;
  scene.add(m);
  return m;
}
function setRing(m: THREE.Mesh, c: V3, age: number, dur = 1.8, size = 2.4) {
  if (age < 0 || age > dur) { m.visible = false; return; }
  const k = age / dur;
  m.visible = true;
  m.position.set(c.x, seaH(c.x, c.z, st) + 0.06, c.z);
  m.scale.set(0.5 + k * size, 0.5 + k * size, Math.max(0.05, 1 - k));
}
function tube(mesh: THREE.Mesh, curve: THREE.Curve<V3>, r: number) {
  mesh.geometry.dispose();
  mesh.geometry = new THREE.TubeGeometry(curve, 16, r, 5, false);
}

// ---------- Particles (kept sparse so the pixel look stays clean) ----------
type ParticleInit = { pos?: V3; vel?: V3; spin?: V3; g?: number; drag?: number; life?: number; size?: number; grow?: number; flutter?: number; floor?: number; fadeIn?: number; color?: string; word?: Word | null };
type Particle = Required<Omit<ParticleInit, "color" | "word">> & { rot: THREE.Euler; age: number; ph: number; color: THREE.Color; word: Word | null };
const dummy = new THREE.Object3D();
class Swarm {
  list: Particle[] = [];
  mesh: THREE.InstancedMesh;
  constructor(scene: THREE.Scene, geo: THREE.BufferGeometry, readonly max: number, opts: THREE.MeshToonMaterialParameters = {}) {
    this.mesh = new THREE.InstancedMesh(geo, new THREE.MeshToonMaterial({ color: "#ffffff", gradientMap: RAMP(), ...opts }), max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;
    const c = new THREE.Color("#ffffff");
    for (let i = 0; i < max; i++) this.mesh.setColorAt(i, c);
    this.mesh.count = 0;
    scene.add(this.mesh);
  }
  emit({ color, word, ...o }: ParticleInit) {
    if (this.list.length >= this.max) this.list.shift();
    const p: Particle = { pos: V(), vel: V(), spin: V(), g: 0, drag: 0, life: 1, size: 1, grow: 0, flutter: 0, floor: -Infinity, fadeIn: 0, ...o, rot: new THREE.Euler(rand(0, TAU), rand(0, TAU), rand(0, TAU)), age: 0, ph: rand(0, TAU), color: new THREE.Color(color || "#ffffff"), word: word ?? null };
    this.list.push(p);
    return p;
  }
  update(dt: number) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.age += dt;
      if (p.age > p.life) { this.list.splice(i, 1); continue; }
      p.vel.y += p.g * dt;
      p.vel.multiplyScalar(Math.exp(-p.drag * dt));
      p.pos.addScaledVector(p.vel, dt);
      if (p.flutter) { p.pos.x += Math.sin(p.age * 2.3 + p.ph) * p.flutter * dt; p.pos.y += Math.cos(p.age * 1.7 + p.ph) * p.flutter * 0.6 * dt; }
      if (p.pos.y < p.floor) { p.pos.y = p.floor; p.vel.set(0, 0, 0); p.spin.set(0, 0, 0); }
      p.rot.x += p.spin.x * dt; p.rot.y += p.spin.y * dt; p.rot.z += p.spin.z * dt;
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
  clear() { this.list.length = 0; this.update(0); }
}
let leafGeometry: THREE.BufferGeometry | null = null;
const leafGeo = () => (leafGeometry ??= new THREE.CircleGeometry(0.22, 6).scale(1.8, 1, 1));
const drops = (sw: Swarm, n: number, at: V3, o: ParticleInit | ((i: number) => ParticleInit)) => {
  for (let i = 0; i < n; i++) sw.emit({ pos: at.clone(), color: pick(["#ffffff", "#e3f7f6"]), ...(typeof o === "function" ? o(i) : o) });
};

// Physics bodies for props that get thrown (cups, buns, apples).
type Body = { obj: THREE.Object3D; pos: V3; vel: V3; spin: V3; rest: boolean; g: number; floor: number };
function body<T extends object>(obj: THREE.Object3D, extra: Partial<Body> & T = {} as T): Body & T {
  return { obj, pos: V(), vel: V(), spin: V(), rest: false, g: -4.5, floor: -Infinity, ...extra };
}
function stepBody(b: Body, dt: number) {
  if (b.rest) return;
  b.vel.y += b.g * dt;
  b.pos.addScaledVector(b.vel, dt);
  b.obj.rotation.x += b.spin.x * dt; b.obj.rotation.y += b.spin.y * dt; b.obj.rotation.z += b.spin.z * dt;
  if (b.pos.y < b.floor) { b.pos.y = b.floor; b.vel.set(0, 0, 0); b.spin.set(0, 0, 0); b.rest = true; }
  b.obj.position.copy(b.pos);
}

// ======================================================================
// Lilla Ö 1: Words on the wind
// ======================================================================
const LEAF = ["#5c9a47", "#8ec25e", "#3f7d4f", "#f4c24a", "#e0913a"];
const BLOBS = [[0, 0, 0, 2.6], [1.9, -0.4, 0.6, 2], [-1.9, -0.2, 0.4, 2.1], [0.6, 1.3, -0.6, 1.9], [-0.8, 1, 1.2, 1.7], [0.4, -0.6, -1.9, 1.9], [-1.2, -0.9, -1.2, 1.6]] as const;
function windScene(): Reel {
  const windDir = V(-0.28, 0, 1).normalize(), windSide = V(windDir.z, 0, -windDir.x);
  const w = makeWorld({ top: "#7cc4e2", bottom: "#f3dcb8", sun: [-0.7, 0.9, 0.2], water: "#76cbe5", amp: 0.3 });
  const s = w.scene;
  part(G.cyl, pal.sand, [0, 0.2, 0], [11, 1.6, 11], s);
  part(G.cyl, pal.leaf, [0, 1.2, 0], [9.2, 0.8, 9.2], s);
  for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.3; part(G.ico, toon(pal.stone, { flat: true }), [Math.cos(a) * 10.6, 0.6, Math.sin(a) * 10.6], rand(0.6, 1.1), s); }
  ([[-5, -4, 1.1], [-6.6, -0.8, 0.9], [-3, -6.4, 1.2], [5.5, -5, 1]] as Tuple[]).forEach(([x, z, sc]) => { const f = fir(sc); f.position.set(x, 1.6, z); s.add(f); });
  const cot = house({ w: 3.6, d: 3.2, h: 2.2 });
  cot.position.set(-6.5, 1.6, -5.5); cot.rotation.y = 0.5; cot.scale.setScalar(0.8); s.add(cot);
  const tree = new THREE.Group();
  tree.position.set(2, 1.6, -2);
  s.add(tree);
  part(G.cyl, pal.woodDark, [0, 3, 0], [0.7, 6, 0.7], tree);
  part(G.cyl, pal.woodDark, [-0.9, 4.6, 0], [0.22, 2.6, 0.22], tree, true, [0, 0, 0.9]);
  part(G.cyl, pal.woodDark, [1, 4.3, 0.3], [0.2, 2.4, 0.2], tree, true, [0, 0, -0.9]);
  const canopy = new THREE.Group();
  canopy.position.y = 6.9;
  tree.add(canopy);
  const blobs = BLOBS.map(([x, y, z, r], i) => { const m = part(G.sph, [pal.leaf, pal.leafLight, "#4f8a3e"][i % 3], [x, y, z], r, canopy); m.userData.base = m.position.clone(); m.userData.r = r; return m; });
  const tufts: THREE.Mesh[] = [];
  for (let i = 0; i < 28; i++) { const a = rand(0, TAU), r = Math.sqrt(Math.random()) * 8; tufts.push(part(G.cone, i % 2 ? "#4f8a3e" : pal.leafLight, [Math.cos(a) * r, 1.85, Math.sin(a) * r], [0.14, 0.6, 0.14], s, false)); }
  const astrid = character(LOOKS.astrid, { looseHat: true });
  astrid.g.position.set(-3.2, 1.6, 3); astrid.g.rotation.y = 0.75; s.add(astrid.g);
  const hat = astrid.hat!;
  s.add(hat);
  const sap = saplingModel();
  sap.g.position.set(-0.7, 1.6, 3.7); sap.g.rotation.y = 0.75; s.add(sap.g);
  const leaves = new Swarm(s, leafGeo(), 40, { side: THREE.DoubleSide });
  const streaks = Array.from({ length: 5 }, () => {
    const geo = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 7 }, (_, k) => V(0, Math.sin(k * 0.8) * 0.18, k * 0.9)));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.55 }));
    line.rotation.y = Math.atan2(windDir.x, windDir.z);
    line.userData = { o: rand(0, 60), y: rand(3, 10), x: rand(-12, 12), sp: rand(12, 16) };
    s.add(line);
    return line;
  });
  ([[-40, -70, 9], [30, -80, 12], [70, -55, 7]] as Tuple[]).forEach(([x, z, r]) => part(G.sph, pal.leaf, [x, 0, z], [r, r * 0.3, r], s, false));
  const clouds = ([[-30, 22, -70, 2], [15, 26, -90, 2.6], [50, 20, -60, 1.6]] as const).map(([x, y, z, sc]) => { const c = cloudModel(sc); c.position.set(x, y, z); c.userData.x = x; s.add(c); return c; });

  let acc = 0, n = 0, q = 0;
  const gust = () => 0.62 + 0.38 * Math.sin(st * 0.45) + 0.12 * Math.sin(st * 1.7);
  function spawn(dt: number, g: number) {
    acc += dt * (1.6 + 2.2 * g);
    tree.updateMatrixWorld(true);
    while (acc > 1) {
      acc -= 1;
      const b = pick(blobs);
      const pos = b.getWorldPosition(V()).add(V(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(b.userData.r * 0.9));
      const word = n++ % 4 === 0 ? { w: "lövet", m: "the leaf" } : null;
      leaves.emit({ pos, vel: windDir.clone().multiplyScalar(rand(4, 7) * g).add(V(rand(-1.2, 1.2), rand(0, 1.8), 0)), g: -0.6, drag: 0.04, flutter: rand(0.8, 2), spin: V(rand(-3, 3), rand(-3, 3), rand(-3, 3)), life: rand(6, 8), size: word ? 1.9 : rand(1.2, 1.6), color: word ? pal.yellow : pick(LEAF), word, fadeIn: 0.3 });
    }
  }
  return {
    world: w, slow: 0.6, beat: 5.9, fadeColor: "#f3dcb8",
    reset() { leaves.clear(); acc = 0; n = 0; for (let t = 0; t < 3; t += 1 / 30) { spawn(1 / 30, 0.8); leaves.update(1 / 30); } },
    update(dt) {
      const g = gust();
      waveSea(w);
      tree.rotation.x = 0.035 * g + Math.sin(st * 1.3) * 0.02 * g;
      blobs.forEach((b, i) => { b.position.copy(b.userData.base).addScaledVector(windDir, 0.35 * g + Math.sin(st * 2.1 + i) * 0.22 * g); });
      tufts.forEach((t, i) => { t.rotation.x = 0.55 * g + Math.sin(st * 3 + i) * 0.15; t.rotation.z = 0.15 * g; });
      const A = astrid;
      q = (st % 6) / 6;
      A.body.rotation.x = 0.22 * g;
      A.armR.rotation.z = 2.4 + Math.sin(st * 3) * 0.2; A.armR.rotation.x = -0.4;
      A.armL.rotation.z = -1.0 - Math.sin(st * 5) * 0.3;
      A.legR.rotation.x = -0.35; A.legL.rotation.x = 0.3;
      A.head.rotation.x = -0.25;
      A.setFace(q > 0.05 && q < 0.8 ? "talk" : "think");
      const h = hatOnHead(A, hat);
      const tumble = new THREE.Quaternion().setFromEuler(new THREE.Euler(q * 7, q * 3, Math.sin(q * 6) * 1.1));
      hat.position.copy(h.pos).addScaledVector(windDir, q * q * 26).addScaledVector(UP, Math.sin(q * Math.PI) * 3.5 + q * 3).addScaledVector(windSide, Math.sin(q * 5) * 1.2);
      hat.quaternion.copy(h.quat).multiply(tumble);
      hat.scale.copy(h.scale).multiplyScalar(smooth(0, 0.04, q) * (1 - smooth(0.88, 1, q)) + 1e-3);
      const P = sap;
      P.body.rotation.x = 0.26 * g; P.legR.rotation.x = -0.4; P.legL.rotation.x = 0.35;
      P.armL.rotation.z = -1.1 - Math.sin(st * 5 + 1) * 0.3; P.armR.rotation.set(-0.3, 0, 1.0 + Math.sin(st * 4) * 0.25);
      leafFlutter(P, 0.9 * g, 0.4, 0.4 * g); P.setFace("talk");
      spawn(dt, g);
      leaves.update(dt);
      streaks.forEach((l) => { const u = l.userData, d = ((st * u.sp + u.o) % 60) - 30; l.position.set(u.x + windDir.x * d, u.y + Math.sin(st + u.o) * 0.3, windDir.z * d); });
      clouds.forEach((c, i) => { c.position.x = c.userData.x + st * (0.6 + i * 0.2); });
    },
    cam: () => ({ target: V(0, 3.4, 0), yaw: 0.62, pitch: 0.24, dist: 27, fov: 38 }),
    labels() {
      // one leaf tagged at a time, plus the things around the island
      const out: Label[] = [];
      const leaf = leaves.list.find((p) => p.word && p.age / p.life < 0.9);
      if (leaf?.word) out.push({ pos: leaf.pos, w: leaf.word.w, m: leaf.word.m, l: "Swedish", a: smooth(0.4, 1.2, leaf.age) * (1 - smooth(0.75, 0.9, leaf.age / leaf.life)) });
      out.push({ pos: V(2, 11.2, -2), w: "trädet", m: "the tree", l: "Swedish", a: 1 });
      out.push({ pos: V(-14, 0.4, 3), w: "havet", m: "the sea", l: "Swedish", a: 1 });
      out.push({ pos: V(-6.5, 5.2, -5.5), w: "stugan", m: "the cottage", l: "Swedish", a: 1 });
      out.push({ pos: hat.position, w: "solhatten", m: "the sunhat", l: "Swedish", a: smooth(0.08, 0.16, q) * (1 - smooth(0.7, 0.82, q)) });
      return out;
    },
    fade: () => 0,
  };
}

// ======================================================================
// Lilla Ö 2: Ferry arriving
// ======================================================================
const P0 = V(-44, 0, -18), P1 = V(-24, 0, 8), P2 = V(0, 0, 5.3);
const bez = (t: number) => V().addScaledVector(P0, (1 - t) * (1 - t)).addScaledVector(P1, 2 * (1 - t) * t).addScaledVector(P2, t * t);
const bezTan = (t: number) => V().addScaledVector(P1.clone().sub(P0), 2 * (1 - t)).addScaledVector(P2.clone().sub(P1), 2 * t);
function buildFerry() {
  const g = new THREE.Group();
  g.rotation.order = "YXZ";
  const shape = new THREE.Shape();
  shape.moveTo(-4.5, -1.5); shape.lineTo(2.2, -1.5); shape.quadraticCurveTo(4.4, -1.3, 5.3, 0); shape.quadraticCurveTo(4.4, 1.3, 2.2, 1.5); shape.lineTo(-4.5, 1.5); shape.lineTo(-4.5, -1.5);
  const hull = (depth: number) => { const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }); geo.rotateX(-Math.PI / 2); return geo; };
  const add = (geo: THREE.BufferGeometry, c: string, y: number, sx = 1, sz = 1) => part(geo, c, [0, y, 0], [sx, 1, sz], g);
  add(hull(0.5), "#2c2a3d", -0.6, 0.98, 0.97); add(hull(1.3), "#f7f3ea", -0.3); add(hull(0.24), "#1f5a3a", 0.3, 1.012, 1.03); add(hull(0.08), pal.plank, 1.0, 0.96, 0.94);
  part(G.box, "#ffffff", [-1.2, 1.7, 0], [4.2, 1.3, 2.4], g);
  part(G.box, glow("#bfe6f0", 0.9), [-1.2, 1.85, 0], [4.0, 0.42, 2.45], g, false);
  part(G.box, "#8b1e2d", [-1.2, 2.44, 0], [4.6, 0.18, 2.8], g);
  part(G.box, "#ffffff", [0.3, 3.0, 0], [1.5, 1, 2], g);
  part(G.box, "#8b1e2d", [0.3, 3.55, 0], [1.8, 0.14, 2.3], g);
  part(G.cyl, "#1d1d24", [-2.6, 3.3, 0], [0.38, 1.7, 0.38], g);
  part(G.cyl, "#d9a53a", [-2.6, 3.8, 0], [0.4, 0.2, 0.4], g);
  part(G.cyl, "#e6e0d4", [-4.3, 1.9, 0], [0.04, 1.8, 0.04], g);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), toon("#ffffff", { map: flagTex(), side: THREE.DoubleSide }));
  fl.position.set(-4.72, 2.55, 0);
  g.add(fl);
  const crew = character(LOOKS.olle);
  crew.g.scale.multiplyScalar(0.9); crew.g.position.set(3.0, 1.04, -0.4); crew.g.rotation.y = Math.PI; g.add(crew.g);
  const sap = saplingModel(0.85);
  sap.g.position.set(4.75, 1.08, 0); sap.g.rotation.y = Math.PI / 2; g.add(sap.g);
  return { g, crew, sap };
}
function ferryScene(): Reel {
  const T = 8;
  const w = makeWorld({ top: "#8ecfea", bottom: "#f8e2c4", sun: [0.55, 0.85, 0.55], water: "#76cbe5", amp: 0.45, shadow: 34 });
  const s = w.scene;
  const isl = new THREE.Group();
  isl.position.set(17, 0, -9);
  s.add(isl);
  part(G.cyl, pal.sand, [0, 0.3, 0], [16, 1.6, 16], isl); part(G.cyl, pal.leaf, [0, 1.4, 0], [14, 1, 14], isl);
  ([[-8, -1.2, -0.4, pal.falu], [-3, 0.5, 0.2, pal.yellow], [2, 4.5, -0.2, pal.falu], [-5, -6.5, 0.5, "#f3efe6"], [6.5, 1.5, 0.1, pal.falu]] as const).forEach(([x, z, r, c], i) => { const h = house({ wall: c, roof: i % 2 ? pal.roofTile : pal.roof }); h.position.set(x, 1.9, z); h.rotation.y = r; h.scale.setScalar(0.75); isl.add(h); });
  for (let i = 0; i < 12; i++) { const f = fir(rand(0.8, 1.3)); f.position.set(rand(-11, 12), 1.9, rand(-12, -6)); isl.add(f); }
  part(G.cyl, "#e6e0d4", [6.5, 4.8, 1], [0.1, 6, 0.1], s);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5, 12, 1), toon("#ffffff", { map: flagTex(), side: THREE.DoubleSide }));
  flag.geometry.translate(1.2, 0, 0);
  flag.position.set(6.5, 7, 1);
  s.add(flag);
  const flagBase = Float32Array.from(flag.geometry.attributes.position.array);
  const lh = new THREE.Group();
  lh.position.set(-34, 0, -52);
  s.add(lh);
  part(G.ico, toon(pal.stone, { flat: true }), [0, 0, 0], 4, lh); part(G.cyl, "#ffffff", [0, 5.5, 0], [1.1, 7, 1.1], lh); part(G.cyl, pal.falu, [0, 6, 0], [1.15, 1.2, 1.15], lh); part(G.cyl, glow("#ffd27a", 1.4), [0, 9.5, 0], [0.7, 1, 0.7], lh);
  for (let x = -5.5; x <= 5; x += 0.55) part(G.box, Math.round(x / 0.55) % 3 ? pal.plank : "#a87c52", [x, 1.32, 2], [0.5, 0.14, 2.4], s);
  for (let x = -5.5; x <= 4.5; x += 2) for (const z of [0.9, 3.1]) part(G.cyl, pal.woodDark, [x, 0.1, z], [0.15, 3.4, 0.15], s);
  const rec = character(LOOKS.elin);
  rec.g.position.set(-2.4, 1.4, 2.7); s.add(rec.g);
  const waver = character(LOOKS.leo);
  waver.g.position.set(1.4, 1.4, 1.6); waver.g.rotation.y = -0.2; s.add(waver.g);
  const f = buildFerry(), ferry = f.g, crew = f.crew, F = f.sap;
  s.add(ferry);
  const spray = new Swarm(s, G.ico, 90);
  const smoke = new Swarm(s, new THREE.IcosahedronGeometry(1, 1), 16);
  const rope = new THREE.Mesh(new THREE.BufferGeometry(), toon("#d8b878"));
  rope.castShadow = true;
  s.add(rope);
  const coil = part(new THREE.TorusGeometry(0.22, 0.07, 5, 10), "#d8b878", [0, 0, 0], 1, s);
  const gulls = [0, 1].map(() => { const gm = gullModel(); gm.g.scale.setScalar(1.3); s.add(gm.g); return gm; });
  const clouds = ([[-40, 24, -80, 2.4], [20, 28, -95, 3]] as const).map(([x, y, z, sc]) => { const c = cloudModel(sc); c.position.set(x, y, z); c.userData.x = x; s.add(c); return c; });

  let acc = 0, smokeT = 0, prevBow: number | null = null, p = 0, ropeHead: V3 | null = null;
  return {
    world: w, slow: 0.7, beat: 7.85, fadeColor: "#f8e2c4",
    reset() { spray.clear(); smoke.clear(); acc = 0; smokeT = 0; prevBow = null; ropeHead = null; },
    update(dt) {
      waveSea(w);
      p = (st / T) % 1;
      const lin = clamp(p / 0.74, 0, 1), e = 1 - Math.pow(1 - lin, 2.4);
      const pos = bez(e), tan = bezTan(e), fwd = tan.clone().normalize();
      const speed = (tan.length() * (p < 0.74 ? (2.4 * Math.pow(1 - lin, 1.4)) / 0.74 : 0)) / T;
      const sp = clamp(speed / 16, 0, 1);
      const heading = Math.atan2(-fwd.z, fwd.x);
      const t2 = bezTan(Math.min(1, e + 0.02)), turn = Math.atan2(-t2.z, t2.x) - heading;
      const bow = pos.clone().addScaledVector(fwd, 4.8), stern = pos.clone().addScaledVector(fwd, -4.2), side = V(-fwd.z, 0, fwd.x);
      const bowH = seaH(bow.x, bow.z, st), sternH = seaH(stern.x, stern.z, st);
      ferry.position.set(pos.x, (bowH + sternH) * 0.42 + 0.05, pos.z);
      ferry.rotation.set(clamp(-turn * 6, -0.25, 0.25) * sp, heading, Math.atan2(bowH - sternH, 9) + sp * 0.05);
      ferry.updateMatrixWorld(true);
      const dBow = prevBow === null || dt === 0 ? 0 : (bowH - prevBow) / dt;
      if (dt > 0) prevBow = bowH;
      acc += dt * sp * (24 + 50 * Math.max(0, -dBow));
      const bowW = ferry.localToWorld(V(4.3, 0.6, 0));
      while (acc > 1) {
        acc -= 1;
        const sd = Math.random() < 0.5 ? -1 : 1;
        spray.emit({ pos: bowW.clone().addScaledVector(fwd, -rand(0, 1.5)).addScaledVector(side, sd * rand(0.7, 1.3)), vel: side.clone().multiplyScalar(sd * rand(2, 5) * (0.4 + sp)).add(V(0, rand(3, 7) * (0.4 + sp), 0)).addScaledVector(fwd, speed * rand(0.2, 0.5)), g: -9, drag: 0.5, life: rand(1.2, 1.8), size: rand(0.2, 0.32), color: pick(["#ffffff", "#e3f7f6"]) });
      }
      smokeT -= dt;
      if (smokeT <= 0) { smokeT = 0.45; smoke.emit({ pos: ferry.localToWorld(V(-2.6, 4.3, 0)), vel: V(0, 1.4, 0).addScaledVector(fwd, -speed * 0.35).add(V(-0.5, 0, 0.4)), drag: 0.35, grow: 0.8, size: 0.45, life: 5, color: "#eee8dc" }); }
      spray.update(dt); smoke.update(dt);
      const wind = smooth(0.52, 0.62, p), thr = smooth(0.62, 0.7, p);
      crew.armR.rotation.x = lerp(0.9 * wind, -2.6, thr); crew.armL.rotation.x = -0.6 - thr * 0.4;
      crew.body.rotation.x = -0.2 * wind + 0.35 * thr; crew.setFace(p > 0.55 && p < 0.75 ? "talk" : "neutral");
      const r = smooth(0.64, 0.82, p);
      rec.armL.rotation.x = rec.armR.rotation.x = -1.3 - smooth(0.7, 0.82, p) * 0.9 + (p > 0.82 ? 0.6 : 0);
      rec.body.rotation.x = p > 0.82 ? -0.25 : 0.1; rec.setFace(p > 0.82 ? "happy" : "think");
      waver.armR.rotation.z = 2.5 + Math.sin(st * 6) * 0.45; waver.setFace("happy");
      const arrive = smooth(0.7, 0.8, p);
      F.armL.rotation.set(0, 0, lerp(-1.45, -0.2, arrive) + Math.sin(st * 3) * 0.08); F.armR.rotation.set(0, 0, lerp(1.45, 2.6 + Math.sin(st * 7) * 0.4, arrive));
      F.body.rotation.x = -0.12 * (1 - arrive); leafFlutter(F, -0.9 * (1 - arrive), 0.4, 0.35 * (1 - arrive) + 0.05);
      F.setFace(p < 0.72 ? "happy" : "talk");
      crew.g.updateMatrixWorld(true); rec.g.updateMatrixWorld(true);
      const from = hand(crew.armR), to = hand(rec.armR);
      if (p < 0.64) { rope.visible = false; coil.visible = true; coil.position.copy(from); coil.rotation.set(st * 2, 0.5, 0); }
      else {
        rope.visible = true; coil.visible = r < 1;
        const head = from.clone().lerp(to, r).addScaledVector(UP, Math.sin(Math.PI * r) * 3.2);
        const mid = from.clone().lerp(head, 0.5).addScaledVector(UP, r < 1 ? Math.sin(Math.PI * r) * 1.2 : -0.9);
        tube(rope, new THREE.QuadraticBezierCurve3(from, mid, head), 0.07);
        coil.position.copy(head); coil.rotation.set(st * 5, 0.5, st * 3); ropeHead = head;
      }
      gulls.forEach((gm, i) => {
        const a = st * 0.55 + i * 3, rr = 7 + i * 2, c = V(-3 + Math.cos(a) * rr, 9 + i, 1 + Math.sin(a) * rr * 0.7), n = V(-3 + Math.cos(a + 0.1) * rr, 9 + i, 1 + Math.sin(a + 0.1) * rr * 0.7);
        gm.g.position.copy(c); gm.g.lookAt(n); gm.g.rotation.z += 0.3; flap(gm, Math.sin(st * 6 + i * 2) * 0.6);
      });
      const fp = flag.geometry.attributes.position;
      for (let i = 0; i < fp.count; i++) { const x = flagBase[i * 3]; fp.array[i * 3 + 2] = Math.sin(st * 4 - x * 2.2) * 0.2 * (x / 2.4); }
      fp.needsUpdate = true;
      clouds.forEach((c, i) => { c.position.x = c.userData.x + st * (0.5 + i * 0.2); });
    },
    cam() { const f = ferry.position; return { target: V(lerp(1, f.x, 0.45), 2.4, lerp(1, f.z, 0.45)), yaw: 0.42, pitch: 0.18, dist: 34, fov: 36 }; },
    labels() {
      const out: Label[] = [], end = 1 - smooth(0.9, 0.94, p);
      out.push({ pos: ferry.localToWorld(V(0.3, 4.4, 0)), w: "färjan", m: "the ferry", l: "Swedish", a: smooth(0.06, 0.14, p) * end });
      out.push({ pos: V(-4.8, 1.8, 2.2), w: "bryggan", m: "the dock", l: "Swedish", a: smooth(0.2, 0.3, p) * end });
      if (p > 0.64 && ropeHead) out.push({ pos: ropeHead, w: "repet", m: "the rope", l: "Swedish", a: smooth(0.64, 0.68, p) * (1 - smooth(0.88, 0.93, p)) });
      return out;
    },
    fade: () => Math.max(1 - smooth(0, 0.04, p), smooth(0.94, 1, p)),
  };
}

// ======================================================================
// Lilla Ö 3: Fika heist
// ======================================================================
function cupModel() { const g = new THREE.Group(); part(G.cyl, "#ffffff", [0, 0.02, 0], [0.26, 0.04, 0.26], g); part(G.cyl, "#ffffff", [0, 0.19, 0], [0.16, 0.3, 0.16], g); part(G.cyl, "#5a3522", [0, 0.335, 0], [0.14, 0.02, 0.14], g); part(new THREE.TorusGeometry(0.08, 0.03, 5, 8), "#ffffff", [0.2, 0.2, 0], 1, g); return g; }
function bunModel() { const g = new THREE.Group(); part(G.sph, "#c98a4b", [0, 0.12, 0], [0.27, 0.15, 0.27], g); part(new THREE.TorusGeometry(0.13, 0.05, 5, 10), "#9b6230", [0, 0.22, 0], 1, g, true, [Math.PI / 2, 0, 0]); for (let i = 0; i < 5; i++) part(G.box, "#ffffff", [Math.cos(i * 1.3) * 0.12, 0.26, Math.sin(i * 1.3) * 0.12], 0.05, g, false); return g; }
function fikaScene(): Reel {
  const T = 3.4, HIT = 0.33;
  const w = makeWorld({ top: "#94cfe8", bottom: "#fbe5c6", sun: [0.45, 0.9, 0.55], water: "#76cbe5", amp: 0.22, shadow: 16 });
  const s = w.scene;
  for (let z = -6.2; z <= 4.3; z += 0.55) part(G.box, Math.round(z / 0.55) % 3 ? pal.plank : "#a87c52", [0, 0.95, z], [18, 0.5, 0.5], s);
  for (const x of [-8.5, -3, 3, 8.5]) for (const z of [-6.2, 4.2]) part(G.cyl, pal.woodDark, [x, -0.8, z], [0.22, 3.4, 0.22], s);
  for (const x of [-8.8, 8.8]) { for (let z = -5.5; z <= 4; z += 1.9) part(G.box, pal.woodDark, [x, 1.65, z], [0.12, 0.9, 0.12], s); part(G.box, pal.wood, [x, 2.1, -0.8], [0.16, 0.1, 10], s); }
  const cafe = house({ w: 10, d: 4, h: 3.2, door: 2.6 });
  cafe.position.set(-1, 1.2, -5.2);
  s.add(cafe);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.8), toon("#ffffff", { map: signTex("CAFÉ KANEL", "#3f7d4f", "#fffaf0", pal.yellow) }));
  sign.position.set(-1, 3.95, -3.12);
  s.add(sign);
  const awn = part(G.box, toon("#ffffff", { map: stripes(pal.falu, "#ffffff", 8) }), [-2.8, 2.9, -2.55], [3.4, 0.08, 1.4], s);
  awn.rotation.x = 0.4;
  const table = new THREE.Group();
  table.position.set(4.2, 1.2, 0.2);
  s.add(table);
  const cloth = tex(64, 64, (g) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? "#ffffff" : "#3570b3"; g.fillRect(x * 8, y * 8, 8, 8); } });
  part(G.cyl, toon("#ffffff", { map: cloth }), [0, 1.0, 0], [1.1, 0.08, 1.1], table);
  part(G.cyl, "#3a3d45", [0, 0.5, 0], [0.08, 1, 0.08], table);
  part(G.cyl, "#3570b3", [0.3, 1.19, -0.2], [0.1, 0.3, 0.1], table); part(G.sph, pal.yellow, [0.3, 1.42, -0.2], 0.14, table);
  part(G.cyl, "#f3efe6", [0, 1.7, 0], [0.05, 3.4, 0.05], table);
  part(G.cone, toon("#ffffff", { map: stripes(pal.yellow, "#ffffff", 8) }), [0, 3.5, 0], [2.3, 0.9, 2.3], table);
  for (const [x, z, r] of [[1.3, 0.3, -1.6], [-0.2, 1.3, 0.1]]) { const ch = new THREE.Group(); ch.position.set(x, 0, z); ch.rotation.y = r; table.add(ch); part(G.box, pal.blue, [0, 0.6, 0], [0.7, 0.08, 0.7], ch); part(G.box, pal.blue, [0, 1.0, 0.31], [0.7, 0.8, 0.08], ch); for (const lx of [-0.3, 0.3]) for (const lz of [-0.3, 0.3]) part(G.box, "#3a3d45", [lx, 0.3, lz], [0.06, 0.6, 0.06], ch); }
  const far = new THREE.Group();
  far.position.set(-14, 0, -42);
  s.add(far);
  part(G.cyl, pal.leaf, [0, 0.2, 0], [17, 2, 17], far);
  ([[-6, 0, pal.falu], [-1, -3, pal.yellow], [4, 1, pal.falu]] as const).forEach(([x, z, c]) => { const h = house({ wall: c }); h.position.set(x, 1.2, z + 6); far.add(h); });
  for (let i = 0; i < 10; i++) { const f = fir(rand(1, 1.6)); f.position.set(rand(-13, 13), 1.2, rand(-10, 0)); far.add(f); }
  const bosse = character(LOOKS.bosse);
  bosse.g.rotation.y = Math.PI / 2;
  s.add(bosse.g);
  const tray = new THREE.Group();
  s.add(tray);
  part(G.box, "#c79a62", [0, 0, 0], [1.5, 0.06, 1.0], tray);
  for (const [x, z, ww, dd] of [[0, 0.5, 1.5, 0.05], [0, -0.5, 1.5, 0.05], [0.75, 0, 0.05, 1], [-0.75, 0, 0.05, 1]]) part(G.box, "#a67c4a", [x, 0.05, z], [ww, 0.1, dd], tray);
  type Prop = Body & { local: V3; word: string | null; m: string | null; kind: string; start: V3 };
  const mk = (obj: THREE.Object3D, local: Tuple, word: string | null, m: string | null, kind: string): Prop => { s.add(obj); return body(obj, { local: V(...local), word, m, kind, start: V(), floor: 1.22 }); };
  const items = [
    mk(cupModel(), [-0.35, 0.03, -0.2], "kaffe", "coffee", "cup"),
    mk(cupModel(), [0.38, 0.03, 0.22], null, null, "cup"),
    mk(bunModel(), [0.32, 0.03, -0.24], "kanelbulle", "cinnamon bun", "bun"),
    mk(bunModel(), [-0.3, 0.03, 0.26], null, null, "caught"),
    mk(bunModel(), [0.02, 0.03, 0.02], null, null, "stolen"),
  ];
  const trayB = body(tray, { floor: 1.26 });
  const gull = gullModel();
  gull.g.scale.setScalar(1.7);
  s.add(gull.g);
  const coffee = new Swarm(s, G.ico, 40);
  const sap = saplingModel(0.9);
  sap.g.position.set(-0.6, 1.04, 0.55); sap.g.rotation.y = 0.2; table.add(sap.g);
  let sapHands = V(3.8, 2.8, 0.6);
  const feathers = new Swarm(s, leafGeo(), 6, { side: THREE.DoubleSide });

  let launched = false, prevP = 0, p = 0, hitPos: V3 | null = null;
  const qb = (a: V3, b: V3, c: V3, t: number) => V().addScaledVector(a, (1 - t) * (1 - t)).addScaledVector(b, 2 * (1 - t) * t).addScaledVector(c, t * t);
  function gullAt(t: number) {
    const hit = (hitPos || V(0.9, 2.9, 1.2)).clone().add(V(0.1, 0.45, 0));
    return t < HIT ? qb(V(10, 9, -7), V(5, 2.2, 4), hit, smooth(0, HIT, t)) : qb(hit, V(-2, 3.2, 3.5), V(-14, 9, 5), clamp((t - HIT) / 0.6, 0, 1));
  }
  function reset() { coffee.clear(); feathers.clear(); launched = false; prevP = 0; items.forEach((it) => { it.rest = false; it.obj.rotation.set(0, 0, 0); }); trayB.rest = false; }
  function launch() {
    launched = true;
    tray.updateMatrixWorld(true);
    trayB.rest = false; trayB.pos.copy(tray.position); trayB.vel.set(1.2, 2.6, 0.4); trayB.spin.set(0.6, 0.4, 3.2);
    items.forEach((it) => {
      it.pos.copy(tray.localToWorld(it.local.clone())); it.rest = false; it.start = it.pos.clone();
      it.vel.set(rand(-0.6, 3.2), rand(3, 5.6), rand(-2.2, 2.4)); it.spin.set(rand(-4, 4), rand(-3, 3), rand(-5, 5));
      if (it.kind === "cup") drops(coffee, 12, it.pos.clone().add(V(0, 0.3, 0)), () => ({ vel: it.vel.clone().multiplyScalar(rand(0.7, 1.05)).add(V(rand(-0.7, 0.7), rand(-0.2, 1), rand(-0.7, 0.7))), g: -4.5, drag: 0.2, life: rand(2.4, 3), size: rand(0.08, 0.13), color: pick(["#5a3522", "#7a4a2c"]), floor: 1.25 }));
    });
    for (let i = 0; i < 5; i++) feathers.emit({ pos: gull.g.position.clone(), vel: V(rand(-1.5, 1.5), rand(-0.5, 1.5), rand(-1.5, 1.5)), g: -0.6, drag: 0.8, flutter: 1.5, spin: V(rand(-3, 3), rand(-3, 3), rand(-3, 3)), life: 3.5, size: rand(0.6, 0.9), color: pick(["#ffffff", "#b8bfc8"]) });
  }
  return {
    world: w, slow: 0.5, beat: 3.35, fadeColor: "#fbe5c6",
    reset,
    update(dt) {
      waveSea(w);
      p = (st / T) % 1;
      if (p < prevP) reset();
      const B = bosse, walk = clamp(p / HIT, 0, 1);
      B.g.position.set(p < HIT ? lerp(-4.6, 0.1, walk) : 0.1 + smooth(HIT, 0.6, p) * 0.7, 1.2, 1.2);
      if (p < HIT) {
        const ph = st * 9;
        B.legL.rotation.x = Math.sin(ph) * 0.5; B.legR.rotation.x = -Math.sin(ph) * 0.5;
        B.armL.rotation.x = B.armR.rotation.x = -1.35; B.armL.rotation.z = B.armR.rotation.z = 0; B.body.rotation.x = 0.05;
        B.g.position.y = 1.2 + Math.abs(Math.sin(ph)) * 0.05; B.setFace("happy");
      } else {
        const k = smooth(HIT, HIT + 0.08, p);
        B.body.rotation.x = -0.4 * k; B.body.rotation.z = Math.sin(st * 3) * 0.08 * k;
        B.armL.rotation.x = lerp(-1.35, -2.9, k) + Math.sin(st * 7) * 0.25 * k; B.armL.rotation.z = -0.4 * k;
        B.armR.rotation.x = lerp(-1.35, -2.6, k) - Math.sin(st * 6) * 0.25 * k; B.armR.rotation.z = 0.5 * k;
        B.legL.rotation.x = lerp(0, -0.7, k); B.legR.rotation.x = lerp(0, 0.5, k); B.setFace("talk");
      }
      B.g.updateMatrixWorld(true);
      if (!launched) {
        tray.position.copy(between(B.armL, B.armR)).add(V(0.15, 0.1, 0));
        tray.rotation.set(0, 0, Math.sin(st * 9) * 0.02);
        hitPos = tray.position.clone();
        tray.updateMatrixWorld(true);
        items.forEach((it) => { it.obj.position.copy(tray.localToWorld(it.local.clone())); it.obj.rotation.copy(tray.rotation); });
      }
      const prev = prevP;
      prevP = p;
      if (!launched && prev < HIT && p >= HIT) launch();
      const gp = gullAt(p), gn = gullAt(Math.min(0.999, p + 0.01));
      gull.g.position.copy(gp);
      if (gn.distanceToSquared(gp) > 1e-6) gull.g.lookAt(gn);
      flap(gull, p < HIT - 0.06 ? 0.15 : p < HIT + 0.05 ? 0.9 : Math.sin(st * 13) * 0.9);
      if (launched) {
        stepBody(trayB, dt);
        gull.g.updateMatrixWorld(true);
        items.forEach((it) => {
          if (it.kind === "stolen") { it.obj.position.copy(gull.g.localToWorld(V(0, -0.1, 0.75))); it.obj.rotation.set(0.6, st, 0); return; }
          if (it.kind === "caught") {
            const f = smooth(HIT, 0.68, p), grab = sapHands.clone().add(V(0, 0.12, 0));
            if (p < 0.68) { it.obj.position.copy(qb(it.start, it.start.clone().lerp(grab, 0.5).add(V(0, 2.4, 0)), grab, f)); it.obj.rotation.x += dt * 4; }
            else it.obj.position.copy(grab);
            return;
          }
          stepBody(it, dt);
        });
      }
      // the sapling: sits, jumps up at the crash, catches the flying bun
      const P = sap, up = smooth(HIT, HIT + 0.08, p), hop = Math.sin(Math.PI * smooth(0.52, 0.8, p));
      P.g.position.y = 1.04 + hop * 0.45;
      P.legL.rotation.x = P.legR.rotation.x = lerp(-1.4, 0, up) - hop * 0.5; P.body.position.y = lerp(-0.12, 0, up);
      const reach = smooth(0.45, 0.62, p), hold = smooth(0.68, 0.74, p);
      P.armL.rotation.set(lerp(lerp(-0.3, -2.7, reach), -1.6, hold), 0, -0.2); P.armR.rotation.set(lerp(lerp(-0.3, -2.7, reach), -1.6, hold), 0, 0.2);
      leafFlutter(P, 0, 0.35 + up * 0.5 * (1 - hold), 0.25 * up * (1 - hold)); P.setFace(p < HIT ? "neutral" : p < 0.7 ? "talk" : "happy");
      sap.g.updateMatrixWorld(true);
      sapHands = between(P.armL, P.armR);
      coffee.update(dt); feathers.update(dt);
    },
    cam() { const push = smooth(0.18, 0.45, p); return { target: V(lerp(-0.8, 1.4, push), 2.8, 1.0), yaw: 0.95, pitch: 0.13, dist: 15 - push * 2.5, fov: 40 }; },
    labels() {
      const out: Label[] = [], a = smooth(HIT + 0.02, HIT + 0.08, p) * (1 - smooth(0.86, 0.92, p));
      items.forEach((it) => { if (it.word && it.m) out.push({ pos: it.obj.position.clone().add(V(0, 0.35, 0)), w: it.word, m: it.m, l: "Swedish", a }); });
      out.push({ pos: gull.g.position.clone().add(V(0, 0.6, 0)), w: "måsen", m: "the gull", l: "Swedish", a: smooth(0.08, 0.16, p) * (1 - smooth(0.8, 0.88, p)) });
      return out;
    },
    fade: () => Math.max(1 - smooth(0, 0.05, p), smooth(0.92, 0.99, p)),
  };
}

// ======================================================================
// Lilla Ö 4: Nils's big catch
// ======================================================================
function fishModel() {
  const g = new THREE.Group();
  part(G.sph, "#c7d6de", [0, 0, 0], [0.28, 0.34, 1.15], g);
  part(G.sph, "#f7f3ea", [0, -0.1, 0.05], [0.24, 0.22, 1.0], g);
  part(G.sph, "#46708c", [0, 0.14, -0.05], [0.2, 0.22, 1.05], g);
  part(G.box, "#e98f7a", [0, 0.0, 0], [0.57, 0.06, 1.6], g, false);
  part(G.box, "#46708c", [0, 0.38, -0.1], [0.05, 0.26, 0.42], g, true, [0.35, 0, 0]);
  part(G.box, "#46708c", [0, -0.3, -0.35], [0.05, 0.16, 0.26], g, false, [-0.4, 0, 0]);
  for (const x of [-0.22, 0.22]) part(G.box, "#2c2a3d", [x, 0.08, 0.82], 0.08, g, false);
  part(G.box, "#8a5a5a", [0, -0.08, 1.12], [0.14, 0.05, 0.1], g, false);
  const tail = new THREE.Group();
  tail.position.z = -1.05;
  g.add(tail);
  part(G.box, "#46708c", [0, 0, -0.05], [0.06, 0.16, 0.2], tail, false);
  for (const sd of [-1, 1]) part(G.box, "#46708c", [0, sd * 0.24, -0.3], [0.06, 0.5, 0.34], tail, true, [sd * 0.7, 0, 0]);
  g.scale.setScalar(1.25);
  return { g, tail };
}
function rowboat() {
  const g = new THREE.Group();
  const sh = new THREE.Shape();
  sh.moveTo(-1.7, 0); sh.quadraticCurveTo(-1.2, -0.75, 0, -0.8); sh.quadraticCurveTo(1.2, -0.75, 1.9, 0); sh.quadraticCurveTo(1.2, 0.75, 0, 0.8); sh.quadraticCurveTo(-1.2, 0.75, -1.7, 0);
  const hull = (d: number) => { const geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }); geo.rotateX(-Math.PI / 2); return geo; };
  part(hull(0.7), pal.wood, [0, -0.35, 0], 1, g);
  const inner = part(hull(0.05), pal.woodDark, [0, 0.33, 0], 1, g);
  inner.scale.set(0.86, 1, 0.8);
  part(G.box, pal.falu, [0, 0.2, 0], [3.2, 0.12, 1.62], g, false);
  for (const x of [-0.6, 0.5]) part(G.box, pal.plank, [x, 0.4, 0], [0.36, 0.08, 1.4], g);
  for (const sd of [-1, 1]) part(G.box, pal.plank, [-0.2, 0.44, sd * 0.55], [2.4, 0.06, 0.1], g, true, [0, sd * 0.15, 0]);
  g.scale.setScalar(1.3);
  return g;
}
function catchScene(): Reel {
  const T = 3.2, A = V(4.6, 0, 2.4), B = V(8.2, 0, 3.8);
  const w = makeWorld({ top: "#88c8e8", bottom: "#f8e2c4", sun: [0.2, 0.9, 0.7], water: "#76cbe5", amp: 0.2, shadow: 22 });
  const s = w.scene;
  const isl = new THREE.Group();
  isl.position.set(-11, 0, -13);
  s.add(isl);
  for (let i = 0; i < 9; i++) part(G.ico, toon(i % 2 ? pal.stone : pal.stoneDark, { flat: true }), [rand(-8, 8), rand(-0.3, 0.3), rand(-3, 4)], rand(1.4, 2.6), isl);
  part(G.cyl, pal.leaf, [0, 0.9, -2], [9, 1.4, 6], isl);
  const bh = house({ w: 4.2, d: 3.6, h: 2.3, door: 0 });
  bh.position.set(1, 1.6, 0.2);
  isl.add(bh);
  part(G.box, "#3a2a1e", [1, 0.8, 2.05], [1.8, 1.5, 0.06], isl, false);
  for (let i = 0; i < 6; i++) { const f = fir(rand(0.9, 1.4)); f.position.set(rand(-8, 8), 1.6, rand(-6, -3)); isl.add(f); }
  for (let x = -2; x <= 4; x += 0.55) part(G.box, pal.plank, [x, 0.95, 3.2], [0.5, 0.12, 1.4], isl);
  const lh = new THREE.Group();
  lh.position.set(34, 0, -58);
  s.add(lh);
  part(G.ico, toon(pal.stone, { flat: true }), [0, 0, 0], 4, lh); part(G.cyl, "#ffffff", [0, 5.5, 0], [1.1, 7, 1.1], lh); part(G.cyl, pal.falu, [0, 6, 0], [1.15, 1.2, 1.15], lh);
  const boat = rowboat();
  s.add(boat);
  const nils = character(LOOKS.nils);
  nils.g.rotation.y = Math.PI / 2;
  s.add(nils.g);
  const rod = new THREE.Mesh(new THREE.BufferGeometry(), toon(pal.woodDark));
  rod.castShadow = true;
  s.add(rod);
  const line = new THREE.Mesh(new THREE.BufferGeometry(), toon("#f6efe0"));
  s.add(line);
  const fish = fishModel();
  s.add(fish.g);
  part(G.cyl, pal.woodDark, [2.4, 0.2, -2.6], [0.18, 3, 0.18], s);
  const gull = gullModel();
  gull.g.position.set(2.4, 1.85, -2.6); gull.g.scale.setScalar(1.3); flap(gull, -0.15); s.add(gull.g);
  const splash = new Swarm(s, G.ico, 50);
  const rings = [splashRing(s), splashRing(s)];
  const sap = saplingModel(0.9);
  s.add(sap.g);
  // The net sits in his right fist, so it swings with the arm. Aimed forward-up at a mid pose, bag hanging below.
  const net = landingNet();
  net.position.set(0, -0.27, 0);
  sap.armR.add(net);
  const d = V(0.3, -0.45, 1).normalize(), up = UP.clone().applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.4, 0, 0.2)).invert());
  const n = up.addScaledVector(d, -up.dot(d)).normalize();
  net.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(n.clone().cross(d), n, d));

  let prevP = 0, trail = 0, p = 0, tip = V(), hoop = V();
  function fishAt(t: number) {
    const q = clamp((t - 0.15) / 0.7, 0, 1);
    const pos = A.clone().lerp(B, q).addScaledVector(UP, Math.sin(Math.PI * q) * 4 - 0.4);
    if (t < 0.15) pos.copy(A).addScaledVector(UP, -2 + t * 10);
    if (t > 0.85) pos.copy(B).addScaledVector(UP, -0.4 - (t - 0.85) * 12);
    return pos;
  }
  return {
    world: w, slow: 0.5, beat: 3.15, fadeColor: "#f8e2c4",
    reset() { splash.clear(); prevP = 0; trail = 0; },
    update(dt) {
      waveSea(w);
      p = (st / T) % 1;
      const prev = p < prevP ? 0 : prevP;
      prevP = p;
      const q = clamp((p - 0.15) / 0.7, 0, 1), tension = Math.sin(Math.PI * q);
      boat.position.set(0, seaH(0, 0, st) * 0.8 + 0.25, 0);
      boat.rotation.set(-0.14 * tension + seaH(0, 1, st) * 0.05, 0, Math.sin(st * 1.1) * 0.03);
      const N = nils;
      N.g.position.set(-0.7, boat.position.y + 0.55, 0);
      N.body.rotation.x = -0.35 - 0.2 * tension; N.armL.rotation.x = N.armR.rotation.x = -2.0 - 0.3 * tension; N.armL.rotation.z = -0.2; N.armR.rotation.z = 0.2;
      N.legL.rotation.x = -0.5; N.legR.rotation.x = 0.35; N.setFace(q > 0 && q < 1 ? "talk" : "think");
      N.g.updateMatrixWorld(true);
      const base = between(N.armL, N.armR);
      const fp = fishAt(p), fn = fishAt(Math.min(0.999, p + 0.01));
      fish.g.position.copy(fp);
      if (fn.distanceToSquared(fp) > 1e-6) fish.g.lookAt(fn);
      fish.tail.rotation.y = Math.sin(st * 16) * 0.5;
      fish.g.visible = fp.y > -1.2;
      const toFish = fp.clone().sub(base);
      toFish.y = 0;
      toFish.normalize();
      tip = base.clone().addScaledVector(toFish, 2.2 + 0.6 * tension).addScaledVector(UP, 2.4 - 1.1 * tension);
      tube(rod, new THREE.QuadraticBezierCurve3(base, base.clone().addScaledVector(toFish, 1.2).addScaledVector(UP, 1.8), tip), 0.06);
      const mouth = fish.g.localToWorld(V(0, -0.05, 1.15));
      const target = fp.y > seaH(fp.x, fp.z, st) ? mouth : V(fp.x, seaH(fp.x, fp.z, st), fp.z);
      tube(line, new THREE.QuadraticBezierCurve3(tip, tip.clone().lerp(target, 0.5).addScaledVector(UP, -0.4 * (1 - tension)), target), 0.035);
      if (prev < 0.15 && p >= 0.15) drops(splash, 14, A.clone(), () => ({ vel: V(rand(-2, 2), rand(3, 6), rand(-2, 2)), g: -9, life: 1.8, size: rand(0.18, 0.3), floor: -1 }));
      if (prev < 0.85 && p >= 0.85) drops(splash, 16, B.clone(), () => ({ vel: V(rand(-2.2, 2.2), rand(3.5, 7), rand(-2.2, 2.2)), g: -9, life: 1.9, size: rand(0.18, 0.32), floor: -1 }));
      trail -= dt;
      if (q > 0.05 && q < 0.95 && trail <= 0) { trail = 0.1; splash.emit({ pos: fish.g.localToWorld(V(0, 0, -1.2)), vel: V(rand(-0.4, 0.4), rand(-0.5, 0.5), rand(-0.4, 0.4)), g: -6, life: 1.2, size: 0.18, color: "#e3f7f6" }); }
      splash.update(dt);
      setRing(rings[0], A, (p - 0.15) * T, 1.6);
      setRing(rings[1], B, p > 0.85 ? (p - 0.85) * T : (p + 0.15) * T, 1.6);
      gull.g.lookAt(fp.x, gull.g.position.y, fp.z);
      const P = sap;
      boat.updateMatrixWorld(true);
      P.g.position.copy(boat.localToWorld(V(1.15, 0.36, 0)));
      P.g.rotation.set(0, Math.atan2(fp.x - P.g.position.x, fp.z - P.g.position.z), 0);
      // net held out in the right fist and lifted as the fish leaps; the left arm points after it
      P.body.rotation.x = 0.25 * tension;
      P.armR.rotation.set(-1.1 - 0.6 * tension, 0, 0.2);
      P.armL.rotation.set(-1.3 - 0.9 * tension + Math.sin(st * 7) * 0.12 * tension, 0, -0.25);
      P.legL.rotation.x = -0.3; P.legR.rotation.x = 0.3;
      leafFlutter(P, 0, 0.35 + 0.7 * tension, 0.2 * tension); P.setFace(q > 0 && q < 1 ? "talk" : "neutral");
      P.g.updateMatrixWorld(true);
      hoop = net.localToWorld(V(0, 0.3, net.userData.hoopZ));
    },
    cam: () => ({ target: V(3.6, 2, 1.4), yaw: 0.58, pitch: 0.17, dist: 18, fov: 40 }),
    labels() {
      const q = clamp((p - 0.15) / 0.7, 0, 1), air = smooth(0.02, 0.1, q) * (1 - smooth(0.88, 0.97, q));
      return [
        { pos: fish.g.position.clone().add(V(0, 0.7, 0)), w: "fisken", m: "the fish", l: "Swedish", a: air },
        { pos: tip, w: "spöet", m: "the fishing rod", l: "Swedish", a: 1 },
        { pos: hoop, w: "håven", m: "the landing net", l: "Swedish", a: 1 },
        { pos: boat.position.clone().add(V(-2.4, 0.6, 1.2)), w: "båten", m: "the boat", l: "Swedish", a: 1 },
        { pos: V(-10, 5.8, -11), w: "sjöboden", m: "the boathouse", l: "Swedish", a: 1 },
      ];
    },
    fade: () => 0,
  };
}

// ======================================================================
// Tannenau 1: Pretzel pass
// ======================================================================
function pretzelModel() {
  const g = new THREE.Group(), m = toon("#a4582a");
  const loop = new THREE.CatmullRomCurve3(([[-0.5, 0.1], [-0.45, 0.42], [-0.2, 0.52], [0, 0.28], [0.2, 0.52], [0.45, 0.42], [0.5, 0.1], [0.3, -0.25], [0, -0.35], [-0.3, -0.25]] as const).map(([x, y]) => V(x, y, 0)), true);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(loop, 40, 0.08, 6, true), m));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-0.3, -0.3, 0.04), V(0, -0.02, 0.08), V(0.22, 0.24, 0)]), 10, 0.075, 6), m));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0.3, -0.3, -0.04), V(0, -0.02, -0.08), V(-0.22, 0.24, 0)]), 10, 0.075, 6), m));
  for (let i = 0; i < 6; i++) part(G.box, "#ffffff", [Math.cos(i) * 0.35, Math.sin(i * 1.7) * 0.3 + 0.1, 0.08], 0.05, g, false);
  g.children.forEach((c) => { c.castShadow = true; });
  g.scale.setScalar(1.2);
  return g;
}
function pretzelScene(): Reel {
  const T = 3.4, leapA = V(5.6, 0, 2.4), land = V(0.6, 0, 0.9);
  const w = makeWorld({ top: "#86c3e3", bottom: "#e6ede4", fog: "#d3e3de", sun: [0.4, 0.9, 0.6], water: null, shadow: 20 });
  const s = w.scene;
  part(G.cyl, "#6f9f55", [0, -0.5, 0], [140, 1, 140], s, false);
  part(G.box, "#b9b2a2", [0, -0.02, -1], [22, 0.06, 14], s);
  for (let i = 0; i < 40; i++) part(G.box, i % 2 ? "#a8a192" : "#c7c0ae", [rand(-10, 10), 0.02, rand(-7, 5)], [rand(0.5, 0.9), 0.04, rand(0.4, 0.7)], s, false);
  mountains(s, 9, 80, 110, [-2.6, -0.5]);
  for (let i = 0; i < 26; i++) { const f = fir(rand(1.4, 2.4), i % 3 ? "#24533a" : pal.pine); f.position.set(rand(-40, 40), 0, rand(-40, -16)); s.add(f); }
  const cafe = house({ w: 9, d: 5, h: 4.2, style: "fachwerk", wall: pal.plaster, roof: pal.tRoof, door: -2.6 });
  cafe.position.set(0, 0, -6.5);
  s.add(cafe);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.7), toon("#ffffff", { map: signTex("CAFÉ KUCKUCK", "#6b3f24", "#fff4e0", pal.yellow) }));
  sign.position.set(-2.6, 2.1, -3.9);
  s.add(sign);
  const h2 = house({ w: 6, d: 5, h: 4, style: "fachwerk", wall: "#f3e0c0", roof: pal.tRoof });
  h2.position.set(-12, 0, -8); h2.rotation.y = 0.35; s.add(h2);
  const h3 = house({ w: 6, d: 5, h: 4, style: "fachwerk", wall: "#eaf0e6", roof: "#3b3b44" });
  h3.position.set(12.5, 0, -8.5); h3.rotation.y = -0.4; s.add(h3);
  // Maibaum with its guild rings
  const mb = new THREE.Group();
  mb.position.set(8, 0, -3);
  s.add(mb);
  for (let i = 0; i < 12; i++) part(G.cyl, i % 2 ? "#ffffff" : "#c8a23a", [0, 0.35 + i * 0.6, 0], [0.13, 0.6, 0.13], mb);
  part(G.cone, "#3f7d4f", [0, 8, 0], [0.6, 1.4, 0.6], mb);
  [3.4, 5.6].forEach((y) => part(new THREE.TorusGeometry(0.75, 0.12, 6, 16), "#3f7d4f", [0, y, 0], 1, mb, true, [Math.PI / 2, 0, 0]));
  // the cuckoo clock on the café's upper floor
  const clock = new THREE.Group();
  clock.position.set(1.8, 3.2, -3.9);
  s.add(clock);
  part(G.box, "#6b3f24", [0, 0, 0.2], [1.5, 1.8, 0.4], clock);
  for (const sd of [-1, 1]) part(G.box, "#4a2a18", [sd * 0.45, 1.15, 0.2], [1.1, 0.12, 0.6], clock, true, [0, 0, -sd * 0.65]);
  for (const sd of [-1, 1]) part(G.box, "#3f7d4f", [sd * 0.4, 0.95, 0.42], [0.25, 0.12, 0.05], clock, false);
  part(G.cyl, "#fff4e0", [0, -0.2, 0.42], [0.5, 0.05, 0.5], clock, false, [Math.PI / 2, 0, 0]);
  const hands = [part(G.box, "#2c2a3d", [0, -0.2, 0.47], [0.05, 0.4, 0.03], clock, false), part(G.box, "#2c2a3d", [0, -0.2, 0.47], [0.05, 0.28, 0.03], clock, false)];
  const doors = [-1, 1].map((sd) => { const d = new THREE.Group(); d.position.set(sd * 0.25, 0.55, 0.41); part(G.box, "#4a2a18", [-sd * 0.12, 0, 0], [0.24, 0.36, 0.04], d, false); clock.add(d); return d; });
  part(G.box, "#1b120c", [0, 0.55, 0.39], [0.48, 0.36, 0.02], clock, false);
  const bird = new THREE.Group();
  clock.add(bird);
  part(G.sph, pal.blue, [0, 0, 0], [0.17, 0.15, 0.22], bird); part(G.sph, pal.blue, [0, 0.13, 0.14], 0.11, bird);
  part(G.cone, pal.yellow, [0, 0.12, 0.3], [0.04, 0.14, 0.04], bird, false, [Math.PI / 2, 0, 0]);
  part(G.box, "#2f6f4a", [0, 0.02, -0.22], [0.2, 0.04, 0.16], bird, false);
  const pend = new THREE.Group();
  pend.position.set(0, -0.9, 0.3);
  clock.add(pend);
  part(G.box, "#c8a23a", [0, -0.5, 0], [0.04, 1, 0.03], pend, false); part(G.cyl, "#c8a23a", [0, -1.0, 0], [0.16, 0.04, 0.16], pend, false, [Math.PI / 2, 0, 0]);
  for (const x of [-0.3, 0.3]) part(G.cone, "#3a2414", [x, -1.5, 0.3], [0.1, 0.35, 0.1], clock, false, [Math.PI, 0, 0]);
  // Franz, Marie, the pretzel and the apple basket
  const franz = character(LOOKS.franz);
  franz.g.position.set(-2.6, 0, -3.4); franz.g.rotation.y = 0.7; s.add(franz.g);
  const marieWrap = new THREE.Group();
  s.add(marieWrap);
  const marie = character(LOOKS.marie);
  marieWrap.add(marie.g);
  const pretzel = pretzelModel();
  s.add(pretzel);
  const basket = new THREE.Group();
  s.add(basket);
  part(G.cyl, "#b07a3c", [0, 0.18, 0], [0.34, 0.36, 0.28], basket); part(new THREE.TorusGeometry(0.3, 0.035, 4, 12), "#8a5a2c", [0, 0.45, 0], 1, basket, false, [0, 0, 0]);
  const basketB = body(basket, { floor: 0.02, g: -7 });
  const apples = Array.from({ length: 4 }, () => { const a = new THREE.Group(); part(G.sph, "#d42a2a", [0, 0, 0], 0.17, a); part(G.box, pal.woodDark, [0, 0.17, 0], [0.03, 0.08, 0.03], a, false); s.add(a); return body(a, { floor: 0.17, g: -7 }); });
  const dust = new Swarm(s, new THREE.IcosahedronGeometry(1, 1), 10);
  const sap = saplingModel(0.72);
  sap.g.position.set(0, 1.36, 0.2);
  clock.add(sap.g);

  let prevP = 0, spilled = false, p = 0, relPos: V3 | null = null;
  function reset() { dust.clear(); prevP = 0; spilled = false; basketB.rest = false; apples.forEach((a) => { a.rest = false; }); }
  function mariePose(t: number) {
    // run in, dive across the square, land on the cobbles
    const runStart = V(10.5, 0, 3.2), dir = land.clone().sub(leapA).normalize();
    const f = clamp((t - 0.42) / 0.43, 0, 1);
    const pos = t < 0.42 ? runStart.clone().lerp(leapA, t / 0.42) : leapA.clone().lerp(land, f).addScaledVector(UP, Math.sin(Math.PI * f) * 1.5);
    if (t > 0.85) pos.copy(land).addScaledVector(dir, smooth(0.85, 0.95, t) * 0.7);
    return { pos, dir };
  }
  return {
    world: w, slow: 0.5, beat: 3.35, fadeColor: "#e6ede4",
    reset,
    update(dt) {
      p = (st / T) % 1;
      if (p < prevP) reset();
      const prev = prevP;
      prevP = p;
      // Franz: wind up, fling, then jump at the cuckoo
      const F = franz, wind = smooth(0.05, 0.17, p), rel = smooth(0.17, 0.22, p), scare = smooth(0.25, 0.32, p);
      F.armR.rotation.x = lerp(lerp(0, 1.1, wind), -2.4, rel); F.armR.rotation.z = 0.2;
      F.armL.rotation.x = -0.4 - scare * 2.2; F.armL.rotation.z = -0.3 * scare;
      F.body.rotation.x = 0.15 * wind - 0.3 * scare; F.g.position.y = Math.sin(Math.PI * smooth(0.25, 0.4, p)) * 0.35;
      F.head.rotation.y = scare * 0.9; F.setFace(scare > 0.2 ? "talk" : "happy");
      // cuckoo clock
      const open = smooth(0.22, 0.28, p) * (1 - smooth(0.8, 0.88, p)), out = smooth(0.24, 0.32, p) * (1 - smooth(0.78, 0.86, p));
      doors[0].rotation.y = -open * 1.6; doors[1].rotation.y = open * 1.6;
      bird.position.set(0, 0.55 + out * 0.05, 0.3 + out * 1.1 + Math.sin(st * 22) * 0.06 * out);
      bird.visible = out > 0.02; bird.rotation.x = -0.3 + Math.sin(st * 22) * 0.2 * out;
      const K = sap, knock = smooth(0.24, 0.3, p) * (1 - smooth(0.55, 0.75, p));
      K.g.position.y = 1.36 + Math.sin(Math.PI * smooth(0.24, 0.42, p)) * 0.3;
      K.body.rotation.x = -0.95 * knock; K.legL.rotation.x = -0.9 * knock + Math.sin(st * 9) * 0.3 * knock; K.legR.rotation.x = -0.5 * knock - Math.sin(st * 9) * 0.3 * knock;
      K.armL.rotation.set(0, 0, -0.3 - 2.2 * knock - Math.sin(st * 8) * 0.3 * knock); K.armR.rotation.set(0, 0, 0.3 + 2.2 * knock + Math.sin(st * 8 + 1) * 0.3 * knock);
      leafFlutter(K, 0, 0.35 + 0.9 * knock, 0.3 * knock); K.setFace(knock > 0.2 ? "talk" : "happy");
      pend.rotation.z = Math.sin(st * 3) * 0.3; hands[0].rotation.z = st * 0.2; hands[1].rotation.z = st * 0.02;
      // Marie
      const M = marie, mp = mariePose(p);
      marieWrap.position.copy(mp.pos);
      marieWrap.rotation.y = Math.atan2(mp.dir.x, mp.dir.z);
      // Plant and dip at the end of the run, leave the ground only slightly tipped,
      // then stretch out through the flight: flat just as the pretzel arrives.
      const plant = smooth(0.34, 0.42, p) * (1 - smooth(0.42, 0.47, p));
      const stretch = smooth(0.42, 0.72, p);
      const runFade = smooth(0.38, 0.46, p);
      M.g.rotation.x = 0.3 * smooth(0.34, 0.42, p) + 1.05 * stretch + 0.15 * smooth(0.85, 0.92, p);
      marieWrap.position.y -= plant * 0.14;
      const run = st * 11;
      const kick = smooth(0.4, 0.46, p) * (1 - smooth(0.5, 0.64, p));
      M.legL.rotation.x = lerp(Math.sin(run) * 0.8, lerp(0.3, 0.75, kick), runFade);
      M.legR.rotation.x = lerp(-Math.sin(run) * 0.8, lerp(0.1, -0.5, kick), runFade);
      const reach = smooth(0.4, 0.62, p);
      M.armL.rotation.x = lerp(Math.sin(run) * 0.8 * (1 - runFade), -2.9, reach);
      M.armR.rotation.x = lerp(-Math.sin(run) * 0.8 * (1 - runFade), -2.9, reach);
      M.setFace(p < 0.72 ? "talk" : "happy");
      marieWrap.updateMatrixWorld(true);
      const grip = between(M.armL, M.armR);
      // pretzel: in Franz's hand, then flying to Marie's hands, then caught
      franz.g.updateMatrixWorld(true);
      const fHand = hand(F.armR);
      if (p < 0.2) { pretzel.position.copy(fHand).add(V(0, 0.2, 0)); relPos = pretzel.position.clone(); pretzel.rotation.set(0, 0.7, 0); }
      else if (p < 0.72) {
        const t = smooth(0.2, 0.72, p) * 0.2 + ((p - 0.2) / 0.52) * 0.8, a = relPos || fHand;
        const ctrl = a.clone().lerp(grip, 0.5).add(V(0, 4.2, 0));
        pretzel.position.copy(V().addScaledVector(a, (1 - t) * (1 - t)).addScaledVector(ctrl, 2 * (1 - t) * t).addScaledVector(grip, t * t));
        pretzel.rotation.set(0.4, 0.7 + (p - 0.2) * 16, 0);
      } else pretzel.position.copy(grip).add(V(0, 0.1, 0));
      // basket goes flying when she dives
      if (!spilled) { basket.position.copy(hand(M.armL)).add(V(0, -0.35, 0)); apples.forEach((a, i) => a.obj.position.copy(basket.position).add(V((i - 1.5) * 0.14, 0.45, 0))); }
      if (!spilled && prev < 0.44 && p >= 0.44) {
        spilled = true;
        basketB.pos.copy(basket.position); basketB.vel.copy(mp.dir).multiplyScalar(-1.5).add(V(0, 3.2, 1.4)); basketB.spin.set(3, 1, 2); basketB.rest = false;
        apples.forEach((a) => { a.pos.copy(a.obj.position); a.vel.set(rand(-1.5, 1.5), rand(3.5, 5.5), rand(0.4, 2.4)); a.spin.set(rand(-4, 4), 0, rand(-4, 4)); a.rest = false; });
      }
      if (spilled) { stepBody(basketB, dt); apples.forEach((a) => stepBody(a, dt)); }
      if (prev < 0.85 && p >= 0.85) for (let i = 0; i < 6; i++) dust.emit({ pos: land.clone().add(V(rand(-0.6, 0.6), 0.2, rand(-0.6, 0.6))), vel: V(rand(-1, 1), rand(0.3, 1), rand(-1, 1)), drag: 1.2, grow: 0.9, size: 0.3, life: 1.8, color: "#e8e0cc" });
      dust.update(dt);
    },
    cam: () => ({ target: V(2.6, 2.3, -0.4), yaw: 0.3, pitch: 0.14, dist: 17.5, fov: 40 }),
    labels() {
      const end = 1 - smooth(0.9, 0.95, p);
      return [
        { pos: pretzel.position.clone().add(V(0, 0.6, 0)), w: "die Brezel", m: "the pretzel", l: "German", a: smooth(0.22, 0.28, p) * end },
        { pos: clock.localToWorld(bird.position.clone()).add(V(0, 0.3, 0)), w: "der Kuckuck", m: "the cuckoo", l: "German", a: smooth(0.28, 0.33, p) * (1 - smooth(0.74, 0.8, p)) },
        { pos: apples[0].obj.position.clone().add(V(0, 0.3, 0)), w: "der Apfel", m: "the apple", l: "German", a: smooth(0.46, 0.52, p) * end },
        { pos: basket.position.clone().add(V(0, 0.6, 0)), w: "der Korb", m: "the basket", l: "German", a: smooth(0.5, 0.56, p) * end },
      ];
    },
    fade: () => Math.max(1 - smooth(0, 0.04, p), smooth(0.93, 1, p)),
  };
}

// ======================================================================
// Tannenau 2: Lake leap
// ======================================================================
function lakeScene(): Reel {
  const T = 3.6, jumpA = V(-2.2, 1.35, 0), entry = V(3.8, 0, 1.2);
  const w = makeWorld({ top: "#7fc0e2", bottom: "#dbe8e2", fog: "#d3e3de", sun: [0.3, 0.9, 0.6], water: "#5fb3a8", amp: 0.1, shadow: 22 });
  const s = w.scene;
  mountains(s, 12, 70, 95, [-3.0, -0.2]);
  part(G.box, "#6f9f55", [-24, 0.4, -4], [30, 1.4, 60], s);
  part(G.box, pal.sand, [-9.5, 0.1, -4], [3, 1, 60], s);
  for (let i = 0; i < 30; i++) { const f = fir(rand(1.3, 2.4), i % 3 ? "#24533a" : pal.pine); f.position.set(rand(-36, -12), 1.1, rand(-30, 20)); s.add(f); }
  for (let i = 0; i < 24; i++) { const f = fir(rand(2, 3), "#2f5a48"); f.position.set(rand(-20, 50), 0, rand(-55, -45)); s.add(f); }
  const hut = house({ w: 3.4, d: 3, h: 2.4, style: "fachwerk", wall: pal.blue, roof: pal.tRoof });
  hut.position.set(-14, 1.1, -5); hut.rotation.y = 0.9; s.add(hut);
  for (let x = -11; x <= -2; x += 0.55) part(G.box, Math.round(x / 0.55) % 3 ? pal.plank : "#8a6a44", [x, 1.2, 0], [0.5, 0.14, 1.8], s);
  for (let x = -9; x <= -2; x += 2.3) for (const z of [-0.95, 0.95]) part(G.cyl, pal.woodDark, [x, 0.3, z], [0.15, 2.4, 0.15], s);
  const towel = part(G.box, toon("#ffffff", { map: stripes("#d42a2a", "#ffffff", 6) }), [-7, 1.3, 0.3], [1.2, 0.05, 0.7], s);
  towel.rotation.y = 0.2;
  const hilde = character(LOOKS.hilde, { looseHat: true });
  hilde.g.rotation.y = Math.PI / 2;
  s.add(hilde.g);
  const hat = hilde.hat!;
  s.add(hat);
  const sepp = character(LOOKS.sepp);
  sepp.g.position.set(-8.4, 1.27, -0.4); sepp.g.rotation.y = 1.2; s.add(sepp.g);
  // the lake steamer, far out
  const steamer = new THREE.Group();
  steamer.position.set(22, 0, -30); steamer.rotation.y = 0.3; s.add(steamer);
  part(G.box, "#f7f3ea", [0, 0.25, 0], [9, 1.1, 3.2], steamer); part(G.box, "#1f5a3a", [0, -0.15, 0], [9.05, 0.45, 3.25], steamer);
  part(G.box, "#ffffff", [0.2, 1.3, 0], [4.6, 1, 2.6], steamer); part(G.box, "#8b1e2d", [0.2, 1.85, 0], [5, 0.12, 2.9], steamer);
  part(G.cyl, "#1d1d24", [-0.8, 2.6, 0], [0.32, 1.4, 0.32], steamer); part(G.cyl, "#d9a53a", [-0.8, 3.1, 0], [0.34, 0.14, 0.34], steamer);
  const ducks = [0, 1].map(() => { const d = new THREE.Group(); part(G.sph, "#8a6a44", [0, 0, 0], [0.3, 0.22, 0.4], d); part(G.sph, "#2f6f4a", [0, 0.25, 0.3], 0.15, d); part(G.cone, pal.yellow, [0, 0.24, 0.48], [0.05, 0.14, 0.05], d, false, [Math.PI / 2, 0, 0]); s.add(d); return d; });
  const splash = new Swarm(s, G.ico, 40);
  const ring = splashRing(s);
  const sap = saplingModel(0.9);
  sap.g.rotation.y = Math.PI / 2;
  s.add(sap.g);
  const sapRing = splashRing(s);

  let prevP = 0, p = 0, hatStart: V3 | null = null, hatQ0: THREE.Quaternion | null = null;
  return {
    world: w, slow: 0.55, beat: 3.55, fadeColor: "#dbe8e2",
    reset() { splash.clear(); prevP = 0; },
    update(dt) {
      waveSea(w);
      p = (st / T) % 1;
      const prev = p < prevP ? 0 : prevP;
      prevP = p;
      const H = hilde, f = clamp((p - 0.3) / 0.5, 0, 1);
      if (p < 0.3) {
        const k = p / 0.3;
        H.g.position.set(lerp(-9.5, jumpA.x, k), 1.27 + Math.abs(Math.sin(st * 11)) * 0.08, 0);
        H.legL.rotation.x = Math.sin(st * 11) * 0.8; H.legR.rotation.x = -Math.sin(st * 11) * 0.8;
        H.armL.rotation.x = -Math.sin(st * 11) * 0.7; H.armR.rotation.x = Math.sin(st * 11) * 0.7; H.body.rotation.x = 0.15; H.g.rotation.x = 0;
        H.setFace("happy");
      } else {
        H.g.position.copy(jumpA.clone().lerp(entry, f).addScaledVector(UP, Math.sin(Math.PI * f) * 3.2 - f * 1.3));
        const tuck = smooth(0.3, 0.38, p);
        H.legL.rotation.x = H.legR.rotation.x = -1.6 * tuck; H.armL.rotation.x = H.armR.rotation.x = -1.1 * tuck; H.armL.rotation.z = 0.4 * tuck; H.armR.rotation.z = -0.4 * tuck;
        H.body.rotation.x = 0.35 * tuck; H.g.rotation.x = f * 0.9; H.setFace("talk");
      }
      H.g.visible = p < 0.8;
      H.g.updateMatrixWorld(true);
      // the hat leaves at take-off and floats down on its own arc
      const h = hatOnHead(H, hat), hq = clamp((p - 0.33) / 0.67, 0, 1);
      if (p < 0.33) { hat.position.copy(h.pos); hat.quaternion.copy(h.quat); hatStart = h.pos.clone(); hatQ0 = h.quat.clone(); }
      else {
        const a = hatStart || h.pos;
        hat.position.copy(a).add(V(hq * 2.2, Math.sin(hq * Math.PI * 0.75) * 3.6 - hq * 1.2, hq * 1.8));
        hat.quaternion.copy(hatQ0 || h.quat).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(hq * 2.5, hq * 4, hq * 1.2)));
      }
      hat.scale.copy(h.scale);
      if (prev < 0.8 && p >= 0.8) drops(splash, 26, entry.clone(), (i) => { const a = (i / 26) * TAU; return { vel: V(Math.cos(a) * rand(1.5, 2.8), rand(5, 8.5), Math.sin(a) * rand(1.5, 2.8)), g: -9, life: 2, size: rand(0.2, 0.34), floor: -1 }; });
      splash.update(dt);
      setRing(ring, entry, (p - 0.8) * T, 1.6, 3.2);
      sepp.armR.rotation.z = 2.5 + Math.sin(st * 7) * 0.4; sepp.armL.rotation.z = -2.5 - Math.sin(st * 7) * 0.4; sepp.setFace("happy");
      sepp.g.position.y = 1.27 + Math.abs(Math.sin(st * 7)) * 0.12;
      const L = sap, from = V(-2.6, 1.27, 0.6), into = V(1.4, 0, 2.6), sf = clamp((p - 0.52) / 0.26, 0, 1), crouch = smooth(0.44, 0.52, p) * (1 - smooth(0.52, 0.56, p));
      if (p < 0.52) { L.g.position.copy(from); L.g.position.y -= crouch * 0.12; L.g.rotation.x = 0; L.body.rotation.x = 0.3 * crouch; L.legL.rotation.x = L.legR.rotation.x = 0; L.armR.rotation.set(0, 0, p < 0.4 ? 2.4 + Math.sin(st * 8) * 0.4 : 0.2); L.armL.rotation.set(0, 0, -0.2); L.setFace("happy"); }
      else { const tuck = smooth(0.52, 0.58, p); L.g.position.copy(from.clone().lerp(into, sf).addScaledVector(UP, Math.sin(Math.PI * sf) * 1.8 - sf * 1.27)); L.g.rotation.x = sf * 1.2; L.legL.rotation.x = L.legR.rotation.x = -1.6 * tuck; L.armL.rotation.set(-1.1 * tuck, 0, 0.4 * tuck); L.armR.rotation.set(-1.1 * tuck, 0, -0.4 * tuck); L.setFace("talk"); }
      leafFlutter(L, 0, 0.4 + 0.4 * smooth(0.52, 0.6, p), 0.15);
      L.g.visible = p < 0.78;
      if (prev < 0.78 && p >= 0.78) drops(splash, 8, into.clone(), () => ({ vel: V(rand(-1.2, 1.2), rand(3, 5), rand(-1.2, 1.2)), g: -9, life: 1.5, size: rand(0.16, 0.24), floor: -1 }));
      setRing(sapRing, into, (p - 0.78) * T, 1.2, 1.6);
      steamer.position.x = 22 - st * 0.4; steamer.position.y = Math.sin(st * 0.8) * 0.06;
      const flee = smooth(0.8, 1, p);
      ducks.forEach((d, i) => { d.position.set(6.5 + i * 1.1 + flee * 2, seaH(6, 3, st) + 0.1, 2.6 + i * 0.6 + flee * 1.5); d.rotation.y = 0.9 + Math.sin(st + i) * 0.2; });
    },
    cam: () => ({ target: V(0.8, 2.3, 0.4), yaw: 0.52, pitch: 0.14, dist: 19, fov: 40 }),
    labels() {
      const end = 1 - smooth(0.9, 0.95, p);
      return [
        { pos: hat.position.clone().add(V(0, 0.5, 0)), w: "der Bollenhut", m: "the pom-pom hat", l: "German", a: smooth(0.36, 0.42, p) * end },
        { pos: V(-5, 1.6, 0.9), w: "der Steg", m: "the jetty", l: "German", a: end },
        { pos: ducks[0].position.clone().add(V(0, 0.6, 0)), w: "die Ente", m: "the duck", l: "German", a: end },
        { pos: entry.clone().add(V(1.5, 0.3, 2)), w: "der See", m: "the lake", l: "German", a: smooth(0.82, 0.86, p) * end },
      ];
    },
    fade: () => Math.max(1 - smooth(0, 0.04, p), smooth(0.93, 1, p)),
  };
}

const SCENES = [windScene, ferryScene, fikaScene, catchScene, pretzelScene, lakeScene];

export type ReelElements = {
  stage: HTMLElement;
  words: HTMLElement;
  fade: HTMLElement;
  progress: HTMLElement;
};

// Starts the reel inside `stage` and returns a function that stops it. Returns
// null when WebGL is unavailable, leaving the stage's own background showing.
// Each run draws on a fresh canvas, since a stopped reel gives up its context.
export function startIslandReel({ stage, words, fade, progress }: ReelElements): (() => void) | null {
  let renderer: THREE.WebGLRenderer;
  const canvas = document.createElement("canvas");
  canvas.className = "login-stage-view";
  canvas.setAttribute("aria-hidden", "true");
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  stage.prepend(canvas);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 600);
  const font = getComputedStyle(stage).getPropertyValue("--font-display").trim();
  if (font) displayFont = `${font}, "Arial Rounded MT Bold", sans-serif`;

  let sw = 1, sh = 1;
  function resize() {
    const r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    sw = r.width;
    sh = r.height;
    // ~300 rendered rows, scaled up hard-edged: the same pixel look as the islands in the game.
    renderer.setPixelRatio(Math.min(1, 300 / sh));
    renderer.setSize(sw, sh, false);
    camera.aspect = sw / sh;
    camera.updateProjectionMatrix();
  }
  const sizer = new ResizeObserver(resize);
  sizer.observe(stage);

  // The camera leans toward the pointer; pointing at a word holds the moment still.
  let tx = 0, ty = 0, px = 0, py = 0, hold = false;
  const onPointer = (e: PointerEvent) => {
    const r = stage.getBoundingClientRect();
    tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1.3, 1.2);
    ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1.2, 1.2);
  };
  window.addEventListener("pointermove", onPointer);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reels: (Reel | null)[] = SCENES.map(() => null);
  let reel: Reel, current = 0, shown = 0, sinceSwitch = 0, spd = 0;
  const speed = () => (reduced ? 0 : reel.slow);
  function setScene(i: number) {
    current = i;
    reel = reels[i] ??= SCENES[i]();
    seaAmp = reel.world.amp;
    st = 0;
    reel.reset();
    fade.style.background = reel.fadeColor;
    shown = 0;
    sinceSwitch = 0;
    hold = false;
    spd = speed();
  }

  const pool = Array.from({ length: 10 }, () => {
    const el = document.createElement("div");
    el.className = "reel-word";
    el.hidden = true;
    el.append(document.createElement("b"), document.createElement("span"));
    el.addEventListener("pointerenter", () => { hold = true; });
    el.addEventListener("pointerleave", () => { hold = false; });
    words.appendChild(el);
    return el;
  });
  const _p = V();
  function updateLabels(vis: number) {
    let i = 0;
    const placed: { x: number; y: number; w: number }[] = [];
    for (const l of reel.labels()) {
      if (i >= pool.length) break;
      if (l.a * vis <= 0.01) continue;
      _p.copy(l.pos).project(camera);
      if (_p.z > 1 || Math.abs(_p.x) > 1.05 || Math.abs(_p.y) > 1.05) continue;
      const el = pool[i++];
      const x = ((_p.x + 1) / 2) * sw + 8, bw = 26 + l.w.length * 9;
      let y = ((1 - _p.y) / 2) * sh - 30;
      for (let n = 0; n < 6; n++) {
        const hit = placed.find((b) => x < b.x + b.w && x + bw > b.x && Math.abs(y - b.y) < 28);
        if (!hit) break;
        y = hit.y - 30;
      }
      placed.push({ x, y, w: bw });
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      el.style.opacity = (Math.max(l.a, el.matches(":hover") ? 1 : 0) * vis).toFixed(3);
      const key = l.w + l.l;
      if (el.dataset.k !== key) {
        el.dataset.k = key;
        el.firstChild!.textContent = l.w;
        el.lastChild!.textContent = `${l.m} · ${l.l}`;
        el.lang = l.l === "Swedish" ? "sv" : "de";
      }
      el.hidden = false;
    }
    for (; i < pool.length; i++) pool[i].hidden = true;
  }

  let drift = 0;
  function placeCamera() {
    const c = reel.cam();
    const yaw = c.yaw + px * 0.28, pitch = clamp(c.pitch - py * 0.1, 0.02, 0.6);
    camera.fov = c.fov;
    camera.updateProjectionMatrix();
    camera.position.set(c.target.x + Math.sin(yaw) * Math.cos(pitch) * c.dist, c.target.y + Math.sin(pitch) * c.dist, c.target.z + Math.cos(yaw) * Math.cos(pitch) * c.dist);
    camera.position.x += Math.sin(drift * 0.7) * 0.08;
    camera.position.y += Math.sin(drift * 1.1) * 0.06;
    camera.lookAt(c.target);
    camera.updateMatrixWorld();
  }

  // Skip rendering while the stage is scrolled out of view (it sits above the form on phones).
  let visible = true;
  const seen = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
  seen.observe(stage);

  resize();
  setScene(0);
  let last = performance.now(), frameId = 0;
  function frame(now: number) {
    frameId = requestAnimationFrame(frame);
    const dtR = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!visible) return;
    spd += ((hold ? 0 : speed()) - spd) * (1 - Math.exp(-dtR * (hold ? 14 : 5)));
    if (!hold) {
      px += (tx - px) * (1 - Math.exp(-dtR * 2.2));
      py += (ty - py) * (1 - Math.exp(-dtR * 2.2));
      drift += dtR;
    }
    const dt = dtR * spd;
    st += dt;
    reel.update(dt);
    placeCamera();
    renderer.render(reel.world.scene, camera);
    sinceSwitch += dtR;
    if (!hold && !reduced) shown += dtR;
    const dwell = reel.beat / reel.slow;
    if (shown >= dwell) setScene((current + 1) % SCENES.length);
    const cross = Math.max(1 - smooth(0, 0.6, sinceSwitch), smooth(dwell - 0.7, dwell, shown));
    fade.style.opacity = Math.max(reel.fade(), cross).toFixed(3);
    progress.style.width = (clamp(shown / dwell, 0, 1) * 100).toFixed(2) + "%";
    updateLabels(1 - cross);
  }
  frameId = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(frameId);
    sizer.disconnect();
    seen.disconnect();
    window.removeEventListener("pointermove", onPointer);
    pool.forEach((el) => el.remove());
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
}
