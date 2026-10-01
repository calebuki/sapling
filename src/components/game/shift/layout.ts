import type { CafeConfig } from "@/lib/game/cafe";
import type { RushConfig } from "@/lib/game/rush";

// Where everything stands in the café room. The counter runs across the
// middle: guests queue on the near side, you work on the far side, with the
// drink stations along the back wall and the host's kitchen to the left.

export const ROOM = { halfWidth: 7.5, back: -5, front: 5.5 };
export const COUNTER = { z: 0.5, from: -4.4, to: 4.4, height: 1.05, depth: 0.9 };
// Where guests wait, and where you stand to hand them their tray.
export const COUNTER_SPOTS = [
  { x: -2.6, z: 1.75 },
  { x: 0.4, z: 1.75 },
  { x: 3.3, z: 1.75 },
];
export const DOOR = { x: 8.2, z: 3.7 };
export const HOST = { x: -6.1, z: -2.6 };
export const KITCHEN_SPOT = { x: -4.6, z: -2.2 };
// The staff door in the right wall: you come in through it and leave through it.
export const STAFF_DOOR = { x: 7.6, z: -2.3, width: 1.4 };
export const STAFF_ENTRY = { x: 6.9, z: -2.3 };
export const STAFF_START = { x: 0.4, z: -2.4 };
export const TRASH = { x: 5.6, z: -0.9 };
export const TRASH_SPOT = { x: 4.7, z: -1.1 };
export const STATION_Z = -4.15;
// Staff side of the counter: where the player can walk.
export const STAFF = { minX: -5.2, maxX: 5.4, minZ: -3.4, maxZ: -0.25 };

export function serveSpot(spot: number) {
  return { x: COUNTER_SPOTS[spot].x, z: -0.35 };
}

// Drinks and the like stand at stations; the kitchen makes the rest.
export function stationSlugs(cafe: CafeConfig, rush: RushConfig) {
  return cafe.menu.filter((m) => !rush.kitchen.includes(m.slug)).map((m) => m.slug);
}

export function stationX(slugs: readonly string[], slug: string) {
  const i = Math.max(0, slugs.indexOf(slug));
  const n = slugs.length;
  return n <= 1 ? 0.5 : -3 + (i * 7.4) / (n - 1);
}

export function stationSpot(slugs: readonly string[], slug: string) {
  return { x: stationX(slugs, slug), z: -3.2 };
}
