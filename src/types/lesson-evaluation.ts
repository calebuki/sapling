export type LessonFeedbackArea = "meaning" | "grammar" | "vocabulary";

export type LessonFeedbackTip = {
  area: LessonFeedbackArea;
  message: string;
};

export type LessonEvaluation = {
  meaningScore: number;
  grammarScore: number;
  vocabularyScore: number;
  summary: string;
  correctedTargetText: string;
  tips: LessonFeedbackTip[];
  source: "ai" | "deterministic";
  evaluatorVersion: string;
};

export type TargetSpeechResult = {
  recognizedText: string;
  alternatives: string[];
  durationMs: number;
  responseStartLatencyMs: number;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  pronunciationScore: number;
  wordDetails: Array<{
    word: string;
    accuracyScore: number;
    errorType: string;
  }>;
  successful: boolean;
};
