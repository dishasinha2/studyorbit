# Migration Repair Report

Date: 2026-06-02

## Issue

Prisma reported `P3015` because two migration directories existed without `migration.sql` files:

- `prisma/migrations/20260531190534_career_profile_foundation`
- `prisma/migrations/20260601004500_init`

The valid PostgreSQL baseline migration was present:

- `prisma/migrations/20260601010000_postgresql_career_platform_foundation/migration.sql`

## Repair Performed

The two empty SQLite-era migration directories were removed.

The project now uses a single consolidated PostgreSQL baseline migration:

- `20260601010000_postgresql_career_platform_foundation`

This is the safe path because the current Prisma schema targets PostgreSQL and the old folders were empty, incomplete, and not portable.

## Verification

Commands run:

```bash
npx prisma validate
npx prisma migrate status
npx prisma migrate deploy
npx prisma migrate status
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code
npx prisma generate
```

Results:

- Prisma schema validation passed.
- Neon PostgreSQL connection worked.
- `migrate deploy` applied `20260601010000_postgresql_career_platform_foundation`.
- Final `migrate status` reported: database schema is up to date.
- Schema integrity check reported: no difference detected.
- Prisma Client regenerated successfully.

## Current Migration Directory

```text
prisma/migrations/
  migration_lock.toml
  20260601010000_postgresql_career_platform_foundation/
    migration.sql
```

## Status

Migration integrity is restored.

