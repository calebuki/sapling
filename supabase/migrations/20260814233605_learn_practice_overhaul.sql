alter table public.learning_sessions
  drop constraint if exists learning_sessions_kind_check;

alter table public.learning_sessions
  add constraint learning_sessions_kind_check
  check (kind in ('learn', 'ear', 'practice'));

alter table public.learning_events
  drop constraint if exists learning_events_event_type_check;

alter table public.learning_events
  add constraint learning_events_event_type_check
  check (
    event_type in (
      'exposure',
      'retrieval_attempt',
      'listening_attempt',
      'speaking_attempt',
      'conversation_turn',
      'error',
      'repair',
      'successful_transfer',
      'story_encounter',
      'concept_encounter'
    )
  );

create table public.learner_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  language_code text not null check (
    language_code ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'
  ),
  memory_key text not null check (
    memory_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  label text not null check (length(trim(label)) between 1 and 100),
  value text not null check (length(trim(value)) between 1 and 300),
  category text not null check (
    category in (
      'identity',
      'family',
      'work',
      'home',
      'interest',
      'routine',
      'preference'
    )
  ),
  confidence real not null default 0.7 check (confidence between 0 and 1),
  source text not null default 'practice_conversation' check (
    source in ('practice_conversation', 'learner_edit')
  ),
  first_learned_at timestamptz not null default now(),
  last_confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, language_code, memory_key)
);

create table public.character_continuity (
  user_id uuid not null references public.profiles (id) on delete cascade,
  language_code text not null check (
    language_code ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'
  ),
  character_id text not null check (
    character_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  encounter_count integer not null default 0 check (encounter_count >= 0),
  last_scenario_id text,
  summary text check (summary is null or length(summary) <= 1000),
  last_met_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, language_code, character_id)
);

create table public.learning_event_concepts (
  event_id bigint not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  concept_id uuid not null references public.concepts (id) on delete restrict,
  evidence_role text not null default 'demonstrated' check (
    evidence_role in ('demonstrated', 'supported', 'misunderstood')
  ),
  weight real not null default 1 check (weight between 0 and 1),
  dimensions jsonb not null default '{}'::jsonb check (
    jsonb_typeof(dimensions) = 'object'
  ),
  created_at timestamptz not null default now(),
  primary key (event_id, concept_id),
  foreign key (event_id, user_id)
    references public.learning_events (id, user_id)
    on delete cascade
);

create table public.speech_resolutions (
  event_id bigint primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider_transcript text not null,
  resolved_text text not null,
  alternatives jsonb not null default '[]'::jsonb check (
    jsonb_typeof(alternatives) = 'array'
  ),
  resolution_kind text not null check (
    resolution_kind in ('unchanged', 'contextual_correction', 'uncertain')
  ),
  confidence real not null check (confidence between 0 and 1),
  invisible_note text check (
    invisible_note is null or length(invisible_note) <= 300
  ),
  surface_after_session boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (event_id, user_id)
    references public.learning_events (id, user_id)
    on delete cascade
);

create trigger learner_memories_set_updated_at
before update on public.learner_memories
for each row execute function private.set_updated_at();

create trigger character_continuity_set_updated_at
before update on public.character_continuity
for each row execute function private.set_updated_at();

create index learner_memories_user_id_last_confirmed_at_idx
  on public.learner_memories (user_id, last_confirmed_at desc);

create index character_continuity_user_id_last_met_at_idx
  on public.character_continuity (user_id, last_met_at desc);

create index learning_event_concepts_user_id_concept_id_idx
  on public.learning_event_concepts (user_id, concept_id, created_at desc);

create index speech_resolutions_user_id_created_at_idx
  on public.speech_resolutions (user_id, created_at desc);

alter table public.learner_memories enable row level security;
alter table public.character_continuity enable row level security;
alter table public.learning_event_concepts enable row level security;
alter table public.speech_resolutions enable row level security;

create policy learner_memories_select_own
on public.learner_memories
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy learner_memories_insert_own
on public.learner_memories
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy learner_memories_update_own
on public.learner_memories
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy learner_memories_delete_own
on public.learner_memories
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy character_continuity_select_own
on public.character_continuity
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy character_continuity_insert_own
on public.character_continuity
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy character_continuity_update_own
on public.character_continuity
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy character_continuity_delete_own
on public.character_continuity
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy learning_event_concepts_select_own
on public.learning_event_concepts
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy learning_event_concepts_insert_own
on public.learning_event_concepts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy speech_resolutions_select_own
on public.speech_resolutions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy speech_resolutions_insert_own
on public.speech_resolutions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

revoke all on public.learner_memories from public, anon;
revoke all on public.character_continuity from public, anon;
revoke all on public.learning_event_concepts from public, anon;
revoke all on public.speech_resolutions from public, anon;

grant select, insert, update, delete on public.learner_memories to authenticated;
grant select, insert, update, delete on public.character_continuity to authenticated;
grant select, insert on public.learning_event_concepts to authenticated;
grant select, insert on public.speech_resolutions to authenticated;

create or replace function public.record_practice_turn(
  p_session_id uuid,
  p_position integer,
  p_scenario_id text,
  p_character_id text,
  p_language_code text,
  p_provider_transcript text,
  p_resolved_text text,
  p_alternatives jsonb,
  p_resolution_kind text,
  p_resolution_confidence real,
  p_invisible_note text,
  p_surface_after_session boolean,
  p_reply_text text,
  p_meaning_score real,
  p_grammar_score real,
  p_vocabulary_score real,
  p_speech_metrics jsonb,
  p_evidence jsonb
)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_session_item_id uuid;
  v_event_id bigint;
  v_concept_id uuid;
  v_primary_concept_id uuid;
  v_evidence jsonb;
  v_weight real;
  v_meaning real;
  v_production real;
  v_automaticity real;
  v_pronunciation real;
  v_now timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_position < 0 then
    raise exception 'Practice position must be non-negative';
  end if;

  if p_resolution_kind not in ('unchanged', 'contextual_correction', 'uncertain') then
    raise exception 'Invalid speech resolution kind';
  end if;

  if p_resolution_confidence < 0 or p_resolution_confidence > 1
    or p_meaning_score < 0 or p_meaning_score > 1
    or p_grammar_score < 0 or p_grammar_score > 1
    or p_vocabulary_score < 0 or p_vocabulary_score > 1 then
    raise exception 'Practice scores must be between zero and one';
  end if;

  if jsonb_typeof(coalesce(p_alternatives, '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_evidence, '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_speech_metrics, '{}'::jsonb)) <> 'object' then
    raise exception 'Practice details have an invalid JSON shape';
  end if;

  if not exists (
    select 1
    from public.learning_sessions
    where id = p_session_id
      and user_id = v_user_id
      and kind = 'practice'
  ) then
    raise exception 'Practice session not found';
  end if;

  select c.id
  into v_primary_concept_id
  from jsonb_array_elements(coalesce(p_evidence, '[]'::jsonb)) as item
  join public.concepts c
    on c.slug = item ->> 'conceptSlug'
   and c.language_code = p_language_code
  limit 1;

  insert into public.session_items (
    user_id,
    session_id,
    position,
    activity_type,
    primary_concept_id,
    status,
    prompt,
    started_at,
    completed_at
  )
  values (
    v_user_id,
    p_session_id,
    p_position,
    'speaking',
    v_primary_concept_id,
    'completed',
    jsonb_build_object(
      'scenario_id', p_scenario_id,
      'character_id', p_character_id,
      'reply_text', p_reply_text
    ),
    v_now,
    v_now
  )
  on conflict (session_id, position) do update
  set
    prompt = excluded.prompt,
    primary_concept_id = excluded.primary_concept_id,
    status = 'completed',
    completed_at = v_now
  returning id into v_session_item_id;

  select id
  into v_event_id
  from public.learning_events
  where user_id = v_user_id
    and session_item_id = v_session_item_id
    and event_type = 'conversation_turn'
  order by id
  limit 1;

  if v_event_id is not null then
    return v_event_id;
  end if;

  insert into public.learning_events (
    user_id,
    session_id,
    session_item_id,
    primary_concept_id,
    event_type,
    modality,
    outcome,
    context,
    payload,
    occurred_at
  )
  values (
    v_user_id,
    p_session_id,
    v_session_item_id,
    v_primary_concept_id,
    'conversation_turn',
    'speech',
    case
      when p_meaning_score >= 0.7 then 'success'
      when p_meaning_score >= 0.35 then 'partial'
      else 'failure'
    end,
    jsonb_build_object(
      'scenario_id', p_scenario_id,
      'character_id', p_character_id,
      'language_code', p_language_code,
      'position', p_position
    ),
    jsonb_build_object(
      'resolved_text', p_resolved_text,
      'reply_text', p_reply_text,
      'meaning_score', p_meaning_score,
      'grammar_score', p_grammar_score,
      'vocabulary_score', p_vocabulary_score,
      'speech_metrics', coalesce(p_speech_metrics, '{}'::jsonb),
      'audio_retained', false,
      'projection_algorithm_version', 2
    ),
    v_now
  )
  returning id into v_event_id;

  insert into public.speech_resolutions (
    event_id,
    user_id,
    provider_transcript,
    resolved_text,
    alternatives,
    resolution_kind,
    confidence,
    invisible_note,
    surface_after_session
  )
  values (
    v_event_id,
    v_user_id,
    p_provider_transcript,
    p_resolved_text,
    coalesce(p_alternatives, '[]'::jsonb),
    p_resolution_kind,
    p_resolution_confidence,
    p_invisible_note,
    p_surface_after_session
  );

  v_pronunciation := nullif(p_speech_metrics ->> 'pronunciationScore', '')::real;

  for v_evidence in
    select value from jsonb_array_elements(coalesce(p_evidence, '[]'::jsonb))
  loop
    select id
    into v_concept_id
    from public.concepts
    where language_code = p_language_code
      and slug = v_evidence ->> 'conceptSlug'
      and is_active
    limit 1;

    if v_concept_id is null then
      continue;
    end if;

    v_weight := greatest(
      0.1,
      least(1.0, coalesce((v_evidence ->> 'weight')::real, 0.5))
    );
    v_meaning := greatest(
      0.0,
      least(1.0, coalesce((v_evidence ->> 'meaningScore')::real, p_meaning_score))
    );
    v_production := greatest(
      0.0,
      least(1.0, coalesce((v_evidence ->> 'productionScore')::real, p_meaning_score))
    );
    v_automaticity := greatest(
      0.0,
      least(1.0, coalesce((v_evidence ->> 'automaticityScore')::real, 0.4))
    );

    insert into public.learning_event_concepts (
      event_id,
      user_id,
      concept_id,
      evidence_role,
      weight,
      dimensions
    )
    values (
      v_event_id,
      v_user_id,
      v_concept_id,
      'demonstrated',
      v_weight,
      jsonb_build_object(
        'meaning', v_meaning,
        'production', v_production,
        'automaticity', v_automaticity
      )
    )
    on conflict (event_id, concept_id) do nothing;

    insert into public.learner_concept_state (
      user_id,
      concept_id,
      production,
      pronunciation,
      automaticity,
      context_diversity,
      last_exposure_at,
      estimate_confidence,
      exposure_count,
      successful_retrieval_count,
      algorithm_version
    )
    values (
      v_user_id,
      v_concept_id,
      v_production,
      v_pronunciation,
      v_automaticity,
      least(1.0, 0.12 + 0.08 * v_weight),
      v_now,
      0.06 * v_weight,
      1,
      0,
      2
    )
    on conflict (user_id, concept_id) do update
    set
      production = least(
        1.0,
        coalesce(public.learner_concept_state.production, 0.12)
          * (1.0 - 0.22 * v_weight)
          + v_production * (0.22 * v_weight)
      ),
      pronunciation = case
        when v_pronunciation is null
          then public.learner_concept_state.pronunciation
        else least(
          1.0,
          coalesce(public.learner_concept_state.pronunciation, 0.12)
            * (1.0 - 0.16 * v_weight)
            + v_pronunciation * (0.16 * v_weight)
        )
      end,
      automaticity = least(
        1.0,
        coalesce(public.learner_concept_state.automaticity, 0.08)
          * (1.0 - 0.16 * v_weight)
          + v_automaticity * (0.16 * v_weight)
      ),
      context_diversity = least(
        1.0,
        coalesce(public.learner_concept_state.context_diversity, 0.08)
          + 0.06 * v_weight
      ),
      last_exposure_at = v_now,
      estimate_confidence = least(
        1.0,
        public.learner_concept_state.estimate_confidence + 0.05 * v_weight
      ),
      exposure_count = public.learner_concept_state.exposure_count + 1,
      algorithm_version = 2;
  end loop;

  update public.learning_sessions
  set configuration = jsonb_set(
    jsonb_set(configuration, '{turn_count}', to_jsonb(p_position + 1), true),
    '{last_goal_progress}',
    to_jsonb(p_meaning_score),
    true
  )
  where id = p_session_id
    and user_id = v_user_id;

  return v_event_id;
end;
$$;

revoke all on function public.record_practice_turn(
  uuid,
  integer,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  text,
  real,
  text,
  boolean,
  text,
  real,
  real,
  real,
  jsonb,
  jsonb
) from public, anon;

grant execute on function public.record_practice_turn(
  uuid,
  integer,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  text,
  real,
  text,
  boolean,
  text,
  real,
  real,
  real,
  jsonb,
  jsonb
) to authenticated;
