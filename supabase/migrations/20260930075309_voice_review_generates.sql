-- Voice review makes clips too: lines nobody has heard yet are generated from
-- /dev/voices and come back for review. Everything runs as the reviewer
-- (their session and these policies), so the app never needs the secret key.

-- 'generate': the line had no clip yet, as opposed to a remake.
alter table public.voice_line_jobs drop constraint voice_line_jobs_reason_check;
alter table public.voice_line_jobs
  add constraint voice_line_jobs_reason_check check (reason in ('rejected', 'requested', 'generate'));

-- Jobs run in the order they were queued (identity order, which follows the
-- order of p_ids, so a batch is made in the order the reviewer sees it).
drop index public.voice_line_jobs_status_idx;
create index voice_line_jobs_status_idx on public.voice_line_jobs (status, id);

create or replace function public.review_voice_lines(
  p_ids uuid[],
  p_status public.voice_line_status,
  p_note text default null,
  p_provider text default 'gemini',
  p_direction text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed integer;
begin
  if not public.is_voice_reviewer() then
    raise exception 'not a voice reviewer' using errcode = '42501';
  end if;
  if p_provider not in ('gemini', 'openai') then
    raise exception 'unknown provider %', p_provider using errcode = '22023';
  end if;

  update public.voice_lines
  set status = p_status,
      note = coalesce(nullif(btrim(p_note), ''), case when p_status = 'approved' then null else note end),
      reviewed_by = case when p_status = 'unreviewed' then null else (select auth.uid()) end,
      reviewed_at = case when p_status = 'unreviewed' then null else now() end
  where id = any (p_ids);
  get diagnostics changed = row_count;

  if p_status in ('rejected', 'queued') then
    insert into public.voice_line_jobs (line_id, provider, direction, reason, requested_by)
    select l.id, p_provider, nullif(btrim(p_direction), ''),
           case when p_status = 'rejected' then 'rejected' when not l.has_audio then 'generate' else 'requested' end,
           (select auth.uid())
    from (
      select distinct on (u.id) u.id, u.position
      from unnest(p_ids) with ordinality as u (id, position)
      order by u.id, u.position
    ) wanted
    join public.voice_lines l on l.id = wanted.id
    order by wanted.position
    on conflict (line_id) where status in ('queued', 'running')
    do update set provider = excluded.provider,
                  direction = excluded.direction,
                  reason = excluded.reason,
                  requested_by = excluded.requested_by;
  else
    update public.voice_line_jobs
    set status = 'cancelled', finished_at = now()
    where line_id = any (p_ids) and status = 'queued';
  end if;

  return changed;
end;
$$;

-- The claim now says whether there is a take to keep, and reviewers run it.
drop function public.claim_voice_line_job();
create function public.claim_voice_line_job()
returns table (
  job_id bigint,
  provider text,
  direction text,
  line_id uuid,
  path text,
  language_code text,
  voice text,
  slow boolean,
  text text,
  take integer,
  has_audio boolean
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_voice_reviewer() then
    raise exception 'not a voice reviewer' using errcode = '42501';
  end if;
  return query
  with next_job as (
    select j.id
    from public.voice_line_jobs j
    where j.status = 'queued'
       or (j.status = 'running' and j.started_at < now() - interval '5 minutes')
    order by j.id
    limit 1
    for update skip locked
  ), claimed as (
    update public.voice_line_jobs j
    set status = 'running', started_at = now(), error = null
    from next_job
    where j.id = next_job.id
    returning j.id, j.provider, j.direction, j.line_id
  )
  select c.id, c.provider, c.direction, l.id, l.path, l.language_code, l.voice, l.slow, l.text, l.take, l.has_audio
  from claimed c
  join public.voice_lines l on l.id = c.line_id;
end;
$$;

-- A finished job. A line's first clip is take 1; each remake adds one.
-- p_requeue puts the job back (a quota or key problem, not the line's fault).
drop function public.finish_voice_line_job(bigint, text);
create function public.finish_voice_line_job(p_job_id bigint, p_error text default null, p_requeue boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  job public.voice_line_jobs;
begin
  if not public.is_voice_reviewer() then
    raise exception 'not a voice reviewer' using errcode = '42501';
  end if;

  update public.voice_line_jobs
  set status = case when p_requeue then 'queued' when p_error is null then 'done' else 'failed' end,
      error = left(p_error, 1000),
      started_at = case when p_requeue then null else started_at end,
      finished_at = case when p_requeue then null else now() end
  where id = p_job_id and status = 'running'
  returning * into job;

  if job.id is null or p_error is not null then
    return;
  end if;

  update public.voice_lines
  set take = take + case when has_audio then 1 else 0 end,
      provider = job.provider,
      has_audio = true,
      audio_updated_at = now(),
      status = 'unreviewed',
      reviewed_by = null,
      reviewed_at = null
  where id = job.line_id;
end;
$$;

revoke all on function public.claim_voice_line_job() from public, anon;
revoke all on function public.finish_voice_line_job(bigint, text, boolean) from public, anon;
grant execute on function public.claim_voice_line_job() to authenticated;
grant execute on function public.finish_voice_line_job(bigint, text, boolean) to authenticated;

-- Sync runs as the reviewer too.
create or replace function public.sync_voice_lines(p_language_code text, p_lines jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  added integer;
  changed integer;
  dropped integer;
  audio integer;
begin
  if not public.is_voice_reviewer() then
    raise exception 'not a voice reviewer' using errcode = '42501';
  end if;

  drop table if exists pg_temp.incoming;
  create temporary table incoming on commit drop as
  select *
  from jsonb_to_recordset(p_lines) as x (
    path text, voice text, slow boolean, text text, en text, speaker text, sources text[], units text[], level text
  );

  insert into public.voice_lines (path, language_code, voice, slow, text, en, speaker, sources, units, level, in_catalog)
  select i.path, p_language_code, i.voice, i.slow, i.text, i.en, i.speaker, i.sources, i.units, i.level, true
  from pg_temp.incoming i
  on conflict (path) do nothing;
  get diagnostics added = row_count;

  update public.voice_lines l
  set en = i.en, speaker = i.speaker, sources = i.sources, units = i.units, level = i.level, in_catalog = true
  from pg_temp.incoming i
  where l.path = i.path
    and (l.en, l.speaker, l.sources, l.units, l.level, l.in_catalog)
        is distinct from (i.en, i.speaker, i.sources, i.units, i.level, true);
  get diagnostics changed = row_count;

  update public.voice_lines l
  set in_catalog = false
  where l.language_code = p_language_code
    and l.in_catalog
    and not exists (select 1 from pg_temp.incoming i where i.path = l.path);
  get diagnostics dropped = row_count;

  update public.voice_lines l
  set has_audio = not l.has_audio
  where l.language_code = p_language_code
    and l.has_audio is distinct from exists (
      select 1 from storage.objects o where o.bucket_id = 'speech' and o.name = l.path
    );
  get diagnostics audio = row_count;

  return jsonb_build_object('added', added, 'changed', changed, 'dropped', dropped, 'audio', audio);
end;
$$;

revoke all on function public.sync_voice_lines(text, jsonb) from public, anon;
grant execute on function public.sync_voice_lines(text, jsonb) to authenticated;

-- Reviewers may replace clips and keep earlier takes under history/.
-- (Anyone signed in may already add a clip that isn't there yet.)
create policy "Voice reviewers read speech clips"
  on storage.objects for select to authenticated
  using (bucket_id = 'speech' and (select public.is_voice_reviewer()));

create policy "Voice reviewers add speech clips and takes"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'speech'
    and (select public.is_voice_reviewer())
    and name ~ '^(history/)?[a-z]{2}/[A-Za-z]+/(normal|slow)/[0-9a-f]{64}(\.take[0-9]+)?\.mp3$'
  );

create policy "Voice reviewers replace speech clips"
  on storage.objects for update to authenticated
  using (bucket_id = 'speech' and (select public.is_voice_reviewer()))
  with check (
    bucket_id = 'speech'
    and name ~ '^[a-z]{2}/[A-Za-z]+/(normal|slow)/[0-9a-f]{64}\.mp3$'
  );
