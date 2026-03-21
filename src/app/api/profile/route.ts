import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ensureUserProfile } from "@/lib/ensure-user";
import { getAuthContext } from "@/lib/auth-server";

const patchSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  avatarUrl: z.string().max(2_000).nullable().optional(),
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
    parsed.data.themePreference === undefined &&
    parsed.data.studyGoalMin === undefined &&
    parsed.data.focusSessionMin === undefined
  ) {
    return NextResponse.json({ error: "No profile changes provided." }, { status: 400 });
  }

  const user = await ensureUserProfile(auth.authId);
  const profile = await prisma.userProfile.update({
    where: { id: user.id },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name.trim() } : {}),
      ...(parsed.data.avatarUrl !== undefined ? { avatarUrl: parsed.data.avatarUrl } : {}),
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
        themePreference: "pastel",
        studyGoalMin: 120,
        focusSessionMin: 25,
      },
    });

    return NextResponse.json({ ok: true, profile });
  }

  await prisma.$transaction([
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
