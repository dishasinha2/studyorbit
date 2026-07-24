import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ensureUserProfile } from "@/lib/ensure-user";
import { getAuthContext } from "@/lib/auth-server";
import {
  calculateCareerReadiness,
  calculateProfileCompletion,
  parseStringList,
  stringifyStringList,
} from "@/lib/career-scoring";

const patchSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  avatarUrl: z.string().max(2_000).nullable().optional(),
  age: z.number().int().min(13).max(100).nullable().optional(),
  education: z.string().max(120).nullable().optional(),
  college: z.string().max(160).nullable().optional(),
  degree: z.string().max(160).nullable().optional(),
  skills: z.array(z.string().min(1).max(60)).max(30).optional(),
  interests: z.array(z.string().min(1).max(80)).max(30).optional(),
  careerGoals: z.array(z.string().min(1).max(140)).max(20).optional(),
  resumeFileId: z.string().nullable().optional(),
  linkedinUrl: z.string().url().max(300).nullable().optional(),
  githubUrl: z.string().url().max(300).nullable().optional(),
  themePreference: z.enum(["pastel", "light"]).optional(),
  studyGoalMin: z.number().int().min(30).max(600).optional(),
  focusSessionMin: z.number().int().min(10).max(90).optional(),
});

const deleteSchema = z.object({
  action: z.enum(["reset_profile", "clear_workspace"]),
});

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await ensureUserProfile(auth.authId);

  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const [artifactStats, fileCount, videoCount, stickyCount, focusStats, projectCount, recentArtifacts, recentFiles, recentVideos, recentStickies, recentFocus, focusTrendSessions] = await Promise.all([
    prisma.artifact.groupBy({
      by: ["type", "status"],
      where: { userId: user.id },
      _count: { _all: true },
    }),
    prisma.fileItem.count({ where: { userId: user.id } }),
    prisma.videoBookmark.count({ where: { userId: user.id } }),
    prisma.stickyNote.count({ where: { userId: user.id } }),
    prisma.focusSession.aggregate({
      where: { userId: user.id },
      _count: { _all: true },
      _sum: { durationMin: true },
    }),
    prisma.project.count({ where: { userId: user.id } }),
    prisma.artifact.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, type: true, title: true, updatedAt: true, status: true },
    }),
    prisma.fileItem.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, name: true, subject: true, updatedAt: true },
    }),
    prisma.videoBookmark.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, title: true, isCompleted: true, updatedAt: true },
    }),
    prisma.stickyNote.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, content: true, updatedAt: true },
    }),
    prisma.focusSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, durationMin: true, startedAt: true },
    }),
    prisma.focusSession.findMany({
      where: { userId: user.id, startedAt: { gte: since } },
      orderBy: { startedAt: "asc" },
      select: { startedAt: true, durationMin: true },
    }),
  ]);

  const tasks = artifactStats.filter((item) => item.type === "TASK");
  const notes = artifactStats.filter((item) => item.type === "NOTE").reduce((sum, item) => sum + item._count._all, 0);
  const links = artifactStats.filter((item) => item.type === "LINK").reduce((sum, item) => sum + item._count._all, 0);
  const totalTasks = tasks.reduce((sum, item) => sum + item._count._all, 0);
  const completedTasks = tasks.filter((item) => item.status === "COMPLETED").reduce((sum, item) => sum + item._count._all, 0);

  const recentActivity = [
    ...recentArtifacts.map((item) => ({
      id: item.id,
      kind: item.type === "TASK" ? "task" : item.type === "NOTE" ? "note" : "link",
      title: item.title,
      detail:
        item.type === "TASK"
          ? `Task ${item.status.toLowerCase().replace("_", " ")}`
          : item.type === "NOTE"
            ? "Note updated"
            : "Link saved",
      at: item.updatedAt.toISOString(),
    })),
    ...recentFiles.map((item) => ({
      id: item.id,
      kind: "file" as const,
      title: item.name,
      detail: item.subject ? `File in ${item.subject}` : "File saved",
      at: item.updatedAt.toISOString(),
    })),
    ...recentVideos.map((item) => ({
      id: item.id,
      kind: "video" as const,
      title: item.title,
      detail: item.isCompleted ? "Video completed" : "Video saved",
      at: item.updatedAt.toISOString(),
    })),
    ...recentStickies.map((item) => ({
      id: item.id,
      kind: "sticky" as const,
      title: item.content.slice(0, 42) || "Sticky note",
      detail: "Sticky note updated",
      at: item.updatedAt.toISOString(),
    })),
    ...recentFocus.map((item) => ({
      id: item.id,
      kind: "focus" as const,
      title: `Focus session`,
      detail: `${item.durationMin} minutes completed`,
      at: item.startedAt.toISOString(),
    })),
  ]
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 8);

  const focusTrendMap = new Map<string, number>();
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    focusTrendMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const session of focusTrendSessions) {
    const key = session.startedAt.toISOString().slice(0, 10);
    focusTrendMap.set(key, (focusTrendMap.get(key) ?? 0) + session.durationMin);
  }

  return NextResponse.json({
    profile: {
      id: user.id,
      name: user.name,
      email: auth.email ?? null,
      avatarUrl: user.avatarUrl,
      career: {
        age: user.age,
        education: user.education,
        college: user.college,
        degree: user.degree,
        skills: parseStringList(user.skillsJson),
        interests: parseStringList(user.interestsJson),
        careerGoals: parseStringList(user.careerGoalsJson),
        resumeFileId: user.resumeFileId,
        linkedinUrl: user.linkedinUrl,
        githubUrl: user.githubUrl,
        profileCompletion: user.profileCompletion,
        careerReadiness: user.careerReadiness,
      },
      preferences: {
        themePreference: user.themePreference,
        studyGoalMin: user.studyGoalMin,
        focusSessionMin: user.focusSessionMin,
      },
      createdAt: user.createdAt,
      stats: {
        tasks: totalTasks,
        completedTasks,
        notes,
        links,
        files: fileCount,
        videos: videoCount,
        stickies: stickyCount,
        focusSessions: focusStats._count._all,
        focusMinutes: focusStats._sum.durationMin ?? 0,
        projects: projectCount,
      },
      recentActivity,
      focusTrend: [...focusTrendMap.entries()].map(([day, minutes]) => ({ day, minutes })),
    },
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (
    !parsed.data.name &&
    parsed.data.avatarUrl === undefined &&
    parsed.data.age === undefined &&
    parsed.data.education === undefined &&
    parsed.data.college === undefined &&
    parsed.data.degree === undefined &&
    parsed.data.skills === undefined &&
    parsed.data.interests === undefined &&
    parsed.data.careerGoals === undefined &&
    parsed.data.resumeFileId === undefined &&
    parsed.data.linkedinUrl === undefined &&
    parsed.data.githubUrl === undefined &&
    parsed.data.themePreference === undefined &&
    parsed.data.studyGoalMin === undefined &&
    parsed.data.focusSessionMin === undefined
  ) {
    return NextResponse.json({ error: "No profile changes provided." }, { status: 400 });
  }

  const user = await ensureUserProfile(auth.authId);
  const nextCareer = {
    name: parsed.data.name ?? user.name,
    age: parsed.data.age !== undefined ? parsed.data.age : user.age,
    education: parsed.data.education !== undefined ? parsed.data.education : user.education,
    college: parsed.data.college !== undefined ? parsed.data.college : user.college,
    degree: parsed.data.degree !== undefined ? parsed.data.degree : user.degree,
    skills: parsed.data.skills ?? parseStringList(user.skillsJson),
    interests: parsed.data.interests ?? parseStringList(user.interestsJson),
    careerGoals: parsed.data.careerGoals ?? parseStringList(user.careerGoalsJson),
    resumeFileId: parsed.data.resumeFileId !== undefined ? parsed.data.resumeFileId : user.resumeFileId,
    linkedinUrl: parsed.data.linkedinUrl !== undefined ? parsed.data.linkedinUrl : user.linkedinUrl,
    githubUrl: parsed.data.githubUrl !== undefined ? parsed.data.githubUrl : user.githubUrl,
  };
  const profile = await prisma.userProfile.update({
    where: { id: user.id },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name.trim() } : {}),
      ...(parsed.data.avatarUrl !== undefined ? { avatarUrl: parsed.data.avatarUrl } : {}),
      ...(parsed.data.age !== undefined ? { age: parsed.data.age } : {}),
      ...(parsed.data.education !== undefined ? { education: parsed.data.education?.trim() || null } : {}),
      ...(parsed.data.college !== undefined ? { college: parsed.data.college?.trim() || null } : {}),
      ...(parsed.data.degree !== undefined ? { degree: parsed.data.degree?.trim() || null } : {}),
      ...(parsed.data.skills !== undefined ? { skillsJson: stringifyStringList(parsed.data.skills) ?? "[]" } : {}),
      ...(parsed.data.interests !== undefined ? { interestsJson: stringifyStringList(parsed.data.interests) ?? "[]" } : {}),
      ...(parsed.data.careerGoals !== undefined ? { careerGoalsJson: stringifyStringList(parsed.data.careerGoals) ?? "[]" } : {}),
      ...(parsed.data.resumeFileId !== undefined ? { resumeFileId: parsed.data.resumeFileId } : {}),
      ...(parsed.data.linkedinUrl !== undefined ? { linkedinUrl: parsed.data.linkedinUrl?.trim() || null } : {}),
      ...(parsed.data.githubUrl !== undefined ? { githubUrl: parsed.data.githubUrl?.trim() || null } : {}),
      profileCompletion: calculateProfileCompletion(nextCareer),
      careerReadiness: calculateCareerReadiness(nextCareer),
      ...(parsed.data.themePreference !== undefined ? { themePreference: parsed.data.themePreference } : {}),
      ...(parsed.data.studyGoalMin !== undefined ? { studyGoalMin: parsed.data.studyGoalMin } : {}),
      ...(parsed.data.focusSessionMin !== undefined ? { focusSessionMin: parsed.data.focusSessionMin } : {}),
    },
  });

  return NextResponse.json({ profile });
}

export async function DELETE(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await ensureUserProfile(auth.authId);

  if (parsed.data.action === "reset_profile") {
    const profile = await prisma.userProfile.update({
      where: { id: user.id },
      data: {
        name: null,
        avatarUrl: null,
        age: null,
        education: null,
        college: null,
        degree: null,
        skillsJson: "[]",
        interestsJson: "[]",
        careerGoalsJson: "[]",
        resumeFileId: null,
        linkedinUrl: null,
        githubUrl: null,
        profileCompletion: 0,
        careerReadiness: 0,
        xpPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        themePreference: "pastel",
        studyGoalMin: 120,
        focusSessionMin: 25,
      },
    });

    return NextResponse.json({ ok: true, profile });
  }

  await prisma.$transaction([
    prisma.message.deleteMany({ where: { conversation: { userId: user.id } } }),
    prisma.conversation.deleteMany({ where: { userId: user.id } }),
    prisma.embedding.deleteMany({ where: { userId: user.id } }),
    prisma.documentChunk.deleteMany({ where: { userId: user.id } }),
    prisma.documentIngestionJob.deleteMany({ where: { userId: user.id } }),
    prisma.document.deleteMany({ where: { userId: user.id } }),
    prisma.documentFolder.deleteMany({ where: { userId: user.id } }),
    prisma.userGoal.deleteMany({ where: { userId: user.id } }),
    prisma.careerRoadmap.deleteMany({ where: { userId: user.id } }),
    prisma.userSkill.deleteMany({ where: { userId: user.id } }),
    prisma.educationHistory.deleteMany({ where: { userId: user.id } }),
    prisma.userAchievement.deleteMany({ where: { userId: user.id } }),
    prisma.notificationPreference.deleteMany({ where: { userId: user.id } }),
    prisma.notificationReminder.deleteMany({ where: { userId: user.id } }),
    prisma.artifact.deleteMany({ where: { userId: user.id } }),
    prisma.plannerEvent.deleteMany({ where: { userId: user.id } }),
    prisma.stickyNote.deleteMany({ where: { userId: user.id } }),
    prisma.whiteboard.deleteMany({ where: { userId: user.id } }),
    prisma.videoBookmark.deleteMany({ where: { userId: user.id } }),
    prisma.fileItem.deleteMany({ where: { userId: user.id } }),
    prisma.focusSession.deleteMany({ where: { userId: user.id } }),
    prisma.project.deleteMany({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
