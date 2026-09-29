-- Neural speech clips, generated once and read by every player. The bucket is
-- public, so clips load straight from the storage CDN without a signed URL.
-- Signed-in players (through /api/speech) may add a clip that isn't there yet;
-- nobody can overwrite or delete one, and names must match the clip-path
-- scheme in src/lib/speech/clips.ts.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('speech', 'speech', true, 524288, array['audio/mpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Signed-in players add new speech clips" on storage.objects;
create policy "Signed-in players add new speech clips"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'speech'
    and name ~ '^(sv|de|da)/[A-Za-z]+/(normal|slow)/[0-9a-f]{64}\.mp3$'
  );
