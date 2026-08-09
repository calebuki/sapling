-- Seed the complete Swedish beginner track alongside the existing Danish course.
insert into public.concepts (
  language_code,
  slug,
  kind,
  canonical_form,
  gloss,
  description,
  metadata,
  sort_order,
  is_active
)
values
  ('sv', 'hej', 'word', 'hej', 'hello', 'The everyday Swedish greeting.', '{"level":"A0","topic":"foundations"}'::jsonb, 1001, true),
  ('sv', 'tack', 'word', 'tack', 'thanks', 'The everyday Swedish word for thanks.', '{"level":"A0","topic":"foundations"}'::jsonb, 1002, true),
  ('sv', 'ja', 'word', 'ja', 'yes', 'The basic Swedish word for yes.', '{"level":"A0","topic":"foundations"}'::jsonb, 1003, true),
  ('sv', 'nej', 'word', 'nej', 'no', 'The basic Swedish word for no.', '{"level":"A0","topic":"foundations"}'::jsonb, 1004, true),
  ('sv', 'jag-heter', 'chunk', 'jag heter …', 'my name is …', 'The everyday Swedish frame for introducing yourself.', '{"level":"A0","topic":"introductions"}'::jsonb, 1010, true),
  ('sv', 'vad-heter-du', 'chunk', 'vad heter du?', 'what is your name?', 'A natural way to ask someone their name.', '{"level":"A0","topic":"introductions"}'::jsonb, 1011, true),
  ('sv', 'trevligt-att-traeffas', 'chunk', 'trevligt att träffas', 'nice to meet you', 'A warm standard response to an introduction.', '{"level":"A0","topic":"introductions"}'::jsonb, 1012, true),
  ('sv', 'kaffe', 'word', 'kaffe', 'coffee', 'The Swedish word for coffee.', '{"level":"A0","topic":"cafe"}'::jsonb, 1020, true),
  ('sv', 'te', 'word', 'te', 'tea', 'The Swedish word for tea.', '{"level":"A0","topic":"cafe"}'::jsonb, 1021, true),
  ('sv', 'vatten', 'word', 'vatten', 'water', 'The Swedish word for water.', '{"level":"A0","topic":"cafe"}'::jsonb, 1022, true),
  ('sv', 'mjoelk', 'word', 'mjölk', 'milk', 'The Swedish word for milk.', '{"level":"A0","topic":"cafe"}'::jsonb, 1023, true),
  ('sv', 'kanelbulle', 'word', 'kanelbulle', 'cinnamon bun', 'A classic Swedish cinnamon bun.', '{"level":"A0","topic":"cafe"}'::jsonb, 1024, true),
  ('sv', 'jag-skulle-vilja', 'construction', 'jag skulle vilja ha …', 'I would like …', 'A polite frame for asking for something.', '{"level":"A1","topic":"cafe"}'::jsonb, 1030, true),
  ('sv', 'med-mjoelk', 'chunk', 'med mjölk', 'with milk', 'A short phrase for modifying a drink order.', '{"level":"A0","topic":"cafe"}'::jsonb, 1031, true),
  ('sv', 'och-en-kanelbulle', 'chunk', 'och en kanelbulle, tack', 'and a cinnamon bun, please', 'A natural addition to a café order.', '{"level":"A0","topic":"cafe"}'::jsonb, 1032, true),
  ('sv', 'cafe-order-drink', 'communicative_function', 'beställa en dryck', 'order a drink', 'Ordering a drink naturally in a Swedish café.', '{"level":"A1","topic":"cafe"}'::jsonb, 1040, true),
  ('sv', 'cafe-order-food', 'communicative_function', 'beställa något att äta', 'order something to eat', 'Adding food to a Swedish café order.', '{"level":"A1","topic":"cafe"}'::jsonb, 1041, true),
  ('sv', 'cafe-ask-bill', 'communicative_function', 'be om notan', 'ask for the bill', 'Finishing a café visit by asking for the bill.', '{"level":"A1","topic":"cafe"}'::jsonb, 1042, true),
  ('sv', 'var-ligger-stationen', 'chunk', 'var ligger stationen?', 'where is the station?', 'A useful way to ask where a place is located.', '{"level":"A0","topic":"transport"}'::jsonb, 1050, true),
  ('sv', 'taget-till-stockholm', 'chunk', 'går det här tåget till Stockholm?', 'does this train go to Stockholm?', 'A flexible question for checking a train destination.', '{"level":"A1","topic":"transport"}'::jsonb, 1051, true),
  ('sv', 'jag-ska-av-haer', 'chunk', 'jag ska av här', 'I need to get off here', 'A useful phrase for buses and trains.', '{"level":"A0","topic":"transport"}'::jsonb, 1052, true),
  ('sv', 'jag-foerstar-inte', 'chunk', 'jag förstår inte', 'I do not understand', 'A direct way to reset a difficult conversation.', '{"level":"A0","topic":"repair"}'::jsonb, 1060, true),
  ('sv', 'kan-du-upprepa', 'chunk', 'kan du upprepa det?', 'can you repeat that?', 'A polite repair question.', '{"level":"A0","topic":"repair"}'::jsonb, 1061, true),
  ('sv', 'prata-langsammare', 'chunk', 'kan du prata lite långsammare?', 'can you speak more slowly?', 'A polite request for slower speech.', '{"level":"A1","topic":"repair"}'::jsonb, 1062, true),
  ('sv', 'kanske', 'word', 'kanske', 'maybe', 'A common Swedish word for keeping an answer open.', '{"level":"A0","topic":"plans"}'::jsonb, 1070, true),
  ('sv', 'ska-vi-infinitive', 'construction', 'ska vi + infinitiv', 'shall we + verb', 'A common Swedish pattern for suggesting a shared plan.', '{"level":"A1","topic":"plans"}'::jsonb, 1071, true)
on conflict (language_code, slug) do update
set
  kind = excluded.kind,
  canonical_form = excluded.canonical_form,
  gloss = excluded.gloss,
  description = excluded.description,
  metadata = excluded.metadata,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();
