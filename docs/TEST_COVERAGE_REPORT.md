# Test Coverage Report

Date: 2026-06-01

## Automated Checks Run

Passed:

- `npx prisma validate`
- `npx prisma generate`
- `npm run build`
- `npm run lint`

Build result:

- TypeScript passed.
- Next.js production build passed.
- New API routes were included in the build output.

Lint result:

- 0 errors.
- 7 existing warnings remain.

## Runtime Smoke Tests

Blocked in this environment.

Reason:

- The project has been migrated to PostgreSQL.
- No local PostgreSQL server, `psql`, or Docker runtime is available.
- `DATABASE_URL` points to `localhost:5432`, but no server is reachable.

Required smoke suite once PostgreSQL is available:

- `GET /api/profile`
- `PATCH /api/profile`
- `GET /api/career/education`
- `POST /api/career/education`
- `GET /api/career/skills`
- `POST /api/career/skills`
- `GET /api/career/goals`
- `POST /api/career/goals`
- `GET /api/documents/folders`
- `POST /api/documents/folders`
- `POST /api/documents`
- `GET /api/documents`
- `GET /api/documents/:id`
- `POST /api/ai/ingestion`
- `POST /api/ai/conversations`
- `POST /api/ai/conversations/:id/messages`

## Screenshot Coverage

Blocked in this environment.

Reason:

- Playwright is not installed.
- No browser automation runtime is available.

Screens to capture once browser tooling is available:

- `/profile` desktop
- `/profile` mobile
- Career profile readiness panel
- Document manager upload/folder/search panel

