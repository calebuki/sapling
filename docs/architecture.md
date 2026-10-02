# Sapling architecture

Status: accepted; islands and language packs added 2026-09-28  
Date: 2026-08-07

## Product boundary

Sapling models a learner, not a lesson path. The durable source of truth is the
history of learning evidence. A learner concept state is a replaceable,
versioned projection over that evidence. Sessions and narrative experiences are
ways to collect useful evidence; they are not the top-level learning model.

The learner-facing product has two primary areas:

- **Learn** introduces and strengthens vocabulary, patterns, sounds, and
  communicative functions with guided retrieval and repair.
- **Practice** combines encountered capabilities in conversations, roleplays,
  and open questions. Practice is always available, but the planner limits each
  scenario to language the learner has encountered and selects the best next
  stretch automatically.

Learning happens on islands: one small explorable village per language, whose
villagers teach the course and hold the conversations. The hub at `/` lists
every island with the learner's progress; each island lives at its language
code (`/sv` Lilla Ö, `/de` Tannenau, `/vi` Cát Bà). Every table and route keeps the
`user_id` and `language_code` boundaries, so a new language is new content,
not new code.

## What Crumbs established

The reference Crumbs repository uses:

- Next.js App Router, React, strict TypeScript, and Tailwind CSS v4
- route code in `src/app`, reusable UI in `src/components`, product and
  integration code in `src/lib`, and explicit domain/database types
- small shadcn-style primitives rather than a heavy design system
- Supabase Auth, Postgres, Storage, row-level security, and SQL-first schema
- a repository interface with Supabase and local demo implementations
- explicit `lint`, `typecheck`, and `build` checks
- Vercel-oriented environment and metadata conventions

These conventions carry over because they are understandable and already
familiar. Product-specific map, trip, photo, sharing, storage, privacy, and
comment code does not carry over. No Crumbs environment file, credential,
project identifier, production secret, or Supabase resource is used by Sapling.

## Application architecture

```text
Next.js route group
  -> product screens and client learning-model provider
    -> LearningRepository interface
      -> local demo repository (no environment configured)
      -> Supabase repository (publishable key + user RLS)
        -> authenticated database commands
          -> append-only evidence + learner-state projection
```

Reads and writes stay behind a learning repository so UI components do not
depend directly on Supabase row shapes. The local repository is a development
aid, not a second production backend. It persists the same domain shape and raw
event vocabulary in `localStorage`.

When Supabase is configured, `@supabase/ssr` stores authentication in cookies.
Next.js Proxy refreshes tokens and protects the application routes. The
browser uses only Sapling's publishable key; RLS is the authorization boundary.
There is deliberately no service-role client in the regular application path.

AI and speech providers remain adapters. Provider outputs become evidence
events and content artifacts; provider-specific IDs never become core concept
or learner-state IDs. Practice generation uses a structured scenario contract
so the model varies natural dialogue without controlling progression,
eligibility, or persistence rules.

Learner speech recordings are ephemeral processing inputs, not stored content.
The browser sends a recording to a server-side speech adapter, which returns a
transcript, timing or alignment data, and derived pronunciation evidence. The
application persists only that derived evidence and discards the recording when
the scoring request completes. Sapling does not upload learner recordings to
Supabase Storage. Any speech provider must have its own retention behavior
reviewed and configured for the shortest available retention before use.

Open conversation recognition keeps the provider transcript, detailed alternate
candidates, and a context-resolved interpretation as separate derived values.
A likely recognition artifact is recorded in `speech_resolutions` and is not
treated as a learner vocabulary or grammar error. High-confidence resolutions
remain invisible during the conversation; uncertain meaning produces a natural
in-character clarification. Only recurring or useful details may appear in the
post-conversation debrief.

## Islands and language packs

The game engine (`src/components/game`, `src/lib/game`) knows no language.
Everything an island says or shows comes from its pack in
`src/content/<code>/`, typed as `IslandPack` (`src/content/types.ts`):

- **course**: units, lessons, listening items and the concept catalog
- **villagers** and the host's script, **scenes** (short exchanges that play
  out key phrases), **grammar** tips, **scenarios** (kept for a future
  conversation mode; nothing in the game opens them now)
- **glossary** for hover glosses, **ui** strings, the **café** counter if the
  island has one, **discoveries**, **placement** bands, **world** geometry and
  **signs**

The browser loads only the pack being played (`src/content/islands.ts`
imports it on demand). Server routes, scripts and the demo repository reach
every course through `src/content/courses.ts`. Game saves are per island
(`sapling:island:v3:<learner>:<code>`); the player's name and look are shared.

A course is a list of **units** (A1 or A2), each taught by one villager. A unit
opens when 60% of the previous one has been met, when placement opens it, or
once the learner has started it, so inserting units never locks away progress.
Grammar tips gate a few phrases of their unit until they have been read.

New units are written in a compact format (`src/content/dsl.ts`): one line
per phrase with its English, examples and options. `buildUnits` turns them
into lessons, listening items and concept seeds. Lilla Ö's first four chapters
keep their original hand-written lessons alongside the newer units.

The `concepts` table mirrors every course. After changing a course, run
`npm run content:sql -- <codes>` into a new migration; the upsert refreshes
forms, glosses, unit, level and order without touching learner state.
`npm run content:report -- <code>` lists course sizes and any shown word
without a gloss, and the island tests run the same checks for every pack.

German and the Swedish A2 units have not yet been reviewed by a native speaker.

Cát Bà teaches Northern (Hanoi) Vietnamese, the standard variety and the one
whose six tones match the spelling; its words, voice direction and AI prompts
all keep to Northern forms (bố, bát, cốc, nghìn, quả). Vietnamese answers typed
without tone marks pass like a missing å, but once a learner types tones they
must all be right, since a tone changes the word. Words written as several
syllables ("cà phê") gloss and hover as one word. Only A1 exists so far, and it
has not been reviewed by a native speaker.

### Jobs: mini-games in a villager's own place

Between lessons, villagers ask for help with a job played in 3D with the
player's own character. The first is the **café shift**: the café host's
menu offers "Kann ich dir helfen?", and the game enters the `shift` phase,
which swaps the island for the café interior (`src/components/game/shift`).
Guests queue at the counter and order out loud; the player fills a tray from
unlabelled drink stations and asks the host for kitchen items by typing or
saying them. The language is load-bearing: station names only show on the
first rungs, later orders are heard and only shown after "Wie bitte?", and
the kitchen bakes exactly what was asked for, saying it back correctly.

The second is **Hilde's farmhouse** (Maja's house on Lilla Ö): her family
comes for dinner and she can't find her things. Things lie on, under, next
to and in the furniture, often several of the same, so the place in her
request decides which one she means; later she asks "Wo ist …?" and the
learner says where, and she looks exactly there. It uses the dative the
course teaches for *where* something is, not the accusative of putting it
somewhere.

The third is **Aylin's surgery** (Karin's on Lilla Ö): a patient says what
hurts and you click that spot on them, with the camera close in; you brew
their remedy from the doctor's recipe (so many spoons of which colour of
herbs, hot or cold water, sugar or not); later you also answer how they feel
("Keine Sorge!") and tell them what to do from a picture ("Du musst im Bett
bleiben."). "Du musst …" is only credited when the learner used it.

The fourth is **Jonas's workshop** (Stina's on Lilla Ö): customers ask for
their stopped clock to be set ("Stell sie bitte auf halb vier.") and you
drag the hands, with the camera on the clock; some ask the time by the wall
clock and you say it in words (digits get "Sag es mit Wörtern!"); later
some ask when they can collect it ("Passt es dir am Freitag um zwei Uhr?")
and you answer from the week in the calendar.

The fifth is **Greta's ferry** (German only): passengers queue on the
landing stage and you check them aboard. You greet each one for the time of
day the sky shows ("Guten Abend? Es ist doch noch Morgen!"), ask the name
with du for children and Sie for adults, and fill in the passenger list from
how they introduce themselves (name, where from, where they live, what they
speak). "Wie bitte?", "Kannst du langsamer sprechen?" and "Wie schreibt man
das?" are the buttons for hearing it again, slowly, or spelled; then a
goodbye as they walk up the gangway.

The sixth is **Marie's market stall** (German only): customers ask for fruit
and vegetables by the piece or by the kilo ("Haben Sie Kirschen? Ein halbes
Kilo, bitte."); you fill the basket from the crates and ask "Sonst noch
etwas?" until they say that's all, then say the price on the till in words
and take cash or card as they ask. From the third level some want clothes in
a colour ("Ich suche einen roten Pullover."), and later what you hand over is
"zu klein" or "zu groß" and you swap the size.

The seventh is **Sepp's mountain rescue** (German only): a map of little
landscapes lies on the table (lake, meadow, forest, mountain, river), each
under its own weather (rain falling from its own cloud, snow, bands of fog,
gusts, a storm) and with an animal about. Lost hikers radio in ("Hilfe, hier
ist Emma! Ich bin im Wald. Hier schneit es. Ich sehe einen Fuchs.") and you
click where they are. Later maps have two of a place, differing in just the
weather or just the animal, so that clue decides; a wrong click gets the
first thing that doesn't fit ("Nein, da ist es sonnig. Bei ihr regnet es!").
Sepp also asks what the weather is like where he's driving ("Wie ist das
Wetter am See?") and you tell him. It replaced a wildlife survey from a
lookout, whose fog hid the whole clearing.

The eighth is **Lena's station** (German only): travellers at the kiosk ask
for a ticket ("Eine Fahrkarte nach Titisee, bitte."); you ask "Einfach oder
hin und zurück?", make the ticket up, and say which platform from the
timetable, in words. From the third level some ask the way ("Wie komme ich
zur Post?"); Lena gives directions one sentence per step ("Geh geradeaus.
An der Ampel rechts. Die Post ist rechts."), and you carry the suitcase
through a small grid of streets with the arrow buttons. Every turn you take
counts as evidence for the words of that step (links, rechts, the landmark,
die erste Straße).

Outdoor jobs (ferry, market, forest, station) bring their own sky and sun
(`OutdoorSun`), so the island's daylight cycle is left out while they're open.

Jobs share their walking, camera, player, top bar, intro and summary
(`src/components/game/jobs`); the game phase is `job`, with `job` naming
which room is open. `FitCamera` frames a room's box whole on any screen,
clear of the top bar and side cards, and `JobPanel` is the answer box along
the bottom, which slides down to its tab so you can see what it covers.

Before a job, a **mini lesson** (`jobLessons` in a pack,
`src/lib/game/job-lesson.ts`) shows how it plays, its words to listen to
(only those already met), the grammar it leans on, and a quick check. It
opens by itself the first time you help and the first time at a level whose
cards are marked `from` that level; otherwise it's a button in the host's
intro. Only Tannenau has them so far.

A job splits like the rest of the game. The rules live in `src/lib/game`
(`rush.ts` for the café, `home.ts` for the farmhouse, `clinic.ts` for the
surgery, `clock.ts` for the workshop) and are tested without
a browser. Each language pack supplies the words (`cafe.rush` in
`src/content/<code>/cafe.ts`, `home`, `clinic` and `clock` in their own
files). Orders only use menu
words the learner has met, weak words come up more often, and every shift
records evidence through the same `recordObservation` path as lessons:
orders understood by ear count as audio recognition, orders read off the
bubble as exposure, and kitchen requests as production. A shift with two or
more stars opens the next, busier rung (`save.shifts`). Everything a guest or
host can say is in the gloss audit and the voice catalog.

Job progress is kept on the device (the island save) and with the account
(`profiles.jobs`, per island and host). Both copies only grow, so
`src/components/game/jobs/progress.ts` merges them by taking the better of
each when an island loads and after every run. Two or more stars on a job's
third level earn the host's work clothes (Franz's apron, Aylin's white coat,
Jonas's bow tie and so on: wardrobe items with a `job` unlock), shown on the
summary card and added to the wardrobe's gifts.

Lines built from interchangeable pieces are spoken as `parts`
(`Line.parts`, `speakLine`): Hilde's "Ich brauche den Hund. Er ist auf dem
Tisch.", Aylin's recipe read step by step, a customer's "Nein, das ist halb
fünf! Ich brauche halb vier." Each piece is one recording, reused across
every combination, which keeps the voice catalog small while covering every
mix-up a player can cause.

### Speech

Villagers speak with Gemini neural voices through `/api/speech`. The
response depends only on the query string, so the CDN keeps each line after
its first request. Recorded clips exist only for the original Swedish and
Danish lessons, listed in `public/audio/*/manifest.json`. If the provider
refuses (bad key or no credits), the route answers 503 and the game switches to
device voices for the rest of the visit.

Every line lives in `voice_lines` with its words, English, speaker, units and
CEFR level, so it can be reviewed at `/dev/voices` (reviewers in
`voice_reviewers` only; everyone else gets a 404). **Sync** lists everything
the islands say (`src/lib/speech/catalog.ts`, which the pre-generation script
also uses); `/api/speech` records runtime-only lines such as AI replies when it
stores them. Lines with no clip yet can be generated there: queueing them
(`voice_line_jobs`) makes their first clip with Gemini or OpenAI, in the order
the reviewer sees them, and sends each back for review. Rejecting a line queues
a remake the same way; the new take replaces the clip in the bucket and the old
one is kept under `history/`. Everything runs as the reviewer, through their
session and reviewer-only storage policies, so no secret key is involved.

## Data model

### Curriculum graph

`concepts` is the central catalog. A concept has a target language, kind,
canonical form, learner-facing gloss, and extensible metadata. Initial kinds
cover words, chunks, constructions, collocations, phonemes, phonetic contrasts,
communicative functions, pragmatic conventions, and listening phenomena.

`concept_relations` is a directed graph for prerequisite, component,
contrast, realization, and related-to edges. Concepts are shared curriculum
data, not learner-owned data.

### Learner projection

`learner_concept_state` has a composite `(user_id, concept_id)` identity and
keeps these estimates separate:

- recognition in text and audio
- recall and production
- pronunciation and automaticity
- context and speaker diversity
- retrieval strength and retrieval latency
- estimator confidence, evidence counts, and evidence timestamps

Dimension estimates are nullable: no evidence is different from observed zero
ability. Values use a normalized `0..1` range as estimator outputs, but are not
combined into a stored mastery percentage. The Seed/Sprout/Growing/Established/
Automatic label is a UI projection and may change without rewriting history.

`algorithm_version` makes changes to the projection rules explicit. The first
database commands update only dimensions for which a typed retrieval attempt is
evidence. They do not infer audio recognition, pronunciation, or speaker
diversity from text answers.

### Evidence ledger

`learning_events` is append-only for authenticated clients. It records event
type, modality, outcome, latency, primary concept, session context, structured
context, raw payload, timestamp, and schema version. Detail tables attach data
that deserves validation and querying:

- `retrieval_attempts` stores the response, expected response, self-assessed
  result, score, latency, and hints
- `reading_attempts` stores the selected and expected answers, score, and
  latency for text-comprehension evidence
- `errors` stores one or more observed/target contrasts associated with an
  error event

`learning_sessions` and `session_items` record the delivery context without
making lessons the core abstraction. Composite foreign keys include `user_id`
so one learner cannot attach evidence to another learner's session.

Practice sessions use `kind = 'practice'`. A conversation turn creates one
append-only learning event and can attribute weighted evidence to multiple
concepts through `learning_event_concepts`. `speech_resolutions` preserves the
difference between provider transcription and contextual interpretation without
retaining audio.

`learner_memories` stores compact learner-owned facts explicitly stated during
conversation, such as family, work, routines, interests, and preferences.
Memories are captured automatically and remain visible and deletable by the
learner. `character_continuity` stores a short summary and encounter count for
the recurring guide in each language; raw conversation transcripts are not the
continuity model.

### Deferred tables

Story events, a broader cast, and reusable listening audio samples remain
deferred until their first working experience defines ownership and query
patterns. Basic learner-owned character continuity now exists; future narrative
history can extend it without becoming the learning model. Reusable source audio
is distinct from ephemeral learner speech and may be stored with explicit
provenance and licensing.

## Security decisions

- `auth.users` remains the identity source; `profiles` stores application
  preferences and display data.
- A trigger in a non-exposed `private` schema creates profiles. User metadata is
  never used for authorization.
- Every public table has RLS enabled. Learner-owned tables compare indexed
  `user_id` columns to `(select auth.uid())` and explicitly target the
  `authenticated` role.
- Shared concepts are readable by authenticated users and not writable through
  the browser API.
- Learning events and detail rows have select/insert policies but no client
  update/delete policies, preserving raw history.
- Learner memories and character continuity are learner-owned and support
  select, insert, update, and delete under RLS.
- Authenticated database commands use invoker rights and assert the current
  user; no exposed security-definer function bypasses RLS.

## Deployment boundary

Sapling uses its own independent GitHub repository, Supabase project, and Vercel
project. Production is served from `https://mysapl.ing`; GoDaddy retains DNS
authority, the apex points to Vercel, and `www.mysapl.ing` permanently
redirects to the apex. Supabase Auth uses the apex as its Site URL while
localhost and scoped Vercel previews remain explicit redirect allow-list
entries. Infrastructure identifiers and secrets are never copied from Crumbs.
