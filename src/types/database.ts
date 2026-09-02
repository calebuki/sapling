export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type LearnerConceptStateRow = {
  user_id: string;
  concept_id: string;
  recognition_text: number | null;
  recognition_audio: number | null;
  recall: number | null;
  production: number | null;
  pronunciation: number | null;
  automaticity: number | null;
  context_diversity: number | null;
  speaker_diversity: number | null;
  retrieval_latency_ms: number | null;
  last_exposure_at: string | null;
  last_successful_retrieval_at: string | null;
  retrieval_strength: number | null;
  estimate_confidence: number;
  exposure_count: number;
  successful_retrieval_count: number;
  independent_retrieval_count: number;
  delayed_independent_success_count: number;
  last_independent_retrieval_at: string | null;
  recall_due_at: string | null;
  listening_due_at: string | null;
  pronunciation_due_at: string | null;
  recall_interval_hours: number;
  listening_interval_hours: number;
  pronunciation_interval_hours: number;
  recall_lapses: number;
  listening_lapses: number;
  pronunciation_lapses: number;
  algorithm_version: number;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          native_language_code: string;
          target_language_code: string;
          time_zone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          native_language_code?: string;
          target_language_code?: string;
          time_zone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      concepts: {
        Row: {
          id: string;
          language_code: string;
          slug: string;
          kind:
            | "word"
            | "chunk"
            | "construction"
            | "collocation"
            | "phoneme"
            | "phonetic_contrast"
            | "communicative_function"
            | "pragmatic_convention"
            | "listening_phenomenon";
          canonical_form: string;
          gloss: string;
          description: string | null;
          metadata: Json;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          language_code: string;
          slug: string;
          kind: Database["public"]["Tables"]["concepts"]["Row"]["kind"];
          canonical_form: string;
          gloss: string;
          description?: string | null;
          metadata?: Json;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["concepts"]["Insert"]>;
        Relationships: [];
      };
      learner_concept_state: {
        Row: LearnerConceptStateRow;
        Insert: {
          user_id: string;
          concept_id: string;
          recognition_text?: number | null;
          recognition_audio?: number | null;
          recall?: number | null;
          production?: number | null;
          pronunciation?: number | null;
          automaticity?: number | null;
          context_diversity?: number | null;
          speaker_diversity?: number | null;
          retrieval_latency_ms?: number | null;
          last_exposure_at?: string | null;
          last_successful_retrieval_at?: string | null;
          retrieval_strength?: number | null;
          estimate_confidence?: number;
          exposure_count?: number;
          successful_retrieval_count?: number;
          independent_retrieval_count?: number;
          delayed_independent_success_count?: number;
          last_independent_retrieval_at?: string | null;
          recall_due_at?: string | null;
          listening_due_at?: string | null;
          pronunciation_due_at?: string | null;
          recall_interval_hours?: number;
          listening_interval_hours?: number;
          pronunciation_interval_hours?: number;
          recall_lapses?: number;
          listening_lapses?: number;
          pronunciation_lapses?: number;
          algorithm_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["learner_concept_state"]["Insert"]
        >;
        Relationships: [];
      };
      learning_sessions: {
        Row: {
          id: string;
          user_id: string;
          kind: "learn" | "practice" | "ear" | "text";
          status: "planned" | "active" | "completed" | "abandoned";
          planner_version: string | null;
          configuration: Json;
          started_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: "learn" | "practice" | "ear" | "text";
          status?: "planned" | "active" | "completed" | "abandoned";
          planner_version?: string | null;
          configuration?: Json;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["learning_sessions"]["Insert"]>;
        Relationships: [];
      };
      session_items: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          position: number;
          activity_type: string;
          primary_concept_id: string | null;
          status: "planned" | "in_progress" | "completed" | "skipped";
          prompt: Json;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          position: number;
          activity_type: string;
          primary_concept_id?: string | null;
          status?: "planned" | "in_progress" | "completed" | "skipped";
          prompt?: Json;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["session_items"]["Insert"]>;
        Relationships: [];
      };
      learning_events: {
        Row: {
          id: number;
          user_id: string;
          session_id: string | null;
          session_item_id: string | null;
          primary_concept_id: string | null;
          event_type: string;
          modality: string | null;
          outcome: string | null;
          response_latency_ms: number | null;
          context: Json;
          payload: Json;
          schema_version: number;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          session_id?: string | null;
          session_item_id?: string | null;
          primary_concept_id?: string | null;
          event_type: string;
          modality?: string | null;
          outcome?: string | null;
          response_latency_ms?: number | null;
          context?: Json;
          payload?: Json;
          schema_version?: number;
          occurred_at?: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      record_retrieval_attempt: {
        Args: {
          p_concept_id: string;
          p_response_text: string;
          p_expected_response: string;
          p_successful: boolean;
          p_latency_ms: number;
          p_evidence_kind: string;
          p_answer_visible: boolean;
          p_hint_count: number;
          p_evaluator_version: string;
          p_scorer_version: string;
          p_context?: Json;
          p_session_id?: string | null;
          p_session_item_id?: string | null;
        };
        Returns: number;
      };
      record_repair_event: {
        Args: {
          p_concept_id: string;
          p_response_text: string;
          p_target_text: string;
          p_context?: Json;
          p_session_id?: string | null;
          p_session_item_id?: string | null;
        };
        Returns: number;
      };
      record_listening_attempt: {
        Args: {
          p_concept_id: string;
          p_successful: boolean;
          p_score: number;
          p_latency_ms: number;
          p_speaker_id: string;
          p_context_id: string;
          p_playback_count: number;
          p_used_slow_playback: boolean;
          p_task_type: string;
          p_scorer_version: string;
          p_context?: Json;
          p_session_id?: string | null;
          p_session_item_id?: string | null;
        };
        Returns: number;
      };
      record_reading_attempt: {
        Args: {
          p_concept_id: string;
          p_question_id: string;
          p_selected_answer: string;
          p_expected_answer: string;
          p_successful: boolean;
          p_score: number;
          p_latency_ms: number;
          p_scorer_version: string;
          p_context?: Json;
          p_session_id?: string | null;
          p_session_item_id?: string | null;
        };
        Returns: number;
      };
      record_speaking_attempt: {
        Args: {
          p_concept_id: string;
          p_reference_text: string;
          p_recognized_text: string;
          p_accuracy_score: number;
          p_fluency_score: number;
          p_completeness_score: number;
          p_pronunciation_score: number;
          p_successful: boolean;
          p_evidence_kind: string;
          p_scorer_version: string;
          p_word_details?: Json;
          p_context?: Json;
          p_session_id?: string | null;
          p_session_item_id?: string | null;
        };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
