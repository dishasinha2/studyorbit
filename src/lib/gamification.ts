import { prisma } from "@/lib/prisma";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayDiff(a: Date, b: Date) {
  return Math.round((startOfUtcDay(a).getTime() - startOfUtcDay(b).getTime()) / MS_PER_DAY);
}

export async function seedAchievements() {
  await prisma.achievement.createMany({
    data: [
      { code: "first_goal", name: "First Goal", description: "Complete your first career goal.", icon: "target", xp: 25 },
      { code: "three_day_streak", name: "Three Day Streak", description: "Keep career activity going for three days.", icon: "flame", xp: 30 },
      { code: "resume_ready", name: "Resume Ready", description: "Upload and analyze a resume.", icon: "file-check", xp: 40 },
    ],
    skipDuplicates: true,
  });
}

async function awardAchievement(userId: string, code: string) {
  const achievement = await prisma.achievement.findUnique({ where: { code } });
  if (!achievement) return null;
  await prisma.userAchievement.upsert({
    where: { userId_achievementId: { userId, achievementId: achievement.id } },
    update: {},
    create: { userId, achievementId: achievement.id },
  });
  return achievement;
}

export async function recordCareerActivity(userId: string, input: { xp?: number; achievementCode?: string } = {}) {
  await seedAchievements();
  const user = await prisma.userProfile.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found.");

  const now = new Date();
  const diff = user.lastActivityDate ? dayDiff(now, user.lastActivityDate) : null;
  const nextCurrentStreak = diff === 0 ? user.currentStreak : diff === 1 ? user.currentStreak + 1 : 1;
  const nextLongestStreak = Math.max(user.longestStreak, nextCurrentStreak);

  const updated = await prisma.userProfile.update({
    where: { id: userId },
    data: {
      xpPoints: { increment: input.xp ?? 5 },
      currentStreak: nextCurrentStreak,
      longestStreak: nextLongestStreak,
      lastActivityDate: now,
    },
  });

  if (input.achievementCode) await awardAchievement(userId, input.achievementCode);
  if (nextCurrentStreak >= 3) await awardAchievement(userId, "three_day_streak");

  return updated;
}

export async function gamificationSummary(userId: string) {
  await seedAchievements();
  const [user, achievements, goals] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { id: userId },
      select: { xpPoints: true, currentStreak: true, longestStreak: true, lastActivityDate: true },
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { earnedAt: "desc" },
    }),
    prisma.userGoal.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true },
    }),
  ]);

  const totalGoals = goals.reduce((sum, item) => sum + item._count._all, 0);
  const completedGoals = goals.find((item) => item.status === "COMPLETED")?._count._all ?? 0;

  return {
    xpPoints: user?.xpPoints ?? 0,
    currentStreak: user?.currentStreak ?? 0,
    longestStreak: user?.longestStreak ?? 0,
    lastActivityDate: user?.lastActivityDate ?? null,
    goalCompletionRate: totalGoals ? Math.round((completedGoals / totalGoals) * 100) : 0,
    achievements: achievements.map((item) => ({
      code: item.achievement.code,
      name: item.achievement.name,
      description: item.achievement.description,
      icon: item.achievement.icon,
      xp: item.achievement.xp,
      earnedAt: item.earnedAt,
    })),
  };
}

