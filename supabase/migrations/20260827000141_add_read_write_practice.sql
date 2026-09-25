alter table public.learning_sessions
  drop constraint if exists learning_sessions_kind_check;

alter table public.learning_sessions
  add constraint learning_sessions_kind_check
  check (kind in ('learn', 'ear', 'text'));

alter table public.session_items
  drop constraint if exists session_items_activity_type_check;

alter table public.session_items
  add constraint session_items_activity_type_check
  check (
    activity_type in (
      'cold_recall',
      'contextual_input',
      'prediction',
      'pattern_discovery',
      'speaking',
      'retelling',
      'repair',
      'transfer',
      'listening',
      'reading',
      'writing'
    )
  );

alter table public.learning_events
  drop constraint if exists learning_events_event_type_check;

alter table public.learning_events
  add constraint learning_events_event_type_check
  check (
    event_type in (
      'exposure',
      'retrieval_attempt',
      'reading_attempt',
      'listening_attempt',
      'speaking_attempt',
      'error',
      'repair',
      'successful_transfer',
      'story_encounter',
      'concept_encounter'
    )
  );

create table public.reading_attempts (
  event_id bigint primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  concept_id uuid not null references public.concepts (id) on delete restrict,
  question_id text not null check (length(trim(question_id)) between 1 and 120),
  selected_answer text not null check (length(trim(selected_answer)) between 1 and 500),
  expected_answer text not null check (length(trim(expected_answer)) between 1 and 500),
  successful boolean not null,
  score real not null check (score between 0 and 1),
  latency_ms integer not null check (latency_ms >= 0),
  created_at timestamptz not null default now(),
  foreign key (event_id, user_id)
    references public.learning_events (id, user_id)
    on delete cascade
);

create index reading_attempts_user_id_created_at_idx
  on public.reading_attempts (user_id, created_at desc);

alter table public.reading_attempts enable row level security;

create policy reading_attempts_select_own
on public.reading_attempts
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy reading_attempts_insert_own
on public.reading_attempts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

revoke all on table public.reading_attempts from anon, authenticated;
grant select, insert on table public.reading_attempts to authenticated;

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
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_event_id bigint;
  v_now timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if length(trim(p_question_id)) not between 1 and 120 then
    raise exception 'Question id is invalid';
  end if;

  if length(trim(p_selected_answer)) not between 1 and 500
    or length(trim(p_expected_answer)) not between 1 and 500 then
    raise exception 'Reading answers are invalid';
  end if;

  if p_score < 0 or p_score > 1 then
    raise exception 'Score must be between zero and one';
  end if;

  if p_latency_ms < 0 then
    raise exception 'Latency must be non-negative';
  end if;

  if jsonb_typeof(coalesce(p_context, '{}'::jsonb)) <> 'object' then
    raise exception 'Context must be a JSON object';
  end if;

  insert into public.learning_events (
    user_id,
    session_id,
    session_item_id,
    primary_concept_id,
    event_type,
    modality,
    outcome,
    response_latency_ms,
    context,
    payload,
    occurred_at
  )
  values (
    v_user_id,
    p_session_id,
    p_session_item_id,
    p_concept_id,
    'reading_attempt',
    'text',
    case when p_successful then 'success' else 'failure' end,
    p_latency_ms,
    coalesce(p_context, '{}'::jsonb),
    jsonb_build_object('projection_algorithm_version', 1),
    v_now
  )
  returning id into v_event_id;

  insert into public.reading_attempts (
    event_id,
    user_id,
    concept_id,
    question_id,
    selected_answer,
    expected_answer,
    successful,
    score,
    latency_ms
  )
  values (
    v_event_id,
    v_user_id,
    p_concept_id,
    p_question_id,
    p_selected_answer,
    p_expected_answer,
    p_successful,
    p_score,
    p_latency_ms
  );

  insert into public.learner_concept_state (
    user_id,
    concept_id,
    recognition_text,
    context_diversity,
    last_exposure_at,
    estimate_confidence,
    exposure_count,
    successful_retrieval_count,
    algorithm_version
  )
  values (
    v_user_id,
    p_concept_id,
    least(1.0, 0.15 * 0.7 + p_score * 0.3),
    case when p_successful then 0.14 else 0.10 end,
    v_now,
    0.07,
    1,
    0,
    1
  )
  on conflict (user_id, concept_id) do update
  set
    recognition_text = least(
      1.0,
      coalesce(public.learner_concept_state.recognition_text, 0.15) * 0.7
        + p_score * 0.3
    ),
    context_diversity = least(
      1.0,
      coalesce(public.learner_concept_state.context_diversity, 0.08)
        + case when p_successful then 0.06 else 0.02 end
    ),
    last_exposure_at = v_now,
    estimate_confidence = least(
      1.0,
      public.learner_concept_state.estimate_confidence + 0.07
    ),
    exposure_count = public.learner_concept_state.exposure_count + 1,
    algorithm_version = 1;

  return v_event_id;
end;
$$;

revoke all on function public.record_reading_attempt(
  uuid,
  text,
  text,
  text,
  boolean,
  real,
  integer,
  jsonb,
  uuid,
  uuid
) from public, anon;

grant execute on function public.record_reading_attempt(
  uuid,
  text,
  text,
  text,
  boolean,
  real,
  integer,
  jsonb,
  uuid,
  uuid
) to authenticated;
