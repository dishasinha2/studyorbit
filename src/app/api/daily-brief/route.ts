import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [todayEvents, todayTasks, overdueTasks, remindersDue, pinnedSticky, recentVideos, recentNotes, focusSessions] = await Promise.all([
    prisma.plannerEvent.findMany({
      where: { userId: user.id, startAt: { gte: dayStart, lt: dayEnd } },
      orderBy: { startAt: "asc" },
    }),
    prisma.artifact.findMany({
      where: { userId: user.id, type: "TASK", status: { not: "COMPLETED" }, dueAt: { gte: dayStart, lt: dayEnd } },
      orderBy: { dueAt: "asc" },
      take: 10,
    }),
    prisma.artifact.findMany({
      where: { userId: user.id, type: "TASK", status: { not: "COMPLETED" }, dueAt: { lt: new Date() } },
      orderBy: { dueAt: "asc" },
      take: 8,
    }),
    prisma.plannerEvent.findMany({
      where: { userId: user.id, isDone: false, reminderAt: { gte: now, lt: dayEnd } },
      orderBy: { reminderAt: "asc" },
      take: 10,
    }),
    prisma.stickyNote.findMany({
      where: { userId: user.id, isPinned: true },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.videoBookmark.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.artifact.findMany({
      where: { userId: user.id, type: "NOTE" },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    prisma.focusSession.findMany({
      where: { userId: user.id, createdAt: { gte: dayStart, lt: dayEnd } },
    }),
  ]);

  const focusMinutes = focusSessions.reduce((sum, item) => sum + item.durationMin, 0);

  return NextResponse.json({
    summary: {
      eventsToday: todayEvents.length,
      pendingTasks: todayTasks.length,
      remindersDue: remindersDue.length,
      overdueTasks: overdueTasks.length,
      pinnedNotes: pinnedSticky.length,
      notesSaved: recentNotes.length,
      focusMinutes,
    },
    todayEvents,
    todayTasks,
    remindersDue,
    overdueTasks,
    pinnedSticky,
    recentVideos,
    recentNotes,
  });
}
