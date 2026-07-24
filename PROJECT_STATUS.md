# Project Status

Last updated: 2026-06-14

## Completed Milestones

- Milestone 0: Prisma, migration, and runtime stabilization.
- Milestone 1: Career domain foundation, database/API foundation and profile UI workflow.
- Milestone 2: Document ingestion, vector retrieval, AI chat UI, resume analyzer, skill gap analysis, and roadmap generator.
- Milestone 3: Gemini-backed RAG generation, auth hardening, production storage fallback, gamification, notifications, PWA readiness, and integration smoke tests.

## Current Milestone

- Milestone 4: Authentication, authorization, and user isolation for production-ready multi-user access.
- Multi-provider AI architecture now uses Gemini 2.5 Flash first, Groq as the fallback provider, and retrieval-only mode as the final safety net.
- Milestone 4 completion work is now documented and validated: clear Supabase configuration checks, Google OAuth entry-point wiring, session/logout persistence support, and ownership enforcement tests for documents, conversations, roadmaps, and profile.

## Pending Tasks

- Capture UI screenshots after browser automation is available.
- Continue product rename across legacy module copy to keep the product surface aligned with StudyOrbit.
- Replace study-specific dashboard modules with career-oriented modules.
- Split the large workspace shell into smaller feature modules.
- Configure Supabase Storage service-role credentials and bucket in production.
- Add broader automated tests for profile, documents, ingestion, and chat memory APIs.
- Review production Google OAuth provider settings in Supabase and confirm the redirect URL list for the deployment domain.
- Add real provider implementations for OpenAI, Claude, and Ollama.
- Add production queue/background worker for ingestion and embedding jobs.
- Add email sender and push subscription worker for scheduled reminders.

## Known Issues

- Existing lint warnings remain in `user-profile-panel.tsx` and `workspace-shell.tsx`.
- Prisma schema has an intentionally SQL-managed pgvector HNSW index that Prisma datamodel diff cannot represent directly.
- File storage uses Supabase Storage when service-role env vars are configured and falls back to PostgreSQL bytes locally.
- Gemini generation requires `GEMINI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, or `GOOGLE_AI_API_KEY`; without a key the chat falls back to retrieval-only responses.
- PWA installability is implemented; native Android/iOS packaging is still pending.
- `npm ci` reports 10 dependency audit findings; security triage is pending.

## Database Changes

- Added baseline Prisma migration: `20260601004500_init`.
- Marked the baseline migration as applied to the existing SQLite database.
- Added career profile foundation migration: `20260531190534_career_profile_foundation`.
- Added career fields on `UserProfile`: age, education, college, degree, skills, interests, career goals, resume file id, LinkedIn, GitHub, profile completion, and career readiness.
- Migrated Prisma provider from SQLite to PostgreSQL.
- Added PostgreSQL production baseline migration: `20260601010000_postgresql_career_platform_foundation`.
- Added pgvector migration: `20260602090000_pgvector_embedding_support`.
- Added Milestone 3 migration: `20260613100000_milestone_3_product_hardening`.
- Added models for education history, skills, documents, folders, chunks, embeddings, ingestion jobs, conversations, messages, roadmaps, goals, achievements, and notification preferences.
- Added `UserProfile` XP/streak fields, `UserGoal.completedAt`, and `NotificationReminder`.
- Regenerated Prisma Client with local Prisma v6.16.0 for PostgreSQL.
- Neon migrations are applied and up to date.

## Milestone 1 Progress

- Career profile fields added to Prisma schema.
- Profile API now reads and updates career fields.
- Profile completion and career readiness scoring helpers added.
- Product identity started: metadata, nav brand, reveal screen, and footer now use StudyOrbit.
- Runtime profile API smoke test passed with career scores returned.
- Profile page now includes editable career fields and readiness bars.

## Milestone 2 Progress

- Document folder and document upload APIs added.
- Document metadata supports type, category, tags, favorite, folder, status, summary, and stored bytes.
- Document manager UI added to the profile page.
- Document ingestion endpoint now parses TXT/MD, PDF, and DOCX.
- Ingestion now chunks documents, creates deterministic local embeddings, stores pgvector values, and marks documents ready.
- Provider-agnostic AI interfaces added for OpenAI, Gemini, Claude, and Ollama.
- Conversation and message APIs added for chat memory storage without LLM calls.
- AI chat UI added at `/ai` with conversation list, chat interface, history, and source citations.
- AI provider metadata and fallback logging now surface provider/model/fallback status in chat flow and UI badges.
- Integration tests added for Gemini success, Gemini→Groq fallback, and Gemini→Groq→retrieval-only fallback behavior.
- Resume analyzer API/UI added with skill extraction, ATS score, missing keywords, and suggestions.
- Skill gap API/UI added with current skills, missing skills, readiness score, and recommendations.
- Roadmap generator API/UI added with weekly goals and persisted progress goals.
- End-to-end smoke test passed against Neon: profile, skills, goals, document upload, ingestion, embeddings, vector retrieval chat, conversation history, resume analysis, skill gap, and roadmap generation.

## Milestone 4 Progress

- Added protected route coverage for /documents, /roadmaps, and /skills through the Next.js middleware so unauthenticated users are redirected to /auth.
- Removed placeholder demo-user fallback usage from the server auth path and client fetch helpers so the app relies on real authenticated sessions.
- Added /login and /signup aliases that route into the Google/OAuth auth flow.
- Expanded the main navigation to expose a session-aware user menu with profile/settings/logout controls.
- Added integration tests for protected-route enforcement and unauthorized access handling under tests/integration/auth-authorization.test.mjs.
- Added Milestone 4 auth validation and ownership coverage under tests/integration/auth-milestone4.test.mjs, including config diagnostics, Google OAuth wiring, session/logout persistence helpers, and cross-user ownership enforcement.
- Added AUTH_CONFIGURATION.md with Supabase setup steps, Google OAuth configuration, required environment variables, and deployment guidance.
- Validation completed: `npx prisma validate` passed, `npx prisma generate` passed, `npx prisma migrate deploy` reported no pending migrations, `npm run lint` completed with existing warnings only, `npm run build` passed, and the integration suite passed with 14 tests passing and 1 skipped.

## Milestone 3 Progress

- Gemini 2.5 Flash provider implemented behind the provider abstraction.
- AI chat now uses retrieval + generation when Gemini credentials are present and preserves source citations.
- Career-only guardrails run before LLM calls; generation prompt requires retrieved sources and conservative fallback behavior.
- Server auth now validates Supabase bearer tokens and only allows `x-user-id` demo auth outside production or when `ALLOW_DEMO_AUTH=true`.
- Existing Google login, OTP login, session cookie middleware, and protected routes remain active.
- Document uploads now use Supabase Storage when configured and fall back to database bytes for local/dev reliability.
- Gamification API added with XP, daily streaks, longest streak, goal completion rate, and achievements.
- Goal status update API awards XP and achievements when goals are completed.
- Notification preferences and reminder APIs added for learning, goal, resume, certification, and interview reminders.
- Profile dashboard now includes progress and notification panels.
- PWA manifest, service worker, install metadata, and browser notification permission flow added.
- Integration smoke tests added under `tests/integration`.
- Validation completed: Prisma validate, Prisma generate, Neon migrate deploy/status, lint, production build, and live API smoke test passed.

## AI/RAG Implementation Progress

- Architecture documented in `docs/CAREER_PLATFORM_BLUEPRINT.md`.
- Provider abstraction created in `src/lib/ai/providers.ts`.
- Gemini chat completion provider implemented for `gemini-2.5-flash`.
- Text extraction/chunking contracts created in `src/lib/ai/ingestion.ts`.
- Database models created for chunks, embeddings, conversations, and messages.
- pgvector storage and similarity retrieval implemented.
- RAG chat endpoint implemented with career-scope guardrails, retrieved source blocks, citation-preserving prompt controls, and retrieval fallback.
- Pending: production-grade semantic embeddings, background ingestion workers, advanced retrieval ranking, OpenAI/Claude/Ollama generation providers, and evaluation datasets.
