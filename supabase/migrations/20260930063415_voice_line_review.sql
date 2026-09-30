-- Voice line review. Every neural clip in the speech bucket gets a row here
-- with the words it says, who says them and where the course uses them, so a
-- reviewer can listen through them at /dev/voices. Rejecting a line queues it
-- to be made again (Gemini or OpenAI); the new take replaces the clip in the
-- bucket and comes back for review.
--
-- Only reviewers (public.voice_reviewers) can see or change any of it. Add one:
--   insert into public.voice_reviewers (user_id)
--   select id from auth.users where email = '<their email>';

create table public.voice_reviewers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);

alter table public.voice_reviewers enable row level security;

create or replace function public.is_voice_reviewer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.voice_reviewers where user_id = (select auth.uid()));
$$;

revoke all on function public.is_voice_reviewer() from public, anon;
grant execute on function public.is_voice_reviewer() to authenticated;

create policy voice_reviewers_select_own
on public.voice_reviewers
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.voice_reviewers from public, anon, authenticated;
grant select on public.voice_reviewers to authenticated;

-- unreviewed: waiting for a listen (new lines, and every new take)
-- approved:   sounds right
-- rejected:   sounds wrong; always has a job in the queue until it is remade
-- queued:     sent to the queue without a verdict (missing audio, try the other provider)
create type public.voice_line_status as enum ('unreviewed', 'approved', 'rejected', 'queued');

create table public.voice_lines (
  id uuid primary key default gen_random_uuid(),
  -- The clip's object in the speech bucket (see src/lib/speech/clips.ts).
  path text not null unique check (path ~ '^[a-z]{2}/[A-Za-z]+/(normal|slow)/[0-9a-f]{64}\.mp3$'),
  language_code text not null check (language_code ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'),
  voice text not null,
  slow boolean not null default false,
  text text not null check (length(text) between 1 and 400),
  en text,
  word_count integer generated always as (
    coalesce(array_length(regexp_split_to_array(btrim(text), '\s+'), 1), 0)
  ) stored,
  speaker text,
  sources text[] not null default '{}',
  units text[] not null default '{}',
  level text check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  -- False for lines the course no longer says, and for lines only heard at
  -- runtime (AI replies), which the game records when it first stores them.
  in_catalog boolean not null default false,
  has_audio boolean not null default false,
  provider text not null default 'gemini' check (provider in ('gemini', 'openai')),
  take integer not null default 1 check (take >= 1),
  status public.voice_line_status not null default 'unreviewed',
  note text check (note is null or length(note) <= 1000),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  audio_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index voice_lines_language_status_idx on public.voice_lines (language_code, status);
create index voice_lines_reviewed_by_idx on public.voice_lines (reviewed_by);

create trigger voice_lines_set_updated_at
before update on public.voice_lines
for each row execute function private.set_updated_at();

create table public.voice_line_jobs (
  id bigint generated always as identity primary key,
  line_id uuid not null references public.voice_lines (id) on delete cascade,
  provider text not null default 'gemini' check (provider in ('gemini', 'openai')),
  -- Added to the island's voice direction for this take ("stress the second word").
  direction text check (direction is null or length(direction) <= 500),
  reason text not null default 'requested' check (reason in ('rejected', 'requested')),
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed', 'cancelled')),
  error text,
  requested_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

-- A line waits in the queue at most once.
create unique index voice_line_jobs_one_open_idx on public.voice_line_jobs (line_id) where status in ('queued', 'running');
create index voice_line_jobs_line_idx on public.voice_line_jobs (line_id);
create index voice_line_jobs_status_idx on public.voice_line_jobs (status, created_at);
create index voice_line_jobs_requested_by_idx on public.voice_line_jobs (requested_by);

alter table public.voice_lines enable row level security;
alter table public.voice_line_jobs enable row level security;

create policy voice_lines_reviewers_select
on public.voice_lines
for select
to authenticated
using ((select public.is_voice_reviewer()));

create policy voice_line_jobs_reviewers_select
on public.voice_line_jobs
for select
to authenticated
using ((select public.is_voice_reviewer()));

-- Changes go through review_voice_lines so a verdict and its queue entry land together.
revoke all on public.voice_lines from public, anon, authenticated;
revoke all on public.voice_line_jobs from public, anon, authenticated;
grant select on public.voice_lines to authenticated;
grant select on public.voice_line_jobs to authenticated;

-- A reviewer's verdict on one or more lines. Rejecting or queueing puts each
-- line in the queue (or updates its waiting entry); approving or resetting
-- takes it out, unless a take is already being made.
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
    select id, p_provider, nullif(btrim(p_direction), ''),
           case when p_status = 'rejected' then 'rejected' else 'requested' end,
           (select auth.uid())
    from public.voice_lines
    where id = any (p_ids)
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

revoke all on function public.review_voice_lines(uuid[], public.voice_line_status, text, text, text) from public, anon;
grant execute on function public.review_voice_lines(uuid[], public.voice_line_status, text, text, text) to authenticated;

-- Failed jobs go back in the queue.
create or replace function public.retry_voice_line_jobs(p_ids bigint[])
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
  update public.voice_line_jobs j
  set status = 'queued', error = null, started_at = null, finished_at = null
  where j.id = any (p_ids)
    and j.status = 'failed'
    and not exists (
      select 1 from public.voice_line_jobs o
      where o.line_id = j.line_id and o.status in ('queued', 'running')
    );
  get diagnostics changed = row_count;
  return changed;
end;
$$;

revoke all on function public.retry_voice_line_jobs(bigint[]) from public, anon;
grant execute on function public.retry_voice_line_jobs(bigint[]) to authenticated;

-- The worker (server only) takes the oldest waiting job. A job left running
-- for five minutes is assumed abandoned and taken again.
create or replace function public.claim_voice_line_job()
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
  take integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with next_job as (
    select j.id
    from public.voice_line_jobs j
    where j.status = 'queued'
       or (j.status = 'running' and j.started_at < now() - interval '5 minutes')
    order by j.created_at
    limit 1
    for update skip locked
  ), claimed as (
    update public.voice_line_jobs j
    set status = 'running', started_at = now(), error = null
    from next_job
    where j.id = next_job.id
    returning j.id, j.provider, j.direction, j.line_id
  )
  select c.id, c.provider, c.direction, l.id, l.path, l.language_code, l.voice, l.slow, l.text, l.take
  from claimed c
  join public.voice_lines l on l.id = c.line_id;
end;
$$;

-- A finished job: a new take is ready for review, or the error is kept.
create or replace function public.finish_voice_line_job(p_job_id bigint, p_error text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  job public.voice_line_jobs;
begin
  update public.voice_line_jobs
  set status = case when p_error is null then 'done' else 'failed' end,
      error = left(p_error, 1000),
      finished_at = now()
  where id = p_job_id and status = 'running'
  returning * into job;

  if job.id is null or p_error is not null then
    return;
  end if;

  update public.voice_lines
  set take = take + 1,
      provider = job.provider,
      has_audio = true,
      audio_updated_at = now(),
      status = 'unreviewed',
      reviewed_by = null,
      reviewed_at = null
  where id = job.line_id;
end;
$$;

revoke all on function public.claim_voice_line_job() from public, anon, authenticated;
revoke all on function public.finish_voice_line_job(bigint, text) from public, anon, authenticated;
grant execute on function public.claim_voice_line_job() to service_role;
grant execute on function public.finish_voice_line_job(bigint, text) to service_role;

-- The game records a line the first time anyone stores its clip, so lines
-- that only exist at runtime (AI replies) are reviewable too. The path must be
-- the hash of exactly these words in this voice, so nothing else gets in.
create or replace function public.record_speech_clip(
  p_path text,
  p_language_code text,
  p_voice text,
  p_slow boolean,
  p_text text,
  p_version text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected text;
begin
  if (select auth.uid()) is null then
    raise exception 'sign in first' using errcode = '42501';
  end if;
  expected := p_language_code || '/' || p_voice || '/' || case when p_slow then 'slow' else 'normal' end || '/'
    || encode(
      sha256(convert_to(concat_ws(E'\n', p_version, p_language_code, p_voice, case when p_slow then 'slow' else 'normal' end, p_text), 'UTF8')),
      'hex'
    ) || '.mp3';
  if p_path is distinct from expected then
    raise exception 'clip path does not match its line' using errcode = '22023';
  end if;

  insert into public.voice_lines (path, language_code, voice, slow, text, has_audio)
  values (p_path, p_language_code, p_voice, p_slow, p_text, true)
  on conflict (path) do update set has_audio = true;
end;
$$;

revoke all on function public.record_speech_clip(text, text, text, boolean, text, text) from public, anon;
grant execute on function public.record_speech_clip(text, text, text, boolean, text, text) to authenticated;

-- Brings one language's lines up to date with its island (server only). Only
-- rows that actually change are written, so a sync that finds nothing new
-- leaves updated_at alone and sends reviewers no realtime noise. Reviews are
-- never touched; lines the course dropped are marked out of the catalog, and
-- every line learns whether its clip is in the bucket.
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

revoke all on function public.sync_voice_lines(text, jsonb) from public, anon, authenticated;
grant execute on function public.sync_voice_lines(text, jsonb) to service_role;

-- Reviewers see each other's verdicts and the queue move as it happens.
alter publication supabase_realtime add table public.voice_lines, public.voice_line_jobs;

-- Cát Bà's clips belong in the bucket too.
drop policy if exists "Signed-in players add new speech clips" on storage.objects;
create policy "Signed-in players add new speech clips"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'speech'
    and name ~ '^(sv|de|da|vi)/[A-Za-z]+/(normal|slow)/[0-9a-f]{64}\.mp3$'
  );
