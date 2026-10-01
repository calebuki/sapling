-- Every neural line that gets made is kept for everyone, whoever asked for it:
-- a signed-in player, or a visitor (demo mode, local testing). Before this,
-- lines made without a signed-in session were generated, played once and
-- thrown away.
--
-- Visitors may add a clip that isn't there yet, under the same rules as
-- players: names must match the clip-path scheme in src/lib/speech/clips.ts,
-- and nobody but voice reviewers can overwrite or delete one.
do $do$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Visitors add new speech clips'
  ) then
    create policy "Visitors add new speech clips"
      on storage.objects for insert to anon
      with check (
        bucket_id = 'speech'
        and name ~ '^(sv|de|da|vi)/[A-Za-z]+/(normal|slow)/[0-9a-f]{64}\.mp3$'
      );
  end if;
end
$do$;

-- Recording a clip in voice_lines no longer needs a sign-in, but it does need
-- the clip: the path must be the hash of exactly these words in this voice,
-- and the file must already be in the bucket.
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
  expected := p_language_code || '/' || p_voice || '/' || case when p_slow then 'slow' else 'normal' end || '/'
    || encode(
      sha256(convert_to(concat_ws(E'\n', p_version, p_language_code, p_voice, case when p_slow then 'slow' else 'normal' end, p_text), 'UTF8')),
      'hex'
    ) || '.mp3';
  if p_path is distinct from expected then
    raise exception 'clip path does not match its line' using errcode = '22023';
  end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'speech' and o.name = p_path) then
    raise exception 'store the clip first' using errcode = '22023';
  end if;

  insert into public.voice_lines (path, language_code, voice, slow, text, has_audio)
  values (p_path, p_language_code, p_voice, p_slow, p_text, true)
  on conflict (path) do update set has_audio = true;
end;
$$;

grant execute on function public.record_speech_clip(text, text, text, boolean, text, text) to anon, authenticated, service_role;
