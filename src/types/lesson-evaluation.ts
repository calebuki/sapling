export type LessonFeedbackArea = "meaning" | "grammar" | "vocabulary";

export type LessonFeedbackTip = {
  area: LessonFeedbackArea;
  message: string;
};

export type LessonEvaluation = {
  successful: boolean;
  meaningScore: number;
  grammarScore: number;
  vocabularyScore: number;
  summary: string;
  correctedDanish: string;
  tips: LessonFeedbackTip[];
  source: "ai" | "fallback";
};

export type DanishSpeechResult = {
  recognizedText: string;
  durationMs: number;
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
