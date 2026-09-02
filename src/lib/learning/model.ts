import type {
  GrowthStage,
  LearnerConceptState,
  LearningDimension,
  ListeningAttemptInput,
  ReadingAttemptInput,
  RetrievalAttemptInput,
  SpeakingAttemptInput,
} from "@/types/learning";
import {
  isIndependentEvidence,
  isDelayedIndependentSuccess,
  PROJECTION_VERSION,
  scheduleReview,
} from "@/lib/learning/scheduler";

export const learningDimensions: LearningDimension[] = [
  "recognitionText",
  "recognitionAudio",
  "recall",
  "production",
  "pronunciation",
  "automaticity",
  "contextDiversity",
  "speakerDiversity",
];

export const dimensionLabels: Record<LearningDimension, string> = {
  recognitionText: "Recognize in text",
  recognitionAudio: "Recognize in speech",
  recall: "Retrieve",
  production: "Produce",
  pronunciation: "Pronounce",
  automaticity: "Automaticity",
  contextDiversity: "Across contexts",
  speakerDiversity: "Across speakers",
};

export const growthStageLabels: Record<GrowthStage, string> = {
  seed: "Seed",
  sprout: "Sprout",
  growing: "Seedling",
  established: "Sapling",
  automatic: "Tree",
};

export function createEmptyState(conceptId: string): LearnerConceptState {
  return {
    conceptId,
    recognitionText: null,
    recognitionAudio: null,
    recall: null,
    production: null,
    pronunciation: null,
    automaticity: null,
    contextDiversity: null,
    speakerDiversity: null,
    retrievalLatencyMs: null,
    lastExposureAt: null,
    lastSuccessfulRetrievalAt: null,
    retrievalStrength: null,
    estimateConfidence: 0,
    exposureCount: 0,
    successfulRetrievalCount: 0,
    independentRetrievalCount: 0,
    delayedIndependentSuccessCount: 0,
    lastIndependentRetrievalAt: null,
    recallDueAt: null,
    listeningDueAt: null,
    pronunciationDueAt: null,
    recallIntervalHours: 0,
    listeningIntervalHours: 0,
    pronunciationIntervalHours: 0,
    recallLapses: 0,
    listeningLapses: 0,
    pronunciationLapses: 0,
    algorithmVersion: PROJECTION_VERSION,
  };
}

export function deriveGrowthStage(state: LearnerConceptState): GrowthStage {
  if (state.exposureCount === 0) {
    return "seed";
  }

  if (
    (state.recall ?? 0) >= 0.8 &&
    (state.production ?? 0) >= 0.72 &&
    (state.automaticity ?? 0) >= 0.78 &&
    (state.retrievalStrength ?? 0) >= 0.78 &&
    (state.contextDiversity ?? 0) >= 0.55 &&
    state.delayedIndependentSuccessCount >= 3
  ) {
    return "automatic";
  }

  if (
    (state.recall ?? 0) >= 0.58 &&
    (state.production ?? 0) >= 0.45 &&
    Math.max(state.recognitionText ?? 0, state.recognitionAudio ?? 0) >= 0.66 &&
    (state.contextDiversity ?? 0) >= 0.34 &&
    state.delayedIndependentSuccessCount >= 2
  ) {
    return "established";
  }

  if (
    (state.recall ?? 0) >= 0.25 ||
    (state.production ?? 0) >= 0.22 ||
    Math.max(state.recognitionText ?? 0, state.recognitionAudio ?? 0) >= 0.45
  ) {
    return "growing";
  }

  return "sprout";
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function applyDemoRetrievalAttempt(
  current: LearnerConceptState,
  attempt: RetrievalAttemptInput,
): LearnerConceptState {
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const independent = isIndependentEvidence(attempt);
  const elapsedHours = current.lastIndependentRetrievalAt
    ? Math.max(0, (nowDate.getTime() - Date.parse(current.lastIndependentRetrievalAt)) / 3_600_000)
    : null;
  const delayedSuccess = isDelayedIndependentSuccess({
    ...attempt,
    previousIndependentAt: current.lastIndependentRetrievalAt,
    now: nowDate,
  });
  const schedule = scheduleReview({
    assisted: !independent,
    elapsedHours,
    intervalHours: current.recallIntervalHours,
    lapses: current.recallLapses,
    now: nowDate,
    successful: attempt.successful,
  });
  const speedGain =
    attempt.latencyMs <= 3000 ? 0.12 : attempt.latencyMs <= 7000 ? 0.07 : 0.03;

  return {
    ...current,
    recall: independent
      ? clamp((current.recall ?? 0.2) + (attempt.successful ? 0.12 : -0.1))
      : current.recall,
    production:
      independent && attempt.evidenceKind === "communicative_use"
        ? clamp((current.production ?? 0.15) + (attempt.successful ? 0.1 : -0.06))
        : current.production,
    automaticity: independent
      ? clamp(
          (current.automaticity ?? 0.1) +
            (attempt.successful ? speedGain : -0.04),
        )
      : current.automaticity,
    retrievalLatencyMs: independent && attempt.successful
      ? current.retrievalLatencyMs === null
        ? attempt.latencyMs
        : Math.round(current.retrievalLatencyMs * 0.7 + attempt.latencyMs * 0.3)
      : current.retrievalLatencyMs,
    lastExposureAt: now,
    lastSuccessfulRetrievalAt: independent && attempt.successful
      ? now
      : current.lastSuccessfulRetrievalAt,
    retrievalStrength: independent
      ? clamp(
          (current.retrievalStrength ?? 0.15) +
            (attempt.successful ? 0.12 : -0.08),
        )
      : current.retrievalStrength,
    estimateConfidence: clamp(current.estimateConfidence + (independent ? 0.08 : 0.02)),
    exposureCount: current.exposureCount + 1,
    successfulRetrievalCount:
      current.successfulRetrievalCount + (independent && attempt.successful ? 1 : 0),
    independentRetrievalCount:
      current.independentRetrievalCount + (independent ? 1 : 0),
    delayedIndependentSuccessCount:
      current.delayedIndependentSuccessCount + (delayedSuccess ? 1 : 0),
    lastIndependentRetrievalAt: independent ? now : current.lastIndependentRetrievalAt,
    recallDueAt: schedule.dueAt,
    recallIntervalHours: schedule.intervalHours,
    recallLapses: schedule.lapses,
    algorithmVersion: PROJECTION_VERSION,
  };
}

export function applyDemoRepair(
  current: LearnerConceptState,
): LearnerConceptState {
  return {
    ...current,
    estimateConfidence: clamp(current.estimateConfidence + 0.01),
    exposureCount: current.exposureCount + 1,
    lastExposureAt: new Date().toISOString(),
    algorithmVersion: PROJECTION_VERSION,
  };
}

export function applyDemoListeningAttempt(
  current: LearnerConceptState,
  attempt: ListeningAttemptInput,
): LearnerConceptState {
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const currentAudio = current.recognitionAudio ?? 0.15;
  const assisted = attempt.playbackCount > 1 || attempt.usedSlowPlayback;
  const schedule = scheduleReview({
    assisted,
    elapsedHours: null,
    intervalHours: current.listeningIntervalHours,
    lapses: current.listeningLapses,
    now: nowDate,
    successful: attempt.successful,
  });
  const weight = assisted ? 0.12 : 0.28;

  return {
    ...current,
    recognitionAudio: clamp(currentAudio * (1 - weight) + attempt.score * weight),
    speakerDiversity: clamp(
      (current.speakerDiversity ?? 0.08) +
        (assisted ? 0.02 : 0.05),
    ),
    estimateConfidence: clamp(current.estimateConfidence + 0.07),
    exposureCount: current.exposureCount + 1,
    lastExposureAt: now,
    listeningDueAt: schedule.dueAt,
    listeningIntervalHours: schedule.intervalHours,
    listeningLapses: schedule.lapses,
    algorithmVersion: PROJECTION_VERSION,
  };
}

export function applyDemoReadingAttempt(
  current: LearnerConceptState,
  attempt: ReadingAttemptInput,
): LearnerConceptState {
  const now = new Date().toISOString();
  const currentText = current.recognitionText ?? 0.15;

  return {
    ...current,
    recognitionText: clamp(currentText * 0.7 + attempt.score * 0.3),
    contextDiversity: clamp(
      (current.contextDiversity ?? 0.08) + (attempt.successful ? 0.06 : 0.02),
    ),
    estimateConfidence: clamp(current.estimateConfidence + 0.07),
    exposureCount: current.exposureCount + 1,
    lastExposureAt: now,
    algorithmVersion: PROJECTION_VERSION,
  };
}

export function applyDemoSpeakingAttempt(
  current: LearnerConceptState,
  attempt: SpeakingAttemptInput,
): LearnerConceptState {
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const schedule = scheduleReview({
    assisted: attempt.evidenceKind === "imitation",
    elapsedHours: null,
    intervalHours: current.pronunciationIntervalHours,
    lapses: current.pronunciationLapses,
    now: nowDate,
    successful: attempt.successful,
  });

  return {
    ...current,
    pronunciation: clamp(
      (current.pronunciation ?? 0.12) * 0.7 + attempt.pronunciationScore * 0.3,
    ),
    production:
      attempt.evidenceKind === "communicative_use"
        ? clamp((current.production ?? 0.12) * 0.75 + attempt.completenessScore * 0.25)
        : current.production,
    estimateConfidence: clamp(current.estimateConfidence + 0.09),
    exposureCount: current.exposureCount + 1,
    lastExposureAt: now,
    pronunciationDueAt: schedule.dueAt,
    pronunciationIntervalHours: schedule.intervalHours,
    pronunciationLapses: schedule.lapses,
    algorithmVersion: PROJECTION_VERSION,
  };
}
