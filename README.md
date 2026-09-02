# Playbook Iterator

A decision-support application for Sales Engineering leaders.

A good SE organization should have an explicit playbook, but having a playbook does not mean never making exceptions. Teams should make exceptions consciously, record them, and learn from the results. The playbook should evolve based on evidence.

This repository is a product rebuild of that idea. The primary areas are Playbook Health, Activity Explorer, and Admin Console. The landing page is Playbook Health.

## Local setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run lint
npm run build
```

Local SQLite lives at `data/playbook.sqlite` (gitignored). A fresh database applies migration `0001_init` and seeds the Northstar SE development dataset. Delete the file to re-seed.

## Deploy on Vercel

This repository deploys from the existing GitHub-to-Vercel connection. `vercel.json` sets the framework to Next.js. The Vercel project was originally connected to an empty repo, which made Vercel look for a static `public` output directory after `next build`. Next.js does not write that folder; it emits `.next` and is deployed by the Next.js runtime.

If a dashboard **Output Directory** override is still set to `public`, turn the override off so the Next.js preset can choose the output.

Vercel’s function filesystem is read-only except `/tmp`. On Vercel the app uses `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` over HTTP (`libsql://` is converted to `https://`). File SQLite under `/tmp` is only the fallback when those variables are missing; that store is per-instance and not durable.

Never commit environment variable values. The application reads them only through the existing environment configuration.

## Architecture snapshot

- **App:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4
- **Persistence:** Drizzle + libSQL. Local file SQLite; Turso HTTP on Vercel
- **Migrations:** Additive forward migrations in `src/lib/db/migrations`. Existing predecessor tables are detected and left untouched
- **Ingestion boundary:** `src/lib/ingest/types.ts` so demo seed, CSV, manual entry, and a future CRM adapter can share one domain model
- **Analytics:** Deterministic analysis will live in a later phase. Dashboard values will come from queries and pure functions, not hardcoded metrics
- **AI:** Not in this phase. Metrics will be computed first; any brief will consume a structured findings payload

See `docs/assumptions.md` for product and analytics decisions.

## Development dataset

The seed is small, coherent, and replaceable. It plants:

- A Product Demo prerequisite with a large closed-won gap (future Enforce candidate)
- A frequently skipped prerequisite with little outcome difference (future Revisit candidate)
- A tiny Workshop sample that must never be labeled Supported
- Repeated Product Demo activities on the same opportunities
- Stacked exceptions on a single activity
- Discovery used outside its typical stages
- An undefined play, *Security questionnaire walkthrough*, with no invented prerequisite snapshots

## Current status

| Phase | Intent | Status |
| --- | --- | --- |
| 1 | Domain model, migrations, development data | Done |
| 2 | Navigation and application shell | In progress |
| 3–12 | Admin versioning, Explorer, analytics, Health, AI, polish | Not started |
