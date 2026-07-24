-- PostgreSQL baseline for CareerOrbit.
-- This migration replaces the earlier local SQLite-only baseline with a
-- production-compatible PostgreSQL schema.

CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "public"."ArtifactType" AS ENUM ('NOTE', 'LINK', 'FILE', 'TASK', 'CALENDAR', 'EMAIL');
CREATE TYPE "public"."TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE "public"."DocumentType" AS ENUM ('RESUME', 'CERTIFICATE', 'NOTE', 'PDF', 'DOCX', 'OTHER');
CREATE TYPE "public"."DocumentStatus" AS ENUM ('UPLOADED', 'INGESTING', 'READY', 'FAILED');
CREATE TYPE "public"."IngestionStatus" AS ENUM ('PENDING', 'EXTRACTING', 'CHUNKING', 'EMBEDDING', 'COMPLETED', 'FAILED');
CREATE TYPE "public"."MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');
CREATE TYPE "public"."GoalStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED');
CREATE TYPE "public"."NotificationChannel" AS ENUM ('EMAIL', 'WEB_PUSH', 'MOBILE_PUSH');

CREATE TABLE "public"."UserProfile" (
    "id" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "age" INTEGER,
    "education" TEXT,
    "college" TEXT,
    "degree" TEXT,
    "skillsJson" TEXT NOT NULL DEFAULT '[]',
    "interestsJson" TEXT NOT NULL DEFAULT '[]',
    "careerGoalsJson" TEXT NOT NULL DEFAULT '[]',
    "resumeFileId" TEXT,
    "linkedinUrl" TEXT,
    "githubUrl" TEXT,
    "profileCompletion" INTEGER NOT NULL DEFAULT 0,
    "careerReadiness" INTEGER NOT NULL DEFAULT 0,
    "themePreference" TEXT NOT NULL DEFAULT 'pastel',
    "studyGoalMin" INTEGER NOT NULL DEFAULT 120,
    "focusSessionMin" INTEGER NOT NULL DEFAULT 25,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."EducationHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT,
    "field" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "grade" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EducationHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."UserSkill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "targetLevel" INTEGER,
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserSkill_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "color" TEXT NOT NULL DEFAULT '#22d3ee',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Artifact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "public"."ArtifactType" NOT NULL,
    "source" TEXT,
    "contextKey" TEXT,
    "dueAt" TIMESTAMP(3),
    "occurredAt" TIMESTAMP(3),
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Artifact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."PlannerEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "reminderAt" TIMESTAMP(3),
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlannerEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."StickyNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#fef08a',
    "isPinned" BOOLEAN NOT NULL DEFAULT true,
    "posX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "posY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StickyNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Whiteboard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dataJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Whiteboard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."VideoBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "comment" TEXT,
    "tags" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VideoBookmark_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."FileItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pathOrUrl" TEXT NOT NULL,
    "originalFileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "storageData" BYTEA,
    "category" TEXT,
    "subject" TEXT,
    "tags" TEXT,
    "lastPosition" TEXT,
    "progressNote" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FileItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."FocusSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "breakMin" INTEGER NOT NULL,
    "screenLimitMin" INTEGER,
    "blockedList" TEXT,
    "note" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FocusSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."DocumentFolder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DocumentFolder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "folderId" TEXT,
    "name" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "type" "public"."DocumentType" NOT NULL,
    "status" "public"."DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageData" BYTEA,
    "extractedText" TEXT,
    "summary" TEXT,
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "category" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."DocumentChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Embedding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chunkId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "dimensions" INTEGER NOT NULL,
    "vectorJson" JSONB,
    "vectorHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."DocumentIngestionJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "status" "public"."IngestionStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DocumentIngestionJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'career',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "public"."MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "citations" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."CareerRoadmap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "planJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CareerRoadmap_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."UserGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roadmapId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "status" "public"."GoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "dueAt" TIMESTAMP(3),
    "xpReward" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserGoal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Achievement" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."UserAchievement" (
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("userId","achievementId")
);

CREATE TABLE "public"."NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channels" "public"."NotificationChannel"[] DEFAULT ARRAY['EMAIL']::"public"."NotificationChannel"[],
    "learningReminder" BOOLEAN NOT NULL DEFAULT true,
    "resumeUpdateReminder" BOOLEAN NOT NULL DEFAULT true,
    "certificationReminder" BOOLEAN NOT NULL DEFAULT true,
    "interviewReminder" BOOLEAN NOT NULL DEFAULT true,
    "goalReminder" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserProfile_authId_key" ON "public"."UserProfile"("authId");
CREATE INDEX "EducationHistory_userId_startYear_idx" ON "public"."EducationHistory"("userId", "startYear");
CREATE INDEX "UserSkill_userId_category_idx" ON "public"."UserSkill"("userId", "category");
CREATE UNIQUE INDEX "UserSkill_userId_name_key" ON "public"."UserSkill"("userId", "name");
CREATE INDEX "Project_userId_createdAt_idx" ON "public"."Project"("userId", "createdAt");
CREATE INDEX "Artifact_userId_type_createdAt_idx" ON "public"."Artifact"("userId", "type", "createdAt");
CREATE INDEX "Artifact_projectId_createdAt_idx" ON "public"."Artifact"("projectId", "createdAt");
CREATE INDEX "PlannerEvent_userId_startAt_idx" ON "public"."PlannerEvent"("userId", "startAt");
CREATE INDEX "StickyNote_userId_createdAt_idx" ON "public"."StickyNote"("userId", "createdAt");
CREATE INDEX "Whiteboard_userId_updatedAt_idx" ON "public"."Whiteboard"("userId", "updatedAt");
CREATE INDEX "VideoBookmark_userId_createdAt_idx" ON "public"."VideoBookmark"("userId", "createdAt");
CREATE INDEX "FileItem_userId_createdAt_idx" ON "public"."FileItem"("userId", "createdAt");
CREATE INDEX "FocusSession_userId_createdAt_idx" ON "public"."FocusSession"("userId", "createdAt");
CREATE INDEX "DocumentFolder_userId_name_idx" ON "public"."DocumentFolder"("userId", "name");
CREATE UNIQUE INDEX "DocumentFolder_userId_parentId_name_key" ON "public"."DocumentFolder"("userId", "parentId", "name");
CREATE INDEX "Document_userId_type_uploadedAt_idx" ON "public"."Document"("userId", "type", "uploadedAt");
CREATE INDEX "Document_userId_category_idx" ON "public"."Document"("userId", "category");
CREATE INDEX "Document_folderId_idx" ON "public"."Document"("folderId");
CREATE INDEX "DocumentChunk_userId_documentId_idx" ON "public"."DocumentChunk"("userId", "documentId");
CREATE UNIQUE INDEX "DocumentChunk_documentId_chunkIndex_key" ON "public"."DocumentChunk"("documentId", "chunkIndex");
CREATE INDEX "Embedding_userId_provider_model_idx" ON "public"."Embedding"("userId", "provider", "model");
CREATE INDEX "Embedding_chunkId_idx" ON "public"."Embedding"("chunkId");
CREATE INDEX "DocumentIngestionJob_userId_status_createdAt_idx" ON "public"."DocumentIngestionJob"("userId", "status", "createdAt");
CREATE INDEX "Conversation_userId_updatedAt_idx" ON "public"."Conversation"("userId", "updatedAt");
CREATE INDEX "Message_conversationId_createdAt_idx" ON "public"."Message"("conversationId", "createdAt");
CREATE INDEX "CareerRoadmap_userId_targetRole_idx" ON "public"."CareerRoadmap"("userId", "targetRole");
CREATE INDEX "UserGoal_userId_status_dueAt_idx" ON "public"."UserGoal"("userId", "status", "dueAt");
CREATE UNIQUE INDEX "Achievement_code_key" ON "public"."Achievement"("code");
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "public"."NotificationPreference"("userId");

ALTER TABLE "public"."EducationHistory" ADD CONSTRAINT "EducationHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."UserSkill" ADD CONSTRAINT "UserSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Artifact" ADD CONSTRAINT "Artifact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Artifact" ADD CONSTRAINT "Artifact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."PlannerEvent" ADD CONSTRAINT "PlannerEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."StickyNote" ADD CONSTRAINT "StickyNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Whiteboard" ADD CONSTRAINT "Whiteboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."VideoBookmark" ADD CONSTRAINT "VideoBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."FileItem" ADD CONSTRAINT "FileItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."FocusSession" ADD CONSTRAINT "FocusSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."DocumentFolder" ADD CONSTRAINT "DocumentFolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."DocumentFolder" ADD CONSTRAINT "DocumentFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."DocumentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."DocumentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."DocumentChunk" ADD CONSTRAINT "DocumentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."DocumentChunk" ADD CONSTRAINT "DocumentChunk_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Embedding" ADD CONSTRAINT "Embedding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Embedding" ADD CONSTRAINT "Embedding_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "public"."DocumentChunk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."DocumentIngestionJob" ADD CONSTRAINT "DocumentIngestionJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."DocumentIngestionJob" ADD CONSTRAINT "DocumentIngestionJob_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."CareerRoadmap" ADD CONSTRAINT "CareerRoadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."UserGoal" ADD CONSTRAINT "UserGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."UserGoal" ADD CONSTRAINT "UserGoal_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "public"."CareerRoadmap"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "public"."Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
