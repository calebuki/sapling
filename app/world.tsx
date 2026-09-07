'use client';
import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canPlace, type BuildPiece } from '@/lib/game';
import { routeTo, walkable } from '@/lib/navigation';
import Vocab from './vocab';
import type { IslandScene } from './island-scene';
import { pieceMesh, disposeGroup } from './build-mesh';
export type Decoration = {
  id: string;
  kind: string;
  x: number;
  z: number;
  rotation?: number;
  color?: string;
};
type Props = {
  buildActive: boolean;
  onSceneReady: (value: IslandScene) => void;
  onInteract: (id: string) => boolean;
  buildings: BuildPiece[];
  onEdit: (id: string) => void;
  onBuildEdit: (id: string) => void;
  movingId?: string | null;
  editingId?: string | null;
  placementRotation: number;
  placementColor: string;
  decorations: Decoration[];
  paused: boolean;
  command?: { id: string; nonce: number };
  onTravel: (id: string | null) => void;
  cooldowns: Partial<Record<string, number>>;
  placement: string | null;
  onPlace: (x: number, z: number) => void;
  expansion: number;
  visitorAvailable: boolean;
  roofColor: string;
  onWordHelp: (key: string) => void;
};
const labels: Record<
  string,
  { icon: string; name: string; sv: string; y: number }
> = {
  wood: { icon: '🪵', name: 'Gather wood', sv: 'Samla trä', y: 4.8 },
  apple: { icon: '🍎', name: 'Pick apples', sv: 'Plocka äpplen', y: 4.8 },
  stone: { icon: '🪨', name: 'Collect stones', sv: 'Samla stenar', y: 1.9 },
  flower: { icon: '🌼', name: 'Pick flowers', sv: 'Plocka blommor', y: 1.5 },
  workshop: { icon: '🔨', name: 'Workshop', sv: 'Verkstad', y: 4.8 },
  visitor: { icon: '💬', name: 'Say hej!', sv: 'Säg hej!', y: 2.7 },
};
const points: Record<string, [number, number]> = {
  wood: [-5, -2],
  apple: [-6, 3],
  stone: [5, -3],
  flower: [4, 4],
  workshop: [0, -2],
  visitor: [1.3, 4.6],
};
export default function World({
  buildActive,
  onSceneReady,
  onInteract,
  buildings,
  onEdit,
  onBuildEdit,
  movingId,
  editingId,
  placementRotation,
  placementColor,
  decorations,
  paused,
  command,
  onTravel,
  cooldowns,
  placement,
  onPlace,
  onWordHelp,
  expansion,
  visitorAvailable,
  roofColor,
}: Props) {
  const pins = useRef<Record<string, HTMLButtonElement | null>>({});
  const live = useRef({
    buildActive,
    onSceneReady,
    onTravel,
    onEdit,
    onBuildEdit,
    movingId,
    editingId,
    placementRotation,
    placementColor,
    cooldowns,
    placement,
    onPlace,
    expansion,
    visitorAvailable,
    roofColor,
    buildings,
    decorations,
  });
  useEffect(() => {
    live.current = {
      buildActive,
      onSceneReady,
      onTravel,
      onEdit,
      onBuildEdit,
      movingId,
      editingId,
      placementRotation,
      placementColor,
      cooldowns,
      placement,
      onPlace,
      expansion,
      visitorAvailable,
      roofColor,
      buildings,
      decorations,
    };
  }, [
    buildActive,
    onSceneReady,
    editingId,
    placementColor,
    placementRotation,
    movingId,
    onEdit,
    onBuildEdit,
    onTravel,
    cooldowns,
    placement,
    onPlace,
    expansion,
    visitorAvailable,
    roofColor,
    buildings,
    decorations,
  ]);
  const host = useRef<HTMLDivElement>(null),
    api = useRef<{
      go: (id: string) => void;
      decorate: (d: Decoration[]) => void;
      zoom: (delta: number) => void;
      structures: (pieces: BuildPiece[]) => void;
    } | null>(null),
    interaction = useRef(onInteract),
    pause = useRef(paused);
  useEffect(() => {
    interaction.current = onInteract;
    pause.current = paused;
  }, [onInteract, paused]);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      queueMicrotask(() => setError(true));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFShadowMap;
    renderer.setClearColor('#86dce2');
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    el.appendChild(renderer.domElement);
    const scene = new T.Scene();
    scene.fog = new T.Fog('#86dce2', 40, 90);
    const camera = new T.PerspectiveCamera(35, 1, 0.1, 150);
    camera.position.set(19, 22, 26);
    camera.lookAt(0, 0, 0);
    scene.add(new T.HemisphereLight('#e7f6ff', '#5c9f9d', 2.5));
    const sun = new T.DirectionalLight('#fff1d7', 3.3);
    sun.position.set(-9, 18, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -16,
      right: 16,
      top: 16,
      bottom: -16,
    });
    sun.shadow.normalBias = 0.04;
    scene.add(sun);
    const mats = new Map<string, T.MeshStandardMaterial>();
    const mat = (c: string) => {
      if (!mats.has(c))
        mats.set(
          c,
          new T.MeshStandardMaterial({
            color: c,
            roughness: 0.7,
            flatShading: false,
          }),
        );
      return mats.get(c)!;
    };
    const mesh = (
      g: T.BufferGeometry,
      c: string,
      x = 0,
      y = 0,
      z = 0,
      p: T.Object3D = scene,
    ) => {
      const m = new T.Mesh(g, mat(c));
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      p.add(m);
      return m;
    };
    const box = (
      w: number,
      h: number,
      d: number,
      c: string,
      x = 0,
      y = 0,
      z = 0,
      p: T.Object3D = scene,
    ) =>
      mesh(
        new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * 0.15),
        c,
        x,
        y,
        z,
        p,
      );
    const ball = (
      r: number,
      c: string,
      x: number,
      y: number,
      z: number,
      p: T.Object3D = scene,
    ) => mesh(new T.SphereGeometry(r, 14, 10), c, x, y, z, p);
    const cyl = (
      a: number,
      b: number,
      h: number,
      c: string,
      x: number,
      y: number,
      z: number,
      p: T.Object3D = scene,
    ) => mesh(new T.CylinderGeometry(a, b, h, 10), c, x, y, z, p);
    const water = mesh(new T.PlaneGeometry(250, 250), '#40bacb', 0, -0.65, 0);
    water.rotation.x = -Math.PI / 2;
    water.receiveShadow = false;
    const landBase = cyl(10.4, 9.5, 1.3, '#f1d6a0', 0, -0.25, 0);
    landBase.scale.z = 0.82;
    const landTop = cyl(9.9, 10.3, 0.36, '#94cf70', 0, 0.52, 0);
    landTop.scale.z = 0.82;
    const extraMaterials: T.Material[] = [];
    const shores: T.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const m = new T.MeshBasicMaterial({
        color: '#c4f2df',
        transparent: true,
        opacity: 0.35 - i * 0.08,
        depthWrite: false,
      });
      extraMaterials.push(m);
      const shore = new T.Mesh(
        new T.RingGeometry(10.4 + i * 0.8, 10.65 + i * 0.8, 72),
        m,
      );
      shore.rotation.x = -Math.PI / 2;
      shore.scale.y = 0.82;
      shore.position.y = -0.59 + i * 0.01;
      scene.add(shore);
      shores.push(shore);
    }
    box(2.1, 0.045, 9, '#e1c99c', 0, 0.72, 2);
    box(9, 0.045, 1.45, '#e1c99c', -2, 0.72, 0);
    box(6, 0.045, 1.4, '#e1c99c', 3.5, 0.72, 1);
    const targets: T.Object3D[] = [];
    const mark = (o: T.Object3D, id: string) => {
      o.userData.id = id;
      targets.push(o);
    };
    function tree(x: number, z: number, fruit = false) {
      const g = new T.Group();
      g.position.set(x, 0.72, z);
      scene.add(g);
      cyl(0.22, 0.38, 2.25, '#906748', 0, 1, 0, g);
      ball(1.48, fruit ? '#65b267' : '#43a985', 0, 2.8, 0, g);
      ball(0.95, '#a1d175', 0.6, 3.35, 0.1, g);
      ball(0.95, '#7bc575', -0.75, 2.85, 0.3, g);
      if (fruit)
        for (let i = 0; i < 6; i++)
          ball(
            0.17,
            '#ee795c',
            Math.sin(i * 2) * 1.1,
            2.2 + (i % 3) * 0.35,
            Math.cos(i * 2) * 1.1,
            g,
          );
      mark(g, fruit ? 'apple' : 'wood');
    }
    tree(-6, 3, true);
    tree(-7.2, 1.3, true);
    tree(-5, -2);
    tree(-6.6, -3.5);
    tree(-3.4, -5);
    tree(3.4, -5.5);
    tree(7, 0);
    tree(6, 2);
    for (let i = 0; i < 7; i++) {
      const r = ball(
        0.35 + (i % 3) * 0.15,
        '#aab2a2',
        4.5 + (i % 3) * 0.7,
        0.9,
        -3.4 + Math.floor(i / 3) * 0.6,
      );
      r.scale.y = 0.7;
      mark(r, 'stone');
    }
    const garden = new T.Group();
    scene.add(garden);
    for (let i = 0; i < 12; i++) {
      const x = 3.2 + (i % 4) * 0.46,
        z = 3.2 + Math.floor(i / 4) * 0.55;
      cyl(0.025, 0.025, 0.35, '#53955b', x, 0.9, z, garden);
      ball(0.15, i % 2 ? '#f4cb60' : '#f4a9ab', x, 1.12, z, garden).scale.y =
        0.4;
    }
    mark(garden, 'flower');
    for (let i = 0; i < 8; i++) {
      const p = ball(
        0.32,
        '#f5dda9',
        -0.4 + (i % 2) * 0.75,
        0.77,
        -0.2 + i * 0.65,
      );
      p.scale.set(1, 0.09, 0.7);
    }
    for (let i = 0; i < 6; i++) {
      const x = 2.8 + i * 0.6;
      box(0.1, 0.65, 0.1, '#fff0ca', x, 1.05, 4.8);
      if (i < 5) {
        box(0.6, 0.09, 0.08, '#ead1a3', x + 0.3, 1.22, 4.8);
        box(0.6, 0.09, 0.08, '#ead1a3', x + 0.3, 0.96, 4.8);
      }
    }
    for (let i = 0; i < 11; i++)
      box(2, 0.16, 0.39, i % 2 ? '#b79569' : '#c5a576', 1, 0.55, 6 + i * 0.43);
    for (const z of [6, 8.3, 10.3])
      for (const x of [-0.12, 2.12])
        cyl(0.09, 0.12, 1.3, '#907451', x, 0.55, z);
    const boat = cyl(0.65, 0.5, 0.4, '#b46a4d', 3.2, -0.25, 8.5);
    boat.scale.z = 2.2;
    box(0.13, 1.2, 0.12, '#d4b980', 3.2, 0.4, 8.5);
    function person(x: number, z: number, color: string) {
      const g = new T.Group();
      g.position.set(x, 0.73, z);
      scene.add(g);
      cyl(0.2, 0.28, 0.62, color, 0, 0.66, 0, g);
      ball(0.24, '#edc7a3', 0, 1.22, 0, g);
      ball(0.245, '#76503c', 0, 1.34, -0.045, g).scale.y = 0.65;
      for (const sx of [-0.08, 0.08])
        ball(0.026, '#343546', sx, 1.25, 0.216, g);
      ball(0.035, '#e8a38c', 0, 1.17, 0.237, g);
      const hat = cyl(0.34, 0.34, 0.075, color, 0, 1.47, 0, g);
      hat.rotation.z = -0.08;
      cyl(0.23, 0.24, 0.17, color, 0, 1.57, 0, g);
      for (const sx of [-0.14, 0.14]) {
        const leg = box(0.13, 0.36, 0.15, '#425868', sx, 0.23, 0, g);
        leg.userData.limb = sx < 0 ? -1 : 1;
        const arm = ball(0.08, '#edc7a3', sx * 2, 0.65, 0, g);
        arm.userData.arm = sx < 0 ? -1 : 1;
      }
      return g;
    }
    const visitor = person(1.3, 4.6, '#f2bb64');
    mark(visitor, 'visitor');
    const player = person(0, 2, '#9373d5');
    box(0.34, 0.39, 0.2, '#d6a771', 0, 0.73, -0.23, player);
    const halo = mesh(new T.RingGeometry(0.32, 0.4, 32), '#fff4c9', 0, 0.75, 2);
    halo.rotation.x = -Math.PI / 2;
    const marker = mesh(
      new T.RingGeometry(0.18, 0.24, 24),
      '#fff8d8',
      0,
      0.77,
      0,
    );
    marker.rotation.x = -Math.PI / 2;
    marker.visible = false;
    const hoverRing = mesh(
      new T.RingGeometry(0.52, 0.61, 36),
      '#fff5b9',
      0,
      0.79,
      0,
    );
    hoverRing.rotation.x = -Math.PI / 2;
    hoverRing.visible = false;
    let hovered: string | null = null;
    const particles = Array.from({ length: 14 }, (_, i) => {
      const p = ball(0.08, ['#fff1a4', '#f6b9d1', '#b2e5c9'][i % 3], 0, 0, 0);
      p.visible = false;
      return { mesh: p, velocity: new T.Vector3(), life: 0 };
    });
    const bumps = new Map<T.Object3D, { time: number; base: T.Vector3 }>();
    function collect(id: string) {
      if (reduced) return;
      for (const o of targets.filter((o) => o.userData.id === id))
        bumps.set(o, { time: 0, base: o.scale.clone() });
      particles.forEach((p, i) => {
        p.life = 1;
        p.mesh.visible = true;
        p.mesh.position.copy(player.position).add(new T.Vector3(0, 0.7, 0));
        p.velocity.set(
          Math.cos(i * 2.4) * 1.6,
          2 + (i % 3) * 0.5,
          Math.sin(i * 2.4) * 1.6,
        );
      });
    }
    const clouds: T.Group[] = [];
    for (let i = 0; i < 4; i++) {
      const g = new T.Group();
      g.position.set(-15 + i * 10, 5 + (i % 2) * 1.5, -14 - (i % 2) * 4);
      scene.add(g);
      for (let j = 0; j < 4; j++)
        ball(
          0.75 + (j % 2) * 0.3,
          '#eefcfa',
          j * 0.75,
          Math.sin(j) * 0.3,
          0,
          g,
        );
      clouds.push(g);
    }
    const smoke: T.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const p = ball(0.2, '#f4f5e9', 0.8, 5 + i * 0.45, -4.1);
      p.castShadow = false;
      smoke.push(p);
    }
    const butterflies: T.Group[] = [];
    for (let i = 0; i < 3; i++) {
      const g = new T.Group();
      scene.add(g);
      for (const side of [-1, 1]) {
        const wing = ball(
          0.1,
          i % 2 ? '#c49bea' : '#f4c566',
          side * 0.1,
          0,
          0,
          g,
        );
        wing.scale.z = 0.5;
      }
      butterflies.push(g);
    }
    for (let i = 0; i < 65; i++) {
      const a = i * 2.3999,
        r = 3 + Math.sin(i * 8) * 5,
        x = Math.cos(a) * r,
        z = Math.sin(a) * r * 0.77;
      if (Math.abs(x) < 2 || Math.abs(z) < 0.9) continue;
      ball(0.07, i % 4 === 0 ? '#efddad' : '#a4c67a', x, 0.78, z).scale.y =
        0.45;
    }
    const waves: T.Mesh[] = [];
    for (let i = 0; i < 20; i++) {
      const a = i * 0.8,
        r = 12 + (i % 4) * 2,
        w = box(
          0.6 + (i % 3) * 0.3,
          0.018,
          0.045,
          '#b5e8e4',
          Math.cos(a) * r,
          -0.6,
          Math.sin(a) * r,
        );
      w.rotation.y = a;
      waves.push(w);
    }
    const deco = new T.Group();
    scene.add(deco);
    function decorate(ds: Decoration[]) {
      while (deco.children.length) {
        const o = deco.children[0];
        o.traverse((n) => {
          if (n instanceof T.Mesh) n.geometry.dispose();
        });
        deco.remove(o);
      }
      for (const d of ds) {
        const g = new T.Group();
        g.position.set(d.x, 0.75, d.z);
        deco.add(g);
        g.userData.decorationId = d.id;
        g.rotation.y = ((d.rotation ?? 0) * Math.PI) / 180;
        if (d.kind === 'chair') {
          box(0.7, 0.12, 0.65, d.color ?? '#dfb475', 0, 0.6, 0, g);
          box(0.7, 0.7, 0.1, d.color ?? '#dfb475', 0, 1, -0.28, g);
          for (const x of [-0.25, 0.25])
            for (const z of [-0.24, 0.24])
              box(0.09, 0.6, 0.09, '#946d43', x, 0.3, z, g);
        } else if (d.kind === 'table') {
          box(1.2, 0.13, 0.85, d.color ?? '#d7ae72', 0, 0.85, 0, g);
          for (const x of [-0.45, 0.45])
            for (const z of [-0.3, 0.3])
              box(0.1, 0.85, 0.1, '#926e48', x, 0.43, z, g);
        } else {
          cyl(0.3, 0.21, 0.45, d.color ?? '#c47b54', 0, 0.23, 0, g);
          for (let i = 0; i < 5; i++) {
            cyl(
              0.025,
              0.025,
              0.45,
              '#5f9360',
              Math.sin(i) * 0.2,
              0.65,
              Math.cos(i) * 0.2,
              g,
            );
            ball(0.15, '#f2b25b', Math.sin(i) * 0.2, 0.9, Math.cos(i) * 0.2, g);
          }
        }
      }
    }
    let goal: T.Vector3 | null = null,
      pending: string | null = null;
    let waypoints: T.Vector3[] = [];
    function plan(x: number, z: number) {
      waypoints = routeTo(
        player.position,
        { x, z },
        live.current.expansion,
        live.current.buildings,
      ).map((p) => new T.Vector3(p.x, 0.73, p.z));
      goal = waypoints.shift() ?? null;
      return !!goal;
    }
    let lastReport: string | null = null;
    const report = (id: string | null) => {
      if (lastReport !== id) {
        lastReport = id;
        live.current.onTravel(id);
      }
    };
    function go(id: string, object?: T.Object3D) {
      if (
        pause.current ||
        !points[id] ||
        (id === 'visitor' && !live.current.visitorAvailable)
      )
        return;
      let [x, z] = points[id];
      if (object && ['apple', 'wood', 'stone'].includes(id)) {
        const position = object.getWorldPosition(new T.Vector3());
        x = position.x;
        z = position.z;
      }
      if (!plan(x, z + 0.7) || !goal) return;
      pending = id;
      report(id);
      marker.position.set(x, 0.77, z + 0.7);
      marker.visible = true;
    }
    let zoomLevel = 1;
    const zoom = (delta: number) => {
      zoomLevel = T.MathUtils.clamp(zoomLevel + delta, 0.74, 1.25);
      resize();
    };
    const buildingGroup = new T.Group();
    buildingGroup.position.y = 0.73;
    scene.add(buildingGroup);
    function structures(pieces: BuildPiece[]) {
      disposeGroup(buildingGroup);
      buildingGroup.clear();
      for (const p of pieces) buildingGroup.add(pieceMesh(p));
    }
    api.current = { go, decorate, zoom, structures };
    live.current.onSceneReady({
      scene,
      renderer,
      camera,
      buildings: buildingGroup,
      surface: el,
    });
    const ray = new T.Raycaster(),
      pointer = new T.Vector2(),
      plane = new T.Plane(new T.Vector3(0, 1, 0), -0.73);
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enabled = false;
    orbit.enableDamping = true;
    orbit.target.set(0, 0, 0);
    orbit.minDistance = 4;
    orbit.maxDistance = 55;
    orbit.maxPolarAngle = Math.PI / 2.1;
    let press = { x: 0, y: 0 };
    const pressed = (e: PointerEvent) => {
      press = { x: e.clientX, y: e.clientY };
    };
    const down = (e: PointerEvent) => {
      if (live.current.buildActive) return;
      if (
        e.button !== 0 ||
        Math.hypot(e.clientX - press.x, e.clientY - press.y) > 5
      )
        return;
      if (pause.current && !live.current.placement) return;
      if ((e.target as HTMLElement).closest('button')) return;
      el.focus({ preventScroll: true });
      const rect = el.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      if (live.current.placement) {
        const p = new T.Vector3();
        if (ray.ray.intersectPlane(plane, p))
          live.current.onPlace(
            Math.round(p.x * 4) / 4,
            Math.round(p.z * 4) / 4,
          );
        return;
      }
      const placedHit = ray.intersectObjects(
        [...deco.children, ...buildingGroup.children],
        true,
      )[0];
      if (placedHit) {
        let o: T.Object3D | null = placedHit.object;
        while (o && !o.userData.decorationId && !o.userData.pieceId)
          o = o.parent;
        if (o?.userData.decorationId) {
          live.current.onEdit(o.userData.decorationId);
          return;
        }
        if (o?.userData.pieceId) {
          live.current.onBuildEdit(o.userData.pieceId);
          return;
        }
      }
      if (live.current.editingId) return;
      const hits = ray.intersectObjects(targets, true);
      if (hits.length) {
        let o: T.Object3D | null = hits[0].object;
        while (o && !o.userData.id) o = o.parent;
        if (o?.userData.id) {
          go(o.userData.id, o);
          return;
        }
      }
      const p = new T.Vector3();
      if (
        ray.ray.intersectPlane(plane, p) &&
        walkable(p, live.current.expansion, live.current.buildings)
      ) {
        if (!plan(p.x, p.z)) return;
        pending = null;
        report('walk');
        marker.position.set(p.x, 0.77, p.z);
        marker.visible = true;
      }
    };
    const placementRing = mesh(
      new T.RingGeometry(0.65, 0.73, 32),
      '#a8c58a',
      0,
      0.78,
      0,
    );
    placementRing.rotation.x = -Math.PI / 2;
    placementRing.visible = false;
    let preview: T.Group | null = null,
      previewKey = '';
    let lastEdit: string | null = null,
      lastEditMode = false;
    const selection = new T.Box3Helper(new T.Box3(), new T.Color('#ffcf70'));
    (selection.material as T.Material).depthTest = false;
    selection.renderOrder = 100;
    scene.add(selection);
    const move = (e: PointerEvent) => {
      if (live.current.buildActive) return;
      if (live.current.placement) {
        const rect = el.getBoundingClientRect();
        pointer.set(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          (-(e.clientY - rect.top) / rect.height) * 2 + 1,
        );
        ray.setFromCamera(pointer, camera);
        const p = new T.Vector3();
        if (ray.ray.intersectPlane(plane, p)) {
          p.x = Math.round(p.x * 4) / 4;
          p.z = Math.round(p.z * 4) / 4;
          placementRing.position.set(p.x, 0.78, p.z);
          placementRing.visible = true;
          placementRing.material = mat(
            canPlace(
              {
                expansion: live.current.expansion,
                buildings: live.current.buildings,
                decorations: live.current.decorations.filter(
                  (d) => d.id !== live.current.movingId,
                ) as Parameters<typeof canPlace>[0]['decorations'],
              },
              p.x,
              p.z,
            )
              ? '#a8c58a'
              : '#eaa6a0',
          );
        }
        return;
      }
      if (pause.current || e.pointerType === 'touch') {
        hovered = null;
        return;
      }
      const pin = (e.target as HTMLElement).closest<HTMLButtonElement>(
        '[data-object]',
      );
      if (pin) {
        hovered = pin.dataset.object ?? null;
        return;
      }
      const rect = el.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(targets, true)[0];
      let object: T.Object3D | null = hit?.object ?? null;
      while (object && !object.userData.id) object = object.parent;
      hovered = object?.userData.id ?? null;
      renderer.domElement.style.cursor = hovered ? 'pointer' : 'crosshair';
    };
    const leave = () => {
      hovered = null;
    };
    el.addEventListener('pointerdown', pressed);
    el.addEventListener('pointerup', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    const keys = new Set<string>();
    const keydown = (e: KeyboardEvent) => {
      if (
        pause.current ||
        /INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement)?.tagName)
      )
        return;
      if (
        [
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'w',
          'a',
          's',
          'd',
          'e',
        ].includes(e.key)
      ) {
        e.preventDefault();
        keys.add(e.key);
        if (e.key === 'e') {
          let nearest = '',
            dist = 3;
          for (const [id, [x, z]] of Object.entries(points)) {
            const d = Math.hypot(player.position.x - x, player.position.z - z);
            if (d < dist) {
              dist = d;
              nearest = id;
            }
          }
          if (nearest) go(nearest);
        }
      }
    };
    const keyup = (e: KeyboardEvent) => keys.delete(e.key),
      blur = () => keys.clear();
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', blur);
    function resize() {
      const w = el!.clientWidth,
        h = el!.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      if (!live.current.buildActive)
        camera.position
          .set(17, 23, 26)
          .multiplyScalar(
            Math.max(1, 0.94 / (w / h)) *
              zoomLevel *
              (1 + live.current.expansion * 0.15),
          );
      if (!live.current.buildActive) camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    let frame = 0,
      last = performance.now();
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    function animate(now: number) {
      frame = requestAnimationFrame(animate);
      visitor.visible = live.current.visitorAvailable;
      placementRing.visible = !!live.current.placement && placementRing.visible;
      const scale = 1 + live.current.expansion * 0.19;
      if (landTop.scale.x !== scale) {
        landTop.scale.set(scale, 1, scale * 0.82);
        landBase.scale.set(scale, 1, scale * 0.82);
        shores.forEach((o) => o.scale.set(scale, scale * 0.82, 1));
        resize();
      }

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const viewWidth = el!.clientWidth,
        viewHeight = el!.clientHeight;
      const projected = new T.Vector3();
      for (const [id, [x, z]] of Object.entries(points)) {
        const pin = pins.current[id];
        if (!pin) continue;
        projected.set(x, labels[id].y, z).project(camera);
        pin.style.left = `${(projected.x * 0.5 + 0.5) * viewWidth}px`;
        pin.style.top = `${(-projected.y * 0.5 + 0.5) * viewHeight}px`;
        pin.hidden =
          pause.current || (id === 'visitor' && !live.current.visitorAvailable);
        pin.dataset.active = String(hovered === id || pending === id);
        const remaining = Math.max(
          0,
          Math.ceil(((live.current.cooldowns[id] ?? 0) - Date.now()) / 1000),
        );
        pin.dataset.ready = String(!remaining);
        const countdown = pin.querySelector('em');
        if (countdown) countdown.textContent = remaining ? `${remaining}s` : '';
      }
      hoverRing.visible = !!hovered && !pause.current;
      if (hovered && points[hovered])
        hoverRing.position.set(points[hovered][0], 0.79, points[hovered][1]);
      let moving = false;
      if (!pause.current) {
        const dx =
            (keys.has('d') || keys.has('ArrowRight') ? 1 : 0) -
            (keys.has('a') || keys.has('ArrowLeft') ? 1 : 0),
          dz =
            (keys.has('s') || keys.has('ArrowDown') ? 1 : 0) -
            (keys.has('w') || keys.has('ArrowUp') ? 1 : 0);
        if (dx || dz) {
          report('walk');
          goal = null;
          waypoints = [];
          pending = null;
          marker.visible = false;
          const length = Math.hypot(dx, dz);
          const nx =
              player.position.x + ((dx * 0.8 + dz * 0.6) * dt * 4) / length,
            nz = player.position.z + ((dz * 0.8 - dx * 0.6) * dt * 4) / length;
          if (
            walkable(
              { x: nx, z: nz },
              live.current.expansion,
              live.current.buildings,
            )
          ) {
            player.rotation.y = Math.atan2(
              dx * 0.8 + dz * 0.6,
              dz * 0.8 - dx * 0.6,
            );
            player.position.set(nx, 0.73, nz);
            moving = true;
          }
        } else if (goal) {
          const d = goal.clone().sub(player.position);
          d.y = 0;
          if (d.length() < 0.13) {
            goal = waypoints.shift() ?? null;
            if (!goal) {
              marker.visible = false;
              const id = pending;
              pending = null;
              report(null);
              if (id && interaction.current(id)) collect(id);
            }
          } else {
            d.normalize();
            player.position.addScaledVector(
              d,
              Math.min(dt * 4, player.position.distanceTo(goal)),
            );
            player.rotation.y = Math.atan2(d.x, d.z);
            moving = true;
          }
        } else report(null);
      }
      player.position.y =
        0.73 +
        (moving && !reduced ? Math.abs(Math.sin(now * 0.012)) * 0.07 : 0);
      halo.position.set(player.position.x, 0.76, player.position.z);
      if (!reduced) {
        const t = now * 0.001;
        player.children.forEach((limb) => {
          if (limb.userData.limb)
            limb.rotation.x = moving
              ? Math.sin(now * 0.015) * 0.55 * limb.userData.limb
              : 0;
          if (limb.userData.arm)
            limb.position.z = moving
              ? Math.sin(now * 0.015) * 0.12 * limb.userData.arm
              : 0;
        });
        visitor.rotation.y = Math.sin(t * 0.4) * 0.15;
        visitor.children.forEach((o) => {
          if (o.userData.arm === 1) {
            o.position.y = 0.85 + Math.sin(t * 3) * 0.12;
            o.position.x = 0.34;
          }
        });
        clouds.forEach((g, i) => {
          g.position.x = -15 + i * 10 + Math.sin(t * 0.045 + i) * 2;
        });
        smoke.forEach((p, i) => {
          const cycle = (t * 0.4 + i * 0.25) % 1;
          p.position.set(0.8 + cycle * 0.4, 5 + cycle * 2, -4.1);
          p.scale.setScalar(0.4 + Math.sin(cycle * Math.PI) * 1.1);
        });
        butterflies.forEach((g, i) => {
          g.position.set(
            3.9 + Math.sin(t * 0.6 + i * 2),
            1.8 + Math.sin(t * 1.5 + i) * 0.4,
            3.5 + Math.cos(t * 0.6 + i * 2) * 0.8,
          );
          g.rotation.y = t + i;
          g.children.forEach(
            (wing, j) =>
              (wing.rotation.z = Math.sin(t * 13) * (j ? 1 : -1) * 0.7),
          );
        });
        shores.forEach((shore, i) =>
          shore.scale.set(
            1 + Math.sin(t * 0.5 + i) * 0.02,
            0.82 + Math.sin(t * 0.5 + i) * 0.015,
            1,
          ),
        );
        bumps.forEach((b, o) => {
          b.time += dt;
          const pulse = Math.sin(b.time * 18) * Math.exp(-b.time * 5);
          o.scale.set(
            b.base.x * (1 - pulse * 0.07),
            b.base.y * (1 + pulse * 0.13),
            b.base.z * (1 - pulse * 0.07),
          );
          if (b.time > 1) {
            o.scale.copy(b.base);
            bumps.delete(o);
          }
        });
        particles.forEach((p) => {
          if (p.life <= 0) return;
          p.life -= dt * 1.1;
          p.velocity.y -= dt * 5;
          p.mesh.position.addScaledVector(p.velocity, dt);
          p.mesh.scale.setScalar(Math.max(0, p.life));
          p.mesh.visible = p.life > 0;
        });
        boat.rotation.z = Math.sin(now * 0.001) * 0.045;
        waves.forEach(
          (w, i) => (w.scale.x = 1 + Math.sin(now * 0.0008 + i) * 0.25),
        );
      }
      const editMode = !!live.current.editingId || !!live.current.placement;
      if (!editMode && lastEditMode) {
        orbit.target.set(0, 0, 0);
        resize();
      }
      lastEditMode = editMode;
      orbit.enabled =
        !live.current.buildActive &&
        (!!live.current.editingId || !!live.current.placement);
      if (orbit.enabled) orbit.update();
      const selected = deco.children.find(
        (o) =>
          o.userData.decorationId ===
          (live.current.editingId ?? live.current.movingId),
      );
      if (
        selected &&
        live.current.editingId &&
        lastEdit !== live.current.editingId
      ) {
        const center = new T.Box3()
          .setFromObject(selected)
          .getCenter(new T.Vector3());
        orbit.target.copy(center);
        camera.position.copy(center).add(new T.Vector3(5, 6, 7));
      }
      lastEdit = live.current.editingId ?? null;
      selection.visible = !!selected;
      if (selected) selection.box.setFromObject(selected);
      const key = [
        live.current.placement,
        live.current.placementRotation,
        live.current.placementColor,
      ].join();
      if (key !== previewKey) {
        if (preview) {
          scene.remove(preview);
          disposeGroup(preview);
          preview = null;
        }
        previewKey = key;
        if (live.current.placement) {
          preview = pieceMesh({
            id: 'preview',
            kind: live.current.placement as BuildPiece['kind'],
            x: 0,
            z: 0,
            level: 0,
            rotation: live.current.placementRotation,
            color: live.current.placementColor,
            material: 'wood',
            area: 'island',
          });
          preview.traverse((o) => {
            if (o instanceof T.Mesh) {
              o.material.transparent = true;
              o.material.opacity = 0.6;
            }
          });
          scene.add(preview);
        }
      }
      if (preview) {
        preview.position.copy(placementRing.position);
        preview.visible = placementRing.visible && !!live.current.placement;
      }
      if (!live.current.buildActive) renderer.render(scene, camera);
    }
    frame = requestAnimationFrame(animate);
    queueMicrotask(() => setReady(true));
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      el.removeEventListener('pointerdown', pressed);
      el.removeEventListener('pointerup', down);
      orbit.dispose();
      if (preview) disposeGroup(preview);
      selection.geometry.dispose();
      (selection.material as T.Material).dispose();
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', blur);
      scene.traverse((o) => {
        if (o instanceof T.Mesh) o.geometry.dispose();
      });
      disposeGroup(buildingGroup);
      mats.forEach((m) => m.dispose());
      extraMaterials.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
  }, []);
  useEffect(() => api.current?.decorate(decorations), [decorations]);
  useEffect(() => api.current?.structures(buildings), [buildings]);
  useEffect(() => {
    if (command) api.current?.go(command.id);
  }, [command]);
  return (
    <div
      className="world"
      ref={host}
      tabIndex={-1}
      role="application"
      aria-label="3D island. Click to walk or use WASD. Click trees, rocks, flowers, the workshop, or the visitor to interact."
    >
      {!ready && !error && (
        <div className="world-loading">Growing your little island…</div>
      )}
      <div className="world-labels">
        {Object.entries(labels).map(([id, label]) => (
          <Vocab
            sv={label.sv}
            en={label.name}
            onReveal={() => onWordHelp(id)}
            key={id}
            buttonRef={(node) => {
              pins.current[id] = node as HTMLButtonElement | null;
            }}
            className="world-pin"
            data-object={id}
            hidden={paused || !ready}
            aria-label={label.sv}
            action={() => api.current?.go(id)}
          >
            <span aria-hidden="true">{label.icon}</span>
            <span className="vocab-text world-word">{label.sv}</span>
            <em />
          </Vocab>
        ))}
      </div>
      <div className="view-controls" aria-label="Camera zoom">
        <button aria-label="Zoom in" onClick={() => api.current?.zoom(-0.1)}>
          +
        </button>
        <button aria-label="Zoom out" onClick={() => api.current?.zoom(0.1)}>
          −
        </button>
      </div>
      {error && (
        <div className="world-error">
          This device couldn’t start the 3D island. Enable hardware acceleration
          or try another browser.
        </div>
      )}
    </div>
  );
}
