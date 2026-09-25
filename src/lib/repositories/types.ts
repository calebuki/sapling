import type {
  LearningSnapshot,
  LearningSessionPlan,
  LearningSessionPlanInput,
  LearnerConceptState,
  ListeningAttemptInput,
  ReadingAttemptInput,
  RepairInput,
  RetrievalAttemptInput,
  SpeakingAttemptInput,
} from "@/types/learning";
import type { TargetLanguageCode } from "@/lib/learning/languages";
import type { Observation } from "@/lib/learning/adaptive";
import type {
  CompletePracticeSessionInput,
  PracticeSnapshot,
  RecordPracticeTurnInput,
  StartPracticeSessionInput,
} from "@/types/practice";

export interface LearningRepository {
  recordObservation(input: Observation): Promise<LearnerConceptState>;
  mode: "local" | "supabase";
  getTargetLanguage(): Promise<TargetLanguageCode>;
  setTargetLanguage(languageCode: TargetLanguageCode): Promise<void>;
  loadSnapshot(languageCode: TargetLanguageCode): Promise<LearningSnapshot>;
  startSession(input: LearningSessionPlanInput): Promise<LearningSessionPlan>;
  completeSession(sessionId: string | null): Promise<void>;
  recordRetrievalAttempt(
    input: RetrievalAttemptInput,
  ): Promise<LearnerConceptState>;
  recordRepair(input: RepairInput): Promise<LearnerConceptState>;
  recordListeningAttempt(
    input: ListeningAttemptInput,
  ): Promise<LearnerConceptState>;
  recordReadingAttempt(input: ReadingAttemptInput): Promise<LearnerConceptState>;
  recordSpeakingAttempt(input: SpeakingAttemptInput): Promise<LearnerConceptState>;
  loadPracticeSnapshot(
    languageCode: TargetLanguageCode,
  ): Promise<PracticeSnapshot>;
  startPracticeSession(input: StartPracticeSessionInput): Promise<string>;
  recordPracticeTurn(
    input: RecordPracticeTurnInput,
  ): Promise<LearnerConceptState[]>;
  completePracticeSession(
    input: CompletePracticeSessionInput,
  ): Promise<PracticeSnapshot>;
  deleteLearnerMemory(
    languageCode: TargetLanguageCode,
    memoryId: string,
  ): Promise<PracticeSnapshot>;
}
