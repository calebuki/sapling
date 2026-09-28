-- The hosted database never received 20260827000141_add_read_write_practice,
-- and replaying it now would narrow session kinds and event types that later
-- migrations widened. This adds only what it was missing, and is safe to run
-- on a database that already has it.

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
      'conversation_turn',
      'error',
      'repair',
      'successful_transfer',
      'story_encounter',
      'concept_encounter'
    )
  );

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

create table if not exists public.reading_attempts (
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

create index if not exists reading_attempts_user_id_created_at_idx
  on public.reading_attempts (user_id, created_at desc);

create index if not exists reading_attempts_concept_id_idx
  on public.reading_attempts (concept_id);

alter table public.reading_attempts enable row level security;

drop policy if exists reading_attempts_select_own on public.reading_attempts;
create policy reading_attempts_select_own
on public.reading_attempts
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists reading_attempts_insert_own on public.reading_attempts;
create policy reading_attempts_insert_own
on public.reading_attempts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

revoke all on table public.reading_attempts from anon, authenticated;
grant select, insert on table public.reading_attempts to authenticated;
