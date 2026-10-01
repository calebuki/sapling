"use client";

import { useSyncExternalStore } from "react";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

// Developer mode: a switch on a developer's own account that opens everything
// (every unit and villager, every job and each of its levels, the whole
// wardrobe) for trying things out. It only changes what the game lets you
// reach; it never writes learning evidence or progress. Developers are the
// voice reviewers; on a local build without Supabase anyone can use it.

type DevState = { learnerId: string | null; allowed: boolean; on: boolean };

let state: DevState = { learnerId: null, allowed: false, on: false };
const listeners = new Set<() => void>();

const key = (learnerId: string) => `sapling:dev:v1:${learnerId}`;

function emit(patch: Partial<DevState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

// Called wherever a learner's world loads (an island, the hub).
export function loadDevMode(learnerId: string) {
  if (state.learnerId === learnerId) return;
  let on = false;
  try {
    on = window.localStorage.getItem(key(learnerId)) === "1";
  } catch {
    // Storage can be unavailable (private mode); the switch just starts off.
  }
  emit({ learnerId, allowed: !hasSupabase && process.env.NODE_ENV === "development", on });
  if (!hasSupabase) return;
  void createClient()
    .rpc("is_voice_reviewer")
    .then(({ data }) => {
      if (state.learnerId === learnerId) emit({ allowed: Boolean(data) });
    });
}

export function setDevMode(on: boolean) {
  if (!state.learnerId || !state.allowed) return;
  try {
    window.localStorage.setItem(key(state.learnerId), on ? "1" : "0");
  } catch {}
  emit({ on });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Whether this learner may use the switch at all.
export function useDevAllowed() {
  return useSyncExternalStore(subscribe, () => state.allowed, () => false);
}

// Whether everything is open right now.
export function useDevMode() {
  return useSyncExternalStore(subscribe, () => state.allowed && state.on, () => false);
}

export function devModeOn() {
  return state.allowed && state.on;
}
