"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  defaultOutfit,
  emptyRecord,
  legacyOutfit,
  mergeRecords,
  readRecord,
  sameRecord,
  unlockedIds,
  wearable,
  withEverything,
  type ItemId,
  type Outfit,
  type WardrobeRecord,
} from "@/lib/game/wardrobe";
import type { TargetLanguageCode } from "@/lib/learning/languages";
import { createLearningRepository } from "@/lib/repositories";
import { useDevMode } from "../dev-mode";

// The wardrobe lives with the account. This device keeps a copy so the right
// outfit shows at once, and a "dirty" flag for changes the account hasn't
// heard about yet (a tab closed mid-save), which then win over the account's.

type WardrobeState = { learnerId: string | null; record: WardrobeRecord; ready: boolean };

let state: WardrobeState = { learnerId: null, record: emptyRecord, ready: false };
const listeners = new Set<() => void>();

function emit(patch: Partial<WardrobeState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

const cacheKey = (learnerId: string) => `sapling:wardrobe:v1:${learnerId}`;

function readLocal(learnerId: string): { record: WardrobeRecord; dirty: boolean } {
  try {
    const cached = JSON.parse(window.localStorage.getItem(cacheKey(learnerId)) ?? "null") as { record?: unknown; dirty?: boolean } | null;
    const record = readRecord(cached?.record);
    if (record.outfit) return { record, dirty: Boolean(cached?.dirty) };
    // Before the wardrobe there were four looks, saved with the player's name.
    // That look only stands in until the account says otherwise.
    const player = JSON.parse(window.localStorage.getItem(`sapling:player:${learnerId}`) ?? "{}") as { outfit?: unknown };
    if (typeof player.outfit === "number") return { record: { ...record, outfit: legacyOutfit(player.outfit) }, dirty: false };
    return { record, dirty: Boolean(cached?.dirty) };
  } catch {
    return { record: emptyRecord, dirty: false };
  }
}

function writeLocal(dirty: boolean) {
  if (!state.learnerId) return;
  try {
    window.localStorage.setItem(cacheKey(state.learnerId), JSON.stringify({ record: state.record, dirty }));
  } catch {
    // Private windows can refuse storage; the account copy still saves.
  }
}

let loading: { learnerId: string; promise: Promise<void> } | null = null;
// Whether the player changed anything while the account copy was loading.
let touched = false;

export function loadWardrobe(learnerId: string) {
  if (loading?.learnerId === learnerId) return loading.promise;
  const local = readLocal(learnerId);
  touched = false;
  emit({ learnerId, record: local.record, ready: false });
  const promise = (async () => {
    try {
      const remote = readRecord(await createLearningRepository().loadWardrobe());
      if (state.learnerId !== learnerId) return;
      // Unsaved changes on this device win; otherwise the account does.
      const mine = local.dirty || touched;
      const merged = mine ? mergeRecords(remote, state.record) : mergeRecords(state.record, remote);
      emit({ record: merged, ready: true });
      writeLocal(mine || !sameRecord(merged, remote));
      if (!sameRecord(merged, remote)) scheduleSave(0);
    } catch {
      // Offline or signed out: keep this device's copy and try again on the next change.
      if (state.learnerId === learnerId) emit({ ready: true });
    }
  })();
  loading = { learnerId, promise };
  return promise;
}

let timer: number | null = null;
let queue = Promise.resolve();

function scheduleSave(ms = 800) {
  if (timer !== null) window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    timer = null;
    queue = queue.then(push);
  }, ms);
}

async function push() {
  const learnerId = state.learnerId;
  if (!learnerId) return;
  try {
    const repository = createLearningRepository();
    const remote = readRecord(await repository.loadWardrobe());
    const merged = mergeRecords(remote, state.record);
    await repository.saveWardrobe(merged);
    if (state.learnerId !== learnerId) return;
    if (!sameRecord(merged, state.record)) emit({ record: merged });
    writeLocal(false);
  } catch {
    // Stays marked dirty locally, so the next load sends it.
  }
}

function change(record: WardrobeRecord) {
  if (sameRecord(record, state.record)) return;
  touched = true;
  emit({ record });
  writeLocal(true);
  scheduleSave();
}

export function getWardrobe() {
  return state;
}

export function subscribeWardrobe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useWardrobe<T>(selector: (state: WardrobeState) => T): T {
  return useSyncExternalStore(
    subscribeWardrobe,
    () => selector(state),
    () => selector(state),
  );
}

// The record to dress from: everything open in developer mode, otherwise
// exactly what's been earned.
export function useWearRecord() {
  const record = useWardrobe((s) => s.record);
  const dev = useDevMode();
  return useMemo(() => (dev ? withEverything(record) : record), [record, dev]);
}

// What the player has on, with anything they haven't earned swapped out.
export function outfitOf(record: WardrobeRecord): Outfit {
  return wearable(record.outfit ?? defaultOutfit, record);
}

export function setOutfit(outfit: Outfit) {
  change({ ...state.record, outfit });
}

export function markSeen(ids: readonly ItemId[]) {
  const fresh = ids.filter((id) => !state.record.seen.includes(id));
  if (fresh.length) change({ ...state.record, seen: [...state.record.seen, ...fresh] });
}

// Called by an island as its progress comes in. Returns what this unlocked.
export function recordProgress(code: TargetLanguageCode, level: number, gifts: readonly ItemId[]): ItemId[] {
  if (!state.ready) return [];
  const before = new Set(unlockedIds(state.record));
  const record: WardrobeRecord = {
    ...state.record,
    levels: { ...state.record.levels, [code]: Math.max(state.record.levels[code] ?? 1, level) },
    gifts: [...new Set([...state.record.gifts, ...gifts])],
  };
  change(record);
  return unlockedIds(record).filter((id) => !before.has(id));
}
