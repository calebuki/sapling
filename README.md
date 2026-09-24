# Sapling

Sapling is a personal, retrieval-first language learning application with
separate Danish and Swedish learning tracks. Its core
product is an evolving model of what a learner can recognize, retrieve,
produce, pronounce, and understand across contexts and speakers.

The current product includes:

- Lilla Ö, an immersive 3D island game where villagers teach Swedish through
  adaptive dialogue and live spoken conversations (see below)
- a Supabase schema for concepts, learner state, multi-concept conversation
  evidence, character continuity, and append-only learning history
- local demo persistence when Sapling's Supabase project is not configured

## Stack

- Next.js App Router and React
- strict TypeScript
- Tailwind CSS v4
- Supabase Auth and Postgres with row-level security
- Vercel-ready application structure

This follows the useful infrastructure conventions from Crumbs while keeping
Sapling's code, data model, credentials, Supabase project, and Vercel project
entirely independent.

## Production

Sapling is deployed at [https://mysapl.ing](https://mysapl.ing). Vercel serves
the apex domain, and `www.mysapl.ing` permanently redirects to it.

Production deployments follow the `main` branch. Supabase applies checked-in
database migrations from that branch, and Supabase Auth uses the custom domain
as its Site URL. Localhost and scoped Vercel preview URLs remain on the Auth
redirect allow list for development and review.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With no Supabase variables,
Sapling uses a local demo repository in the browser so the whole island can be
played immediately without signing in.

To connect a new Sapling Supabase project, create `.env.local` from the variable
names in `.env.example` and use values from **Sapling's own project**:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SAPLING_SITE_URL
```

Only the publishable key belongs in browser-accessible configuration. Do not add
a Supabase secret or service-role key to the frontend.

## Database

The initial migration is in `supabase/migrations`. It creates the core concept,
learner-state, session, and evidence model; enables RLS on every public table;
and installs authenticated database commands for atomic retrieval, repair, and
conversation-evidence logging.

After creating and linking Sapling's own Supabase project:

```bash
npx supabase link
npx supabase db push
```

Create the first private account in Supabase Auth, and keep new-user sign-ups
disabled in the production Auth settings. Sapling intentionally ships with
sign-in but no public sign-up flow.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Documentation

- [Architecture](docs/architecture.md)
- [Staged implementation plan](docs/implementation-plan.md)

## Lilla Ö — the island game

The whole product is one 3D game at `/`. You arrive by ferry on Lilla Ö, a
small Swedish island where nobody speaks English. Every Swedish word on
screen — interface, speech bubbles, signs, live captions — shows its English
meaning when hovered.

- **Villagers teach.** Elin (dock), Bosse (Café Kanel), Stina (the station) and
  Astrid (the hilltop garden) each own a slice of the Swedish course. Talking
  to one runs an adaptive round (hear → build with tiles → recall → listen),
  using the existing scheduler in `src/lib/learning/adaptive.ts` scoped to that
  villager's concepts. Evidence is recorded through the learning repository,
  exactly as before.
- **Talk for real.** Once you know enough, each villager's capstone is a live
  spoken conversation through GPT-Live (`/api/voice/*`, persona per villager).
  Without Live voice it falls back to a typed chat via `/api/practice/respond`.
- **Progression** is derived from the learning model, not a separate score:
  XP and levels come from concept strength, the next villager unlocks when
  60% of the previous one's phrases have been met, and the tree in the square
  grows with your level. Found objects (25 hidden words) add a little XP but
  never mastery.
- **Sound** is synthesized at runtime (footsteps, voice blips, chimes, waves,
  birds and a generative music box); Swedish speech uses the recorded clips
  in `public/audio/swedish`, falling back to the browser's Swedish voice.
  Speaking answers uses the browser's speech recognition when available.

Code map: game content and pure logic live in `src/lib/game` (villagers,
glossary, world geometry, progression, lesson checking) and are covered by
`scripts/game-content.test.ts`, which fails if any Swedish word the game shows
lacks an English gloss. The React Three Fiber scene and UI live in
`src/components/game`. Words outside the glossary are glossed on demand by
`/api/gloss` through the AI Gateway.

Local island state (name, outfit, found objects) is stored per account in
`localStorage`; learning evidence stays in the repository (Supabase or the
local demo repository). Danish content remains in `src/lib/learning` but has
no interface.
