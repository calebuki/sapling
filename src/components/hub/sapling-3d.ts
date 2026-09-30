import * as THREE from "three";

import { toonRamp } from "@/components/game/world/materials";

// The hub's Sapling mascot in 3D: the same sprout as on the login scenes, toon
// shaded and drawn at a low resolution so he comes out as chunky pixel art.
// He bobs, blinks, turns toward the pointer and waves now and then.

const FRAMES = ["neutral", "blink", "happy"] as const;
type Face = (typeof FRAMES)[number];

function faceTexture() {
  const W = 16, H = 13;
  const c = document.createElement("canvas");
  c.width = W * FRAMES.length;
  c.height = H;
  const ctx = c.getContext("2d")!;
  FRAMES.forEach((frame, i) => {
    const px = (x: number, y: number, col: string) => { ctx.fillStyle = col; ctx.fillRect(i * W + x, y, 1, 1); };
    for (const x of [1, 2, 13, 14]) px(x, 8, "#f39a9a");
    for (const ex of [3, 11]) {
      if (frame === "blink") [ex - 1, ex, ex + 1, ex + 2].forEach((x) => px(x, 6, "#2b2233"));
      else if (frame === "happy") { px(ex - 1, 6, "#2b2233"); px(ex, 5, "#2b2233"); px(ex + 1, 5, "#2b2233"); px(ex + 2, 6, "#2b2233"); }
      else { for (let y = 4; y <= 6; y++) { px(ex, y, "#2b2233"); px(ex + 1, y, "#2b2233"); } px(ex + 1, 4, "#ffffff"); }
    }
    if (frame === "happy") { [6, 7, 8, 9].forEach((x) => px(x, 9, "#7a3030")); [7, 8].forEach((x) => px(x, 10, "#e0707a")); }
    else { px(6, 9, "#7a3030"); px(7, 10, "#7a3030"); px(8, 10, "#7a3030"); px(9, 9, "#7a3030"); }
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.repeat.set(1 / FRAMES.length, 1);
  return t;
}

function roundedBox(r = 0.18, seg = 4) {
  const g = new THREE.BoxGeometry(1, 1, 1, seg, seg, seg), p = g.attributes.position, h = 0.5 - r;
  const v = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    c.set(Math.max(-h, Math.min(h, v.x)), Math.max(-h, Math.min(h, v.y)), Math.max(-h, Math.min(h, v.z)));
    v.sub(c);
    if (v.lengthSq() > 0) v.normalize().multiplyScalar(r);
    p.setXYZ(i, c.x + v.x, c.y + v.y, c.z + v.z);
  }
  g.computeVertexNormals();
  return g;
}

function build() {
  const geo = { round: roundedBox(), sph: new THREE.SphereGeometry(1, 12, 8), cyl: new THREE.CylinderGeometry(1, 1, 1, 10), face: new THREE.PlaneGeometry(1, 1) };
  const mats = new Map<string, THREE.Material>();
  const toon = (color: string) => {
    let m = mats.get(color);
    if (!m) mats.set(color, (m = new THREE.MeshToonMaterial({ color, gradientMap: toonRamp() })));
    return m;
  };
  const part = (g: THREE.BufferGeometry, color: string, p: [number, number, number], s: number | [number, number, number], parent: THREE.Object3D, rz = 0) => {
    const m = new THREE.Mesh(g, toon(color));
    m.position.set(...p);
    if (typeof s === "number") m.scale.setScalar(s);
    else m.scale.set(...s);
    m.rotation.z = rz;
    parent.add(m);
    return m;
  };

  const root = new THREE.Group(), body = new THREE.Group();
  root.add(body);
  for (const x of [-0.15, 0.15]) part(geo.round, "#2f7d4f", [x, 0.1, 0.03], [0.2, 0.12, 0.26], body);
  part(geo.round, "#7cc97a", [0, 0.55, 0], [0.8, 0.76, 0.7], body);
  part(geo.round, "#b9e6a6", [0, 0.32, 0.17], [0.5, 0.3, 0.3], body);
  const faceMap = faceTexture();
  const face = new THREE.Mesh(geo.face, new THREE.MeshToonMaterial({ map: faceMap, gradientMap: toonRamp(), alphaTest: 0.5 }));
  face.position.set(0, 0.64, 0.353);
  face.scale.set(0.56, 0.45, 1);
  body.add(face);
  part(geo.cyl, "#26794c", [0, 1.02, 0], [0.05, 0.2, 0.05], body);
  const leaves = [-1, 1].map((sd) => {
    const l = new THREE.Group();
    l.position.set(0, 1.1, 0);
    part(geo.sph, sd > 0 ? "#4fbf7d" : "#3aa56b", [0.28 * sd, 0.04, 0], [0.32, 0.07, 0.17], l, sd * 0.35);
    body.add(l);
    return l;
  });
  const arm = (x: number) => {
    const a = new THREE.Group();
    a.position.set(x, 0.58, 0);
    part(geo.round, "#6bb869", [0, -0.13, 0], [0.13, 0.28, 0.13], a);
    part(geo.round, "#6bb869", [0, -0.27, 0], 0.1, a);
    body.add(a);
    return a;
  };
  const armL = arm(-0.44), armR = arm(0.44);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.46, 20), new THREE.MeshBasicMaterial({ color: "#26403a", transparent: true, opacity: 0.2, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  root.add(shadow);

  const setFace = (f: Face) => { faceMap.offset.x = FRAMES.indexOf(f) / FRAMES.length; };
  const dispose = () => {
    Object.values(geo).forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    faceMap.dispose();
    face.material.dispose();
    shadow.geometry.dispose();
    shadow.material.dispose();
  };
  return { root, body, leaves, armL, armR, shadow, setFace, dispose };
}

export type Sapling3d = { wave(): void; stop(): void };

// Draws the mascot into `host`. Returns null when WebGL is unavailable so the
// caller can keep its flat sprite instead.
export function startSapling3d(host: HTMLElement, onWave: () => void): Sapling3d | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = "sapling-mascot-3d";
  canvas.setAttribute("aria-hidden", "true");
  host.append(canvas);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight("#eaf6ff", "#a08c64", 1.5));
  const sun = new THREE.DirectionalLight("#fff3dc", 2.4);
  sun.position.set(-1.5, 3, 2.5);
  scene.add(sun);
  const sap = build();
  scene.add(sap.root);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
  camera.position.set(0, 0.95, 3.25);
  camera.lookAt(0, 0.6, 0);

  function resize() {
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    // Roughly one rendered pixel per 2.6 screen pixels: the islands' pixel size.
    renderer.setPixelRatio(1 / 2.6);
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }
  const sizer = new ResizeObserver(resize);
  sizer.observe(host);
  resize();

  // He turns a little toward the pointer, wherever it is on the page.
  let lookX = 0, lookY = 0, turnX = 0, turnY = 0;
  const onPointer = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    lookX = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 600));
    lookY = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / 400));
  };
  window.addEventListener("pointermove", onPointer);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let t = 0, waveAt = reduced ? Infinity : 1.2, waveEnd = -1, blinkAt = 3, blinkEnd = -1;
  const WAVE = 1.8;
  function startWave() {
    waveAt = Infinity;
    waveEnd = t + WAVE;
    onWave();
  }

  function pose() {
    // k eases the waving arm up and back down; a little hop starts each wave
    const waving = t < waveEnd, since = t - (waveEnd - WAVE);
    const k = waving ? Math.min(1, since / 0.2, (waveEnd - t) / 0.25) : 0;
    const hop = waving && since < 0.45 ? Math.sin((since / 0.45) * Math.PI) : 0;
    turnX += (lookX - turnX) * 0.08;
    turnY += (lookY - turnY) * 0.08;
    sap.root.rotation.y = turnX * 0.55;
    sap.body.rotation.x = turnY * 0.18;
    sap.body.position.y = Math.abs(Math.sin(t * 2.2)) * 0.035 + hop * 0.18;
    sap.body.rotation.z = Math.sin(t * 1.3) * 0.03;
    sap.shadow.scale.setScalar(1 - hop * 0.25);
    sap.armL.rotation.set(0, 0, -0.18 - Math.sin(t * 2.2) * 0.06);
    sap.armR.rotation.set(0, 0, 0.18 + Math.sin(t * 2.2) * 0.06 + k * (2.35 + Math.sin(t * 14) * 0.45));
    const flutter = 0.06 + k * 0.2;
    sap.leaves[0].rotation.set(0, 0, 0.35 + Math.sin(t * 5) * flutter);
    sap.leaves[1].rotation.set(0, 0, -0.35 - Math.sin(t * 5 + 1) * flutter);
    sap.setFace(waving ? "happy" : t < blinkEnd ? "blink" : "neutral");
  }

  let visible = true;
  const seen = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
  seen.observe(host);

  let frameId = 0, last = performance.now();
  function frame(now: number) {
    frameId = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!visible) return;
    t += dt;
    if (t >= waveAt) startWave();
    if (t >= waveEnd && waveEnd > 0 && waveAt === Infinity && !reduced) waveAt = t + 7 + Math.random() * 4;
    if (t >= blinkAt) { blinkEnd = t + 0.14; blinkAt = t + 2.6 + Math.random() * 2.4; }
    pose();
    renderer.render(scene, camera);
  }
  if (reduced) {
    pose();
    renderer.render(scene, camera);
  } else frameId = requestAnimationFrame(frame);

  return {
    wave() {
      if (reduced) return;
      startWave();
    },
    stop() {
      cancelAnimationFrame(frameId);
      sizer.disconnect();
      seen.disconnect();
      window.removeEventListener("pointermove", onPointer);
      sap.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
