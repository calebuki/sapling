alter table public.learning_sessions
  drop constraint if exists learning_sessions_kind_check;

alter table public.learning_sessions
  add constraint learning_sessions_kind_check
  check (kind in ('learn', 'practice', 'ear', 'text'));

alter table public.learner_concept_state
  add column independent_retrieval_count integer not null default 0
    check (independent_retrieval_count >= 0),
  add column delayed_independent_success_count integer not null default 0
    check (delayed_independent_success_count >= 0),
  add column last_independent_retrieval_at timestamptz,
  add column recall_due_at timestamptz,
  add column listening_due_at timestamptz,
  add column pronunciation_due_at timestamptz,
  add column recall_interval_hours real not null default 0
    check (recall_interval_hours >= 0),
  add column listening_interval_hours real not null default 0
    check (listening_interval_hours >= 0),
  add column pronunciation_interval_hours real not null default 0
    check (pronunciation_interval_hours >= 0),
  add column recall_lapses integer not null default 0 check (recall_lapses >= 0),
  add column listening_lapses integer not null default 0 check (listening_lapses >= 0),
  add column pronunciation_lapses integer not null default 0 check (pronunciation_lapses >= 0);

alter table public.retrieval_attempts
  add column evidence_kind text not null default 'legacy_unclassified',
  add column answer_visible boolean not null default true,
  add column evaluator_version text not null default 'legacy-v1',
  add column scorer_version text not null default 'legacy-v1';

alter table public.retrieval_attempts
  rename column self_assessed_success to successful;

alter table public.retrieval_attempts
  add constraint retrieval_attempts_evidence_kind_check
  check (
    evidence_kind in (
      'legacy_unclassified',
      'exposure',
      'imitation',
      'assisted_recall',
      'independent_recall',
      'communicative_use'
    )
  );

create table public.listening_attempts (
  event_id bigint primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  concept_id uuid not null references public.concepts (id) on delete restrict,
  context_id text not null check (length(trim(context_id)) between 1 and 160),
  speaker_id text not null check (length(trim(speaker_id)) between 1 and 160),
  task_type text not null check (
    task_type in (
      'meaning_selection',
      'phrase_discrimination',
      'prediction',
      'ordering',
      'heard_selection'
    )
  ),
  successful boolean not null,
  score real not null check (score between 0 and 1),
  response_start_latency_ms integer not null check (response_start_latency_ms >= 0),
  playback_count integer not null check (playback_count > 0),
  used_slow_playback boolean not null default false,
  scorer_version text not null,
  created_at timestamptz not null default now(),
  foreign key (event_id, user_id)
    references public.learning_events (id, user_id)
    on delete cascade
);

create index learner_concept_state_recall_due_idx
  on public.learner_concept_state (user_id, recall_due_at)
  where recall_due_at is not null;
create index learner_concept_state_listening_due_idx
  on public.learner_concept_state (user_id, listening_due_at)
  where listening_due_at is not null;
create index learner_concept_state_pronunciation_due_idx
  on public.learner_concept_state (user_id, pronunciation_due_at)
  where pronunciation_due_at is not null;
create index listening_attempts_user_created_idx
  on public.listening_attempts (user_id, created_at desc);
create index listening_attempts_concept_speaker_idx
  on public.listening_attempts (user_id, concept_id, speaker_id);
create index listening_attempts_concept_context_idx
  on public.listening_attempts (user_id, concept_id, context_id);

alter table public.listening_attempts enable row level security;

create policy listening_attempts_select_own
on public.listening_attempts
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy listening_attempts_insert_own
on public.listening_attempts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

revoke all on table public.listening_attempts from public, anon, authenticated;
grant select, insert on table public.listening_attempts to authenticated;

create function public.record_retrieval_attempt(
  p_concept_id uuid,
  p_response_text text,
  p_expected_response text,
  p_successful boolean,
  p_latency_ms integer,
  p_evidence_kind text,
  p_answer_visible boolean,
  p_hint_count integer,
  p_evaluator_version text,
  p_scorer_version text,
  p_context jsonb default '{}'::jsonb,
  p_session_id uuid default null,
  p_session_item_id uuid default null
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_event_id bigint;
  v_error_event_id bigint;
  v_now timestamptz := now();
  v_independent boolean;
  v_delayed_success boolean := false;
  v_last_independent timestamptz;
  v_previous_interval real := 0;
  v_previous_lapses integer := 0;
  v_elapsed_hours real;
  v_next_interval real;
  v_next_lapses integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_latency_ms < 0 then raise exception 'Latency must be non-negative'; end if;
  if p_hint_count < 0 then raise exception 'Hint count must be non-negative'; end if;
  if p_evidence_kind not in (
    'exposure', 'imitation', 'assisted_recall', 'independent_recall', 'communicative_use'
  ) then raise exception 'Evidence kind is invalid'; end if;
  if length(trim(p_evaluator_version)) = 0 or length(trim(p_scorer_version)) = 0 then
    raise exception 'Evaluator and scorer versions are required';
  end if;
  if jsonb_typeof(coalesce(p_context, '{}'::jsonb)) <> 'object' then
    raise exception 'Context must be a JSON object';
  end if;

  v_independent := p_evidence_kind in ('independent_recall', 'communicative_use')
    and not p_answer_visible and p_hint_count = 0;

  select
    last_independent_retrieval_at,
    recall_interval_hours,
    recall_lapses
  into v_last_independent, v_previous_interval, v_previous_lapses
  from public.learner_concept_state
  where user_id = v_user_id and concept_id = p_concept_id;

  v_previous_interval := coalesce(v_previous_interval, 0);
  v_previous_lapses := coalesce(v_previous_lapses, 0);
  v_elapsed_hours := case
    when v_last_independent is null then null
    else greatest(0, extract(epoch from (v_now - v_last_independent)) / 3600.0)
  end;
  v_delayed_success := v_independent and p_successful
    and v_last_independent is not null
    and v_now - v_last_independent >= interval '6 hours';

  if not p_successful then
    v_next_interval := 10.0 / 60.0;
    v_next_lapses := v_previous_lapses + 1;
  elsif not v_independent then
    v_next_interval := least(greatest(v_previous_interval, 1), 4);
    v_next_lapses := v_previous_lapses;
  elsif v_previous_interval <= 0 then
    v_next_interval := 8;
    v_next_lapses := v_previous_lapses;
  else
    v_next_interval := least(
      2160,
      greatest(
        8,
        v_previous_interval * 2
          * least(1.35, greatest(0.8, coalesce(v_elapsed_hours, v_previous_interval) / greatest(1, v_previous_interval)))
          * greatest(0.55, 1 - v_previous_lapses * 0.08)
      )
    );
    v_next_lapses := v_previous_lapses;
  end if;

  insert into public.learning_events (
    user_id, session_id, session_item_id, primary_concept_id, event_type,
    modality, outcome, response_latency_ms, context, payload, schema_version,
    occurred_at
  ) values (
    v_user_id, p_session_id, p_session_item_id, p_concept_id,
    'retrieval_attempt',
    case when p_evidence_kind = 'communicative_use' then 'mixed' else 'text' end,
    case when p_successful then 'success' else 'failure' end,
    p_latency_ms,
    coalesce(p_context, '{}'::jsonb),
    jsonb_build_object(
      'evidence_kind', p_evidence_kind,
      'answer_visible', p_answer_visible,
      'hint_count', p_hint_count,
      'independent', v_independent,
      'evaluator_version', p_evaluator_version,
      'scorer_version', p_scorer_version,
      'projection_algorithm_version', 2,
      'scheduler_version', 'adaptive-review-v1'
    ),
    2,
    v_now
  ) returning id into v_event_id;

  insert into public.retrieval_attempts (
    event_id, user_id, concept_id, response_text, expected_response,
    successful, score, latency_ms, hints_used, evidence_kind,
    answer_visible, evaluator_version, scorer_version
  ) values (
    v_event_id, v_user_id, p_concept_id, p_response_text, p_expected_response,
    p_successful, case when p_successful then 1 else 0 end, p_latency_ms,
    p_hint_count, p_evidence_kind, p_answer_visible, p_evaluator_version,
    p_scorer_version
  );

  if not p_successful then
    insert into public.learning_events (
      user_id, session_id, session_item_id, primary_concept_id, event_type,
      modality, outcome, context, payload, schema_version, occurred_at
    ) values (
      v_user_id, p_session_id, p_session_item_id, p_concept_id, 'error',
      'text', 'failure', coalesce(p_context, '{}'::jsonb),
      jsonb_build_object('source_event_id', v_event_id), 2, v_now
    ) returning id into v_error_event_id;

    insert into public.errors (
      user_id, event_id, concept_id, category, observed_form, target_form, details
    ) values (
      v_user_id, v_error_event_id, p_concept_id, 'retrieval_mismatch',
      p_response_text, p_expected_response,
      jsonb_build_object('retrieval_event_id', v_event_id, 'evidence_kind', p_evidence_kind)
    );
  end if;

  insert into public.learner_concept_state (
    user_id, concept_id, recall, production, automaticity,
    retrieval_latency_ms, last_exposure_at, last_successful_retrieval_at,
    retrieval_strength, estimate_confidence, exposure_count,
    successful_retrieval_count, independent_retrieval_count,
    delayed_independent_success_count, last_independent_retrieval_at,
    recall_due_at, recall_interval_hours, recall_lapses, algorithm_version
  ) values (
    v_user_id,
    p_concept_id,
    case when v_independent then case when p_successful then 0.30 else 0.10 end else null end,
    case when v_independent and p_evidence_kind = 'communicative_use'
      then case when p_successful then 0.25 else 0.08 end else null end,
    case
      when v_independent and p_successful and p_latency_ms <= 3000 then 0.28
      when v_independent and p_successful and p_latency_ms <= 7000 then 0.20
      when v_independent and p_successful then 0.14
      when v_independent then 0.05
      else null
    end,
    case when v_independent and p_successful then p_latency_ms else null end,
    v_now,
    case when v_independent and p_successful then v_now else null end,
    case when v_independent then case when p_successful then 0.28 else 0.10 end else null end,
    case when v_independent then 0.10 else 0.02 end,
    1,
    case when v_independent and p_successful then 1 else 0 end,
    case when v_independent then 1 else 0 end,
    case when v_delayed_success then 1 else 0 end,
    case when v_independent then v_now else null end,
    v_now + v_next_interval * interval '1 hour',
    v_next_interval,
    v_next_lapses,
    2
  )
  on conflict (user_id, concept_id) do update set
    recall = case
      when v_independent then least(1.0, greatest(0.0,
        coalesce(public.learner_concept_state.recall, 0.20)
          + case when p_successful then 0.12 else -0.10 end))
      else public.learner_concept_state.recall
    end,
    production = case
      when v_independent and p_evidence_kind = 'communicative_use' then
        least(1.0, greatest(0.0,
          coalesce(public.learner_concept_state.production, 0.15)
            + case when p_successful then 0.10 else -0.06 end))
      else public.learner_concept_state.production
    end,
    automaticity = case
      when v_independent then least(1.0, greatest(0.0,
        coalesce(public.learner_concept_state.automaticity, 0.10)
          + case
              when not p_successful then -0.04
              when p_latency_ms <= 3000 then 0.12
              when p_latency_ms <= 7000 then 0.07
              else 0.03
            end))
      else public.learner_concept_state.automaticity
    end,
    retrieval_latency_ms = case
      when v_independent and p_successful then
        case when public.learner_concept_state.retrieval_latency_ms is null
          then p_latency_ms
          else round(public.learner_concept_state.retrieval_latency_ms * 0.7 + p_latency_ms * 0.3)::integer
        end
      else public.learner_concept_state.retrieval_latency_ms
    end,
    last_exposure_at = v_now,
    last_successful_retrieval_at = case
      when v_independent and p_successful then v_now
      else public.learner_concept_state.last_successful_retrieval_at
    end,
    retrieval_strength = case
      when v_independent then least(1.0, greatest(0.0,
        coalesce(public.learner_concept_state.retrieval_strength, 0.15)
          + case when p_successful then 0.12 else -0.08 end))
      else public.learner_concept_state.retrieval_strength
    end,
    estimate_confidence = least(1.0,
      public.learner_concept_state.estimate_confidence + case when v_independent then 0.08 else 0.02 end),
    exposure_count = public.learner_concept_state.exposure_count + 1,
    successful_retrieval_count = public.learner_concept_state.successful_retrieval_count
      + case when v_independent and p_successful then 1 else 0 end,
    independent_retrieval_count = public.learner_concept_state.independent_retrieval_count
      + case when v_independent then 1 else 0 end,
    delayed_independent_success_count = public.learner_concept_state.delayed_independent_success_count
      + case when v_delayed_success then 1 else 0 end,
    last_independent_retrieval_at = case
      when v_independent then v_now
      else public.learner_concept_state.last_independent_retrieval_at
    end,
    recall_due_at = v_now + v_next_interval * interval '1 hour',
    recall_interval_hours = v_next_interval,
    recall_lapses = v_next_lapses,
    algorithm_version = 2;

  if p_session_item_id is not null then
    update public.session_items set status = 'completed', completed_at = v_now
    where id = p_session_item_id and user_id = v_user_id;
  end if;

  return v_event_id;
end;
$$;

revoke all on function public.record_retrieval_attempt(
  uuid, text, text, boolean, integer, text, boolean, integer, text, text, jsonb, uuid, uuid
) from public, anon;
grant execute on function public.record_retrieval_attempt(
  uuid, text, text, boolean, integer, text, boolean, integer, text, text, jsonb, uuid, uuid
) to authenticated;

create or replace function public.record_retrieval_attempt(
  p_concept_id uuid,
  p_response_text text,
  p_expected_response text,
  p_successful boolean,
  p_latency_ms integer,
  p_context jsonb default '{}'::jsonb,
  p_session_id uuid default null,
  p_session_item_id uuid default null
)
returns bigint
language sql
security invoker
set search_path = ''
as $$
  select public.record_retrieval_attempt(
    p_concept_id,
    p_response_text,
    p_expected_response,
    p_successful,
    p_latency_ms,
    'assisted_recall',
    true,
    1,
    'legacy-client-v1',
    'legacy-client-v1',
    p_context,
    p_session_id,
    p_session_item_id
  );
$$;

revoke all on function public.record_retrieval_attempt(
  uuid, text, text, boolean, integer, jsonb, uuid, uuid
) from public, anon;
grant execute on function public.record_retrieval_attempt(
  uuid, text, text, boolean, integer, jsonb, uuid, uuid
) to authenticated;

create or replace function public.record_repair_event(
  p_concept_id uuid,
  p_response_text text,
  p_target_text text,
  p_context jsonb default '{}'::jsonb,
  p_session_id uuid default null,
  p_session_item_id uuid default null
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_event_id bigint;
  v_now timestamptz := now();
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(coalesce(p_context, '{}'::jsonb)) <> 'object' then
    raise exception 'Context must be a JSON object';
  end if;

  insert into public.learning_events (
    user_id, session_id, session_item_id, primary_concept_id, event_type,
    modality, outcome, context, payload, schema_version, occurred_at
  ) values (
    v_user_id, p_session_id, p_session_item_id, p_concept_id, 'repair',
    'text', 'partial', coalesce(p_context, '{}'::jsonb),
    jsonb_build_object(
      'response_text', p_response_text,
      'target_text', p_target_text,
      'evidence_kind', 'imitation',
      'projection_algorithm_version', 2
    ),
    2,
    v_now
  ) returning id into v_event_id;

  insert into public.learner_concept_state (
    user_id, concept_id, last_exposure_at, estimate_confidence,
    exposure_count, algorithm_version
  ) values (
    v_user_id, p_concept_id, v_now, 0.01, 1, 2
  ) on conflict (user_id, concept_id) do update set
    last_exposure_at = v_now,
    estimate_confidence = least(1.0, public.learner_concept_state.estimate_confidence + 0.01),
    exposure_count = public.learner_concept_state.exposure_count + 1,
    algorithm_version = 2;

  if p_session_item_id is not null then
    update public.session_items set status = 'completed', completed_at = v_now
    where id = p_session_item_id and user_id = v_user_id;
  end if;

  return v_event_id;
end;
$$;

create function public.record_listening_attempt(
  p_concept_id uuid,
  p_successful boolean,
  p_score real,
  p_latency_ms integer,
  p_speaker_id text,
  p_context_id text,
  p_playback_count integer,
  p_used_slow_playback boolean,
  p_task_type text,
  p_scorer_version text,
  p_context jsonb default '{}'::jsonb,
  p_session_id uuid default null,
  p_session_item_id uuid default null
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_event_id bigint;
  v_now timestamptz := now();
  v_assisted boolean := p_playback_count > 1 or p_used_slow_playback;
  v_previous_interval real := 0;
  v_previous_lapses integer := 0;
  v_next_interval real;
  v_next_lapses integer;
  v_weight real;
  v_unique_speakers integer;
  v_unique_contexts integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_score < 0 or p_score > 1 then raise exception 'Score must be between zero and one'; end if;
  if p_latency_ms < 0 then raise exception 'Latency must be non-negative'; end if;
  if p_playback_count < 1 then raise exception 'Playback count must be positive'; end if;
  if length(trim(p_speaker_id)) = 0 or length(trim(p_context_id)) = 0 then
    raise exception 'Speaker and context identifiers are required';
  end if;
  if p_task_type not in (
    'meaning_selection', 'phrase_discrimination', 'prediction', 'ordering', 'heard_selection'
  ) then raise exception 'Listening task type is invalid'; end if;
  if length(trim(p_scorer_version)) = 0 then raise exception 'Scorer version is required'; end if;
  if jsonb_typeof(coalesce(p_context, '{}'::jsonb)) <> 'object' then
    raise exception 'Context must be a JSON object';
  end if;

  select listening_interval_hours, listening_lapses
  into v_previous_interval, v_previous_lapses
  from public.learner_concept_state
  where user_id = v_user_id and concept_id = p_concept_id;
  v_previous_interval := coalesce(v_previous_interval, 0);
  v_previous_lapses := coalesce(v_previous_lapses, 0);

  if not p_successful then
    v_next_interval := 10.0 / 60.0;
    v_next_lapses := v_previous_lapses + 1;
  elsif v_assisted then
    v_next_interval := least(greatest(v_previous_interval, 1), 4);
    v_next_lapses := v_previous_lapses;
  elsif v_previous_interval <= 0 then
    v_next_interval := 8;
    v_next_lapses := v_previous_lapses;
  else
    v_next_interval := least(2160, greatest(8, v_previous_interval * 2 * greatest(0.55, 1 - v_previous_lapses * 0.08)));
    v_next_lapses := v_previous_lapses;
  end if;
  v_weight := case when v_assisted then 0.12 else 0.28 end;

  insert into public.learning_events (
    user_id, session_id, session_item_id, primary_concept_id, event_type,
    modality, outcome, response_latency_ms, context, payload, schema_version,
    occurred_at
  ) values (
    v_user_id, p_session_id, p_session_item_id, p_concept_id,
    'listening_attempt', 'audio',
    case when p_successful then 'success' else 'failure' end,
    p_latency_ms,
    coalesce(p_context, '{}'::jsonb),
    jsonb_build_object(
      'score', p_score,
      'speaker_id', p_speaker_id,
      'context_id', p_context_id,
      'playback_count', p_playback_count,
      'used_slow_playback', p_used_slow_playback,
      'assisted', v_assisted,
      'task_type', p_task_type,
      'scorer_version', p_scorer_version,
      'projection_algorithm_version', 2,
      'scheduler_version', 'adaptive-review-v1'
    ),
    2,
    v_now
  ) returning id into v_event_id;

  insert into public.listening_attempts (
    event_id, user_id, concept_id, context_id, speaker_id, task_type,
    successful, score, response_start_latency_ms, playback_count,
    used_slow_playback, scorer_version
  ) values (
    v_event_id, v_user_id, p_concept_id, p_context_id, p_speaker_id,
    p_task_type, p_successful, p_score, p_latency_ms, p_playback_count,
    p_used_slow_playback, p_scorer_version
  );

  select count(distinct speaker_id), count(distinct context_id)
  into v_unique_speakers, v_unique_contexts
  from public.listening_attempts
  where user_id = v_user_id and concept_id = p_concept_id;

  insert into public.learner_concept_state (
    user_id, concept_id, recognition_audio, context_diversity,
    speaker_diversity, last_exposure_at, estimate_confidence, exposure_count,
    listening_due_at, listening_interval_hours, listening_lapses,
    algorithm_version
  ) values (
    v_user_id, p_concept_id,
    least(1.0, 0.15 * (1 - v_weight) + p_score * v_weight),
    least(1.0, v_unique_contexts / 5.0),
    least(1.0, v_unique_speakers / 4.0),
    v_now, case when v_assisted then 0.04 else 0.08 end, 1,
    v_now + v_next_interval * interval '1 hour',
    v_next_interval, v_next_lapses, 2
  ) on conflict (user_id, concept_id) do update set
    recognition_audio = least(1.0,
      coalesce(public.learner_concept_state.recognition_audio, 0.15) * (1 - v_weight)
        + p_score * v_weight),
    context_diversity = least(1.0, v_unique_contexts / 5.0),
    speaker_diversity = least(1.0, v_unique_speakers / 4.0),
    last_exposure_at = v_now,
    estimate_confidence = least(1.0,
      public.learner_concept_state.estimate_confidence + case when v_assisted then 0.04 else 0.08 end),
    exposure_count = public.learner_concept_state.exposure_count + 1,
    listening_due_at = v_now + v_next_interval * interval '1 hour',
    listening_interval_hours = v_next_interval,
    listening_lapses = v_next_lapses,
    algorithm_version = 2;

  if p_session_item_id is not null then
    update public.session_items set status = 'completed', completed_at = v_now
    where id = p_session_item_id and user_id = v_user_id;
  end if;

  return v_event_id;
end;
$$;

revoke all on function public.record_listening_attempt(
  uuid, boolean, real, integer, text, text, integer, boolean, text, text, jsonb, uuid, uuid
) from public, anon;
grant execute on function public.record_listening_attempt(
  uuid, boolean, real, integer, text, text, integer, boolean, text, text, jsonb, uuid, uuid
) to authenticated;

create or replace function public.record_listening_attempt(
  p_concept_id uuid,
  p_successful boolean,
  p_score real,
  p_latency_ms integer,
  p_speaker_id text,
  p_playback_count integer,
  p_context jsonb default '{}'::jsonb
)
returns bigint
language sql
security invoker
set search_path = ''
as $$
  select public.record_listening_attempt(
    p_concept_id,
    p_successful,
    p_score,
    p_latency_ms,
    p_speaker_id,
    coalesce(nullif(p_context ->> 'itemId', ''), 'legacy-context'),
    p_playback_count,
    false,
    'meaning_selection',
    'legacy-client-v1',
    p_context,
    null,
    null
  );
$$;

revoke all on function public.record_listening_attempt(
  uuid, boolean, real, integer, text, integer, jsonb
) from public, anon;
grant execute on function public.record_listening_attempt(
  uuid, boolean, real, integer, text, integer, jsonb
) to authenticated;

create function public.record_speaking_attempt(
  p_concept_id uuid,
  p_reference_text text,
  p_recognized_text text,
  p_accuracy_score real,
  p_fluency_score real,
  p_completeness_score real,
  p_pronunciation_score real,
  p_successful boolean,
  p_evidence_kind text,
  p_scorer_version text,
  p_word_details jsonb default '[]'::jsonb,
  p_context jsonb default '{}'::jsonb,
  p_session_id uuid default null,
  p_session_item_id uuid default null
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_event_id bigint;
  v_now timestamptz := now();
  v_assisted boolean := p_evidence_kind = 'imitation';
  v_previous_interval real := 0;
  v_previous_lapses integer := 0;
  v_next_interval real;
  v_next_lapses integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_accuracy_score < 0 or p_accuracy_score > 1
    or p_fluency_score < 0 or p_fluency_score > 1
    or p_completeness_score < 0 or p_completeness_score > 1
    or p_pronunciation_score < 0 or p_pronunciation_score > 1 then
    raise exception 'Speaking scores must be between zero and one';
  end if;
  if p_evidence_kind not in ('imitation', 'pronunciation', 'communicative_use') then
    raise exception 'Speaking evidence kind is invalid';
  end if;
  if jsonb_typeof(coalesce(p_word_details, '[]'::jsonb)) <> 'array' then
    raise exception 'Word details must be a JSON array';
  end if;
  if jsonb_typeof(coalesce(p_context, '{}'::jsonb)) <> 'object' then
    raise exception 'Context must be a JSON object';
  end if;

  select pronunciation_interval_hours, pronunciation_lapses
  into v_previous_interval, v_previous_lapses
  from public.learner_concept_state
  where user_id = v_user_id and concept_id = p_concept_id;
  v_previous_interval := coalesce(v_previous_interval, 0);
  v_previous_lapses := coalesce(v_previous_lapses, 0);

  if not p_successful then
    v_next_interval := 10.0 / 60.0;
    v_next_lapses := v_previous_lapses + 1;
  elsif v_assisted then
    v_next_interval := least(greatest(v_previous_interval, 1), 4);
    v_next_lapses := v_previous_lapses;
  elsif v_previous_interval <= 0 then
    v_next_interval := 8;
    v_next_lapses := v_previous_lapses;
  else
    v_next_interval := least(2160, greatest(8, v_previous_interval * 2 * greatest(0.55, 1 - v_previous_lapses * 0.08)));
    v_next_lapses := v_previous_lapses;
  end if;

  insert into public.learning_events (
    user_id, session_id, session_item_id, primary_concept_id, event_type,
    modality, outcome, context, payload, schema_version, occurred_at
  ) values (
    v_user_id, p_session_id, p_session_item_id, p_concept_id,
    'speaking_attempt', 'speech',
    case when p_successful then 'success' else 'partial' end,
    coalesce(p_context, '{}'::jsonb),
    jsonb_build_object(
      'reference_text', p_reference_text,
      'recognized_text', p_recognized_text,
      'accuracy_score', p_accuracy_score,
      'fluency_score', p_fluency_score,
      'completeness_score', p_completeness_score,
      'pronunciation_score', p_pronunciation_score,
      'word_details', coalesce(p_word_details, '[]'::jsonb),
      'evidence_kind', p_evidence_kind,
      'scorer_version', p_scorer_version,
      'audio_retained', false,
      'projection_algorithm_version', 2,
      'scheduler_version', 'adaptive-review-v1'
    ),
    2,
    v_now
  ) returning id into v_event_id;

  insert into public.learner_concept_state (
    user_id, concept_id, production, pronunciation, last_exposure_at,
    estimate_confidence, exposure_count, pronunciation_due_at,
    pronunciation_interval_hours, pronunciation_lapses, algorithm_version
  ) values (
    v_user_id, p_concept_id,
    case when p_evidence_kind = 'communicative_use' then p_completeness_score else null end,
    p_pronunciation_score, v_now, 0.09, 1,
    v_now + v_next_interval * interval '1 hour',
    v_next_interval, v_next_lapses, 2
  ) on conflict (user_id, concept_id) do update set
    production = case when p_evidence_kind = 'communicative_use' then
      least(1.0, coalesce(public.learner_concept_state.production, 0.12) * 0.75 + p_completeness_score * 0.25)
      else public.learner_concept_state.production end,
    pronunciation = least(1.0,
      coalesce(public.learner_concept_state.pronunciation, 0.12) * 0.70 + p_pronunciation_score * 0.30),
    last_exposure_at = v_now,
    estimate_confidence = least(1.0, public.learner_concept_state.estimate_confidence + 0.09),
    exposure_count = public.learner_concept_state.exposure_count + 1,
    pronunciation_due_at = v_now + v_next_interval * interval '1 hour',
    pronunciation_interval_hours = v_next_interval,
    pronunciation_lapses = v_next_lapses,
    algorithm_version = 2;

  if p_session_item_id is not null then
    update public.session_items set status = 'completed', completed_at = v_now
    where id = p_session_item_id and user_id = v_user_id;
  end if;

  return v_event_id;
end;
$$;

revoke all on function public.record_speaking_attempt(
  uuid, text, text, real, real, real, real, boolean, text, text, jsonb, jsonb, uuid, uuid
) from public, anon;
grant execute on function public.record_speaking_attempt(
  uuid, text, text, real, real, real, real, boolean, text, text, jsonb, jsonb, uuid, uuid
) to authenticated;

create or replace function public.record_speaking_attempt(
  p_concept_id uuid,
  p_reference_text text,
  p_recognized_text text,
  p_accuracy_score real,
  p_fluency_score real,
  p_completeness_score real,
  p_pronunciation_score real,
  p_successful boolean,
  p_word_details jsonb default '[]'::jsonb,
  p_context jsonb default '{}'::jsonb
)
returns bigint
language sql
security invoker
set search_path = ''
as $$
  select public.record_speaking_attempt(
    p_concept_id,
    p_reference_text,
    p_recognized_text,
    p_accuracy_score,
    p_fluency_score,
    p_completeness_score,
    p_pronunciation_score,
    p_successful,
    'imitation',
    'legacy-client-v1',
    p_word_details,
    p_context,
    null,
    null
  );
$$;

revoke all on function public.record_speaking_attempt(
  uuid, text, text, real, real, real, real, boolean, jsonb, jsonb
) from public, anon;
grant execute on function public.record_speaking_attempt(
  uuid, text, text, real, real, real, real, boolean, jsonb, jsonb
) to authenticated;

create function public.record_reading_attempt(
  p_concept_id uuid,
  p_question_id text,
  p_selected_answer text,
  p_expected_answer text,
  p_successful boolean,
  p_score real,
  p_latency_ms integer,
  p_scorer_version text,
  p_context jsonb default '{}'::jsonb,
  p_session_id uuid default null,
  p_session_item_id uuid default null
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_event_id bigint;
  v_now timestamptz := now();
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_score < 0 or p_score > 1 then raise exception 'Score must be between zero and one'; end if;
  if p_latency_ms < 0 then raise exception 'Latency must be non-negative'; end if;
  if jsonb_typeof(coalesce(p_context, '{}'::jsonb)) <> 'object' then
    raise exception 'Context must be a JSON object';
  end if;

  insert into public.learning_events (
    user_id, session_id, session_item_id, primary_concept_id, event_type,
    modality, outcome, response_latency_ms, context, payload, schema_version,
    occurred_at
  ) values (
    v_user_id, p_session_id, p_session_item_id, p_concept_id,
    'reading_attempt', 'text',
    case when p_successful then 'success' else 'failure' end,
    p_latency_ms, coalesce(p_context, '{}'::jsonb),
    jsonb_build_object(
      'scorer_version', p_scorer_version,
      'projection_algorithm_version', 2,
      'scheduler_version', 'adaptive-review-v1'
    ),
    2,
    v_now
  ) returning id into v_event_id;

  insert into public.reading_attempts (
    event_id, user_id, concept_id, question_id, selected_answer,
    expected_answer, successful, score, latency_ms
  ) values (
    v_event_id, v_user_id, p_concept_id, p_question_id, p_selected_answer,
    p_expected_answer, p_successful, p_score, p_latency_ms
  );

  insert into public.learner_concept_state (
    user_id, concept_id, recognition_text, context_diversity,
    last_exposure_at, estimate_confidence, exposure_count, algorithm_version
  ) values (
    v_user_id, p_concept_id, least(1.0, 0.15 * 0.7 + p_score * 0.3),
    case when p_successful then 0.14 else 0.10 end,
    v_now, 0.07, 1, 2
  ) on conflict (user_id, concept_id) do update set
    recognition_text = least(1.0,
      coalesce(public.learner_concept_state.recognition_text, 0.15) * 0.7 + p_score * 0.3),
    context_diversity = least(1.0,
      coalesce(public.learner_concept_state.context_diversity, 0.08)
        + case when p_successful then 0.06 else 0.02 end),
    last_exposure_at = v_now,
    estimate_confidence = least(1.0, public.learner_concept_state.estimate_confidence + 0.07),
    exposure_count = public.learner_concept_state.exposure_count + 1,
    algorithm_version = 2;

  if p_session_item_id is not null then
    update public.session_items set status = 'completed', completed_at = v_now
    where id = p_session_item_id and user_id = v_user_id;
  end if;

  return v_event_id;
end;
$$;

revoke all on function public.record_reading_attempt(
  uuid, text, text, text, boolean, real, integer, text, jsonb, uuid, uuid
) from public, anon;
grant execute on function public.record_reading_attempt(
  uuid, text, text, text, boolean, real, integer, text, jsonb, uuid, uuid
) to authenticated;

create or replace function public.record_reading_attempt(
  p_concept_id uuid,
  p_question_id text,
  p_selected_answer text,
  p_expected_answer text,
  p_successful boolean,
  p_score real,
  p_latency_ms integer,
  p_context jsonb default '{}'::jsonb,
  p_session_id uuid default null,
  p_session_item_id uuid default null
)
returns bigint
language sql
security invoker
set search_path = ''
as $$
  select public.record_reading_attempt(
    p_concept_id,
    p_question_id,
    p_selected_answer,
    p_expected_answer,
    p_successful,
    p_score,
    p_latency_ms,
    'legacy-client-v1',
    p_context,
    p_session_id,
    p_session_item_id
  );
$$;

revoke all on function public.record_reading_attempt(
  uuid, text, text, text, boolean, real, integer, jsonb, uuid, uuid
) from public, anon;
grant execute on function public.record_reading_attempt(
  uuid, text, text, text, boolean, real, integer, jsonb, uuid, uuid
) to authenticated;
