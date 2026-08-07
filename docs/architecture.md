# Sapling architecture

Status: accepted for the personal Danish MVP  
Date: 2026-08-07

## Product boundary

Sapling models a learner, not a lesson path. The durable source of truth is the
history of learning evidence. A learner concept state is a replaceable,
versioned projection over that evidence. Sessions and narrative experiences are
ways to collect useful evidence; they are not the top-level learning model.

The first implementation stays intentionally small: one learner and Danish in
the UI, with `user_id` and `language_code` boundaries that prevent a future
multi-user or multi-language rewrite.

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
Next.js Proxy refreshes tokens and protects the four application routes. The
browser uses only Sapling's publishable key; RLS is the authorization boundary.
There is deliberately no service-role client in the regular application path.

AI, speech-to-text, text-to-speech, and pronunciation analysis are future
adapters. Provider outputs will become evidence events and content artifacts;
provider-specific IDs must not become core concept or learner-state IDs.

Learner speech recordings are ephemeral processing inputs, not stored content.
The browser sends a recording to a server-side speech adapter, which returns a
transcript, timing or alignment data, and derived pronunciation evidence. The
application persists only that derived evidence and discards the recording when
the scoring request completes. Sapling does not upload learner recordings to
Supabase Storage. Any speech provider must have its own retention behavior
reviewed and configured for the shortest available retention before use.

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
- `errors` stores one or more observed/target contrasts associated with an
  error event

`learning_sessions` and `session_items` record the delivery context without
making lessons the core abstraction. Composite foreign keys include `user_id`
so one learner cannot attach evidence to another learner's session.

### Deferred tables

Stories, characters, story events, and reusable listening audio samples are
important but deferred until their first working experience defines ownership
and query patterns. The likely split is learner-owned narrative continuity plus
reusable curriculum audio and speaker metadata. Reusable source audio is
distinct from ephemeral learner speech and may be stored with explicit
provenance and licensing. Deferring it avoids encoding speculative provider and
licensing assumptions in the foundation migration.

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
- Authenticated database commands use invoker rights and assert the current
  user; no exposed security-definer function bypasses RLS.

## Deployment boundary

Sapling uses its own independent GitHub repository, Supabase project, and Vercel
project. Production is served from `https://mysapl.ing`; GoDaddy retains DNS
authority, the apex points to Vercel, and `www.mysapl.ing` permanently
redirects to the apex. Supabase Auth uses the apex as its Site URL while
localhost and scoped Vercel previews remain explicit redirect allow-list
entries. Infrastructure identifiers and secrets are never copied from Crumbs.
