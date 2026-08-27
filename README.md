# Sapling

Sapling is a personal, retrieval-first Danish learning application. Its core
product is an evolving model of what a learner can recognize, retrieve,
produce, pronounce, and understand across contexts and speakers.

The first slice includes:

- a small adaptive Learn loop built around attempt, reveal, compare, and repair
- an adaptive Read & Write loop with five comprehension checks and five typed
  responses per session
- a My Danish view that keeps learning dimensions separate
- a Supabase schema for concepts, learner state, and append-only evidence
- focused placeholders for the future Ear and World systems
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
Sapling uses a local demo repository in the browser so the Learn and My Danish
flows can be exercised immediately.

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
and installs authenticated database commands for atomic retrieval and repair
logging.

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
