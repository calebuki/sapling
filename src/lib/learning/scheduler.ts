import type {
  EvidenceKind,
  LearnerConceptState,
  ReviewDimension,
} from "@/types/learning";

export const EVALUATOR_VERSION = "open-response-observations-v2";
export const SCORER_VERSION = "deterministic-scorer-v2";
export const SCHEDULER_VERSION = "adaptive-review-v1";
export const PROJECTION_VERSION = 2;

export type EvaluationObservation = {
  meaningScore: number;
  grammarScore: number;
  vocabularyScore: number;
  summary: string;
  correctedTargetText: string;
  tips: Array<{
    area: "meaning" | "grammar" | "vocabulary";
    message: string;
  }>;
  source: "ai" | "deterministic";
  evaluatorVersion: string;
};

export type ScoredObservation = {
  successful: boolean;
  score: number;
  scorerVersion: typeof SCORER_VERSION;
};

export function scoreOpenResponse(
  observation: Pick<
    EvaluationObservation,
    "meaningScore" | "grammarScore" | "vocabularyScore"
  >,
): ScoredObservation {
  const meaning = clamp(observation.meaningScore);
  const form = (clamp(observation.grammarScore) + clamp(observation.vocabularyScore)) / 2;

  return {
    successful: meaning >= 0.68 && form >= 0.45,
    score: round(clamp(meaning * 0.7 + form * 0.3), 4),
    scorerVersion: SCORER_VERSION,
  };
}

export function isIndependentEvidence({
  answerVisible,
  evidenceKind,
  hintCount,
}: {
  answerVisible: boolean;
  evidenceKind: EvidenceKind;
  hintCount: number;
}) {
  return (
    (evidenceKind === "independent_recall" || evidenceKind === "communicative_use") &&
    !answerVisible &&
    hintCount === 0
  );
}

export function isDelayedIndependentSuccess({
  answerVisible,
  evidenceKind,
  hintCount,
  previousIndependentAt,
  successful,
  now,
}: {
  answerVisible: boolean;
  evidenceKind: EvidenceKind;
  hintCount: number;
  previousIndependentAt: string | null;
  successful: boolean;
  now: Date;
}) {
  return (
    successful &&
    isIndependentEvidence({ answerVisible, evidenceKind, hintCount }) &&
    previousIndependentAt !== null &&
    now.getTime() - Date.parse(previousIndependentAt) >= 6 * 3_600_000
  );
}

export type ScheduleUpdate = {
  dueAt: string;
  intervalHours: number;
  lapses: number;
};

export function scheduleReview({
  assisted,
  elapsedHours,
  intervalHours,
  lapses,
  now,
  successful,
}: {
  assisted: boolean;
  elapsedHours: number | null;
  intervalHours: number;
  lapses: number;
  now: Date;
  successful: boolean;
}): ScheduleUpdate {
  let nextInterval: number;
  let nextLapses = lapses;

  if (!successful) {
    nextInterval = 10 / 60;
    nextLapses += 1;
  } else if (assisted) {
    nextInterval = Math.min(Math.max(intervalHours, 1), 4);
  } else if (intervalHours <= 0) {
    nextInterval = 8;
  } else {
    const elapsedFactor = elapsedHours === null
      ? 1
      : Math.min(1.35, Math.max(0.8, elapsedHours / Math.max(1, intervalHours)));
    const lapsePenalty = Math.max(0.55, 1 - nextLapses * 0.08);
    nextInterval = Math.min(24 * 90, Math.max(8, intervalHours * 2 * elapsedFactor * lapsePenalty));
  }

  return {
    dueAt: new Date(now.getTime() + nextInterval * 3_600_000).toISOString(),
    intervalHours: round(nextInterval, 4),
    lapses: nextLapses,
  };
}

export type ReviewCandidate<T> = {
  id: string;
  dimension: ReviewDimension;
  state: LearnerConceptState;
  sortOrder: number;
  value: T;
};

function dimensionState(state: LearnerConceptState, dimension: ReviewDimension) {
  switch (dimension) {
    case "recognitionAudio":
      return { dueAt: state.listeningDueAt, strength: state.recognitionAudio };
    case "pronunciation":
      return { dueAt: state.pronunciationDueAt, strength: state.pronunciation };
    case "recognitionText":
      return { dueAt: state.recallDueAt, strength: state.recognitionText };
    case "communicativeUse":
      return {
        dueAt: state.recallDueAt,
        strength: averageNullable(state.recall, state.production),
      };
    case "recall":
      return { dueAt: state.recallDueAt, strength: state.recall };
  }
}

export function planAdaptiveReview<T>(
  candidates: Array<ReviewCandidate<T>>,
  { limit, now = new Date() }: { limit: number; now?: Date },
) {
  const nowMs = now.getTime();

  return candidates
    .map((candidate) => {
      const dimension = dimensionState(candidate.state, candidate.dimension);
      const dueMs = dimension.dueAt ? Date.parse(dimension.dueAt) : Number.NEGATIVE_INFINITY;
      const overdueHours = Number.isFinite(dueMs)
        ? Math.max(0, (nowMs - dueMs) / 3_600_000)
        : 24;
      const isDue = !dimension.dueAt || dueMs <= nowMs;
      const weakness = 1 - (dimension.strength ?? 0);
      const priority =
        (isDue ? 100 : 0) +
        Math.min(48, overdueHours) +
        weakness * 40 +
        (candidate.state.exposureCount === 0 ? 8 : 0);

      return { candidate, priority };
    })
    .sort(
      (left, right) =>
        right.priority - left.priority ||
        left.candidate.sortOrder - right.candidate.sortOrder ||
        left.candidate.id.localeCompare(right.candidate.id),
    )
    .slice(0, limit)
    .map(({ candidate }) => candidate.value);
}

export function dueReviewCount(states: LearnerConceptState[], now = new Date()) {
  const nowMs = now.getTime();
  return states.filter((state) =>
    [state.recallDueAt, state.listeningDueAt, state.pronunciationDueAt].some(
      (dueAt) => dueAt !== null && Date.parse(dueAt) <= nowMs,
    ),
  ).length;
}

function averageNullable(...values: Array<number | null>) {
  const present = values.filter((value): value is number => value !== null);
  return present.length === 0
    ? null
    : present.reduce((total, value) => total + value, 0) / present.length;
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
