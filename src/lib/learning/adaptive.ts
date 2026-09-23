import { getCourse, type LessonExercise, type ListenSpeakItem } from "./course";
import type { TargetLanguageCode } from "./languages";
import type { Concept, LearnerConceptState } from "@/types/learning";

export type ActivityMode = "encounter" | "recall" | "listen" | "dictation" | "transfer";
export type AdaptiveActivity = {
  id: string;
  conceptId: string;
  lessonId: string;
  exercise: LessonExercise;
  listening?: ListenSpeakItem;
  mode: ActivityMode;
  reason: "new" | "repair" | "due" | "listening-gap" | "stretch";
};
export type SessionAttempt = {
  activity: AdaptiveActivity;
  successful: boolean;
  assisted: boolean;
};
export type Observation = {
  attemptId: string;
  conceptId: string;
  dimension: "exposure" | "recognitionAudio" | "recall" | "production";
  successful: boolean;
  assisted: boolean;
  latencyMs: number | null;
  response: string;
  expected: string;
  context: Record<string, string | number | boolean | null>;
};

const day = 86_400_000;

// A scheduling heuristic, not a calibrated probability of remembering.
export function retrievalIntervalDays(state: LearnerConceptState) {
  return Math.min(30, 0.5 * 2 ** Math.min(6, state.successfulRetrievalCount / 2) *
    (0.5 + (state.retrievalStrength ?? 0)));
}

export function chooseNextActivity({
  languageCode, concepts, states, attempts = [], now = Date.now(),
}: {
  languageCode: TargetLanguageCode;
  concepts: Concept[];
  states: LearnerConceptState[];
  attempts?: SessionAttempt[];
  now?: number;
}): AdaptiveActivity | null {
  const course = getCourse(languageCode);
  const bySlug = new Map(concepts.filter(c => c.languageCode === languageCode).map(c => [c.slug, c]));
  const byId = new Map(states.map(s => [s.conceptId, s]));
  const entries = course.lessons.flatMap(lesson =>
    lesson.exercises.map(exercise => ({ lessonId: lesson.id, exercise, concept: bySlug.get(exercise.conceptSlug) })),
  ).filter(entry => entry.concept);
  const unseen = entries.filter(e => !(byId.get(e.concept!.id)?.exposureCount));
  const newWindow = new Set(unseen.slice(0, 3).map(e => e.concept!.id));
  const recent = new Set(attempts.slice(-2).map(a => a.activity.conceptId));
  const candidates = entries.flatMap((entry, index) => {
    const conceptId = entry.concept!.id;
    const state = byId.get(conceptId);
    const history = attempts.filter(a => a.activity.conceptId === conceptId);
    if (history.length >= 3 || recent.has(conceptId)) return [];
    const exposed = (state?.exposureCount ?? 0) > 0;
    if (!exposed && !newWindow.has(conceptId)) return [];
    const lastAttempt = history.at(-1);
    const repair = lastAttempt && (!lastAttempt.successful || lastAttempt.assisted);
    const elapsed = state?.lastSuccessfulRetrievalAt
      ? Math.max(0, now - Date.parse(state.lastSuccessfulRetrievalAt)) / day : 30;
    const due = state ? Math.min(3, elapsed / retrievalIntervalDays(state)) : 0;
    const listening = course.listenSpeakItems.filter(i => i.conceptSlug === entry.exercise.conceptSlug);
    const audioGap = exposed && listening.length > 0 &&
      (state?.recognitionAudio ?? 0) < Math.max(0.45, (state?.recall ?? 0) - 0.15);
    const mode: ActivityMode = !exposed ? "encounter"
      : audioGap && attempts.at(-1)?.activity.mode !== "listen" ? "listen"
      : listening.length && (state?.recognitionAudio ?? 0) >= 0.5 && attempts.length % 3 === 2 ? "dictation"
      : entry.exercise.mode === "open" && (state?.recall ?? 0) >= 0.35 ? "transfer"
      : "recall";
    const newCount = attempts.filter(a => a.activity.reason === "new").length;
    const score = repair ? 10 : !exposed ? (newCount < 2 ? 3 : 0.4)
      : due + (audioGap ? 2 : 0) + (1 - (state?.recall ?? 0)) - history.length;
    return [{
      id: `${entry.exercise.audioId}:${mode}:${history.length}`,
      conceptId, lessonId: entry.lessonId, exercise: entry.exercise,
      listening: listening[(history.length + Math.floor((state?.exposureCount ?? 0) / 2)) % listening.length],
      mode,
      reason: repair ? "repair" : !exposed ? "new" : audioGap ? "listening-gap" : due >= 1 ? "due" : "stretch",
      score: score - index * 0.002,
    } as AdaptiveActivity & { score: number }];
  });
  const selected = candidates.sort((a, b) => b.score - a.score)[0];
  return selected ?? null;
}

export function normalizeSwedish(text: string) {
  // Swedish vowel distinctions are meaningful: never strip a/å/ä or o/ö.
  return text.normalize("NFC").toLocaleLowerCase("sv-SE")
    .replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
}

export function applyObservation(current: LearnerConceptState, input: Observation, now = new Date().toISOString()): LearnerConceptState {
  const next = { ...current, exposureCount: current.exposureCount + 1, lastExposureAt: now, algorithmVersion: 3 };
  if (input.dimension === "exposure" || input.assisted) return next;
  const field = input.dimension;
  next[field] = Math.max(0, Math.min(1, (current[field] ?? 0.15) + (input.successful ? 0.12 : -0.08)));
  next.estimateConfidence = Math.min(1, current.estimateConfidence + 0.04);
  if (field === "recognitionAudio") return next;
  if (input.successful) {
    next.successfulRetrievalCount++;
    next.lastSuccessfulRetrievalAt = now;
    next.retrievalStrength = Math.min(1, (current.retrievalStrength ?? 0.1) + 0.08);
    if (input.latencyMs !== null && input.latencyMs > 0 && input.latencyMs <= 60_000) {
      next.retrievalLatencyMs = current.retrievalLatencyMs === null ? input.latencyMs
        : Math.round(current.retrievalLatencyMs * 0.7 + input.latencyMs * 0.3);
      // Fast recognition, shadowing and assisted retries never prove automatic recall.
      next.automaticity = Math.min(1, (current.automaticity ?? 0) +
        (input.latencyMs <= 3000 ? 0.06 : input.latencyMs <= 7000 ? 0.025 : 0));
    }
  } else {
    next.retrievalStrength = Math.max(0, (current.retrievalStrength ?? 0.1) - 0.08);
  }
  return next;
}
