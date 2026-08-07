import { createClient } from "@/lib/supabase/client";
import type { LearningRepository } from "@/lib/repositories/types";
import type { Database, Json } from "@/types/database";
import type {
  Concept,
  LearnerConceptState,
  ListeningAttemptInput,
  RepairInput,
  RetrievalAttemptInput,
  SpeakingAttemptInput,
} from "@/types/learning";

type ConceptRow = Database["public"]["Tables"]["concepts"]["Row"];
type StateRow =
  Database["public"]["Tables"]["learner_concept_state"]["Row"];

function mapConcept(row: ConceptRow): Concept {
  return {
    id: row.id,
    languageCode: row.language_code,
    slug: row.slug,
    kind: row.kind,
    canonicalForm: row.canonical_form,
    gloss: row.gloss,
    description: row.description,
    sortOrder: row.sort_order,
  };
}

function mapState(row: StateRow): LearnerConceptState {
  return {
    conceptId: row.concept_id,
    recognitionText: row.recognition_text,
    recognitionAudio: row.recognition_audio,
    recall: row.recall,
    production: row.production,
    pronunciation: row.pronunciation,
    automaticity: row.automaticity,
    contextDiversity: row.context_diversity,
    speakerDiversity: row.speaker_diversity,
    retrievalLatencyMs: row.retrieval_latency_ms,
    lastExposureAt: row.last_exposure_at,
    lastSuccessfulRetrievalAt: row.last_successful_retrieval_at,
    retrievalStrength: row.retrieval_strength,
    estimateConfidence: row.estimate_confidence,
    exposureCount: row.exposure_count,
    successfulRetrievalCount: row.successful_retrieval_count,
    algorithmVersion: row.algorithm_version,
  };
}

async function getCurrentUserId() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw error ?? new Error("No authenticated learner was found.");
  }

  return data.user.id;
}

async function loadState(conceptId: string, userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("learner_concept_state")
    .select("*")
    .eq("user_id", userId)
    .eq("concept_id", conceptId)
    .single();

  if (error) {
    throw error;
  }

  return mapState(data);
}

export function createSupabaseLearningRepository(): LearningRepository {
  return {
    mode: "supabase",
    async loadSnapshot() {
      const supabase = createClient();
      const userId = await getCurrentUserId();
      const [conceptResult, stateResult] = await Promise.all([
        supabase
          .from("concepts")
          .select("*")
          .eq("language_code", "da")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("learner_concept_state")
          .select("*")
          .eq("user_id", userId),
      ]);

      if (conceptResult.error) {
        throw conceptResult.error;
      }
      if (stateResult.error) {
        throw stateResult.error;
      }

      return {
        concepts: conceptResult.data.map(mapConcept),
        states: stateResult.data.map(mapState),
        mode: "supabase",
      };
    },
    async recordRetrievalAttempt(input: RetrievalAttemptInput) {
      const supabase = createClient();
      const userId = await getCurrentUserId();
      const { error } = await supabase.rpc("record_retrieval_attempt", {
        p_concept_id: input.conceptId,
        p_response_text: input.responseText,
        p_expected_response: input.expectedResponse,
        p_successful: input.successful,
        p_latency_ms: input.latencyMs,
        p_context: input.context as Json,
      });

      if (error) {
        throw error;
      }

      return loadState(input.conceptId, userId);
    },
    async recordRepair(input: RepairInput) {
      const supabase = createClient();
      const userId = await getCurrentUserId();
      const { error } = await supabase.rpc("record_repair_event", {
        p_concept_id: input.conceptId,
        p_response_text: input.responseText,
        p_target_text: input.targetText,
        p_context: input.context as Json,
      });

      if (error) {
        throw error;
      }

      return loadState(input.conceptId, userId);
    },
    async recordListeningAttempt(input: ListeningAttemptInput) {
      const supabase = createClient();
      const userId = await getCurrentUserId();
      const { error } = await supabase.rpc("record_listening_attempt", {
        p_concept_id: input.conceptId,
        p_successful: input.successful,
        p_score: input.score,
        p_latency_ms: input.latencyMs,
        p_speaker_id: input.speakerId,
        p_playback_count: input.playbackCount,
        p_context: input.context as Json,
      });

      if (error) {
        throw error;
      }

      return loadState(input.conceptId, userId);
    },
    async recordSpeakingAttempt(input: SpeakingAttemptInput) {
      const supabase = createClient();
      const userId = await getCurrentUserId();
      const { error } = await supabase.rpc("record_speaking_attempt", {
        p_concept_id: input.conceptId,
        p_reference_text: input.referenceText,
        p_recognized_text: input.recognizedText,
        p_accuracy_score: input.accuracyScore,
        p_fluency_score: input.fluencyScore,
        p_completeness_score: input.completenessScore,
        p_pronunciation_score: input.pronunciationScore,
        p_successful: input.successful,
        p_word_details: input.wordDetails as Json,
        p_context: input.context as Json,
      });

      if (error) {
        throw error;
      }

      return loadState(input.conceptId, userId);
    },
  };
}
