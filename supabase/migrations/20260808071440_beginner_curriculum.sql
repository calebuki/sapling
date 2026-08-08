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
  ('da', 'hej', 'word', 'hej', 'hello', 'The everyday Danish greeting.', '{"level":"A0","topic":"foundations"}'::jsonb, 61),
  ('da', 'tak', 'word', 'tak', 'thanks', 'A high-frequency word for thanks and polite requests.', '{"level":"A0","topic":"foundations"}'::jsonb, 62),
  ('da', 'ja', 'word', 'ja', 'yes', 'The basic Danish word for yes.', '{"level":"A0","topic":"foundations"}'::jsonb, 63),
  ('da', 'nej', 'word', 'nej', 'no', 'The basic Danish word for no.', '{"level":"A0","topic":"foundations"}'::jsonb, 64),
  ('da', 'kaffe', 'word', 'kaffe', 'coffee', 'A common café drink.', '{"level":"A0","topic":"cafe"}'::jsonb, 91),
  ('da', 'te', 'word', 'te', 'tea', 'A common café drink.', '{"level":"A0","topic":"cafe"}'::jsonb, 92),
  ('da', 'vand', 'word', 'vand', 'water', 'The Danish word for water.', '{"level":"A0","topic":"cafe"}'::jsonb, 93),
  ('da', 'maelk', 'word', 'mælk', 'milk', 'The Danish word for milk.', '{"level":"A0","topic":"cafe"}'::jsonb, 94),
  ('da', 'kanelsnegl', 'word', 'kanelsnegl', 'cinnamon roll', 'A familiar Danish cinnamon pastry.', '{"level":"A0","topic":"cafe"}'::jsonb, 95),
  ('da', 'med-maelk', 'chunk', 'med mælk', 'with milk', 'A small reusable café phrase.', '{"level":"A0","topic":"cafe"}'::jsonb, 105),
  ('da', 'og-en-kanelsnegl', 'chunk', 'og en kanelsnegl', 'and a cinnamon roll', 'A phrase for adding food to an order.', '{"level":"A0","topic":"cafe"}'::jsonb, 106),
  ('da', 'cafe-order-drink', 'communicative_function', 'bestil en drink', 'order a drink', 'Ordering a chosen drink naturally.', '{"level":"A0","topic":"cafe","stage":"scenario"}'::jsonb, 115),
  ('da', 'cafe-order-food', 'communicative_function', 'bestil noget at spise', 'order something to eat', 'Adding food to a café order.', '{"level":"A0","topic":"cafe","stage":"scenario"}'::jsonb, 116),
  ('da', 'cafe-ask-bill', 'communicative_function', 'bed om regningen', 'ask for the bill', 'Finishing a café interaction naturally.', '{"level":"A0","topic":"cafe","stage":"scenario"}'::jsonb, 117)
on conflict (language_code, slug) do update
set
  kind = excluded.kind,
  canonical_form = excluded.canonical_form,
  gloss = excluded.gloss,
  description = excluded.description,
  metadata = excluded.metadata,
  sort_order = excluded.sort_order,
  is_active = true;
