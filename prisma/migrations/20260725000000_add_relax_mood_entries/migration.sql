CREATE TABLE "RelaxMoodEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RelaxMoodEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RelaxMoodEntry_userId_createdAt_idx" ON "RelaxMoodEntry"("userId", "createdAt");
ALTER TABLE "RelaxMoodEntry" ADD CONSTRAINT "RelaxMoodEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
