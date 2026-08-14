create index learning_event_concepts_concept_id_idx
  on public.learning_event_concepts (concept_id);

create index learning_event_concepts_event_id_user_id_idx
  on public.learning_event_concepts (event_id, user_id);

create index speech_resolutions_event_id_user_id_idx
  on public.speech_resolutions (event_id, user_id);
