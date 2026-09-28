import { conceptStage } from "@/lib/game/progression";
import type { LearningOverview } from "@/lib/repositories/types";
import { retrievalIntervalDays } from "./adaptive";
import { supportedLanguageCodes, type TargetLanguageCode } from "./languages";

// The hub's summary of each language: how much of A1 and A2 the learner has
// met and made strong, and what is due for review. It is a projection over
// the same evidence the islands use, never a separate score.

export type LevelProgress = { total: number; met: number; strong: number };

export type LanguageProgress = {
  code: TargetLanguageCode;
  total: number;
  met: number;
  strong: number;
  due: number;
  levels: { A1: LevelProgress; A2: LevelProgress };
  // The highest level with most of its phrases grown strong.
  reached: "A1" | "A2" | null;
  lastPracticedAt: string | null;
};

const day = 86_400_000;

export function summarize(overview: LearningOverview, now = Date.now()): Record<TargetLanguageCode, LanguageProgress> {
  const states = new Map(overview.states.map((s) => [s.conceptId, s]));
  const result = {} as Record<TargetLanguageCode, LanguageProgress>;
  for (const code of supportedLanguageCodes) {
    const summary: LanguageProgress = {
      code,
      total: 0,
      met: 0,
      strong: 0,
      due: 0,
      levels: { A1: { total: 0, met: 0, strong: 0 }, A2: { total: 0, met: 0, strong: 0 } },
      reached: null,
      lastPracticedAt: null,
    };
    for (const concept of overview.concepts) {
      if (concept.languageCode !== code) continue;
      const state = states.get(concept.id);
      const met = Boolean(state && state.exposureCount > 0);
      const strong = conceptStage(state) >= 3;
      // Early catalog rows marked "A0" count toward A1.
      const level = concept.level === "A2" ? summary.levels.A2 : summary.levels.A1;
      summary.total++;
      level.total++;
      if (met) {
        summary.met++;
        level.met++;
      }
      if (strong) {
        summary.strong++;
        level.strong++;
      }
      if (state?.lastSuccessfulRetrievalAt && state.successfulRetrievalCount > 0) {
        const elapsed = (now - Date.parse(state.lastSuccessfulRetrievalAt)) / day;
        if (elapsed >= retrievalIntervalDays(state)) summary.due++;
      }
      const last = state?.lastExposureAt ?? null;
      if (last && (!summary.lastPracticedAt || last > summary.lastPracticedAt)) summary.lastPracticedAt = last;
    }
    const reached = (l: LevelProgress) => l.total > 0 && l.strong >= Math.ceil(l.total * 0.6);
    summary.reached = reached(summary.levels.A1) ? (reached(summary.levels.A2) ? "A2" : "A1") : null;
    result[code] = summary;
  }
  return result;
}
