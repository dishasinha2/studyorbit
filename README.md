#studyOrbit - Organising Digital Life 

A full-stack Next.js app to unify scattered digital data (notes, links, files, tasks, calendar items, emails) into one context-aware workspace.

## Stack

- Frontend: Next.js App Router + React + Tailwind CSS
- UI: Dynamic glassmorphism and depth/3D-style cards with Framer Motion
- Backend: Next.js API routes
- DB: SQLite with Prisma ORM
- Auth: Supabase Auth (magic link) with fallback demo mode for local testing

## Key Features

- Unified capture flow for multiple artifact types
- Project spaces for contextual organization
- Context retrieval API that ranks highlights by urgency/type/status
- Search and grouping by project/topic/time metadata
- Mobile-responsive dashboard + landing page

## Routes

- `/` landing page
- `/workspace` main product UI
- `/api/projects` GET/POST
- `/api/artifacts` GET/POST
- `/api/artifacts/[id]` PATCH
- `/api/context` GET

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy env template:

```bash
cp .env.example .env
```

For PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Generate Prisma client:

```bash
npm run db:generate
```

4. Create DB schema:

```bash
npm run db:migrate
```

If migration engine fails on your machine, use:

```bash
npm run db:push
```

5. Run app:

```bash
npm run dev
```

## Deployment Reality Check

The app is production-build ready, but public deployment depends on your database setup:

- `SQLite` works locally.
- `Vercel` and similar serverless hosts should use hosted Postgres instead of `file:./dev.db`.
- File uploads are already stored in the database, so there is no separate object storage requirement for the current MVP.

## Recommended Production Setup

Use:

- Hosting: `Vercel`
- Database: `Supabase Postgres`
- Auth: existing `Supabase Auth`

### Required production env vars

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

### Get the database connection string from Supabase

1. Open Supabase project dashboard.
2. Go to `Settings -> Database`.
3. Copy the Postgres connection string.
4. Put it into `DATABASE_URL`.

## Vercel Deployment

1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. Add the env vars:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.

### After first deploy

Run schema sync once against your production database:

```bash
npm run db:push
```

If you prefer migration-based deployment later, use:

```bash
npm run db:deploy
```

## What I verified locally

- Production build passes with `npm run build`
- Prisma client generation works
- The current codebase is ready to connect to a hosted production database once `DATABASE_URL` is replaced

## Supabase Auth Setup (Optional but recommended)

Set these in `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

Without these, the app automatically runs in demo auth mode using local browser identity.

## Hackathon Pitch Angle

- Problem: Digital information is fragmented across tools and timelines.
- Solution: DLife creates a single memory layer with context grouping and priority retrieval.
- Demo flow: add projects -> capture mixed artifacts -> retrieve top highlights and grouped contexts.

## Suggested Next Upgrades

- OAuth connectors (Google Drive, Gmail, Notion, Slack)
- Semantic embeddings for smarter context clustering
- Team workspaces + sharing permissions
- Time-based timeline and weekly briefing generation
