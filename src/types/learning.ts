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
  algorithmVersion: number;
}

export interface RetrievalAttemptInput {
  conceptId: string;
  responseText: string;
  expectedResponse: string;
  successful: boolean;
  latencyMs: number;
  context: Record<string, string | number | boolean | null>;
}

export interface RepairInput {
  conceptId: string;
  responseText: string;
  targetText: string;
  context: Record<string, string | number | boolean | null>;
}

export interface ListeningAttemptInput {
  conceptId: string;
  successful: boolean;
  score: number;
  latencyMs: number;
  speakerId: string;
  playbackCount: number;
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
  wordDetails: PronunciationWordDetail[];
  context: Record<string, string | number | boolean | null>;
}

export interface LearningSnapshot {
  concepts: Concept[];
  states: LearnerConceptState[];
  mode: "local" | "supabase";
}
