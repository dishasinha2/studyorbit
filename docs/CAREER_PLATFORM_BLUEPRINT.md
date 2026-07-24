# StudyOrbit Production Blueprint

## Current Project Audit

StudyOrbit is a Next.js App Router application using React, TypeScript, Tailwind CSS v4, Prisma, SQLite, Supabase Auth, and Next.js API routes. The current product is a student productivity workspace with:

- Landing, auth, dashboard, profile, and workspace pages.
- Supabase email OTP and Google OAuth flow, with access tokens forwarded to API routes.
- Prisma models for user profiles, projects, artifacts, planner events, sticky notes, whiteboards, videos, files, and focus sessions.
- A large client-side workspace shell that owns data loading, forms, timers, file upload, search, whiteboard drawing, and module rendering.
- File upload support through `FileItem.storageData`, currently stored in the database.
- Basic keyword search across notes, files, videos, events, and sticky notes.

Key production gaps:

- Database is SQLite in development; production target should be PostgreSQL.
- The Prisma client in recent logs appears out of sync with the schema around `TaskStatus/status`, causing `/api/artifacts` and `/api/daily-brief` failures.
- No dedicated AI layer, embeddings, RAG pipeline, document text extraction, vector search, chat history, or AI safety boundary.
- Profile model is study-focused and missing career fields such as education, skills, interests, goals, resume, LinkedIn, and GitHub.
- File storage is database-backed and should move to encrypted object storage with metadata in Postgres.
- Workspace UI is component-heavy but not domain-aligned for career guidance.
- No mobile app structure, push notification service, background jobs, rate limiting, audit logs, unit tests, API docs, or observability.

## Recommended Target Architecture

Use a single TypeScript-first product core with shared types and API contracts.

```text
apps/
  web/                 Next.js web app
  mobile/              Expo React Native app
  api/                 Node.js API service or Next.js route handlers during migration
packages/
  ui/                  Shared design tokens and cross-platform components
  api-client/          Typed client generated from OpenAPI or ts-rest contracts
  validators/          Zod schemas shared by web, mobile, and API
  career-core/         Scoring, roadmap, skill taxonomy, prompt policy helpers
  config/              ESLint, TypeScript, Tailwind presets
services/
  ai-worker/           Ingestion, parsing, embeddings, async AI jobs
  notification-worker/ Email, browser push, mobile push, scheduled reminders
prisma/
  schema.prisma
  migrations/
docs/
  api.md
  deployment.md
  rag.md
```

Recommended implementation path:

- Keep Next.js as the web application and initial API host.
- Add Expo React Native for Android and iOS to maximize code sharing.
- Move business logic into shared packages before adding mobile.
- Use PostgreSQL with `pgvector` for RAG.
- Use Supabase Auth or Auth.js with Google, email, and OTP. Supabase remains a good fit because the project already uses it.
- Use object storage for files: Supabase Storage, S3, or Cloudflare R2.
- Use a background worker for document ingestion, embeddings, reminders, email, and AI-heavy tasks.

## Database Schema

Set Prisma datasource to PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Core models to add or replace:

```prisma
enum Role {
  USER
  ADMIN
  COUNSELOR
}

enum DocumentType {
  RESUME
  CERTIFICATE
  NOTE
  PDF
  DOCX
  OTHER
}

enum GoalStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  PAUSED
}

enum NotificationChannel {
  EMAIL
  WEB_PUSH
  MOBILE_PUSH
}

model User {
  id            String   @id @default(cuid())
  authId        String   @unique
  email         String?
  role          Role     @default(USER)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  profile       CareerProfile?
  documents     Document[]
  chats         ChatSession[]
  goals         CareerGoal[]
  reminders     Reminder[]
  activities    LearningActivity[]
  scores        CareerScore[]
}

model CareerProfile {
  id                 String   @id @default(cuid())
  userId             String   @unique
  name               String?
  age                Int?
  education          String?
  college            String?
  degree             String?
  skills             String[]
  interests          String[]
  careerGoals        String[]
  linkedinUrl        String?
  githubUrl          String?
  resumeDocumentId   String?
  profileCompletion  Int      @default(0)
  careerReadiness    Int      @default(0)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Document {
  id              String       @id @default(cuid())
  userId          String
  folderId        String?
  name            String
  originalName    String
  type            DocumentType
  mimeType        String
  sizeBytes       Int
  storageKey      String
  extractedText   String?
  summary         String?
  tags            String[]
  category        String?
  isFavorite      Boolean      @default(false)
  uploadedAt      DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  chunks          DocumentChunk[]
}

model DocumentChunk {
  id          String   @id @default(cuid())
  documentId  String
  userId      String
  chunkIndex  Int
  content     String
  tokenCount  Int?
  embedding   Unsupported("vector(1536)")?
  metadata    Json?
  createdAt   DateTime @default(now())
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@index([userId, documentId])
}

model ChatSession {
  id        String        @id @default(cuid())
  userId    String
  title     String?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages  ChatMessage[]
}

model ChatMessage {
  id          String      @id @default(cuid())
  sessionId   String
  role        String
  content     String
  citations   Json?
  createdAt   DateTime    @default(now())
  session     ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}

model CareerRoadmap {
  id          String       @id @default(cuid())
  userId      String
  targetRole  String
  title       String
  summary     String?
  planJson    Json
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  goals       CareerGoal[]
}

model CareerGoal {
  id          String      @id @default(cuid())
  userId      String
  roadmapId   String?
  title       String
  description String?
  status      GoalStatus  @default(NOT_STARTED)
  dueAt       DateTime?
  xpReward    Int         @default(10)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model LearningActivity {
  id          String   @id @default(cuid())
  userId      String
  type        String
  minutes     Int      @default(0)
  xp          Int      @default(0)
  metadata    Json?
  occurredAt  DateTime @default(now())
}

model Achievement {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  description String
  icon        String?
  xp          Int      @default(0)
}

model UserAchievement {
  userId        String
  achievementId String
  earnedAt      DateTime @default(now())

  @@id([userId, achievementId])
}

model Reminder {
  id          String                @id @default(cuid())
  userId      String
  title       String
  body        String?
  channel     NotificationChannel[]
  scheduledAt DateTime
  sentAt      DateTime?
  metadata    Json?
  createdAt   DateTime              @default(now())
}

model CareerScore {
  id           String   @id @default(cuid())
  userId       String
  kind         String
  score        Int
  details      Json?
  measuredAt   DateTime @default(now())
}
```

## API Design

Use versioned JSON APIs with Zod validation and OpenAPI generation.

- `POST /api/auth/session` validates Supabase/Auth.js JWT and returns app user.
- `GET /api/profile` returns career profile, scores, completion, and stats.
- `PATCH /api/profile` edits career fields, links, skills, interests, and goals.
- `POST /api/documents` uploads PDF, DOCX, resume, certificate, or note.
- `GET /api/documents` supports search, folder, tag, type, favorite, and sort filters.
- `PATCH /api/documents/:id` updates tags, folder, favorite, category, and display name.
- `DELETE /api/documents/:id` removes object storage file, chunks, and metadata.
- `POST /api/ai/chat` sends career-only question to the RAG pipeline.
- `GET /api/ai/chat/:sessionId` returns chat history.
- `POST /api/ai/resume/analyze` returns ATS score, keyword gaps, and suggestions.
- `POST /api/ai/roadmaps` generates personalized roadmap for a target role.
- `GET /api/roadmaps` lists saved roadmaps.
- `PATCH /api/goals/:id` updates goal status and awards XP.
- `GET /api/analytics` returns learning hours, skill growth, goals, scores, and AI usage.
- `POST /api/reminders` creates reminder.
- `GET /api/notifications` lists pending and sent notifications.
- `POST /api/push/register` registers browser or mobile push token.

## AI Chatbot And RAG Architecture

The chatbot must be career-scoped by policy and retrieval.

Flow:

1. Validate user JWT and load profile.
2. Classify input as career-related or not.
3. Rewrite follow-up question using recent chat history.
4. Search user documents first using hybrid retrieval:
   - vector similarity over `DocumentChunk.embedding`
   - keyword search over document metadata and extracted text
5. Search curated career knowledge base:
   - role roadmaps
   - skills taxonomy
   - certifications
   - resume and ATS guidance
   - interview preparation
6. Build response context with citations.
7. Generate answer with strict instruction:
   - answer only career, learning, resume, interview, skills, certification, placement, and role-planning topics
   - if out of scope, refuse briefly and redirect to career guidance
   - cite uploaded documents when used
8. Save message, response, citations, model, token usage, and latency.

Ingestion pipeline:

```text
upload -> virus/type/size validation -> object storage -> metadata row
       -> worker extracts text -> classify document type -> summarize
       -> chunk text -> create embeddings -> store chunks in pgvector
       -> update document searchable status
```

Document parsers:

- PDF: `pdf-parse` or hosted extraction worker.
- DOCX: `mammoth`.
- Resume parsing: text extraction plus AI structured extraction into skills, education, roles, and projects.

AI features:

- Resume analyzer: ATS score, formatting issues, missing keywords, impact rewrites.
- Interview coach: behavioral and technical mock interview sessions with rubric feedback.
- Skill gap analysis: compare profile skills against target role requirements.
- Career prediction: suggest suitable paths based on profile, goals, activity, and market taxonomy.
- Roadmap generator: weekly, monthly, skill, and placement-prep goals.

## UI/UX Redesign

Product name recommendation: StudyOrbit.

Information architecture:

- Career Overview
- AI Career Assistant
- Roadmaps
- Resume
- Skills
- Goals
- Documents
- Notifications
- Analytics
- Profile

Design direction:

- Professional, dense, calm dashboard rather than marketing-heavy screens.
- Light and dark mode with accessible contrast.
- Left rail on desktop, bottom tabs on mobile.
- First screen should be the working dashboard after login.
- Cards only for repeated items, metrics, and contained tools.
- Charts for readiness score, learning hours, skill growth, goal completion, streaks, and resume score trends.
- Use icon buttons for common actions, segmented controls for filters, toggles for preferences, and tabs for dashboard sections.

Dashboard layout:

- Top: career readiness score, target role, current streak, next goal.
- Left/main: AI assistant panel with recent suggestions.
- Center: active roadmap and weekly goals.
- Right: reminders, profile completion, resume health.
- Lower: document recents, analytics charts, achievement badges.

## Mobile App Design

Use Expo React Native.

Shared:

- API client, Zod validators, auth helpers, skill taxonomy, scoring logic, and selected UI tokens.

Native-only:

- Push notification registration.
- File picker and camera/document upload.
- Secure token storage.
- Background notification handling.

Mobile navigation:

- Bottom tabs: Overview, Chat, Roadmaps, Documents, Profile.
- Nested stack screens for Resume Analyzer, Interview Coach, Goal Detail, Document Detail, Settings.

## Notification System

Components:

- `Reminder` table for scheduled reminders.
- Push token table for web, Android, and iOS devices.
- Worker checks due reminders every minute.
- Email provider such as Resend, Postmark, or SendGrid.
- Browser push via Web Push VAPID.
- Mobile push via Expo Notifications or FCM/APNs.

Reminder types:

- Learning reminder.
- Resume update reminder.
- Certification deadline.
- Interview practice.
- Goal completion.
- Streak protection.

## Security And Scalability

Required controls:

- JWT verification on every API route.
- Role-based access control for admin and counselor features.
- Per-user authorization checks on all records.
- Rate limiting for auth, AI chat, upload, and document search.
- File type validation, size limits, malware scanning where possible.
- Store files outside the database in encrypted object storage.
- Encrypt sensitive profile fields if regulatory requirements demand it.
- Audit log for profile, document, AI, and admin actions.
- Structured logging with request IDs.
- OpenTelemetry traces for API, DB, AI model calls, and workers.
- Background queues for AI and notification jobs.

Recommended production services:

- Vercel or Fly.io for web/API.
- Supabase Postgres with `pgvector`, Neon, or RDS Postgres.
- Supabase Storage, S3, or R2.
- Upstash Redis for queues and rate limiting.
- Sentry for errors.
- OpenTelemetry collector for traces.

## Migration Roadmap

### Milestone 0: Stabilize Current App

- Run `prisma generate` and confirm Prisma client matches schema.
- Fix current `/api/artifacts` and `/api/daily-brief` runtime failures.
- Add smoke tests for auth, profile, artifacts, files, and daily brief.
- Split `WorkspaceShell` into smaller feature modules.

### Milestone 1: Career Domain Foundation

- Rename product surfaces to StudyOrbit.
- Add career profile schema fields.
- Replace study modules with career dashboard modules.
- Add profile completion and career readiness scoring.
- Migrate SQLite to PostgreSQL.

### Milestone 2: Documents And Resume

- Move file storage to object storage.
- Add folders, tags, favorites, recent files, and document categories.
- Add PDF/DOCX extraction worker.
- Add resume analyzer and ATS score history.

### Milestone 3: AI Assistant And RAG

- Add chat session and message tables.
- Add document chunks and embeddings.
- Build career-only classification guard.
- Implement hybrid retrieval over uploaded documents and curated career content.
- Add citations and chat history.

### Milestone 4: Roadmaps And Goals

- Generate AI roadmaps by target role.
- Add weekly and monthly goals.
- Add skill roadmap and placement roadmap.
- Add progress tracking against roadmap items.

### Milestone 5: Gamification And Analytics

- Add XP, badges, daily/weekly/monthly streaks.
- Add analytics dashboard.
- Track learning hours, skill growth, goal completion, resume score trend, readiness score, and AI usage.

### Milestone 6: Notifications

- Add reminders table and scheduler.
- Add browser push.
- Add email reminders.
- Add Expo mobile push.

### Milestone 7: Mobile

- Add Expo app.
- Share API client and validators.
- Implement core mobile screens.
- Add native uploads and push registration.
- Prepare Android and iOS builds.

### Milestone 8: Production Hardening

- Add API docs.
- Add unit, integration, and E2E tests.
- Add rate limits, logging, monitoring, audit logs, and backup strategy.
- Add deployment docs and CI/CD.

## Deployment Guide

Production environment variables:

```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
OBJECT_STORAGE_BUCKET="career-documents"
OPENAI_API_KEY="..."
REDIS_URL="..."
EMAIL_PROVIDER_API_KEY="..."
WEB_PUSH_PUBLIC_KEY="..."
WEB_PUSH_PRIVATE_KEY="..."
```

Deployment steps:

1. Provision Postgres with `pgvector`.
2. Run Prisma migrations.
3. Provision object storage and private bucket policies.
4. Deploy web/API.
5. Deploy worker service.
6. Configure Supabase Auth redirect URLs for web and mobile.
7. Configure push notification credentials.
8. Run smoke tests.
9. Enable monitoring alerts.

## Immediate Next Implementation Step

Start with Milestone 0 and Milestone 1:

1. Regenerate Prisma client and fix current API runtime errors.
2. Convert `UserProfile` to a career-aware profile model.
3. Add career dashboard routes and API contracts.
4. Replace the study dashboard with a career overview while keeping existing auth and file primitives.

