create index listening_attempts_concept_id_idx
  on public.listening_attempts (concept_id);

create index listening_attempts_event_id_user_id_idx
  on public.listening_attempts (event_id, user_id);
