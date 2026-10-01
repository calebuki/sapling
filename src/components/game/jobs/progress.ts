"use client";

import { receiveGifts } from "@/components/wardrobe/store";
import { afterRun, mergeShifts, readJobs, readShifts, sameShifts, type JobRecord } from "@/lib/game/jobs";
import { JOB_GIFT_LEVEL, jobGiftOf, type ItemId } from "@/lib/game/wardrobe";
import type { TargetLanguageCode } from "@/lib/learning/languages";
import { createLearningRepository } from "@/lib/repositories";
import { island } from "../island";
import { getGame, updateSave } from "../store";

// Job progress lives in the island save on this device and with the account,
// so stars and opened levels follow you to another computer. Both copies only
// grow, so whichever way they meet they merge by taking the better of each.

let synced: string | null = null;
let queue = Promise.resolve();

// Called once an island's save has loaded.
export function syncJobs(learnerId: string, code: TargetLanguageCode) {
  const key = `${learnerId}:${code}`;
  if (synced === key) return;
  synced = key;
  queue = queue.then(async () => {
    try {
      const remote = readJobs(await createLearningRepository().loadJobs());
      if (synced !== key || getGame().loadedFor !== key) return;
      const local = readShifts(getGame().save.shifts);
      const theirs = remote[code] ?? {};
      const merged = mergeShifts(local, theirs);
      if (!sameShifts(merged, local)) updateSave({ shifts: merged });
      if (!sameShifts(merged, theirs)) await save(code, merged);
    } catch {
      // Offline, signed out or an older database: this device's copy stands, and the next run tries again.
    }
  });
}

async function save(code: TargetLanguageCode, shifts: JobRecord[TargetLanguageCode]) {
  const repository = createLearningRepository();
  const remote = readJobs(await repository.loadJobs());
  await repository.saveJobs({ ...remote, [code]: mergeShifts(remote[code] ?? {}, shifts ?? {}) });
}

// A finished run of any job: keeps the best stars, opens the next level on two
// or more, and hands over the host's work clothes for a good third level.
export function finishJob(host: string, levelIndex: number, stars: number): { levelUp: boolean; gift: ItemId | null } {
  const code = island().code;
  const shifts = getGame().save.shifts;
  const { progress, levelUp } = afterRun(shifts[host], levelIndex, stars);
  const next = { ...shifts, [host]: progress };
  updateSave({ shifts: next });
  queue = queue.then(() => save(code, next)).catch(() => undefined);
  const clothes = jobGiftOf(code, host);
  const gift = clothes && levelIndex === JOB_GIFT_LEVEL && stars >= 2 ? receiveGifts([clothes])[0] ?? null : null;
  return { levelUp, gift };
}
