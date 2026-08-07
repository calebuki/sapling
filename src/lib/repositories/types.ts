import type {
  LearningSnapshot,
  LearnerConceptState,
  RepairInput,
  RetrievalAttemptInput,
} from "@/types/learning";

export interface LearningRepository {
  mode: "local" | "supabase";
  loadSnapshot(): Promise<LearningSnapshot>;
  recordRetrievalAttempt(
    input: RetrievalAttemptInput,
  ): Promise<LearnerConceptState>;
  recordRepair(input: RepairInput): Promise<LearnerConceptState>;
}

