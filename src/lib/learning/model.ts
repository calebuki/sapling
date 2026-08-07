import type {
  GrowthStage,
  LearnerConceptState,
  LearningDimension,
  ListeningAttemptInput,
  RetrievalAttemptInput,
  SpeakingAttemptInput,
} from "@/types/learning";

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
    algorithmVersion: 1,
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
    (state.contextDiversity ?? 0) >= 0.55
  ) {
    return "automatic";
  }

  if (
    (state.recall ?? 0) >= 0.58 &&
    (state.production ?? 0) >= 0.45 &&
    Math.max(state.recognitionText ?? 0, state.recognitionAudio ?? 0) >= 0.66 &&
    (state.contextDiversity ?? 0) >= 0.34
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
  const now = new Date().toISOString();
  const speedGain =
    attempt.latencyMs <= 3000 ? 0.12 : attempt.latencyMs <= 7000 ? 0.07 : 0.03;

  return {
    ...current,
    recall: clamp(
      (current.recall ?? 0.2) + (attempt.successful ? 0.16 : -0.08),
    ),
    production: clamp(
      (current.production ?? 0.15) + (attempt.successful ? 0.13 : -0.07),
    ),
    automaticity: clamp(
      (current.automaticity ?? 0.1) +
        (attempt.successful ? speedGain : -0.04),
    ),
    retrievalLatencyMs: attempt.successful
      ? current.retrievalLatencyMs === null
        ? attempt.latencyMs
        : Math.round(current.retrievalLatencyMs * 0.7 + attempt.latencyMs * 0.3)
      : current.retrievalLatencyMs,
    lastExposureAt: now,
    lastSuccessfulRetrievalAt: attempt.successful
      ? now
      : current.lastSuccessfulRetrievalAt,
    retrievalStrength: clamp(
      (current.retrievalStrength ?? 0.15) + (attempt.successful ? 0.14 : -0.06),
    ),
    estimateConfidence: clamp(current.estimateConfidence + 0.08),
    exposureCount: current.exposureCount + 1,
    successfulRetrievalCount:
      current.successfulRetrievalCount + (attempt.successful ? 1 : 0),
    algorithmVersion: 1,
  };
}

export function applyDemoRepair(
  current: LearnerConceptState,
): LearnerConceptState {
  return {
    ...current,
    recall: clamp((current.recall ?? 0.1) + 0.04),
    production: clamp((current.production ?? 0.08) + 0.04),
    retrievalStrength: clamp((current.retrievalStrength ?? 0.1) + 0.03),
    estimateConfidence: clamp(current.estimateConfidence + 0.04),
    exposureCount: current.exposureCount + 1,
    lastExposureAt: new Date().toISOString(),
    algorithmVersion: 1,
  };
}

export function applyDemoListeningAttempt(
  current: LearnerConceptState,
  attempt: ListeningAttemptInput,
): LearnerConceptState {
  const now = new Date().toISOString();
  const currentAudio = current.recognitionAudio ?? 0.15;

  return {
    ...current,
    recognitionAudio: clamp(currentAudio * 0.7 + attempt.score * 0.3),
    speakerDiversity: clamp(
      (current.speakerDiversity ?? 0.08) +
        (attempt.playbackCount <= 2 ? 0.08 : 0.04),
    ),
    estimateConfidence: clamp(current.estimateConfidence + 0.07),
    exposureCount: current.exposureCount + 1,
    lastExposureAt: now,
    algorithmVersion: 1,
  };
}

export function applyDemoSpeakingAttempt(
  current: LearnerConceptState,
  attempt: SpeakingAttemptInput,
): LearnerConceptState {
  const now = new Date().toISOString();

  return {
    ...current,
    production: clamp(
      (current.production ?? 0.12) * 0.7 + attempt.completenessScore * 0.3,
    ),
    pronunciation: clamp(
      (current.pronunciation ?? 0.12) * 0.7 + attempt.pronunciationScore * 0.3,
    ),
    automaticity: clamp(
      (current.automaticity ?? 0.08) * 0.8 + attempt.fluencyScore * 0.2,
    ),
    estimateConfidence: clamp(current.estimateConfidence + 0.09),
    exposureCount: current.exposureCount + 1,
    lastExposureAt: now,
    algorithmVersion: 1,
  };
}
