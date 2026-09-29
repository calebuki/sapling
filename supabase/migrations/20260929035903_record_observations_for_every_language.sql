-- record_learning_observation still rejected every concept that wasn't Swedish,
-- so German and Danish answers failed to save. Accept any active concept.
create or replace function public.record_learning_observation(p_input jsonb)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare
  uid uuid := auth.uid();
  cid uuid;
  dimension text;
  attempt_id text;
  assisted boolean;
  success boolean;
  latency integer;
  observation_context jsonb;
  event_id bigint;
  independent boolean;
  delta real;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(p_input) is distinct from 'object' or length(p_input::text) > 16000 then
    raise exception 'Invalid observation';
  end if;

  begin
    cid := nullif(btrim(p_input->>'conceptId'), '')::uuid;
    dimension := p_input->>'dimension';
    attempt_id := nullif(btrim(p_input->>'attemptId'), '');
    assisted := coalesce((p_input->>'assisted')::boolean, false);
    success := coalesce((p_input->>'successful')::boolean, false);
    latency := (p_input->>'latencyMs')::integer;
  exception when invalid_text_representation or numeric_value_out_of_range then
    raise exception 'Invalid observation';
  end;

  observation_context := coalesce(nullif(p_input->'context', 'null'::jsonb), '{}'::jsonb);
  if cid is null or dimension is null or dimension not in ('exposure','recognitionAudio','recall','production')
    or attempt_id is null or length(attempt_id) > 120
    or latency < 0 or jsonb_typeof(observation_context) is distinct from 'object' then
    raise exception 'Invalid observation';
  end if;
  if not exists (select 1 from public.concepts where id = cid and is_active) then
    raise exception 'Unknown concept';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(uid::text || ':adaptive:' || attempt_id, 0));
  select id into event_id from public.learning_events
    where user_id = uid and context->>'source' = 'adaptive-v3'
    and context->>'attemptId' = attempt_id;
  if event_id is not null then return event_id; end if;
  independent := dimension <> 'exposure' and not assisted;
  delta := case when success then 0.12 else -0.08 end;
  insert into public.learning_events(user_id, primary_concept_id, event_type, modality, outcome,
    response_latency_ms, context, payload, schema_version)
  values(uid,cid,case when dimension = 'exposure' then 'exposure'
      when assisted then 'repair' when dimension = 'recognitionAudio' then 'listening_attempt'
      else 'retrieval_attempt' end,
    case when dimension = 'recognitionAudio' then 'audio'
      when observation_context->>'modality' in ('speech','mixed') then observation_context->>'modality'
      else 'text' end,
    case when not independent then 'partial' when success then 'success' else 'failure' end,
    latency, observation_context ||
      jsonb_build_object('source','adaptive-v3','attemptId',attempt_id,'dimension',dimension,
        'assisted',assisted,'projection_algorithm_version',3),
    p_input, 3) returning id into event_id;
  insert into public.learner_concept_state(user_id,concept_id) values(uid,cid)
    on conflict do nothing;
  update public.learner_concept_state set
    recognition_audio = case when independent and dimension = 'recognitionAudio'
      then greatest(0,least(1,coalesce(recognition_audio,0.15)+delta)) else recognition_audio end,
    recall = case when independent and dimension = 'recall'
      then greatest(0,least(1,coalesce(recall,0.15)+delta)) else recall end,
    production = case when independent and dimension = 'production'
      then greatest(0,least(1,coalesce(production,0.15)+delta)) else production end,
    retrieval_strength = case when independent and dimension in ('recall','production')
      then greatest(0,least(1,coalesce(retrieval_strength,0.1) + case when success then 0.08 else -0.08 end))
      else retrieval_strength end,
    automaticity = case when independent and success and dimension in ('recall','production') and latency between 1 and 60000
      then least(1,coalesce(automaticity,0) + case when latency <= 3000 then 0.06 when latency <= 7000 then 0.025 else 0 end)
      else automaticity end,
    retrieval_latency_ms = case when independent and success and dimension in ('recall','production') and latency between 1 and 60000
      then case when retrieval_latency_ms is null then latency else round(retrieval_latency_ms*0.7 + latency*0.3) end
      else retrieval_latency_ms end,
    last_successful_retrieval_at = case when independent and success and dimension in ('recall','production')
      then now() else last_successful_retrieval_at end,
    successful_retrieval_count = successful_retrieval_count + case when independent and success and dimension in ('recall','production') then 1 else 0 end,
    estimate_confidence = least(1,estimate_confidence + case when independent then 0.04 else 0 end),
    exposure_count = exposure_count + 1, last_exposure_at = now(), algorithm_version = 3
  where user_id = uid and concept_id = cid;
  return event_id;
end;
$$;
