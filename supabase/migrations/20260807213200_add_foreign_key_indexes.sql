-- Cover foreign-key lookup paths used by deletes, joins, and integrity checks.
create index errors_concept_id_idx
  on public.errors (concept_id);

create index learning_events_primary_concept_id_idx
  on public.learning_events (primary_concept_id);

create index learning_events_session_id_user_id_idx
  on public.learning_events (session_id, user_id);

create index learning_events_session_item_id_user_id_idx
  on public.learning_events (session_item_id, user_id);

create index retrieval_attempts_event_id_user_id_idx
  on public.retrieval_attempts (event_id, user_id);

create index session_items_session_id_user_id_idx
  on public.session_items (session_id, user_id);
