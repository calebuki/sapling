import { supportedLanguageCodes, type TargetLanguageCode } from "@/lib/learning/languages";

// Progress in the villagers' jobs, kept with the account: per island and
// host, the hardest level opened so far and the best stars on each. Like the
// wardrobe it only ever grows, so two copies (this device's, the account's)
// merge by taking the better of each.

export const JOB_LEVELS = 5;

export type JobProgress = { level: number; stars: number[] };
export type JobRecord = Partial<Record<TargetLanguageCode, Record<string, JobProgress>>>;

const clampLevel = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? Math.min(JOB_LEVELS - 1, Math.max(0, Math.floor(n))) : 0);
const clampStars = (raw: unknown) =>
  Array.isArray(raw) ? raw.slice(0, JOB_LEVELS).map((n) => (typeof n === "number" && Number.isFinite(n) ? Math.min(3, Math.max(0, Math.floor(n))) : 0)) : [];

export function readProgress(raw: unknown): JobProgress | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  return { level: clampLevel(p.level), stars: clampStars(p.stars) };
}

// One island's jobs, as an island save or the account keeps them.
export function readShifts(raw: unknown): Record<string, JobProgress> {
  const shifts: Record<string, JobProgress> = {};
  if (!raw || typeof raw !== "object") return shifts;
  for (const [host, value] of Object.entries(raw as Record<string, unknown>)) {
    const progress = readProgress(value);
    if (progress && /^[a-z]{1,24}$/.test(host)) shifts[host] = progress;
  }
  return shifts;
}

export function readJobs(raw: unknown): JobRecord {
  const record: JobRecord = {};
  if (!raw || typeof raw !== "object") return record;
  for (const code of supportedLanguageCodes) {
    const shifts = readShifts((raw as Record<string, unknown>)[code]);
    if (Object.keys(shifts).length) record[code] = shifts;
  }
  return record;
}

export function mergeProgress(a: JobProgress | undefined, b: JobProgress | undefined): JobProgress {
  const stars = Array.from({ length: Math.max(a?.stars.length ?? 0, b?.stars.length ?? 0) }, (_, i) => Math.max(a?.stars[i] ?? 0, b?.stars[i] ?? 0));
  return { level: Math.max(a?.level ?? 0, b?.level ?? 0), stars };
}

export function mergeShifts(a: Record<string, JobProgress>, b: Record<string, JobProgress>): Record<string, JobProgress> {
  const merged: Record<string, JobProgress> = {};
  for (const host of new Set([...Object.keys(a), ...Object.keys(b)])) merged[host] = mergeProgress(a[host], b[host]);
  return merged;
}

const canonical = (shifts: Record<string, JobProgress>) =>
  JSON.stringify(Object.entries(mergeShifts(shifts, {})).sort(([x], [y]) => x.localeCompare(y)));
export const sameShifts = (a: Record<string, JobProgress>, b: Record<string, JobProgress>) => canonical(a) === canonical(b);

// A finished run: the best stars on that level, and the next level opens on two or more.
export function afterRun(saved: JobProgress | undefined, levelIndex: number, stars: number): { progress: JobProgress; levelUp: boolean } {
  const current = saved ?? { level: 0, stars: [] };
  const best = [...current.stars];
  best[levelIndex] = Math.max(best[levelIndex] ?? 0, stars);
  for (let i = 0; i < best.length; i++) best[i] ??= 0;
  const levelUp = stars >= 2 && levelIndex === current.level && current.level < JOB_LEVELS - 1;
  return { progress: { level: levelUp ? current.level + 1 : current.level, stars: best }, levelUp };
}
