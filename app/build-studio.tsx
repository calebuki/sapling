'use client';
import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  BUILD_PARTS,
  COLORS,
  WORKSHOP_COSTS,
  buildCost,
  validBuild,
  type State,
  type Action,
  type Result,
  type BuildKind,
  type BuildPiece,
} from '@/lib/game';
import { pieceMesh, disposeGroup } from './build-mesh';

import { VoicePractice } from './learning';
import Vocab from './vocab';

type Props = {
  state: State;
  act: (a: Action) => Result;
  area: 'workshop' | 'island';
  onExit: () => void;
  onCraft: () => void;
  initialSelected?: string | null;
};
export default function BuildStudio({
  state,
  act,
  area,
  onExit,
  onCraft,
  initialSelected,
}: Props) {
  const host = useRef<HTMLDivElement>(null),
    [kind, setKind] = useState<BuildKind | null>(null),
    [moving, setMoving] = useState(false),
    [selected, setSelected] = useState<string | null>(initialSelected ?? null),
    [rotation, setRotation] = useState(0),
    [color, setColor] = useState<string>(COLORS[0]),
    [material, setMaterial] = useState<'wood' | 'stone'>('wood'),
    [level, setLevel] = useState(0),
    [notice, setNotice] = useState(''),
    [practiceEpoch, setPracticeEpoch] = useState(0),
    [practice, setPractice] = useState<BuildKind | null>(null),
    [walk, setWalk] = useState(false),
    [showRoofs, setShowRoofs] = useState(false),
    [ready, setReady] = useState(false),
    [failure, setFailure] = useState(false);
  const live = useRef({
    state,
    kind,
    rotation,
    color,
    material,
    level,
    walk,
    showRoofs,
    selected,
    moving,
    area,
    onClick: (_x: number, _z: number, _id?: string) => {},
  });
  const selectedPiece = state.buildings.find((p) => p.id === selected);
  function placeAt(x: number, z: number, id?: string) {
    if (moving && selectedPiece) {
      const r = act({
        type: 'build-edit',
        id: selectedPiece.id,
        piece: { ...selectedPiece, x, z, rotation, color },
      });
      setNotice(r.message);
      if (r.ok) setMoving(false);
      return;
    }
    if (!kind) {
      setSelected(id ?? null);
      const picked = state.buildings.find((p) => p.id === id);
      if (picked) {
        setRotation(picked.rotation);
        setColor(picked.color);
        setLevel(picked.level);
      }
      return;
    }
    const piece = { kind, x, z, level, rotation, color, material, area };
    const result = act({ type: 'build', piece });
    setNotice(result.message);
    if (result.ok) {
      setPractice(kind);
      setPracticeEpoch((v) => v + 1);
    }
  }
  useEffect(() => {
    live.current = {
      state,
      kind,
      rotation,
      color,
      material,
      level,
      walk,
      showRoofs,
      selected,
      moving,
      area,
      onClick: placeAt,
    };
  });
  const api = useRef<{
    refresh: () => void;
    turn: (n: number) => void;
    step: (n: number) => void;
    focus: () => void;
  } | null>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true });
    } catch {
      queueMicrotask(() => setFailure(true));
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);
    const scene = new T.Scene();
    scene.background = new T.Color(area === 'workshop' ? '#eee9dc' : '#82c5ce');
    scene.add(new T.HemisphereLight('#fff6df', '#8b9679', 2.4));
    const sun = new T.DirectionalLight('#fff1dc', 3);
    sun.position.set(8, 14, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -20,
      right: 20,
      top: 20,
      bottom: -20,
    });
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    const camera = new T.PerspectiveCamera(48, 1, 0.1, 150),
      root = new T.Group();
    scene.add(root);
    const position = new T.Vector3(0, 1.65, 3);
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.minDistance = 3;
    orbit.maxDistance = 48;
    orbit.maxPolarAngle = Math.PI / 2.05;
    orbit.target.set(0, 0.8, 0);
    camera.position.set(11, 13, 15);
    orbit.update();
    let pitch = 0;
    let yaw = 0,
      frame = 0,
      last = performance.now();
    const keys = new Set<string>();
    function refresh() {
      disposeGroup(root);
      root.clear();
      const s = live.current.state;
      const size = area === 'workshop' ? (3 + s.workshopLevel) * 3 + 1.5 : 30;
      const floor = new T.Mesh(
        area === 'workshop'
          ? new T.BoxGeometry(size, 0.2, size)
          : new T.CylinderGeometry(
              9.9 * (1 + s.expansion * 0.19),
              9.9 * (1 + s.expansion * 0.19),
              0.2,
              48,
            ),
        new T.MeshStandardMaterial({
          color: area === 'workshop' ? '#dfd1ae' : '#94cf70',
        }),
      );
      floor.receiveShadow = true;
      floor.position.y = -0.1;
      if (area === 'island') floor.scale.z = 0.82;
      root.add(floor);
      const grid = new T.GridHelper(
        size,
        Math.round(size / 1.5),
        '#a8b1a1',
        '#c3c5b0',
      );
      grid.position.set(0, 0.012, 0);
      root.add(grid);
      if (area === 'island') {
        const obstacles = [
          [-5, -2],
          [-6, 3],
          [-7.2, 1.3],
          [-6.6, -3.5],
          [-3.4, -5],
          [3.4, -5.5],
          [7, 0],
          [6, 2],
          [5, -3],
          [4, 4],
        ];
        for (const [x, z] of obstacles) {
          const m = new T.Mesh(
            new T.ConeGeometry(1, 2.8, 7),
            new T.MeshStandardMaterial({ color: '#668e6b' }),
          );
          m.position.set(x, 1.4, z);
          m.castShadow = true;
          root.add(m);
        }
        const cabin = new T.Mesh(
          new T.BoxGeometry(3.4, 2.5, 3.05),
          new T.MeshStandardMaterial({ color: '#dfcba9' }),
        );
        cabin.position.set(0, 1.25, -3.725);
        root.add(cabin);
        for (const d of s.decorations) {
          const m = pieceMesh({
            id: d.id,
            kind: d.kind as BuildKind,
            x: 0,
            z: 0,
            level: 0,
            color: d.color ?? COLORS[0],
            rotation: d.rotation ?? 0,
            material: 'wood',
            area: 'island',
          });
          m.position.set(d.x, 0, d.z);
          delete m.userData.pieceId;
          root.add(m);
        }
      }
      if (area === 'workshop') {
        for (const x of [-1, 1]) {
          const wall = new T.Mesh(
            new T.BoxGeometry(0.15, 2.6, size),
            new T.MeshStandardMaterial({ color: '#d9c9b5' }),
          );
          wall.position.set((x * size) / 2, 1.3, 0);
          wall.userData.shell = true;
          root.add(wall);
        }
        const back = new T.Mesh(
          new T.BoxGeometry(size, 2.6, 0.15),
          new T.MeshStandardMaterial({ color: '#d9c9b5' }),
        );
        back.position.set(0, 1.3, -size / 2);
        back.userData.shell = true;
        root.add(back);
      }
      for (const p of s.buildings.filter((p) => p.area === area)) {
        const model = pieceMesh(p);
        root.add(model);
      }
    }
    const ray = new T.Raycaster(),
      pointer = new T.Vector2(),
      plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
    let press = { x: 0, y: 0 };
    const pressed = (e: PointerEvent) => {
      press = { x: e.clientX, y: e.clientY };
    };
    function click(e: PointerEvent) {
      if (
        e.button !== 0 ||
        Math.hypot(e.clientX - press.x, e.clientY - press.y) > 5
      )
        return;
      el!.focus({ preventScroll: true });
      if (live.current.walk) {
        renderer.domElement
          .requestPointerLock?.()
          ?.catch(() =>
            setNotice('Mouse capture unavailable. Hold and drag to look.'),
          );
        return;
      }
      const rect = el!.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const p = new T.Vector3();
      plane.constant = -live.current.level * 2.4;
      if (!ray.ray.intersectPlane(plane, p)) return;
      let id: string | undefined;
      if (!live.current.kind && !live.current.moving) {
        let o: T.Object3D | null =
          ray.intersectObjects(
            root.children.filter((o) => o.visible),
            true,
          )[0]?.object ?? null;
        while (o && !o.userData.pieceId) o = o.parent;
        id = o?.userData.pieceId;
      }
      live.current.onClick(Math.round(p.x / 1.5), Math.round(p.z / 1.5), id);
    }
    const ghost = new T.Mesh(
      new T.BoxGeometry(1.45, 0.05, 1.45),
      new T.MeshBasicMaterial({
        color: '#8fc884',
        transparent: true,
        opacity: 0.6,
      }),
    );
    scene.add(ghost);
    ghost.visible = false;
    let preview: T.Group | null = null,
      previewKey = '';
    const selection = new T.Box3Helper(new T.Box3(), new T.Color('#ffcf70'));
    (selection.material as T.Material).depthTest = false;
    selection.renderOrder = 100;
    scene.add(selection);
    function hover(e: PointerEvent) {
      if (live.current.walk) {
        if (
          document.pointerLockElement === renderer.domElement ||
          e.buttons === 1
        ) {
          yaw -= e.movementX * 0.0025;
          pitch = T.MathUtils.clamp(pitch - e.movementY * 0.0025, -1.3, 1.3);
        }
        return;
      }
      const l = live.current;
      if ((!l.kind && !l.moving) || l.walk) {
        ghost.visible = false;
        return;
      }
      const rect = el!.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      plane.constant = -l.level * 2.4;
      const p = new T.Vector3();
      if (ray.ray.intersectPlane(plane, p)) {
        const x = Math.round(p.x / 1.5),
          z = Math.round(p.z / 1.5);
        ghost.position.set(x * 1.5, l.level * 2.4 + 0.16, z * 1.5);
        ghost.visible = true;
        const picked = l.state.buildings.find((p) => p.id === l.selected);
        const candidate = {
          kind: l.kind ?? picked!.kind,
          x,
          z,
          level: l.level,
          rotation: l.rotation,
          color: l.color,
          material: l.moving ? picked!.material : l.material,
          area: l.area,
        };
        const key = JSON.stringify(candidate);
        if (key !== previewKey) {
          if (preview) {
            scene.remove(preview);
            disposeGroup(preview);
          }
          preview = pieceMesh({ ...candidate, id: 'preview' });
          preview.traverse((o) => {
            if (o instanceof T.Mesh) {
              o.material.transparent = true;
              o.material.opacity = 0.6;
              o.material.depthWrite = false;
            }
          });
          scene.add(preview);
          previewKey = key;
        }
        ghost.material.color.set(
          validBuild(
            l.state,
            {
              kind: l.kind ?? picked!.kind,
              x,
              z,
              level: l.level,
              rotation: l.rotation,
              color: l.color,
              material: l.material,
              area: l.area,
            },
            l.moving ? (l.selected ?? undefined) : undefined,
          )
            ? '#8fc884'
            : '#e89191',
        );
      }
    }
    function keydown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (document.pointerLockElement) document.exitPointerLock();
        keys.clear();
      }
      if (
        e.key === 'r' &&
        !live.current.walk &&
        !(e.target as HTMLElement).closest('input,select')
      ) {
        setRotation((v) => (v + 90) % 360);
        e.preventDefault();
      }
      if ((e.target as HTMLElement).closest('input,select,textarea,button'))
        return;
      if (
        [
          'w',
          'a',
          's',
          'd',
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'Shift',
        ].includes(e.key)
      ) {
        e.preventDefault();
        keys.add(e.key);
      }
    }
    const keyup = (e: KeyboardEvent) => keys.delete(e.key),
      blur = () => keys.clear();
    function step(amount: number, strafe = 0) {
      const n = position.clone();
      n.x -= Math.sin(yaw) * amount;
      n.x += Math.cos(yaw) * strafe;
      n.z -= Math.cos(yaw) * amount;
      n.z -= Math.sin(yaw) * strafe;
      const s = live.current.state,
        bound = (3 + s.workshopLevel) * 1.5;
      const terrain =
        area === 'workshop'
          ? Math.abs(n.x) < bound && Math.abs(n.z) < bound
          : (n.x / (9.2 + s.expansion * 1.8)) ** 2 +
              (n.z / (7.3 + s.expansion * 1.45)) ** 2 <
            1;
      const blocked =
        s.buildings.some((p) => {
          if (
            p.area !== area ||
            p.level !== 0 ||
            ['floor', 'roof', 'stairs'].includes(p.kind)
          )
            return false;
          const dx = n.x - p.x * 1.5,
            dz = n.z - p.z * 1.5,
            r = (p.rotation * Math.PI) / 180,
            lx = dx * Math.cos(r) - dz * Math.sin(r),
            lz = dx * Math.sin(r) + dz * Math.cos(r);
          if (['wall', 'window', 'doorway'].includes(p.kind))
            return (
              Math.abs(lz + 0.68) < 0.3 &&
              Math.abs(lx) < 0.9 &&
              (p.kind !== 'doorway' || Math.abs(lx) > 0.3)
            );
          return Math.abs(lx) < 0.7 && Math.abs(lz) < 0.6;
        }) ||
        (area === 'island' &&
          ((n.x > -1.95 && n.x < 1.95 && n.z > -5.5 && n.z < -2) ||
            s.decorations.some(
              (d) => Math.hypot(d.x - n.x, d.z - n.z) < 0.65,
            )));
      if (terrain && !blocked) position.copy(n);
    }
    api.current = {
      refresh,
      focus: () => {
        const p = live.current.state.buildings.find(
          (p) => p.id === live.current.selected,
        );
        if (p) {
          orbit.target.set(p.x * 1.5, p.level * 2.4 + 0.6, p.z * 1.5);
          camera.position.copy(orbit.target).add(new T.Vector3(4, 4, 5));
          orbit.update();
        }
      },
      turn: (n) => {
        yaw += n;
      },
      step,
    };
    refresh();
    const resize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    let previousWalk = false;
    const buildCamera = camera.position.clone(),
      buildTarget = orbit.target.clone();
    function animate(now: number) {
      frame = requestAnimationFrame(animate);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (live.current.walk !== previousWalk) {
        if (live.current.walk) {
          buildCamera.copy(camera.position);
          buildTarget.copy(orbit.target);
        } else {
          camera.position.copy(buildCamera);
          orbit.target.copy(buildTarget);
        }
        keys.clear();
        previousWalk = live.current.walk;
      }
      if (live.current.walk) {
        if (keys.has('a') || keys.has('ArrowLeft')) step(0, -dt * 3);
        if (keys.has('d') || keys.has('ArrowRight')) step(0, dt * 3);
        if (keys.has('w') || keys.has('ArrowUp'))
          step(dt * (keys.has('Shift') ? 5 : 3));
        if (keys.has('s') || keys.has('ArrowDown')) step(-dt * 3);
        camera.position.copy(position);
        camera.lookAt(
          position.x - Math.sin(yaw),
          position.y + Math.tan(pitch),
          position.z - Math.cos(yaw),
        );
      } else {
        orbit.update();
      }
      orbit.enabled = !live.current.walk;
      camera.fov = live.current.walk ? 75 : 48;
      camera.updateProjectionMatrix();
      if (
        !live.current.walk &&
        document.pointerLockElement === renderer.domElement
      )
        document.exitPointerLock();
      const chosen = root.children.find(
        (o) => o.userData.pieceId === live.current.selected,
      );
      selection.visible = !!chosen && !live.current.walk;
      if (chosen) selection.box.setFromObject(chosen);
      if (preview) preview.rotation.y = (live.current.rotation * Math.PI) / 180;
      if (preview)
        preview.visible =
          (!!live.current.kind || live.current.moving) && !live.current.walk;
      ghost.visible =
        ghost.visible &&
        (!!live.current.kind || live.current.moving) &&
        !live.current.walk;
      root.children.forEach((o) => {
        if (o.userData.shell)
          o.visible =
            live.current.walk || (o.position.z < 0 && camera.position.z > 0);
        if (o instanceof T.GridHelper) o.visible = !live.current.walk;
        if (o.userData.kind === 'roof')
          o.visible = live.current.walk || live.current.showRoofs;
      });
      renderer.render(scene, camera);
    }
    el.addEventListener('pointerdown', pressed);
    el.addEventListener('pointerup', click);
    el.addEventListener('pointermove', hover);
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', blur);
    frame = requestAnimationFrame(animate);
    queueMicrotask(() => setReady(true));
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      el.removeEventListener('pointerdown', pressed);
      el.removeEventListener('pointerup', click);
      orbit.dispose();
      if (document.pointerLockElement === renderer.domElement)
        document.exitPointerLock();
      if (preview) disposeGroup(preview);
      selection.geometry.dispose();
      (selection.material as T.Material).dispose();
      el.removeEventListener('pointermove', hover);
      ghost.geometry.dispose();
      ghost.material.dispose();
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', blur);
      disposeGroup(root);
      root.traverse((o) => {
        if (o instanceof T.LineSegments) {
          o.geometry.dispose();
          const m = o.material;
          if (!Array.isArray(m)) m.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
  }, [area]);
  useEffect(
    () => api.current?.refresh(),
    [state.buildings, state.workshopLevel, state.expansion],
  );
  const cost = kind ? buildCost(kind, material) : null;
  function edit(patch: Partial<BuildPiece>) {
    if (!selectedPiece) return;
    const r = act({
      type: 'build-edit',
      id: selectedPiece.id,
      piece: { ...selectedPiece, ...patch },
    });
    setNotice(r.message);
  }
  return (
    <section className={`build-studio game-editor ${walk ? 'is-walking' : ''}`}>
      <div
        className="studio-viewport"
        ref={host}
        role="application"
        tabIndex={-1}
        aria-label="Build scene. Drag to orbit, scroll to zoom, click to select or place."
      />
      <header className="editor-top">
        <div>
          <span className="eyebrow">{state.islandName}</span>
          <h2>{area === 'workshop' ? 'Workshop' : 'Island construction'}</h2>
        </div>
        <button
          onClick={() => {
            setWalk(!walk);
            setKind(null);
            setMoving(false);
            host.current?.focus();
          }}
        >
          {walk ? 'Build mode' : 'Explore'}
        </button>
        <button onClick={onCraft}>Craft</button>
        <button onClick={onExit}>Done</button>
      </header>
      {!ready && (
        <div className="editor-message">
          {failure
            ? 'This device could not start 3D.'
            : 'Opening the workshop…'}
        </div>
      )}
      {walk ? (
        <>
          <div className="crosshair" aria-hidden="true">
            +
          </div>
          <div className="editor-help">
            Click scene to capture mouse · WASD move · Shift sprint · Esc
            release mouse
          </div>
          <div className="walk-touch">
            <button onClick={() => api.current?.turn(0.2)}>↶</button>
            <button onClick={() => api.current?.step(0.5)}>↑</button>
            <button onClick={() => api.current?.turn(-0.2)}>↷</button>
            <button onClick={() => api.current?.step(-0.5)}>↓</button>
          </div>
        </>
      ) : (
        <>
          <div className="editor-help">
            Drag to orbit · Right-drag to pan · Scroll to zoom · R rotate
          </div>
          <div className="editor-options">
            <button
              aria-pressed={showRoofs}
              onClick={() => setShowRoofs(!showRoofs)}
            >
              {showRoofs ? 'Hide roofs' : 'Show roofs'}
            </button>
            <button onClick={() => setLevel(level ? 0 : 1)}>
              Floor {level + 1}
            </button>
            <button
              onClick={() =>
                setMaterial(material === 'wood' ? 'stone' : 'wood')
              }
            >
              {material === 'wood' ? 'Wood' : 'Stone'}
            </button>
            {area === 'workshop' && (
              <button
                disabled={state.workshopLevel >= 2}
                onClick={() =>
                  setNotice(act({ type: 'workshop-expand' }).message)
                }
              >
                {state.workshopLevel >= 2
                  ? 'Room expanded'
                  : `Expand · 🪵${WORKSHOP_COSTS[state.workshopLevel].wood} 🪨${WORKSHOP_COSTS[state.workshopLevel].stone}`}
              </button>
            )}
          </div>
          {(selectedPiece || kind) && (
            <div className="editor-selection">
              <b>{BUILD_PARTS[kind ?? selectedPiece!.kind].sv}</b>
              <span>
                {kind
                  ? `🪵 ${cost?.wood} · 🪨 ${cost?.stone}`
                  : moving
                    ? 'Click a new location'
                    : 'Selected'}
              </span>
              {selectedPiece && !kind && (
                <>
                  <button
                    onClick={() => {
                      setMoving(!moving);
                      setRotation(selectedPiece.rotation);
                      setColor(selectedPiece.color);
                      setLevel(selectedPiece.level);
                    }}
                  >
                    {moving ? 'Cancel move' : 'Move'}
                  </button>
                  <button onClick={() => api.current?.focus()}>Focus</button>
                </>
              )}
              <button
                onClick={() => {
                  setRotation((rotation + 90) % 360);
                  if (selectedPiece && !kind && !moving)
                    edit({ rotation: (selectedPiece.rotation + 90) % 360 });
                }}
              >
                Rotate ↻
              </button>
              <div className="paint-palette">
                {COLORS.map((c, i) => (
                  <button
                    key={c}
                    aria-label={['Honey', 'Sage', 'Rose', 'Sky', 'Lilac'][i]}
                    style={{ background: c }}
                    aria-pressed={color === c}
                    onClick={() => {
                      setColor(c);
                      if (selectedPiece && !kind && !moving) edit({ color: c });
                    }}
                  />
                ))}
              </div>
              {selectedPiece && !kind && (
                <button
                  onClick={() => {
                    const r = act({
                      type: 'build-remove',
                      id: selectedPiece.id,
                    });
                    setNotice(r.message);
                    if (r.ok) {
                      setSelected(null);
                      setMoving(false);
                    }
                  }}
                >
                  Return materials
                </button>
              )}
              <button
                onClick={() => {
                  setSelected(null);
                  setKind(null);
                  setMoving(false);
                }}
                aria-label="Deselect"
              >
                ×
              </button>
            </div>
          )}
          <nav className="editor-hotbar" aria-label="Building pieces">
            <button
              onClick={() => {
                setKind(null);
                setMoving(false);
              }}
              className={!kind ? 'selected' : ''}
            >
              ↖<small>Select</small>
            </button>
            {(Object.keys(BUILD_PARTS) as BuildKind[]).map((k, i) => (
              <Vocab
                sv={BUILD_PARTS[k].sv}
                en={BUILD_PARTS[k].en}
                key={k}
                className={kind === k ? 'selected' : ''}
                action={() => {
                  setKind(k);
                  setSelected(null);
                  setMoving(false);
                }}
              >
                <span>
                  {['▱', '▥', 'Π', '⊞', '⌂', '▟', '▤', '⚒', '♧', '▰', '❀'][i]}
                </span>
                <VocabLabel text={BUILD_PARTS[k].sv} />
              </Vocab>
            ))}
          </nav>
        </>
      )}
      {notice && (
        <output className="editor-notice" aria-live="polite">
          {notice}{' '}
          <button aria-label="Dismiss message" onClick={() => setNotice('')}>
            ×
          </button>
        </output>
      )}
      {practice && !walk && (
        <details className="editor-speaking">
          <summary>Say what you built</summary>
          <VoicePractice
            key={practice + practiceEpoch}
            line={`Jag byggde ${['golv', 'fönster', 'tak', 'bord'].includes(BUILD_PARTS[practice].sv) ? 'ett' : 'en'} ${BUILD_PARTS[practice].sv}.`}
            translation={`I built a ${BUILD_PARTS[practice].en}.`}
          />
        </details>
      )}
    </section>
  );
}
function VocabLabel({ text }: { text: string }) {
  return (
    <small lang="sv" className="vocab-text">
      {text}
    </small>
  );
}
