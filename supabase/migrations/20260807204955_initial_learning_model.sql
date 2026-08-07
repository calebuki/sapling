create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to postgres, service_role;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (
    display_name is null
    or length(trim(display_name)) between 1 and 80
  ),
  native_language_code text not null default 'en' check (
    native_language_code ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'
  ),
  target_language_code text not null default 'da' check (
    target_language_code ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'
  ),
  time_zone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(
      trim(
        coalesce(
          new.raw_user_meta_data ->> 'display_name',
          new.raw_user_meta_data ->> 'full_name',
          ''
        )
      ),
      ''
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function private.handle_new_user();

insert into public.profiles (id, display_name, created_at, updated_at)
select
  id,
  nullif(
    trim(
      coalesce(
        raw_user_meta_data ->> 'display_name',
        raw_user_meta_data ->> 'full_name',
        ''
      )
    ),
    ''
  ),
  created_at,
  created_at
from auth.users
on conflict (id) do nothing;

create table public.concepts (
  id uuid primary key default gen_random_uuid(),
  language_code text not null check (
    language_code ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'
  ),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  kind text not null check (
    kind in (
      'word',
      'chunk',
      'construction',
      'collocation',
      'phoneme',
      'phonetic_contrast',
      'communicative_function',
      'pragmatic_convention',
      'listening_phenomenon'
    )
  ),
  canonical_form text not null check (length(trim(canonical_form)) > 0),
  gloss text not null check (length(trim(gloss)) > 0),
  description text,
  metadata jsonb not null default '{}'::jsonb check (
    jsonb_typeof(metadata) = 'object'
  ),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (language_code, slug)
);

create table public.concept_relations (
  source_concept_id uuid not null references public.concepts (id) on delete cascade,
  target_concept_id uuid not null references public.concepts (id) on delete cascade,
  relation_type text not null check (
    relation_type in (
      'prerequisite',
      'component',
      'contrast',
      'realizes',
      'related_to'
    )
  ),
  weight real not null default 1 check (weight between 0 and 1),
  metadata jsonb not null default '{}'::jsonb check (
    jsonb_typeof(metadata) = 'object'
  ),
  created_at timestamptz not null default now(),
  primary key (source_concept_id, target_concept_id, relation_type),
  check (source_concept_id <> target_concept_id)
);

create table public.learner_concept_state (
  user_id uuid not null references public.profiles (id) on delete cascade,
  concept_id uuid not null references public.concepts (id) on delete cascade,
  recognition_text real check (recognition_text between 0 and 1),
  recognition_audio real check (recognition_audio between 0 and 1),
  recall real check (recall between 0 and 1),
  production real check (production between 0 and 1),
  pronunciation real check (pronunciation between 0 and 1),
  automaticity real check (automaticity between 0 and 1),
  context_diversity real check (context_diversity between 0 and 1),
  speaker_diversity real check (speaker_diversity between 0 and 1),
  retrieval_latency_ms integer check (
    retrieval_latency_ms is null or retrieval_latency_ms >= 0
  ),
  last_exposure_at timestamptz,
  last_successful_retrieval_at timestamptz,
  retrieval_strength real check (retrieval_strength between 0 and 1),
  estimate_confidence real not null default 0 check (
    estimate_confidence between 0 and 1
  ),
  exposure_count integer not null default 0 check (exposure_count >= 0),
  successful_retrieval_count integer not null default 0 check (
    successful_retrieval_count >= 0
    and successful_retrieval_count <= exposure_count
  ),
  algorithm_version smallint not null default 1 check (algorithm_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, concept_id)
);

create table public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('learn', 'ear')),
  status text not null default 'active' check (
    status in ('planned', 'active', 'completed', 'abandoned')
  ),
  planner_version text,
  configuration jsonb not null default '{}'::jsonb check (
    jsonb_typeof(configuration) = 'object'
  ),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  check (completed_at is null or completed_at >= started_at)
);

create table public.session_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid not null,
  position integer not null check (position >= 0),
  activity_type text not null check (
    activity_type in (
      'cold_recall',
      'contextual_input',
      'prediction',
      'pattern_discovery',
      'speaking',
      'retelling',
      'repair',
      'transfer',
      'listening'
    )
  ),
  primary_concept_id uuid references public.concepts (id) on delete restrict,
  status text not null default 'planned' check (
    status in ('planned', 'in_progress', 'completed', 'skipped')
  ),
  prompt jsonb not null default '{}'::jsonb check (
    jsonb_typeof(prompt) = 'object'
  ),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (session_id, position),
  foreign key (session_id, user_id)
    references public.learning_sessions (id, user_id)
    on delete cascade,
  check (
    completed_at is null
    or started_at is null
    or completed_at >= started_at
  )
);

create table public.learning_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid,
  session_item_id uuid,
  primary_concept_id uuid references public.concepts (id) on delete restrict,
  event_type text not null check (
    event_type in (
      'exposure',
      'retrieval_attempt',
      'listening_attempt',
      'speaking_attempt',
      'error',
      'repair',
      'successful_transfer',
      'story_encounter',
      'concept_encounter'
    )
  ),
  modality text check (modality in ('text', 'audio', 'speech', 'mixed')),
  outcome text check (outcome in ('success', 'partial', 'failure', 'skipped')),
  response_latency_ms integer check (
    response_latency_ms is null or response_latency_ms >= 0
  ),
  context jsonb not null default '{}'::jsonb check (
    jsonb_typeof(context) = 'object'
  ),
  payload jsonb not null default '{}'::jsonb check (
    jsonb_typeof(payload) = 'object'
  ),
  schema_version smallint not null default 1 check (schema_version > 0),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (session_id, user_id)
    references public.learning_sessions (id, user_id)
    on delete cascade,
  foreign key (session_item_id, user_id)
    references public.session_items (id, user_id)
    on delete cascade
);

create table public.retrieval_attempts (
  event_id bigint primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  concept_id uuid not null references public.concepts (id) on delete restrict,
  response_text text not null,
  expected_response text not null,
  self_assessed_success boolean not null,
  score real check (score between 0 and 1),
  latency_ms integer not null check (latency_ms >= 0),
  hints_used integer not null default 0 check (hints_used >= 0),
  created_at timestamptz not null default now(),
  foreign key (event_id, user_id)
    references public.learning_events (id, user_id)
    on delete cascade
);

create table public.errors (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id bigint not null,
  concept_id uuid references public.concepts (id) on delete restrict,
  category text not null,
  observed_form text,
  target_form text,
  details jsonb not null default '{}'::jsonb check (
    jsonb_typeof(details) = 'object'
  ),
  created_at timestamptz not null default now(),
  foreign key (event_id, user_id)
    references public.learning_events (id, user_id)
    on delete cascade
);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger concepts_set_updated_at
before update on public.concepts
for each row execute function private.set_updated_at();

create trigger learner_concept_state_set_updated_at
before update on public.learner_concept_state
for each row execute function private.set_updated_at();

create trigger learning_sessions_set_updated_at
before update on public.learning_sessions
for each row execute function private.set_updated_at();

create trigger session_items_set_updated_at
before update on public.session_items
for each row execute function private.set_updated_at();

create index concept_relations_target_concept_id_idx
  on public.concept_relations (target_concept_id);
create index learner_concept_state_concept_id_idx
  on public.learner_concept_state (concept_id);
create index learning_sessions_user_id_started_at_idx
  on public.learning_sessions (user_id, started_at desc);
create index session_items_user_id_session_id_position_idx
  on public.session_items (user_id, session_id, position);
create index session_items_primary_concept_id_idx
  on public.session_items (primary_concept_id);
create index learning_events_user_id_occurred_at_idx
  on public.learning_events (user_id, occurred_at desc);
create index learning_events_user_id_concept_occurred_at_idx
  on public.learning_events (user_id, primary_concept_id, occurred_at desc)
  where primary_concept_id is not null;
create index learning_events_session_id_idx
  on public.learning_events (session_id)
  where session_id is not null;
create index learning_events_session_item_id_idx
  on public.learning_events (session_item_id)
  where session_item_id is not null;
create index retrieval_attempts_user_id_concept_id_idx
  on public.retrieval_attempts (user_id, concept_id);
create index retrieval_attempts_concept_id_idx
  on public.retrieval_attempts (concept_id);
create index errors_user_id_concept_id_created_at_idx
  on public.errors (user_id, concept_id, created_at desc);
create index errors_event_id_user_id_idx
  on public.errors (event_id, user_id);

alter table public.profiles enable row level security;
alter table public.concepts enable row level security;
alter table public.concept_relations enable row level security;
alter table public.learner_concept_state enable row level security;
alter table public.learning_sessions enable row level security;
alter table public.session_items enable row level security;
alter table public.learning_events enable row level security;
alter table public.retrieval_attempts enable row level security;
alter table public.errors enable row level security;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy concepts_select_authenticated
on public.concepts
for select
to authenticated
using (true);

create policy concept_relations_select_authenticated
on public.concept_relations
for select
to authenticated
using (true);

create policy learner_concept_state_select_own
on public.learner_concept_state
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy learner_concept_state_insert_own
on public.learner_concept_state
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy learner_concept_state_update_own
on public.learner_concept_state
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy learner_concept_state_delete_own
on public.learner_concept_state
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy learning_sessions_select_own
on public.learning_sessions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy learning_sessions_insert_own
on public.learning_sessions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy learning_sessions_update_own
on public.learning_sessions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy learning_sessions_delete_own
on public.learning_sessions
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy session_items_select_own
on public.session_items
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy session_items_insert_own
on public.session_items
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy session_items_update_own
on public.session_items
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy session_items_delete_own
on public.session_items
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy learning_events_select_own
on public.learning_events
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy learning_events_insert_own
on public.learning_events
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy retrieval_attempts_select_own
on public.retrieval_attempts
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy retrieval_attempts_insert_own
on public.retrieval_attempts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy errors_select_own
on public.errors
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy errors_insert_own
on public.errors
for insert
to authenticated
with check ((select auth.uid()) = user_id);

grant select, update on public.profiles to authenticated;
grant select on public.concepts, public.concept_relations to authenticated;
grant select, insert, update, delete on public.learner_concept_state to authenticated;
grant select, insert, update, delete on public.learning_sessions to authenticated;
grant select, insert, update, delete on public.session_items to authenticated;
grant select, insert on public.learning_events to authenticated;
grant select, insert on public.retrieval_attempts to authenticated;
grant select, insert on public.errors to authenticated;
grant usage, select on sequence public.learning_events_id_seq to authenticated;
grant usage, select on sequence public.errors_id_seq to authenticated;

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
language plpgsql
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_event_id bigint;
  v_error_event_id bigint;
  v_now timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
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
    'retrieval_attempt',
    'text',
    case when p_successful then 'success' else 'failure' end,
    p_latency_ms,
    coalesce(p_context, '{}'::jsonb),
    jsonb_build_object(
      'self_assessed', true,
      'projection_algorithm_version', 1
    ),
    v_now
  )
  returning id into v_event_id;

  insert into public.retrieval_attempts (
    event_id,
    user_id,
    concept_id,
    response_text,
    expected_response,
    self_assessed_success,
    score,
    latency_ms
  )
  values (
    v_event_id,
    v_user_id,
    p_concept_id,
    p_response_text,
    p_expected_response,
    p_successful,
    case when p_successful then 1 else 0 end,
    p_latency_ms
  );

  if not p_successful then
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
      p_session_item_id,
      p_concept_id,
      'error',
      'text',
      'failure',
      coalesce(p_context, '{}'::jsonb),
      jsonb_build_object('source_event_id', v_event_id),
      v_now
    )
    returning id into v_error_event_id;

    insert into public.errors (
      user_id,
      event_id,
      concept_id,
      category,
      observed_form,
      target_form,
      details
    )
    values (
      v_user_id,
      v_error_event_id,
      p_concept_id,
      'retrieval_mismatch',
      p_response_text,
      p_expected_response,
      jsonb_build_object('retrieval_event_id', v_event_id)
    );
  end if;

  insert into public.learner_concept_state (
    user_id,
    concept_id,
    recall,
    production,
    automaticity,
    retrieval_latency_ms,
    last_exposure_at,
    last_successful_retrieval_at,
    retrieval_strength,
    estimate_confidence,
    exposure_count,
    successful_retrieval_count,
    algorithm_version
  )
  values (
    v_user_id,
    p_concept_id,
    case when p_successful then 0.35 else 0.10 end,
    case when p_successful then 0.30 else 0.08 end,
    case
      when p_successful and p_latency_ms <= 3000 then 0.30
      when p_successful and p_latency_ms <= 7000 then 0.22
      when p_successful then 0.15
      else 0.05
    end,
    case when p_successful then p_latency_ms else null end,
    v_now,
    case when p_successful then v_now else null end,
    case when p_successful then 0.32 else 0.10 end,
    0.10,
    1,
    case when p_successful then 1 else 0 end,
    1
  )
  on conflict (user_id, concept_id) do update
  set
    recall = case
      when p_successful then least(
        1.0,
        coalesce(public.learner_concept_state.recall, 0.20) + 0.16
      )
      else greatest(
        0.0,
        coalesce(public.learner_concept_state.recall, 0.20) - 0.08
      )
    end,
    production = case
      when p_successful then least(
        1.0,
        coalesce(public.learner_concept_state.production, 0.15) + 0.13
      )
      else greatest(
        0.0,
        coalesce(public.learner_concept_state.production, 0.15) - 0.07
      )
    end,
    automaticity = case
      when p_successful then least(
        1.0,
        coalesce(public.learner_concept_state.automaticity, 0.10)
          + case
              when p_latency_ms <= 3000 then 0.12
              when p_latency_ms <= 7000 then 0.07
              else 0.03
            end
      )
      else greatest(
        0.0,
        coalesce(public.learner_concept_state.automaticity, 0.10) - 0.04
      )
    end,
    retrieval_latency_ms = case
      when p_successful then
        case
          when public.learner_concept_state.retrieval_latency_ms is null
            then p_latency_ms
          else round(
            public.learner_concept_state.retrieval_latency_ms * 0.7
              + p_latency_ms * 0.3
          )::integer
        end
      else public.learner_concept_state.retrieval_latency_ms
    end,
    last_exposure_at = v_now,
    last_successful_retrieval_at = case
      when p_successful then v_now
      else public.learner_concept_state.last_successful_retrieval_at
    end,
    retrieval_strength = case
      when p_successful then least(
        1.0,
        coalesce(public.learner_concept_state.retrieval_strength, 0.15) + 0.14
      )
      else greatest(
        0.0,
        coalesce(public.learner_concept_state.retrieval_strength, 0.15) - 0.06
      )
    end,
    estimate_confidence = least(
      1.0,
      public.learner_concept_state.estimate_confidence + 0.08
    ),
    exposure_count = public.learner_concept_state.exposure_count + 1,
    successful_retrieval_count =
      public.learner_concept_state.successful_retrieval_count
      + case when p_successful then 1 else 0 end,
    algorithm_version = 1;

  return v_event_id;
end;
$$;

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
    context,
    payload,
    occurred_at
  )
  values (
    v_user_id,
    p_session_id,
    p_session_item_id,
    p_concept_id,
    'repair',
    'text',
    'success',
    coalesce(p_context, '{}'::jsonb),
    jsonb_build_object(
      'response_text', p_response_text,
      'target_text', p_target_text,
      'projection_algorithm_version', 1
    ),
    v_now
  )
  returning id into v_event_id;

  insert into public.learner_concept_state (
    user_id,
    concept_id,
    recall,
    production,
    automaticity,
    last_exposure_at,
    retrieval_strength,
    estimate_confidence,
    exposure_count,
    successful_retrieval_count,
    algorithm_version
  )
  values (
    v_user_id,
    p_concept_id,
    0.14,
    0.12,
    0.06,
    v_now,
    0.13,
    0.08,
    1,
    0,
    1
  )
  on conflict (user_id, concept_id) do update
  set
    recall = least(
      1.0,
      coalesce(public.learner_concept_state.recall, 0.10) + 0.04
    ),
    production = least(
      1.0,
      coalesce(public.learner_concept_state.production, 0.08) + 0.04
    ),
    last_exposure_at = v_now,
    retrieval_strength = least(
      1.0,
      coalesce(public.learner_concept_state.retrieval_strength, 0.10) + 0.03
    ),
    estimate_confidence = least(
      1.0,
      public.learner_concept_state.estimate_confidence + 0.04
    ),
    exposure_count = public.learner_concept_state.exposure_count + 1,
    algorithm_version = 1;

  return v_event_id;
end;
$$;

revoke all on function public.record_retrieval_attempt(
  uuid,
  text,
  text,
  boolean,
  integer,
  jsonb,
  uuid,
  uuid
) from public, anon;
grant execute on function public.record_retrieval_attempt(
  uuid,
  text,
  text,
  boolean,
  integer,
  jsonb,
  uuid,
  uuid
) to authenticated;

revoke all on function public.record_repair_event(
  uuid,
  text,
  text,
  jsonb,
  uuid,
  uuid
) from public, anon;
grant execute on function public.record_repair_event(
  uuid,
  text,
  text,
  jsonb,
  uuid,
  uuid
) to authenticated;

insert into public.concepts (
  language_code,
  slug,
  kind,
  canonical_form,
  gloss,
  description,
  metadata,
  sort_order
)
values
  (
    'da',
    'maaske',
    'word',
    'måske',
    'maybe',
    'A high-frequency adverb for uncertainty or possibility.',
    '{"part_of_speech":"adverb"}'::jsonb,
    10
  ),
  (
    'da',
    'jeg-vil-gerne',
    'chunk',
    'jeg vil gerne …',
    'I would like …',
    'A productive, polite frame for expressing a wish or request.',
    '{"register":"neutral-polite"}'::jsonb,
    20
  ),
  (
    'da',
    'skal-vi-infinitive',
    'construction',
    'skal vi + infinitiv',
    'shall we + verb',
    'A construction for proposing a shared action.',
    '{"function":"suggestion"}'::jsonb,
    30
  ),
  (
    'da',
    'polite-request',
    'communicative_function',
    'en høflig anmodning',
    'making a polite request',
    'Language choices used to ask for something without sounding abrupt.',
    '{}'::jsonb,
    40
  ),
  (
    'da',
    'soft-d',
    'listening_phenomenon',
    'blødt d',
    'soft d',
    'A frequent Danish sound that often does not match learners’ expectations from spelling.',
    '{"ipa":"ð̠˕ˠ"}'::jsonb,
    50
  ),
  (
    'da',
    'stoed',
    'listening_phenomenon',
    'stød',
    'Danish stød',
    'A laryngeal feature that can distinguish words and shapes natural Danish rhythm.',
    '{}'::jsonb,
    60
  )
on conflict (language_code, slug) do update
set
  kind = excluded.kind,
  canonical_form = excluded.canonical_form,
  gloss = excluded.gloss,
  description = excluded.description,
  metadata = excluded.metadata,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.concept_relations (
  source_concept_id,
  target_concept_id,
  relation_type,
  weight
)
select
  source.id,
  target.id,
  'realizes',
  1
from public.concepts as source
join public.concepts as target
  on target.language_code = 'da'
  and target.slug = 'polite-request'
where source.language_code = 'da'
  and source.slug = 'jeg-vil-gerne'
on conflict (source_concept_id, target_concept_id, relation_type) do nothing;
