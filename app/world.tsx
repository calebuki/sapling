'use client';
import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
export type Decoration = { id: string; kind: string; x: number; z: number };
type Props = {
  onInteract: (id: string) => void;
  decorations: Decoration[];
  paused: boolean;
  command?: { id: string; nonce: number };
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
  onInteract,
  decorations,
  paused,
  command,
}: Props) {
  const host = useRef<HTMLDivElement>(null),
    api = useRef<{
      go: (id: string) => void;
      decorate: (d: Decoration[]) => void;
    } | null>(null),
    interaction = useRef(onInteract),
    pause = useRef(paused);
  useEffect(() => {
    interaction.current = onInteract;
    pause.current = paused;
  }, [onInteract, paused]);
  const [error, setError] = useState(false);
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
    renderer.setClearColor('#9cdadf');
    el.appendChild(renderer.domElement);
    const scene = new T.Scene();
    scene.fog = new T.Fog('#9cdadf', 38, 95);
    const camera = new T.PerspectiveCamera(35, 1, 0.1, 150);
    camera.position.set(19, 22, 26);
    camera.lookAt(0, 0, 0);
    scene.add(new T.HemisphereLight('#fff7dc', '#5b9f8b', 2.3));
    const sun = new T.DirectionalLight('#fff0cb', 3);
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
            roughness: 0.85,
            flatShading: true,
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
    ) => mesh(new T.BoxGeometry(w, h, d), c, x, y, z, p);
    const ball = (
      r: number,
      c: string,
      x: number,
      y: number,
      z: number,
      p: T.Object3D = scene,
    ) => mesh(new T.IcosahedronGeometry(r, 1), c, x, y, z, p);
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
    const water = mesh(new T.PlaneGeometry(250, 250), '#6ccbd3', 0, -0.65, 0);
    water.rotation.x = -Math.PI / 2;
    water.receiveShadow = false;
    cyl(10.4, 9.5, 1.3, '#e9cf98', 0, -0.25, 0).scale.z = 0.82;
    cyl(9.9, 10.3, 0.36, '#8cbd68', 0, 0.52, 0).scale.z = 0.82;
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
      ball(1.48, fruit ? '#5b9c59' : '#4e9461', 0, 2.8, 0, g);
      ball(0.95, '#73ac62', 0.6, 3.35, 0.1, g);
      ball(0.95, '#70a45b', -0.75, 2.85, 0.3, g);
      if (fruit)
        for (let i = 0; i < 6; i++)
          ball(
            0.17,
            '#dc6551',
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
    const house = new T.Group();
    house.position.set(0, 0.72, -3.7);
    scene.add(house);
    box(3, 2.3, 2.6, '#b85745', 0, 1.15, 0, house);
    for (const x of [-1.46, 1.46])
      box(0.12, 2.4, 2.68, '#f6e5c0', x, 1.2, 0, house);
    const roof = mesh(
      new T.CylinderGeometry(0, 2.45, 1.45, 4),
      '#455c66',
      0,
      3,
      0,
      house,
    );
    roof.rotation.y = Math.PI / 4;
    roof.scale.z = 0.92;
    box(0.76, 1.55, 0.1, '#f6dc9d', 0, 0.78, 1.34, house);
    box(0.57, 1.25, 0.12, '#739b91', 0, 0.7, 1.41, house);
    ball(0.045, '#e8b75c', 0.19, 0.8, 1.5, house);
    for (const x of [-1, 1]) {
      box(0.63, 0.66, 0.1, '#f5dfbb', x, 1.3, 1.34, house);
      box(0.43, 0.48, 0.12, '#97d8dd', x, 1.3, 1.4, house);
      box(0.035, 0.52, 0.14, '#fff3d9', x, 1.3, 1.48, house);
    }
    box(0.45, 1, 0.5, '#b0a992', 0.8, 3.5, -0.4, house);
    mark(house, 'workshop');
    const bench = new T.Group();
    scene.add(bench);
    box(2, 0.18, 0.85, '#ac8052', -1.6, 1.4, -1.5, bench);
    for (const x of [-2.35, -0.9])
      box(0.15, 0.8, 0.65, '#775d44', x, 1, -1.5, bench);
    box(0.65, 0.12, 0.35, '#eedfb2', -1.9, 1.58, -1.5, bench);
    mark(bench, 'workshop');
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
      for (const sx of [-0.14, 0.14]) {
        box(0.13, 0.36, 0.15, '#425868', sx, 0.23, 0, g);
        ball(0.08, '#edc7a3', sx * 2, 0.65, 0, g);
      }
      return g;
    }
    mark(person(1.3, 4.6, '#e8b653'), 'visitor');
    const player = person(0, 2, '#5b85b1');
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
        if (d.kind === 'chair') {
          box(0.7, 0.12, 0.65, '#dfb475', 0, 0.6, 0, g);
          box(0.7, 0.7, 0.1, '#dfb475', 0, 1, -0.28, g);
          for (const x of [-0.25, 0.25])
            for (const z of [-0.24, 0.24])
              box(0.09, 0.6, 0.09, '#946d43', x, 0.3, z, g);
        } else if (d.kind === 'table') {
          box(1.2, 0.13, 0.85, '#d7ae72', 0, 0.85, 0, g);
          for (const x of [-0.45, 0.45])
            for (const z of [-0.3, 0.3])
              box(0.1, 0.85, 0.1, '#926e48', x, 0.43, z, g);
        } else {
          cyl(0.3, 0.21, 0.45, '#c47b54', 0, 0.23, 0, g);
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
    function go(id: string) {
      if (pause.current || !points[id]) return;
      const [x, z] = points[id];
      goal = new T.Vector3(x, 0.73, z + 0.7);
      pending = id;
      marker.position.set(goal.x, 0.77, goal.z);
      marker.visible = true;
    }
    api.current = { go, decorate };
    const ray = new T.Raycaster(),
      pointer = new T.Vector2(),
      plane = new T.Plane(new T.Vector3(0, 1, 0), -0.73);
    const down = (e: PointerEvent) => {
      if (pause.current) return;
      el.focus({ preventScroll: true });
      const rect = el.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const hits = ray.intersectObjects(targets, true);
      if (hits.length) {
        let o: T.Object3D | null = hits[0].object;
        while (o && !o.userData.id) o = o.parent;
        if (o?.userData.id) {
          go(o.userData.id);
          return;
        }
      }
      const p = new T.Vector3();
      if (
        ray.ray.intersectPlane(plane, p) &&
        (p.x / 9.5) ** 2 + (p.z / 7.5) ** 2 < 1
      ) {
        goal = p;
        pending = null;
        marker.position.set(p.x, 0.77, p.z);
        marker.visible = true;
      }
    };
    el.addEventListener('pointerdown', down);
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
      camera.position.set(19, 22, 26).multiplyScalar(w / h < 0.8 ? 1.4 : 1);
      camera.lookAt(0, 0, 0);
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
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      let moving = false;
      if (!pause.current) {
        const dx =
            (keys.has('d') || keys.has('ArrowRight') ? 1 : 0) -
            (keys.has('a') || keys.has('ArrowLeft') ? 1 : 0),
          dz =
            (keys.has('s') || keys.has('ArrowDown') ? 1 : 0) -
            (keys.has('w') || keys.has('ArrowUp') ? 1 : 0);
        if (dx || dz) {
          goal = null;
          pending = null;
          marker.visible = false;
          const nx = player.position.x + (dx * 0.8 + dz * 0.6) * dt * 4,
            nz = player.position.z + (dz * 0.8 - dx * 0.6) * dt * 4;
          if ((nx / 9.2) ** 2 + (nz / 7.3) ** 2 < 1) {
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
            goal = null;
            marker.visible = false;
            const id = pending;
            pending = null;
            if (id) interaction.current(id);
          } else {
            d.normalize();
            player.position.addScaledVector(
              d,
              Math.min(dt * 4, player.position.distanceTo(goal)),
            );
            player.rotation.y = Math.atan2(d.x, d.z);
            moving = true;
          }
        }
      }
      player.position.y =
        0.73 +
        (moving && !reduced ? Math.abs(Math.sin(now * 0.012)) * 0.07 : 0);
      halo.position.set(player.position.x, 0.76, player.position.z);
      if (!reduced) {
        boat.rotation.z = Math.sin(now * 0.001) * 0.045;
        waves.forEach(
          (w, i) => (w.scale.x = 1 + Math.sin(now * 0.0008 + i) * 0.25),
        );
      }
      renderer.render(scene, camera);
    }
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', blur);
      scene.traverse((o) => {
        if (o instanceof T.Mesh) o.geometry.dispose();
      });
      mats.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
  }, []);
  useEffect(() => api.current?.decorate(decorations), [decorations]);
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
      {error && (
        <div className="world-error">
          This device couldn’t start the 3D island. Enable hardware acceleration
          or try another browser.
        </div>
      )}
    </div>
  );
}
