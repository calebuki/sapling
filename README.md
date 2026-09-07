# Sapling

Sapling is a personal, retrieval-first language learning application with
separate Danish and Swedish learning tracks. Its core
product is an evolving model of what a learner can recognize, retrieve,
produce, pronounce, and understand across contexts and speakers.

The current product includes:

- a small adaptive Learn loop built around attempt, reveal, compare, and repair
- an adaptive Practice loop with recurring characters, push-to-talk
  conversation, contextual speech resolution, and automatic personal memory
- a language-specific progress view that keeps learning dimensions separate
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
Sapling uses a local demo repository in the browser so Learn, Practice, and
progress can be exercised immediately.

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

## Sapling Island

The Swedish home is now Lilla's live Three.js island. The existing Sapling lessons, adaptive practice planner, Elin conversations, speech evaluation, authenticated repository, and journal remain the learning source of truth. Learn and Practice open over the island; legacy Swedish Learn/Practice links lead into the same flow. Danish keeps its course and separate records.

Island invitations connect to the four existing Sapling scenarios. Completed conversations and each five saved successful retrievals earn one claimable cosmetic supply delivery. Passive exposure, word lookups, construction, and unfinished conversations do not create mastery evidence. Claims persist with the island, and a sapling grows with completed journal adventures. Ord combines the island dictionary with the current Swedish course concepts.

Construction and furniture retain the Lilla editor, first-person exploration, resource loop, varied visitors, and expandable island. Island state is browser-local and scoped to the signed-in account; it is not cloud-synced. Settings can export/import an island JSON file across domains. Imports preserve current reward claims and save the previous island under the same storage key with a .before-import suffix. Sapling learning records stay in their existing repository.

Development starts from the working production branch codex/learn-practice-overhaul (e3392ee), with Lilla code imported from 78d8655. The combined product is maintained on codex/sapling-island-integration; the standalone island branch and Sapling main remain independently recoverable.
