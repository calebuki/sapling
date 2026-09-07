import * as T from "three";
import type { BuildPiece } from "@/lib/island/game";
export function pieceMesh(p: BuildPiece) {
  const g = new T.Group();
  g.position.set(p.x * 1.5, p.level * 2.4, p.z * 1.5);
  g.rotation.y = (p.rotation * Math.PI) / 180;
  g.userData.pieceId = p.id;
  g.userData.kind = p.kind;
  const material = new T.MeshStandardMaterial({
    color:
      p.material === "stone"
        ? new T.Color(p.color).lerp(new T.Color("#a0abb8"), 0.6)
        : p.color,
    roughness: 0.85,
  });
  const box = (w: number, h: number, d: number, x = 0, y = 0, z = 0) => {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };
  switch (p.kind) {
    case "door": {
      const leaf = box(0.9, 1.95, 0.12, -0.48, 1.08, -0.23);
      leaf.rotation.y = Math.PI / 2;
      box(0.12, 0.12, 0.12, -0.4, 1, -0.1);
      break;
    }
    case "chimney":
      box(0.45, 1.2, 0.5, 0, 3);
      box(0.6, 0.18, 0.65, 0, 3.6);
      break;
    case "awning": {
      const m = box(1.5, 0.12, 1.5, 0, 2.25);
      m.rotation.x = 0.12;
      break;
    }
    case "post":
      box(0.14, 2.2, 0.14, 0, 1.1, 0.5);
      break;
    case "railing":
      box(1.5, 0.12, 0.12, 0, 1, -0.65);
      for (const x of [-0.65, 0, 0.65]) box(0.1, 1, 0.1, x, 0.5, -0.65);
      break;
    case "windowbox":
      box(0.9, 0.3, 0.38, 0, 1, -0.83);
      for (const x of [-0.3, 0, 0.3]) box(0.15, 0.3, 0.15, x, 1.28, -0.83);
      break;
    case "floor":
      box(1.48, 0.14, 1.48, 0, 0.07);
      break;
    case "wall":
      box(1.5, 2.3, 0.15, 0, 1.2, -0.68);
      break;
    case "doorway":
      box(0.25, 2.3, 0.15, -0.625, 1.2, -0.68);
      box(0.25, 2.3, 0.15, 0.625, 1.2, -0.68);
      box(1, 0.35, 0.15, 0, 2.17, -0.68);
      break;
    case "window":
      box(1.5, 0.65, 0.15, 0, 0.38, -0.68);
      box(1.5, 0.4, 0.15, 0, 2.15, -0.68);
      box(0.2, 1.45, 0.15, -0.65, 1.3, -0.68);
      box(0.2, 1.45, 0.15, 0.65, 1.3, -0.68);
      box(0.06, 1.4, 0.12, 0, 1.3, -0.68);
      break;
    case "roof": {
      const a = box(0.86, 0.13, 1.58, -0.37, 2.58);
      a.rotation.z = 0.4;
      const b = box(0.86, 0.13, 1.58, 0.37, 2.58);
      b.rotation.z = -0.4;
      break;
    }
    case "stairs":
      for (let i = 0; i < 8; i++)
        box(1, 0.3 * (i + 1), 0.18, 0, 0.15 * (i + 1), 0.63 - i * 0.18);
      break;
    case "shelf":
      box(0.1, 1.8, 0.45, -0.55, 0.9);
      box(0.1, 1.8, 0.45, 0.55, 0.9);
      for (let i = 0; i < 4; i++) box(1.2, 0.1, 0.45, 0, 0.15 + i * 0.5);
      break;
    case "bench":
    case "table":
      box(1.2, 0.14, 0.8, 0, 0.9);
      for (const x of [-0.5, 0.5])
        for (const z of [-0.3, 0.3]) box(0.12, 0.9, 0.12, x, 0.45, z);
      if (p.kind === "bench") box(1.2, 0.5, 0.1, 0, 1.15, -0.4);
      break;
    case "chair":
      box(0.7, 0.13, 0.65, 0, 0.6);
      box(0.7, 0.65, 0.12, 0, 0.95, -0.28);
      for (const x of [-0.25, 0.25])
        for (const z of [-0.25, 0.25]) box(0.1, 0.6, 0.1, x, 0.3, z);
      break;
    case "planter":
      box(0.6, 0.5, 0.6, 0, 0.25);
      {
        const plant = new T.Mesh(
          new T.SphereGeometry(0.38, 12, 8),
          new T.MeshStandardMaterial({ color: "#83b269" }),
        );
        plant.position.y = 0.8;
        g.add(plant);
      }
      break;
  }
  return g;
}
export function disposeGroup(group: T.Object3D) {
  const materials = new Set<T.Material>();
  group.traverse((o) => {
    if (o instanceof T.Mesh || o instanceof T.LineSegments) {
      o.geometry.dispose();
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        materials.add(m);
    }
  });
  materials.forEach((m) => m.dispose());
}
