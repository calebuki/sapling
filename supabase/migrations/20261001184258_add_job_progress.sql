-- Progress in the villagers' jobs (Franz's café rush, Hilde's farmhouse...):
-- per island and host, the hardest level opened and the best stars on each.
-- Like the wardrobe it is written by the learner's own session
-- (profiles_update_own) and only has to stay a small JSON object; the app
-- validates it when reading and only ever lets it grow.
alter table public.profiles
  add column if not exists jobs jsonb not null default '{}'::jsonb
  constraint profiles_jobs_is_small_object check (
    jsonb_typeof(jobs) = 'object' and pg_column_size(jobs) <= 8192
  );
