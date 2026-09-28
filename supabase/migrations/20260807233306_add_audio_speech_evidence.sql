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
    'da', 'jeg-hedder', 'chunk', 'jeg hedder …', 'my name is …',
    'The everyday Danish frame for introducing yourself.',
    '{"level":"A0","topic":"introductions"}'::jsonb, 70
  ),
  (
    'da', 'hvad-hedder-du', 'chunk', 'hvad hedder du?', 'what is your name?',
    'A common question when meeting someone.',
    '{"level":"A0","topic":"introductions"}'::jsonb, 80
  ),
  (
    'da', 'hyggeligt-at-moede-dig', 'chunk', 'hyggeligt at møde dig', 'nice to meet you',
    'A warm response to an introduction.',
    '{"level":"A0","topic":"introductions"}'::jsonb, 90
  ),
  (
    'da', 'en-kaffe-tak', 'chunk', 'en kaffe, tak', 'a coffee, please',
    'A concise and natural café order.',
    '{"level":"A0","topic":"cafe"}'::jsonb, 100
  ),
  (
    'da', 'jeg-tager', 'construction', 'jeg tager …', 'I’ll have …',
    'A relaxed way to choose something from a menu.',
    '{"level":"A1","topic":"cafe"}'::jsonb, 110
  ),
  (
    'da', 'regningen-tak', 'chunk', 'må jeg bede om regningen?', 'may I have the bill?',
    'A polite way to ask for the bill.',
    '{"level":"A1","topic":"cafe"}'::jsonb, 120
  ),
  (
    'da', 'hvor-er-stationen', 'chunk', 'hvor er stationen?', 'where is the station?',
    'A practical question for finding your way.',
    '{"level":"A0","topic":"transport"}'::jsonb, 130
  ),
  (
    'da', 'toget-til-koebenhavn', 'chunk', 'går dette tog til København?',
    'does this train go to Copenhagen?', 'A route-checking question for public transport.',
    '{"level":"A1","topic":"transport"}'::jsonb, 140
  ),
  (
    'da', 'jeg-skal-af-her', 'chunk', 'jeg skal af her', 'I need to get off here',
    'Used when leaving a bus or train.',
    '{"level":"A1","topic":"transport"}'::jsonb, 150
  ),
  (
    'da', 'jeg-forstaar-ikke', 'chunk', 'jeg forstår ikke', 'I don’t understand',
    'A direct way to repair a difficult conversation.',
    '{"level":"A0","topic":"repair"}'::jsonb, 160
  ),
  (
    'da', 'kan-du-gentage', 'chunk', 'kan du gentage det?', 'can you repeat that?',
    'A request to hear something again.',
    '{"level":"A1","topic":"repair"}'::jsonb, 170
  ),
  (
    'da', 'tal-langsommere', 'chunk', 'kan du tale lidt langsommere?',
    'can you speak a little more slowly?', 'A polite request to slow down.',
    '{"level":"A1","topic":"repair"}'::jsonb, 180
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

  if p_score < 0 or p_score > 1 then
    raise exception 'Score must be between zero and one';
  end if;

  if p_latency_ms < 0 then
    raise exception 'Latency must be non-negative';
  end if;

  if p_playback_count < 1 then
    raise exception 'Playback count must be positive';
  end if;

  if length(trim(p_speaker_id)) = 0 then
    raise exception 'Speaker identifier is required';
  end if;

  if jsonb_typeof(coalesce(p_context, '{}'::jsonb)) <> 'object' then
    raise exception 'Context must be a JSON object';
  end if;

  insert into public.learning_events (
    user_id,
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
    p_concept_id,
    'listening_attempt',
    'audio',
    case when p_successful then 'success' else 'failure' end,
    p_latency_ms,
    coalesce(p_context, '{}'::jsonb),
    jsonb_build_object(
      'score', p_score,
      'speaker_id', p_speaker_id,
      'playback_count', p_playback_count,
      'projection_algorithm_version', 1
    ),
    v_now
  )
  returning id into v_event_id;

  insert into public.learner_concept_state (
    user_id,
    concept_id,
    recognition_audio,
    speaker_diversity,
    last_exposure_at,
    estimate_confidence,
    exposure_count,
    successful_retrieval_count,
    algorithm_version
  )
  values (
    v_user_id,
    p_concept_id,
    p_score,
    case when p_playback_count <= 2 then 0.16 else 0.10 end,
    v_now,
    0.10,
    1,
    0,
    1
  )
  on conflict (user_id, concept_id) do update
  set
    recognition_audio = least(
      1.0,
      coalesce(public.learner_concept_state.recognition_audio, 0.15) * 0.70
        + p_score * 0.30
    ),
    speaker_diversity = least(
      1.0,
      coalesce(public.learner_concept_state.speaker_diversity, 0.08)
        + case when p_playback_count <= 2 then 0.08 else 0.04 end
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

  if p_accuracy_score < 0 or p_accuracy_score > 1
    or p_fluency_score < 0 or p_fluency_score > 1
    or p_completeness_score < 0 or p_completeness_score > 1
    or p_pronunciation_score < 0 or p_pronunciation_score > 1 then
    raise exception 'Speaking scores must be between zero and one';
  end if;

  if length(trim(p_reference_text)) = 0 then
    raise exception 'Reference text is required';
  end if;

  if jsonb_typeof(coalesce(p_word_details, '[]'::jsonb)) <> 'array' then
    raise exception 'Word details must be a JSON array';
  end if;

  if jsonb_typeof(coalesce(p_context, '{}'::jsonb)) <> 'object' then
    raise exception 'Context must be a JSON object';
  end if;

  insert into public.learning_events (
    user_id,
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
    p_concept_id,
    'speaking_attempt',
    'speech',
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
      'audio_retained', false,
      'projection_algorithm_version', 1
    ),
    v_now
  )
  returning id into v_event_id;

  insert into public.learner_concept_state (
    user_id,
    concept_id,
    production,
    pronunciation,
    automaticity,
    last_exposure_at,
    estimate_confidence,
    exposure_count,
    successful_retrieval_count,
    algorithm_version
  )
  values (
    v_user_id,
    p_concept_id,
    p_completeness_score,
    p_pronunciation_score,
    p_fluency_score,
    v_now,
    0.12,
    1,
    0,
    1
  )
  on conflict (user_id, concept_id) do update
  set
    production = least(
      1.0,
      coalesce(public.learner_concept_state.production, 0.12) * 0.70
        + p_completeness_score * 0.30
    ),
    pronunciation = least(
      1.0,
      coalesce(public.learner_concept_state.pronunciation, 0.12) * 0.70
        + p_pronunciation_score * 0.30
    ),
    automaticity = least(
      1.0,
      coalesce(public.learner_concept_state.automaticity, 0.08) * 0.80
        + p_fluency_score * 0.20
    ),
    last_exposure_at = v_now,
    estimate_confidence = least(
      1.0,
      public.learner_concept_state.estimate_confidence + 0.09
    ),
    exposure_count = public.learner_concept_state.exposure_count + 1,
    algorithm_version = 1;

  return v_event_id;
end;
$$;

revoke all on function public.record_listening_attempt(
  uuid,
  boolean,
  real,
  integer,
  text,
  integer,
  jsonb
) from public, anon;
grant execute on function public.record_listening_attempt(
  uuid,
  boolean,
  real,
  integer,
  text,
  integer,
  jsonb
) to authenticated;

revoke all on function public.record_speaking_attempt(
  uuid,
  text,
  text,
  real,
  real,
  real,
  real,
  boolean,
  jsonb,
  jsonb
) from public, anon;
grant execute on function public.record_speaking_attempt(
  uuid,
  text,
  text,
  real,
  real,
  real,
  real,
  boolean,
  jsonb,
  jsonb
) to authenticated;
