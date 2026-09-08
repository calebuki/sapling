import * as T from "three";
import { type Appearance, defaultAppearance } from "@/lib/island/appearance";

/** Shared island and conversation character, with articulated shoulders and hips. */
export function characterMesh(appearance: Appearance = defaultAppearance) {
  const group = new T.Group();
  const materials = new Map<string, T.MeshStandardMaterial>();
  function oval(
    parent: T.Object3D,
    color: string,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) {
    let material = materials.get(color);
    if (!material) {
      material = new T.MeshStandardMaterial({ color, roughness: 0.86 });
      materials.set(color, material);
    }
    const part = new T.Mesh<T.BufferGeometry, T.MeshStandardMaterial>(
      new T.SphereGeometry(1, 20, 16),
      material,
    );
    part.position.set(x, y, z);
    part.scale.set(sx, sy, sz);
    part.castShadow = true;
    part.receiveShadow = true;
    parent.add(part);
    return part;
  }
  const shirt = oval(group, appearance.shirt, 0, 0.65, 0, 1, 1, 0.68);
  shirt.geometry.dispose();
  shirt.geometry = new T.LatheGeometry(
    [
      new T.Vector2(0, 0),
      new T.Vector2(0.17, 0),
      new T.Vector2(0.19, 0.06),
      new T.Vector2(0.17, 0.2),
      new T.Vector2(0.22, 0.42),
      new T.Vector2(0.2, 0.49),
      new T.Vector2(0.085, 0.57),
      new T.Vector2(0, 0.57),
    ],
    28,
  );
  // Collar and hem give the outfit a sewn silhouette at island scale.
  oval(group, "#eee4cc", 0, 1.225, 0.035, 0.086, 0.018, 0.06);
  oval(group, appearance.skin, 0, 1.26, 0, 0.075, 0.12, 0.075);
  oval(group, appearance.skin, 0, 1.52, 0, 0.19, 0.25, 0.17);
  for (const side of [-1, 1]) {
    oval(group, appearance.skin, side * 0.188, 1.51, 0, 0.036, 0.06, 0.038);
    oval(group, "#fff9ed", side * 0.072, 1.55, 0.151, 0.038, 0.024, 0.018);
    oval(group, "#394436", side * 0.072, 1.55, 0.167, 0.016, 0.02, 0.009);
    oval(group, appearance.hair, side * 0.072, 1.6, 0.15, 0.043, 0.009, 0.015);
    const leg = new T.Group();
    leg.position.set(side * 0.12, 0.67, 0);
    leg.userData.limb = side;
    group.add(leg);
    oval(leg, "#465e69", 0, -0.23, 0, 0.091, 0.3, 0.095);
    oval(leg, "#6a5141", 0, -0.58, 0.045, 0.1, 0.07, 0.16);
    const arm = new T.Group();
    arm.position.set(side * 0.23, 1.12, 0);
    arm.userData.arm = side;
    group.add(arm);
    oval(arm, appearance.shirt, side * 0.04, -0.1, 0, 0.09, 0.17, 0.095);
    oval(arm, appearance.skin, side * 0.06, -0.31, 0.02, 0.063, 0.15, 0.065);
    oval(arm, appearance.skin, side * 0.06, -0.45, 0.025, 0.066, 0.078, 0.055);
  }
  oval(group, appearance.skin, 0, 1.49, 0.176, 0.03, 0.044, 0.035);
  oval(group, "#ad6b60", 0, 1.41, 0.157, 0.046, 0.012, 0.016);
  oval(group, appearance.hair, 0, 1.7, -0.025, 0.205, 0.115, 0.18);
  oval(group, appearance.hair, -0.09, 1.67, 0.09, 0.13, 0.1, 0.1).rotation.z =
    -0.3;
  if (appearance.style === "bob") {
    oval(group, appearance.hair, 0, 1.49, -0.11, 0.21, 0.28, 0.11);
    for (const side of [-1, 1])
      oval(group, appearance.hair, side * 0.18, 1.5, -0.025, 0.06, 0.22, 0.13);
  }
  if (appearance.style === "curls")
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      oval(
        group,
        appearance.hair,
        Math.cos(angle) * 0.17,
        1.69 + Math.sin(i * 2) * 0.035,
        Math.sin(angle) * 0.14,
        0.085,
        0.095,
        0.085,
      );
    }
  return group;
}
