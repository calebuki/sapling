"use client";
import { useEffect, useRef, useState } from "react";
import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  BUILD_PARTS,
  COLORS,
  buildCost,
  validBuild,
  type State,
  type Action,
  type Result,
  type BuildKind,
  type BuildPiece,
} from "@/lib/island/game";
import { pieceMesh, disposeGroup } from "./build-mesh";

import { VoicePractice } from "./learning";
import Vocab from "./vocab";
import type { IslandScene } from "./island-scene";

type Props = {
  islandScene: IslandScene;
  state: State;
  act: (a: Action) => Result;
  area: "workshop" | "island";
  onExit: () => void;
  onCraft: () => void;
  initialSelected?: string | null;
};
export default function BuildStudio({
  islandScene,
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
    [material, setMaterial] = useState<"wood" | "stone">("wood"),
    [level, setLevel] = useState(0),
    [notice, setNotice] = useState(""),
    [practiceEpoch, setPracticeEpoch] = useState(0),
    [practice, setPractice] = useState<BuildKind | null>(null),
    [walk, setWalk] = useState(false),
    [showRoofs, setShowRoofs] = useState(false),
    [ready, setReady] = useState(false);
  const sceneRef = useRef(islandScene);
  useEffect(() => {
    sceneRef.current = islandScene;
  }, [islandScene]);
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
    onClick: (() => {}) as (x: number, z: number, id?: string) => void,
  });
  const selectedPiece = state.buildings.find((p) => p.id === selected);
  function placeAt(x: number, z: number, id?: string) {
    if (moving && selectedPiece) {
      const r = act({
        type: "build-edit",
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
    const result = act({ type: "build", piece });
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
    const {
      scene,
      renderer,
      camera,
      buildings: root,
      surface: el,
    } = sceneRef.current;
    const entryCamera = camera.position.clone(),
      entryFov = camera.fov;
    const entryTarget = new T.Vector3(0, 0, 0);
    const startPiece = live.current.state.buildings.find(
      (p) => p.id === initialSelected,
    );
    const focusTarget = startPiece
      ? new T.Vector3(
          startPiece.x * 1.5,
          startPiece.level * 2.4 + 1,
          startPiece.z * 1.5,
        )
      : new T.Vector3(0, 1, -3);
    const focusCamera = focusTarget.clone().add(new T.Vector3(7, 9, 11));
    let intro = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 1
      : 0;
    const position = new T.Vector3(0, 2.38, -1.3);
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.minDistance = 3;
    orbit.maxDistance = 48;
    orbit.maxPolarAngle = Math.PI / 2.05;
    orbit.target.copy(entryTarget);
    orbit.update();
    if (intro === 1) {
      camera.position.copy(focusCamera);
      orbit.target.copy(focusTarget);
      orbit.update();
    }
    let pitch = 0;
    let yaw = 0,
      frame = 0,
      last = performance.now();
    const keys = new Set<string>();
    function refresh() {}
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
            setNotice("Mouse capture unavailable. Hold and drag to look."),
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
      plane.constant = -0.73 - live.current.level * 2.4;
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
        color: "#8fc884",
        transparent: true,
        opacity: 0.6,
      }),
    );
    scene.add(ghost);
    ghost.visible = false;
    let preview: T.Group | null = null,
      previewKey = "";
    const selection = new T.Box3Helper(new T.Box3(), new T.Color("#ffcf70"));
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
      plane.constant = -0.73 - l.level * 2.4;
      const p = new T.Vector3();
      if (ray.ray.intersectPlane(plane, p)) {
        const x = Math.round(p.x / 1.5),
          z = Math.round(p.z / 1.5);
        ghost.position.set(x * 1.5, l.level * 2.4 + 0.89, z * 1.5);
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
          preview = pieceMesh({ ...candidate, id: "preview" });
          preview.traverse((o) => {
            if (o instanceof T.Mesh) {
              o.material.transparent = true;
              o.material.opacity = 0.6;
              o.material.depthWrite = false;
            }
          });
          preview.position.y += 0.73;
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
            ? "#8fc884"
            : "#e89191",
        );
      }
    }
    function keydown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (document.pointerLockElement) document.exitPointerLock();
        keys.clear();
      }
      if (
        e.key === "r" &&
        !live.current.walk &&
        !(e.target as HTMLElement).closest("input,select")
      ) {
        setRotation((v) => (v + 90) % 360);
        e.preventDefault();
      }
      if ((e.target as HTMLElement).closest("input,select,textarea,button"))
        return;
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Shift",
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
      const s = live.current.state;
      const terrain =
        (n.x / (9.2 + s.expansion * 1.8)) ** 2 +
          (n.z / (7.3 + s.expansion * 1.45)) ** 2 <
        1;
      const blocked =
        s.buildings.some((p) => {
          if (
            p.level !== 0 ||
            [
              "floor",
              "roof",
              "stairs",
              "awning",
              "chimney",
              "windowbox",
            ].includes(p.kind)
          )
            return false;
          const dx = n.x - p.x * 1.5,
            dz = n.z - p.z * 1.5,
            r = (p.rotation * Math.PI) / 180,
            lx = dx * Math.cos(r) - dz * Math.sin(r),
            lz = dx * Math.sin(r) + dz * Math.cos(r);
          if (["wall", "window", "doorway"].includes(p.kind))
            return (
              Math.abs(lz + 0.68) < 0.3 &&
              Math.abs(lx) < 0.9 &&
              (p.kind !== "doorway" || Math.abs(lx) > 0.3)
            );
          if (p.kind === "door")
            return Math.abs(lx + 0.48) < 0.23 && Math.abs(lz + 0.23) < 0.6;
          return Math.abs(lx) < 0.7 && Math.abs(lz) < 0.6;
        }) ||
        s.decorations.some((d) => Math.hypot(d.x - n.x, d.z - n.z) < 0.65);
      if (terrain && !blocked) position.copy(n);
    }
    api.current = {
      refresh,
      focus: () => {
        const p = live.current.state.buildings.find(
          (p) => p.id === live.current.selected,
        );
        if (p) {
          orbit.target.set(p.x * 1.5, p.level * 2.4 + 1.33, p.z * 1.5);
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
        if (keys.has("a") || keys.has("ArrowLeft")) step(0, -dt * 3);
        if (keys.has("d") || keys.has("ArrowRight")) step(0, dt * 3);
        if (keys.has("w") || keys.has("ArrowUp"))
          step(dt * (keys.has("Shift") ? 5 : 3));
        if (keys.has("s") || keys.has("ArrowDown")) step(-dt * 3);
        camera.position.copy(position);
        camera.lookAt(
          position.x - Math.sin(yaw),
          position.y + Math.tan(pitch),
          position.z - Math.cos(yaw),
        );
      } else {
        orbit.update();
      }
      orbit.enabled = !live.current.walk && intro >= 1;
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
        if (["roof", "awning"].includes(o.userData.kind))
          o.visible = live.current.walk || live.current.showRoofs;
      });
      if (intro < 1 && !live.current.walk) {
        intro = Math.min(1, intro + dt / 0.8);
        const t = intro * intro * (3 - 2 * intro);
        camera.position.lerpVectors(entryCamera, focusCamera, t);
        orbit.target.lerpVectors(entryTarget, focusTarget, t);
        camera.lookAt(orbit.target);
      }
      renderer.render(scene, camera);
    }
    el.addEventListener("pointerdown", pressed);
    el.addEventListener("pointerup", click);
    el.addEventListener("pointermove", hover);
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    frame = requestAnimationFrame(animate);
    queueMicrotask(() => setReady(true));
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      el.removeEventListener("pointerdown", pressed);
      el.removeEventListener("pointerup", click);
      orbit.dispose();
      if (document.pointerLockElement === renderer.domElement)
        document.exitPointerLock();
      if (preview) disposeGroup(preview);
      selection.geometry.dispose();
      (selection.material as T.Material).dispose();
      el.removeEventListener("pointermove", hover);
      ghost.geometry.dispose();
      ghost.material.dispose();
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
      scene.remove(ghost, selection);
      if (preview) scene.remove(preview);
      root.children.forEach((o) => (o.visible = true));
      camera.position.copy(entryCamera);
      camera.fov = entryFov;
      camera.lookAt(entryTarget);
      camera.updateProjectionMatrix();
      api.current = null;
    };
  }, [area, islandScene, initialSelected]);
  useEffect(
    () => api.current?.refresh(),
    [state.buildings, state.workshopLevel, state.expansion],
  );
  const cost = kind ? buildCost(kind, material) : null;
  function edit(patch: Partial<BuildPiece>) {
    if (!selectedPiece) return;
    const r = act({
      type: "build-edit",
      id: selectedPiece.id,
      piece: { ...selectedPiece, ...patch },
    });
    setNotice(r.message);
  }
  return (
    <section className={`build-studio game-editor ${walk ? "is-walking" : ""}`}>
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
          <h2>{area === "workshop" ? "Workshop" : "Island construction"}</h2>
        </div>
        <button
          onClick={() => {
            setWalk(!walk);
            setKind(null);
            setMoving(false);
            islandScene.surface.focus();
          }}
        >
          {walk ? "Build mode" : "Explore"}
        </button>
        <button onClick={onCraft}>Craft</button>
        <button onClick={onExit}>Done</button>
      </header>
      {!ready && <div className="editor-message">Opening the house…</div>}
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
              {showRoofs ? "Hide roofs" : "Show roofs"}
            </button>
            <button onClick={() => setLevel(level ? 0 : 1)}>
              Floor {level + 1}
            </button>
            <button
              onClick={() =>
                setMaterial(material === "wood" ? "stone" : "wood")
              }
            >
              {material === "wood" ? "Wood" : "Stone"}
            </button>
            <button
              onClick={() => {
                setKind("floor");
                setSelected(null);
                setMoving(false);
              }}
            >
              Extend house · add floors
            </button>
          </div>
          {(selectedPiece || kind) && (
            <div className="editor-selection">
              <b>{BUILD_PARTS[kind ?? selectedPiece!.kind].sv}</b>
              <span>
                {kind
                  ? `🪵 ${cost?.wood} · 🪨 ${cost?.stone}`
                  : moving
                    ? "Click a new location"
                    : "Selected"}
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
                    {moving ? "Cancel move" : "Move"}
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
                    aria-label={["Honey", "Sage", "Rose", "Sky", "Lilac"][i]}
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
                      type: "build-remove",
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
              className={!kind ? "selected" : ""}
            >
              ↖<small>Select</small>
            </button>
            {(Object.keys(BUILD_PARTS) as BuildKind[]).map((k) => (
              <Vocab
                sv={BUILD_PARTS[k].sv}
                en={BUILD_PARTS[k].en}
                key={k}
                className={kind === k ? "selected" : ""}
                action={() => {
                  setKind(k);
                  setSelected(null);
                  setMoving(false);
                }}
              >
                <span>
                  {
                    {
                      door: "▯",
                      chimney: "▥",
                      awning: "▱",
                      post: "│",
                      windowbox: "❀",
                      railing: "╫",
                      floor: "▱",
                      wall: "▥",
                      doorway: "Π",
                      window: "⊞",
                      roof: "⌂",
                      stairs: "▟",
                      shelf: "▤",
                      bench: "⚒",
                      chair: "♧",
                      table: "▰",
                      planter: "❀",
                    }[k]
                  }
                </span>
                <VocabLabel text={BUILD_PARTS[k].sv} />
              </Vocab>
            ))}
          </nav>
        </>
      )}
      {notice && (
        <output className="editor-notice" aria-live="polite">
          {notice}{" "}
          <button aria-label="Dismiss message" onClick={() => setNotice("")}>
            ×
          </button>
        </output>
      )}
      {practice && !walk && (
        <details className="editor-speaking">
          <summary>Say what you built</summary>
          <VoicePractice
            key={practice + practiceEpoch}
            line={`Jag byggde ${["golv", "fönster", "tak", "bord"].includes(BUILD_PARTS[practice].sv) ? "ett" : "en"} ${BUILD_PARTS[practice].sv}.`}
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
