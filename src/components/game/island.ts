"use client";

import { createContext, useContext } from "react";
import type { IslandPack } from "@/content/types";
import type { VillagerId } from "@/lib/game/villagers";

// The island being played. It is set once, before the game mounts, and the
// game remounts when the player switches islands. Components read it through
// useIsland(); plain helpers (audio, actions, the 3D loop) through island().

let active: IslandPack | null = null;

export function setIsland(pack: IslandPack) {
  active = pack;
}

export function island(): IslandPack {
  if (!active) throw new Error("No island is loaded.");
  return active;
}

export function villagerById(id: VillagerId) {
  return island().villagers.find((villager) => villager.id === id)!;
}

export const IslandContext = createContext<IslandPack | null>(null);

export function useIsland() {
  const pack = useContext(IslandContext);
  if (!pack) throw new Error("useIsland must be used inside the island game.");
  return pack;
}
