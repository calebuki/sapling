import type {
  LearningSnapshot,
  LearnerConceptState,
  ListeningAttemptInput,
  ReadingAttemptInput,
  RepairInput,
  RetrievalAttemptInput,
  SpeakingAttemptInput,
} from "@/types/learning";

export interface LearningRepository {
  mode: "local" | "supabase";
  loadSnapshot(): Promise<LearningSnapshot>;
  recordRetrievalAttempt(
    input: RetrievalAttemptInput,
  ): Promise<LearnerConceptState>;
  recordRepair(input: RepairInput): Promise<LearnerConceptState>;
  recordListeningAttempt(
    input: ListeningAttemptInput,
  ): Promise<LearnerConceptState>;
  recordReadingAttempt(input: ReadingAttemptInput): Promise<LearnerConceptState>;
  recordSpeakingAttempt(input: SpeakingAttemptInput): Promise<LearnerConceptState>;
}
