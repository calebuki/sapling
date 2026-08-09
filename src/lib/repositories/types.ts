import type {
  LearningSnapshot,
  LearnerConceptState,
  ListeningAttemptInput,
  RepairInput,
  RetrievalAttemptInput,
  SpeakingAttemptInput,
} from "@/types/learning";
import type { TargetLanguageCode } from "@/lib/learning/languages";

export interface LearningRepository {
  mode: "local" | "supabase";
  getTargetLanguage(): Promise<TargetLanguageCode>;
  setTargetLanguage(languageCode: TargetLanguageCode): Promise<void>;
  loadSnapshot(languageCode: TargetLanguageCode): Promise<LearningSnapshot>;
  recordRetrievalAttempt(
    input: RetrievalAttemptInput,
  ): Promise<LearnerConceptState>;
  recordRepair(input: RepairInput): Promise<LearnerConceptState>;
  recordListeningAttempt(
    input: ListeningAttemptInput,
  ): Promise<LearnerConceptState>;
  recordSpeakingAttempt(input: SpeakingAttemptInput): Promise<LearnerConceptState>;
}
