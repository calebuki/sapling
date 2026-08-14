import type { TargetLanguageCode } from "@/lib/learning/languages";

export type PracticeScenarioStyle = "roleplay" | "open_question";

export type PracticeCharacter = {
  id: string;
  name: string;
  description: string;
};

export type PracticeScenario = {
  id: string;
  languageCode: TargetLanguageCode;
  characterId: string;
  title: string;
  setting: string;
  learnerRole: string;
  characterRole: string;
  goal: string;
  openingLine: string;
  openingEnglish: string;
  style: PracticeScenarioStyle;
  requiredConceptSlugs: string[];
  optionalConceptSlugs: string[];
  minimumEncountered: number;
  minimumTurns: number;
  maximumTurns: number;
  starterHints: Array<{ target: string; english: string }>;
  fallbackReplies: Array<{ target: string; english: string }>;
};

export type PracticeRecommendation = {
  scenario: PracticeScenario;
  readiness: number;
  encounteredConceptSlugs: string[];
  scaffolded: boolean;
  reason: string;
};

export type PracticeMessage = {
  id: string;
  role: "learner" | "character";
  text: string;
  englishSupport?: string;
};

export type TranscriptResolution = {
  providerTranscript: string;
  interpretedText: string;
  kind: "unchanged" | "contextual_correction" | "uncertain";
  confidence: number;
  invisibleNote: string | null;
  surfaceAfterSession: boolean;
};

export type PracticeConceptEvidence = {
  conceptSlug: string;
  meaningScore: number;
  productionScore: number;
  automaticityScore: number;
  weight: number;
};

export type LearnerMemoryDraft = {
  key: string;
  label: string;
  value: string;
  category: "identity" | "family" | "work" | "home" | "interest" | "routine" | "preference";
  confidence: number;
};

export type LearnerMemory = LearnerMemoryDraft & {
  id: string;
  languageCode: TargetLanguageCode;
  lastConfirmedAt: string;
};

export type CharacterContinuity = {
  characterId: string;
  languageCode: TargetLanguageCode;
  encounterCount: number;
  lastScenarioId: string | null;
  summary: string | null;
  lastMetAt: string | null;
};

export type PracticeSnapshot = {
  memories: LearnerMemory[];
  continuity: CharacterContinuity[];
  recentScenarioIds: string[];
};

export type PracticeTurnResponse = {
  resolution: TranscriptResolution;
  reply: string;
  englishSupport: string;
  goalProgress: number;
  complete: boolean;
  meaningScore: number;
  grammarScore: number;
  vocabularyScore: number;
  feedback: string;
  evidence: PracticeConceptEvidence[];
  memories: LearnerMemoryDraft[];
  continuityNote: string;
  deviationDetected: boolean;
};

export type PracticeSpeechMetrics = {
  durationMs: number;
  accuracyScore: number | null;
  fluencyScore: number | null;
  completenessScore: number | null;
  pronunciationScore: number | null;
};

export type StartPracticeSessionInput = {
  languageCode: TargetLanguageCode;
  scenarioId: string;
  characterId: string;
  readiness: number;
  encounteredConceptSlugs: string[];
};

export type RecordPracticeTurnInput = {
  sessionId: string;
  languageCode: TargetLanguageCode;
  scenarioId: string;
  characterId: string;
  position: number;
  resolution: TranscriptResolution;
  alternatives: string[];
  replyText: string;
  meaningScore: number;
  grammarScore: number;
  vocabularyScore: number;
  speechMetrics: PracticeSpeechMetrics;
  evidence: PracticeConceptEvidence[];
  memories: LearnerMemoryDraft[];
};

export type CompletePracticeSessionInput = {
  sessionId: string;
  languageCode: TargetLanguageCode;
  scenarioId: string;
  characterId: string;
  turnCount: number;
  goalProgress: number;
  summary: string;
};
