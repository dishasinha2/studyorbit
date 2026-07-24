# PostgreSQL Migration Report

Date: 2026-06-01

## Summary

The database layer has been converted from SQLite to PostgreSQL in Prisma.

Milestone 0 remains approved as the stabilization baseline. The previous SQLite migration history has been replaced with a PostgreSQL-compatible production baseline because SQLite migration SQL is not portable to PostgreSQL.

## Root Cause For Migration

SQLite was acceptable for the initial local prototype, but the StudyOrbit platform requires:

- Production-grade concurrency and reliability.
- JSONB metadata for documents, AI memory, citations, and retrieval metadata.
- Array support for notification channels.
- Future vector search integration through pgvector or a managed vector store.
- Stronger migration compatibility for production deployments.

## Files Changed

- `prisma/schema.prisma`
- `prisma/migrations/migration_lock.toml`
- `prisma/migrations/20260601010000_postgresql_career_platform_foundation/migration.sql`
- `.env`

## Migration Changes

Provider changed:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

PostgreSQL baseline migration added:

- `20260601010000_postgresql_career_platform_foundation`

The baseline includes:

- Existing StudyOrbit-compatible models.
- Career profile models.
- Document management models.
- Document ingestion and chunking models.
- Provider-agnostic embedding records.
- Conversation and message memory.
- Career roadmaps and user goals.
- Achievements.
- Notification preferences.

## Verification

Passed:

- `npx prisma validate`
- `npx prisma generate`
- `npm run build`
- `npm run lint` with warnings only

Blocked locally:

- `npx prisma migrate status`
- API runtime smoke tests against PostgreSQL

Reason:

No local PostgreSQL server, `psql`, or Docker runtime is available in this environment. The configured `DATABASE_URL` points to `localhost:5432`, but no PostgreSQL server is reachable.

## Production Application Command

When PostgreSQL is available:

```bash
npm run db:deploy
npm run db:generate
npm run build
npm run start
```

For local development with a real PostgreSQL database:

```bash
npm run db:migrate
npm run dev
```

## Data Migration Note

The previous SQLite `prisma/dev.db` is no longer the runtime database. To preserve existing local prototype data, export from SQLite before production cutover and import into PostgreSQL with a one-time migration script.

Recommended one-time sequence:

1. Export SQLite rows to JSON.
2. Transform JSON fields to match the PostgreSQL schema.
3. Insert into PostgreSQL using Prisma Client.
4. Verify counts per table.
5. Run API smoke tests.

