'use client';
import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
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
import Vocab from './vocab';
import { VoicePractice } from './learning';

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
    area,
    onClick: (_x: number, _z: number, _id?: string) => {},
  });
  const selectedPiece = state.buildings.find((p) => p.id === selected);
  function placeAt(x: number, z: number, id?: string) {
    if (!kind) {
      setSelected(id ?? null);
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
      area,
      onClick: placeAt,
    };
  });
  const api = useRef<{
    refresh: () => void;
    turn: (n: number) => void;
    step: (n: number) => void;
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
    scene.add(sun);
    const camera = new T.PerspectiveCamera(48, 1, 0.1, 150),
      root = new T.Group();
    scene.add(root);
    const position = new T.Vector3(0, 1.65, 3);
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
            new T.CylinderGeometry(0.8, 0.8, 0.3, 16),
            new T.MeshStandardMaterial({ color: '#668e6b' }),
          );
          m.position.set(x, 0.15, z);
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
          root.add(wall);
        }
        const back = new T.Mesh(
          new T.BoxGeometry(size, 2.6, 0.15),
          new T.MeshStandardMaterial({ color: '#d9c9b5' }),
        );
        back.position.set(0, 1.3, -size / 2);
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
    function click(e: PointerEvent) {
      el!.focus({ preventScroll: true });
      if (live.current.walk) return;
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
      if (!live.current.kind) {
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
    function hover(e: PointerEvent) {
      const l = live.current;
      if (!l.kind || l.walk) {
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
        ghost.material.color.set(
          validBuild(l.state, {
            kind: l.kind,
            x,
            z,
            level: l.level,
            rotation: l.rotation,
            color: l.color,
            material: l.material,
            area: l.area,
          })
            ? '#8fc884'
            : '#e89191',
        );
      }
    }
    function keydown(e: KeyboardEvent) {
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
        ].includes(e.key)
      ) {
        e.preventDefault();
        keys.add(e.key);
      }
    }
    const keyup = (e: KeyboardEvent) => keys.delete(e.key),
      blur = () => keys.clear();
    function step(amount: number) {
      const n = position.clone();
      n.x -= Math.sin(yaw) * amount;
      n.z -= Math.cos(yaw) * amount;
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
    function animate(now: number) {
      frame = requestAnimationFrame(animate);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (live.current.walk) {
        if (keys.has('a') || keys.has('ArrowLeft')) yaw += dt * 1.5;
        if (keys.has('d') || keys.has('ArrowRight')) yaw -= dt * 1.5;
        if (keys.has('w') || keys.has('ArrowUp')) step(dt * 3);
        if (keys.has('s') || keys.has('ArrowDown')) step(-dt * 3);
        camera.position.copy(position);
        camera.lookAt(
          position.x - Math.sin(yaw),
          position.y,
          position.z - Math.cos(yaw),
        );
      } else {
        camera.position
          .set(13, 17, 19)
          .multiplyScalar(
            area === 'island'
              ? 1.2
              : 0.8 + live.current.state.workshopLevel * 0.1,
          );
        camera.lookAt(0, 0, 0);
      }
      ghost.visible =
        ghost.visible && !!live.current.kind && !live.current.walk;
      root.children.forEach((o) => {
        if (o.userData.kind === 'roof')
          o.visible = live.current.walk || live.current.showRoofs;
      });
      renderer.render(scene, camera);
    }
    el.addEventListener('pointerdown', click);
    el.addEventListener('pointermove', hover);
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', blur);
    frame = requestAnimationFrame(animate);
    queueMicrotask(() => setReady(true));
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      el.removeEventListener('pointerdown', click);
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
    <section className="build-studio">
      <header>
        <div>
          <span className="eyebrow">{state.islandName}</span>
          <h2>{area === 'workshop' ? 'Min verkstad' : 'Bygg ett hem'}</h2>
        </div>
        <button
          className="text-button"
          onClick={() => {
            setWalk(!walk);
            host.current?.focus({ preventScroll: true });
            setKind(null);
          }}
        >
          {walk ? '⌂ Build view' : '◉ Walk inside'}
        </button>
        <button className="text-button" onClick={onCraft}>
          Craft furniture
        </button>
        <button className="primary" onClick={onExit}>
          Back to island
        </button>
      </header>
      <div className="studio-layout">
        <div
          className="studio-viewport"
          ref={host}
          role="application"
          tabIndex={-1}
          aria-label="3D building area. Click a grid square to build, or choose Inspect to edit a piece."
        >
          {!ready && (
            <p>
              {failure
                ? '3D is unavailable. Coordinate building remains available.'
                : 'Opening your workshop…'}
            </p>
          )}
        </div>
        <aside className="studio-tools">
          {area === 'workshop' && (
            <button
              className="primary"
              disabled={state.workshopLevel >= 2}
              onClick={() => {
                const r = act({ type: 'workshop-expand' });
                setNotice(r.message);
              }}
            >
              {state.workshopLevel >= 2
                ? 'Workshop fully expanded'
                : `Expand room · 🪵 ${WORKSHOP_COSTS[state.workshopLevel].wood} 🪨 ${WORKSHOP_COSTS[state.workshopLevel].stone}`}
            </button>
          )}
          <p className="fine">
            🪵 {state.bag.wood} · 🪨 {state.bag.stone} ·{' '}
            {state.buildings.length}/150 pieces
          </p>
          <label>
            <input
              type="checkbox"
              checked={showRoofs}
              onChange={(e) => setShowRoofs(e.target.checked)}
            />{' '}
            Show roofs in build view
          </label>
          <details>
            <summary>
              Placed pieces ·{' '}
              {state.buildings.filter((p) => p.area === area).length}
            </summary>
            <div className="placed-piece-list">
              {state.buildings
                .filter((p) => p.area === area)
                .map((p) => (
                  <button
                    className="text-button"
                    key={p.id}
                    onClick={() => {
                      setKind(null);
                      setSelected(p.id);
                      setWalk(false);
                    }}
                  >
                    {BUILD_PARTS[p.kind].sv} · {p.x}, {p.z} · level {p.level}
                  </button>
                ))}
            </div>
          </details>
          {walk ? (
            <>
              <p>W / S to walk · A / D to turn. Explore at ground level.</p>
              <div className="practice-actions">
                <button onClick={() => api.current?.turn(0.25)}>↶ Left</button>
                <button onClick={() => api.current?.step(0.5)}>
                  ↑ Forward
                </button>
                <button onClick={() => api.current?.turn(-0.25)}>
                  Right ↷
                </button>
                <button onClick={() => api.current?.step(-0.5)}>↓ Back</button>
              </div>
            </>
          ) : (
            <>
              <button className="text-button" onClick={() => setKind(null)}>
                Inspect / edit placed pieces
              </button>
              <div className="build-palette">
                {(Object.keys(BUILD_PARTS) as BuildKind[]).map((k) => (
                  <Vocab
                    key={k}
                    className={kind === k ? 'selected' : ''}
                    sv={BUILD_PARTS[k].sv}
                    en={BUILD_PARTS[k].en}
                    action={() => {
                      setKind(k);
                      setSelected(null);
                    }}
                  />
                ))}
              </div>
              <div className="paint-palette">
                {COLORS.map((c, i) => (
                  <button
                    key={c}
                    aria-label={['Honey', 'Sage', 'Rose', 'Sky', 'Lilac'][i]}
                    aria-pressed={color === c}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  >
                    {color === c ? '✓' : ''}
                  </button>
                ))}
              </div>
              <label>
                Material
                <select
                  value={material}
                  onChange={(e) =>
                    setMaterial(e.target.value as 'wood' | 'stone')
                  }
                >
                  <option value="wood">trä · wood</option>
                  <option value="stone">sten · stone</option>
                </select>
              </label>
              <label>
                Floor level
                <select
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value))}
                >
                  <option value={0}>Ground floor</option>
                  <option value={1}>Upper floor</option>
                </select>
              </label>
              <button
                className="text-button"
                onClick={() => setRotation((rotation + 90) % 360)}
              >
                Rotate · {rotation}°
              </button>
              {kind && (
                <>
                  <p>
                    {['chair', 'table', 'planter'].includes(kind)
                      ? 'Uses one crafted item from your bag.'
                      : `Cost: 🪵 ${cost?.wood} · 🪨 ${cost?.stone}`}
                  </p>
                  <p className="fine">
                    Click a grid square. Outdoor pieces need a floor first.
                    Upper floors need a floor below.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const d = new FormData(e.currentTarget);
                      placeAt(Number(d.get('x')), Number(d.get('z')));
                    }}
                    className="coordinate-form"
                  >
                    <label>
                      X
                      <input
                        name="x"
                        type="number"
                        defaultValue={-2}
                        required
                        step={1}
                      />
                    </label>
                    <label>
                      Z
                      <input
                        name="z"
                        type="number"
                        defaultValue={0}
                        required
                        step={1}
                      />
                    </label>
                    <button className="primary">Place</button>
                  </form>
                </>
              )}
              {selectedPiece && (
                <div className="piece-edit">
                  <b>{BUILD_PARTS[selectedPiece.kind].sv}</b>
                  <p>
                    {selectedPiece.x}, {selectedPiece.z} · level{' '}
                    {selectedPiece.level}
                  </p>
                  <div className="practice-actions">
                    <button
                      onClick={() =>
                        edit({ rotation: (selectedPiece.rotation + 90) % 360 })
                      }
                    >
                      Rotate
                    </button>
                    <button onClick={() => edit({ color })}>Apply color</button>
                    <button onClick={() => edit({ x: selectedPiece.x - 1 })}>
                      ← Move
                    </button>
                    <button onClick={() => edit({ x: selectedPiece.x + 1 })}>
                      Move →
                    </button>
                    <button onClick={() => edit({ z: selectedPiece.z - 1 })}>
                      ↑ Move
                    </button>
                    <button onClick={() => edit({ z: selectedPiece.z + 1 })}>
                      ↓ Move
                    </button>
                    <button
                      onClick={() => {
                        const r = act({
                          type: 'build-remove',
                          id: selectedPiece.id,
                        });
                        setNotice(r.message);
                        if (r.ok) setSelected(null);
                      }}
                    >
                      Return materials
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {notice && <output aria-live="polite">{notice}</output>}
          {practice && (
            <details>
              <summary>Say what you built</summary>
              <VoicePractice
                key={practice + practiceEpoch}
                line={`Jag byggde ${['golv', 'fönster', 'tak', 'bord'].includes(BUILD_PARTS[practice].sv) ? 'ett' : 'en'} ${BUILD_PARTS[practice].sv}.`}
                translation={`I built a ${BUILD_PARTS[practice].en}.`}
              />
            </details>
          )}
        </aside>
      </div>
    </section>
  );
}
