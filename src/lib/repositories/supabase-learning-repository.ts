import { createClient } from "@/lib/supabase/client";
import { getPracticeScenarios } from "@/lib/practice/scenarios";
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
  RepairInput,
  RetrievalAttemptInput,
  SpeakingAttemptInput,
} from "@/types/learning";
import type {
  CharacterContinuity,
  LearnerMemory,
  PracticeSnapshot,
  RecordPracticeTurnInput,
} from "@/types/practice";

type ConceptRow = Database["public"]["Tables"]["concepts"]["Row"];
type StateRow = Database["public"]["Tables"]["learner_concept_state"]["Row"];

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

function mapMemory(
  row: Database["public"]["Tables"]["learner_memories"]["Row"],
): LearnerMemory {
  return {
    id: row.id,
    languageCode: isTargetLanguageCode(row.language_code)
      ? row.language_code
      : "da",
    key: row.memory_key,
    label: row.label,
    value: row.value,
    category: row.category,
    confidence: row.confidence,
    lastConfirmedAt: row.last_confirmed_at,
  };
}

function mapContinuity(
  row: Database["public"]["Tables"]["character_continuity"]["Row"],
): CharacterContinuity {
  return {
    characterId: row.character_id,
    languageCode: isTargetLanguageCode(row.language_code)
      ? row.language_code
      : "da",
    encounterCount: row.encounter_count,
    lastScenarioId: row.last_scenario_id,
    summary: row.summary,
    lastMetAt: row.last_met_at,
  };
}

function jsonRecord(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

async function loadPracticeSnapshot(
  userId: string,
  languageCode: TargetLanguageCode,
): Promise<PracticeSnapshot> {
  const supabase = createClient();
  const [memoryResult, continuityResult, sessionResult, completedResults] =
    await Promise.all([
      supabase
        .from("learner_memories")
        .select("*")
        .eq("user_id", userId)
        .eq("language_code", languageCode)
        .order("last_confirmed_at", { ascending: false }),
      supabase
        .from("character_continuity")
        .select("*")
        .eq("user_id", userId)
        .eq("language_code", languageCode)
        .order("last_met_at", { ascending: false }),
      supabase
        .from("learning_sessions")
        .select("configuration")
        .eq("user_id", userId)
        .eq("kind", "practice")
        .eq("status", "completed")
        .eq("configuration->>language_code", languageCode)
        .order("completed_at", { ascending: false })
        .limit(6),
      Promise.all(
        getPracticeScenarios(languageCode).map((scenario) =>
          supabase
            .from("learning_sessions")
            .select("id")
            .eq("user_id", userId)
            .eq("kind", "practice")
            .eq("status", "completed")
            .eq("configuration->>language_code", languageCode)
            .eq("configuration->>scenario_id", scenario.id)
            .gte("configuration->goal_progress", 1)
            .gte("configuration->turn_count", scenario.minimumTurns)
            .limit(1)
            .then((result) => ({ ...result, scenarioId: scenario.id })),
        ),
      ),
    ]);

  const error =
    memoryResult.error ??
    continuityResult.error ??
    sessionResult.error ??
    completedResults.find((result) => result.error)?.error;
  if (error) {
    throw error;
  }

  return {
    memories: (memoryResult.data ?? []).map(mapMemory),
    completedScenarioIds: completedResults
      .filter((result) => result.data?.length)
      .map((result) => result.scenarioId),
    continuity: (continuityResult.data ?? []).map(mapContinuity),
    recentScenarioIds: (sessionResult.data ?? []).flatMap(
      ({ configuration }) => {
        const scenarioId = jsonRecord(configuration).scenario_id;
        return typeof scenarioId === "string" ? [scenarioId] : [];
      },
    ),
  };
}

async function loadPracticeStates(
  userId: string,
  input: RecordPracticeTurnInput,
) {
  if (input.evidence.length === 0) {
    return [];
  }
  const supabase = createClient();
  const conceptResult = await supabase
    .from("concepts")
    .select("id")
    .eq("language_code", input.languageCode)
    .in(
      "slug",
      input.evidence.map((evidence) => evidence.conceptSlug),
    );
  if (conceptResult.error) {
    throw conceptResult.error;
  }
  const conceptIds = conceptResult.data.map(({ id }) => id);
  if (conceptIds.length === 0) {
    return [];
  }
  const stateResult = await supabase
    .from("learner_concept_state")
    .select("*")
    .eq("user_id", userId)
    .in("concept_id", conceptIds);
  if (stateResult.error) {
    throw stateResult.error;
  }
  return stateResult.data.map(mapState);
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
    async loadPracticeSnapshot(languageCode) {
      return loadPracticeSnapshot(await getCurrentUserId(), languageCode);
    },
    async startPracticeSession(input) {
      const supabase = createClient();
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from("learning_sessions")
        .insert({
          user_id: userId,
          kind: "practice",
          status: "active",
          planner_version: "practice-v1",
          configuration: {
            language_code: input.languageCode,
            scenario_id: input.scenarioId,
            character_id: input.characterId,
            readiness: input.readiness,
            encountered_concept_slugs: input.encounteredConceptSlugs,
          },
        })
        .select("id")
        .single();
      if (error) {
        throw error;
      }
      return data.id;
    },
    async recordPracticeTurn(input) {
      const supabase = createClient();
      const userId = await getCurrentUserId();
      const memoryRows = input.memories.map((memory) => ({
        user_id: userId,
        language_code: input.languageCode,
        memory_key: memory.key,
        label: memory.label,
        value: memory.value,
        category: memory.category,
        confidence: memory.confidence,
        source: "practice_conversation" as const,
        last_confirmed_at: new Date().toISOString(),
      }));
      const [turnResult, memoryResult] = await Promise.all([
        supabase.rpc("record_practice_turn", {
          p_session_id: input.sessionId,
          p_position: input.position,
          p_scenario_id: input.scenarioId,
          p_character_id: input.characterId,
          p_language_code: input.languageCode,
          p_provider_transcript: input.resolution.providerTranscript,
          p_resolved_text: input.resolution.interpretedText,
          p_alternatives: input.alternatives as Json,
          p_resolution_kind: input.resolution.kind,
          p_resolution_confidence: input.resolution.confidence,
          p_invisible_note: input.resolution.invisibleNote,
          p_surface_after_session: input.resolution.surfaceAfterSession,
          p_reply_text: input.replyText,
          p_meaning_score: input.meaningScore,
          p_grammar_score: input.grammarScore,
          p_vocabulary_score: input.vocabularyScore,
          p_speech_metrics: input.speechMetrics as unknown as Json,
          p_evidence: input.evidence as unknown as Json,
        }),
        memoryRows.length > 0
          ? supabase.from("learner_memories").upsert(memoryRows, {
              onConflict: "user_id,language_code,memory_key",
            })
          : Promise.resolve({ error: null }),
      ]);
      const error = turnResult.error ?? memoryResult.error;
      if (error) {
        throw error;
      }
      return loadPracticeStates(userId, input);
    },
    async completePracticeSession(input) {
      const supabase = createClient();
      const userId = await getCurrentUserId();
      const continuityResult = await supabase
        .from("character_continuity")
        .select("encounter_count")
        .eq("user_id", userId)
        .eq("language_code", input.languageCode)
        .eq("character_id", input.characterId)
        .maybeSingle();
      if (continuityResult.error) {
        throw continuityResult.error;
      }
      const completedAt = new Date().toISOString();
      const [sessionResult, upsertResult] = await Promise.all([
        supabase
          .from("learning_sessions")
          .update({
            status: "completed",
            completed_at: completedAt,
            configuration: {
              language_code: input.languageCode,
              scenario_id: input.scenarioId,
              character_id: input.characterId,
              turn_count: input.turnCount,
              goal_progress: input.goalProgress,
              summary: input.summary,
            },
          })
          .eq("id", input.sessionId)
          .eq("user_id", userId),
        supabase.from("character_continuity").upsert(
          {
            user_id: userId,
            language_code: input.languageCode,
            character_id: input.characterId,
            encounter_count: (continuityResult.data?.encounter_count ?? 0) + 1,
            last_scenario_id: input.scenarioId,
            summary: input.summary,
            last_met_at: completedAt,
          },
          { onConflict: "user_id,language_code,character_id" },
        ),
      ]);
      const error = sessionResult.error ?? upsertResult.error;
      if (error) {
        throw error;
      }
      return loadPracticeSnapshot(userId, input.languageCode);
    },
    async deleteLearnerMemory(languageCode, memoryId) {
      const supabase = createClient();
      const userId = await getCurrentUserId();
      const { error } = await supabase
        .from("learner_memories")
        .delete()
        .eq("id", memoryId)
        .eq("user_id", userId);
      if (error) {
        throw error;
      }
      return loadPracticeSnapshot(userId, languageCode);
    },
  };
}
