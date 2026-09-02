export type ConceptKind =
  | "word"
  | "chunk"
  | "construction"
  | "collocation"
  | "phoneme"
  | "phonetic_contrast"
  | "communicative_function"
  | "pragmatic_convention"
  | "listening_phenomenon";

export type LearningDimension =
  | "recognitionText"
  | "recognitionAudio"
  | "recall"
  | "production"
  | "pronunciation"
  | "automaticity"
  | "contextDiversity"
  | "speakerDiversity";

export type EvidenceKind =
  | "exposure"
  | "imitation"
  | "assisted_recall"
  | "independent_recall"
  | "pronunciation"
  | "communicative_use";

export type ReviewDimension =
  | "recall"
  | "recognitionAudio"
  | "recognitionText"
  | "pronunciation"
  | "communicativeUse";

export type GrowthStage =
  | "seed"
  | "sprout"
  | "growing"
  | "established"
  | "automatic";

export interface Concept {
  id: string;
  languageCode: string;
  slug: string;
  kind: ConceptKind;
  canonicalForm: string;
  gloss: string;
  description: string | null;
  sortOrder: number;
}

export interface LearnerConceptState {
  conceptId: string;
  recognitionText: number | null;
  recognitionAudio: number | null;
  recall: number | null;
  production: number | null;
  pronunciation: number | null;
  automaticity: number | null;
  contextDiversity: number | null;
  speakerDiversity: number | null;
  retrievalLatencyMs: number | null;
  lastExposureAt: string | null;
  lastSuccessfulRetrievalAt: string | null;
  retrievalStrength: number | null;
  estimateConfidence: number;
  exposureCount: number;
  successfulRetrievalCount: number;
  independentRetrievalCount: number;
  delayedIndependentSuccessCount: number;
  lastIndependentRetrievalAt: string | null;
  recallDueAt: string | null;
  listeningDueAt: string | null;
  pronunciationDueAt: string | null;
  recallIntervalHours: number;
  listeningIntervalHours: number;
  pronunciationIntervalHours: number;
  recallLapses: number;
  listeningLapses: number;
  pronunciationLapses: number;
  algorithmVersion: number;
}

export interface RetrievalAttemptInput {
  conceptId: string;
  responseText: string;
  expectedResponse: string;
  successful: boolean;
  latencyMs: number;
  evidenceKind: Extract<
    EvidenceKind,
    "exposure" | "imitation" | "assisted_recall" | "independent_recall" | "communicative_use"
  >;
  answerVisible: boolean;
  hintCount: number;
  evaluatorVersion: string;
  scorerVersion: string;
  sessionId?: string | null;
  sessionItemId?: string | null;
  context: Record<string, string | number | boolean | null>;
}

export interface ReadingAttemptInput {
  conceptId: string;
  questionId: string;
  selectedAnswer: string;
  expectedAnswer: string;
  successful: boolean;
  score: number;
  latencyMs: number;
  scorerVersion: string;
  sessionId?: string | null;
  sessionItemId?: string | null;
  context: Record<string, string | number | boolean | null>;
}

export interface RepairInput {
  conceptId: string;
  responseText: string;
  targetText: string;
  sessionId?: string | null;
  sessionItemId?: string | null;
  context: Record<string, string | number | boolean | null>;
}

export interface ListeningAttemptInput {
  conceptId: string;
  successful: boolean;
  score: number;
  latencyMs: number;
  speakerId: string;
  contextId: string;
  playbackCount: number;
  usedSlowPlayback: boolean;
  taskType: "meaning_selection" | "phrase_discrimination" | "prediction" | "ordering" | "heard_selection";
  scorerVersion: string;
  sessionId?: string | null;
  sessionItemId?: string | null;
  context: Record<string, string | number | boolean | null>;
}

export type PronunciationWordDetail = {
  word: string;
  accuracyScore: number;
  errorType: string;
};

export interface SpeakingAttemptInput {
  conceptId: string;
  referenceText: string;
  recognizedText: string;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  pronunciationScore: number;
  successful: boolean;
  evidenceKind: Extract<EvidenceKind, "imitation" | "pronunciation" | "communicative_use">;
  scorerVersion: string;
  sessionId?: string | null;
  sessionItemId?: string | null;
  wordDetails: PronunciationWordDetail[];
  context: Record<string, string | number | boolean | null>;
}

export interface LearningSessionItemInput {
  activityType: "cold_recall" | "listening" | "reading" | "writing" | "speaking" | "repair" | "transfer";
  conceptId: string;
  targetDimension: ReviewDimension;
  prompt: Record<string, string | number | boolean | null>;
}

export interface LearningSessionPlanInput {
  kind: "learn" | "practice";
  plannerVersion: string;
  items: LearningSessionItemInput[];
}

export interface LearningSessionPlan {
  id: string | null;
  itemIds: Array<string | null>;
}

export interface LearningSnapshot {
  concepts: Concept[];
  states: LearnerConceptState[];
  mode: "local" | "supabase";
}
