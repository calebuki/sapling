import { createClient } from "@/lib/supabase/client";
import {
  isTargetLanguageCode,
  type TargetLanguageCode,
} from "@/lib/learning/languages";
import type { LearningRepository } from "@/lib/repositories/types";
import type { Database, Json } from "@/types/database";
import type {
  Concept,
  LearnerConceptState,
  ListeningAttemptInput,
  ReadingAttemptInput,
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
    independentRetrievalCount: row.independent_retrieval_count,
    delayedIndependentSuccessCount: row.delayed_independent_success_count,
    lastIndependentRetrievalAt: row.last_independent_retrieval_at,
    recallDueAt: row.recall_due_at,
    listeningDueAt: row.listening_due_at,
    pronunciationDueAt: row.pronunciation_due_at,
    recallIntervalHours: row.recall_interval_hours,
    listeningIntervalHours: row.listening_interval_hours,
    pronunciationIntervalHours: row.pronunciation_interval_hours,
    recallLapses: row.recall_lapses,
    listeningLapses: row.listening_lapses,
    pronunciationLapses: row.pronunciation_lapses,
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
    async getTargetLanguage() {
      const supabase = createClient();
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from("profiles")
        .select("target_language_code")
        .eq("id", userId)
        .single();

      if (error) {
        throw error;
      }

      return isTargetLanguageCode(data.target_language_code)
        ? data.target_language_code
        : "da";
    },
    async setTargetLanguage(languageCode: TargetLanguageCode) {
      const supabase = createClient();
      const userId = await getCurrentUserId();
      const { error } = await supabase
        .from("profiles")
        .update({ target_language_code: languageCode })
        .eq("id", userId);

      if (error) {
        throw error;
      }
    },
    async loadSnapshot(languageCode: TargetLanguageCode) {
      const supabase = createClient();
      const userId = await getCurrentUserId();
      const conceptResult = await supabase
        .from("concepts")
        .select("*")
        .eq("language_code", languageCode)
        .eq("is_active", true)
        .order("sort_order");

      if (conceptResult.error) {
        throw conceptResult.error;
      }

      const conceptIds = conceptResult.data.map((concept) => concept.id);
      const stateResult = conceptIds.length
        ? await supabase
            .from("learner_concept_state")
            .select("*")
            .eq("user_id", userId)
            .in("concept_id", conceptIds)
        : { data: [], error: null };

      if (stateResult.error) {
        throw stateResult.error;
      }

      return {
        concepts: conceptResult.data.map(mapConcept),
        states: stateResult.data.map(mapState),
        mode: "supabase",
      };
    },
    async startSession(input) {
      const supabase = createClient();
      const userId = await getCurrentUserId();
      const { data: session, error: sessionError } = await supabase
        .from("learning_sessions")
        .insert({
          user_id: userId,
          kind: input.kind,
          status: "active",
          planner_version: input.plannerVersion,
          configuration: { itemCount: input.items.length },
        })
        .select("id")
        .single();

      if (sessionError) {
        throw sessionError;
      }

      const { data: items, error: itemError } = await supabase
        .from("session_items")
        .insert(
          input.items.map((item, position) => ({
            user_id: userId,
            session_id: session.id,
            position,
            activity_type: item.activityType,
            primary_concept_id: item.conceptId,
            status: "planned",
            prompt: {
              ...item.prompt,
              targetDimension: item.targetDimension,
            },
          })),
        )
        .select("id, position");

      if (itemError) {
        throw itemError;
      }

      return {
        id: session.id,
        itemIds: [...items]
          .sort((left, right) => left.position - right.position)
          .map((item) => item.id),
      };
    },
    async completeSession(sessionId) {
      if (!sessionId) {
        return;
      }
      const supabase = createClient();
      const userId = await getCurrentUserId();
      const { error } = await supabase
        .from("learning_sessions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", sessionId)
        .eq("user_id", userId);

      if (error) {
        throw error;
      }
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
        p_evidence_kind: input.evidenceKind,
        p_answer_visible: input.answerVisible,
        p_hint_count: input.hintCount,
        p_evaluator_version: input.evaluatorVersion,
        p_scorer_version: input.scorerVersion,
        p_context: input.context as Json,
        p_session_id: input.sessionId,
        p_session_item_id: input.sessionItemId,
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
        p_session_id: input.sessionId,
        p_session_item_id: input.sessionItemId,
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
        p_context_id: input.contextId,
        p_playback_count: input.playbackCount,
        p_used_slow_playback: input.usedSlowPlayback,
        p_task_type: input.taskType,
        p_scorer_version: input.scorerVersion,
        p_context: input.context as Json,
        p_session_id: input.sessionId,
        p_session_item_id: input.sessionItemId,
      });

      if (error) {
        throw error;
      }

      return loadState(input.conceptId, userId);
    },
    async recordReadingAttempt(input: ReadingAttemptInput) {
      const supabase = createClient();
      const userId = await getCurrentUserId();
      const { error } = await supabase.rpc("record_reading_attempt", {
        p_concept_id: input.conceptId,
        p_question_id: input.questionId,
        p_selected_answer: input.selectedAnswer,
        p_expected_answer: input.expectedAnswer,
        p_successful: input.successful,
        p_score: input.score,
        p_latency_ms: input.latencyMs,
        p_scorer_version: input.scorerVersion,
        p_context: input.context as Json,
        p_session_id: input.sessionId,
        p_session_item_id: input.sessionItemId,
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
        p_evidence_kind: input.evidenceKind,
        p_scorer_version: input.scorerVersion,
        p_word_details: input.wordDetails as Json,
        p_context: input.context as Json,
        p_session_id: input.sessionId,
        p_session_item_id: input.sessionItemId,
      });

      if (error) {
        throw error;
      }

      return loadState(input.conceptId, userId);
    },
  };
}
