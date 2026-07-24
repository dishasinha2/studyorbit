ALTER TABLE "UserProfile"
ADD COLUMN "xpPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "longestStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastActivityDate" TIMESTAMP(3);

ALTER TABLE "UserGoal"
ADD COLUMN "completedAt" TIMESTAMP(3);

CREATE TABLE "NotificationReminder" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "message" TEXT,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "channels" "NotificationChannel"[] DEFAULT ARRAY['EMAIL']::"NotificationChannel"[],
  "isSent" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "NotificationReminder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NotificationReminder_userId_dueAt_idx" ON "NotificationReminder"("userId", "dueAt");
CREATE INDEX "NotificationReminder_userId_kind_isSent_idx" ON "NotificationReminder"("userId", "kind", "isSent");

ALTER TABLE "NotificationReminder"
ADD CONSTRAINT "NotificationReminder_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
