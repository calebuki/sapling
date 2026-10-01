-- The player's wardrobe: what they wear, the best level reached on each
-- island and the gifts villagers have given. It is cosmetic and written by
-- the learner's own session (profiles_update_own), so it only needs to stay a
-- small JSON object; the app validates its contents when it reads them.
alter table public.profiles
  add column wardrobe jsonb not null default '{}'::jsonb
  constraint profiles_wardrobe_is_small_object check (
    jsonb_typeof(wardrobe) = 'object' and pg_column_size(wardrobe) <= 8192
  );
