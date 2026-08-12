import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();

  const soon = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Only surface work that needs attention. Generic reminders make the inbox noisy.
  const pendingTasks = await prisma.artifact.findMany({
    where: { userId: user.id, type: "TASK", status: { not: "COMPLETED" }, dueAt: { not: null, lte: soon } },
    orderBy: { dueAt: "asc" },
    take: 3,
  });

  const upcomingEvents = await prisma.plannerEvent.findMany({
    where: { userId: user.id, isDone: false, startAt: { lte: soon } },
    orderBy: { startAt: "asc" },
    take: 3,
  });

  const newReminders: {
    userId: string;
    title: string;
    kind: string;
    message: string;
    dueAt: Date;
    channels: ("EMAIL" | "WEB_PUSH" | "MOBILE_PUSH")[];
    metadata: { source: string; isRead: boolean };
  }[] = [];

  for (const task of pendingTasks) {
    const overdue = task.dueAt && task.dueAt < now;
    newReminders.push({
      userId: user.id,
      title: overdue ? `Overdue: ${task.title}` : `Due soon: ${task.title}`,
      kind: "task",
      message: overdue
        ? `This task passed its deadline. Reschedule or complete it today.`
        : `This task is due ${task.dueAt?.toLocaleString()}.`,
      dueAt: task.dueAt ?? now,
      channels: ["WEB_PUSH"],
      metadata: { source: "auto-generated", isRead: false },
    });
  }

  for (const event of upcomingEvents) {
    const overdue = event.startAt < now;
    newReminders.push({ userId: user.id, title: overdue ? `Deadline passed: ${event.title}` : `Deadline approaching: ${event.title}`, kind: "deadline", message: overdue ? "This deadline has passed. Update the plan or mark it complete." : `Scheduled for ${event.startAt.toLocaleString()}.`, dueAt: event.reminderAt || event.startAt, channels: ["WEB_PUSH"], metadata: { source: "auto-generated", isRead: false } });
  }

  const recentTitles = newReminders.length
    ? await prisma.notificationReminder.findMany({
        where: { userId: user.id, title: { in: newReminders.map((reminder) => reminder.title) }, createdAt: { gte: new Date(now.getTime() - 12 * 60 * 60 * 1000) } },
        select: { title: true },
      })
    : [];
  const alreadySent = new Set(recentTitles.map((reminder) => reminder.title));
  const created = await Promise.all(
    newReminders.filter((reminder) => !alreadySent.has(reminder.title)).map((r) =>
      prisma.notificationReminder.create({
        data: {
          ...r,
          metadata: r.metadata as Prisma.InputJsonObject,
        },
      })
    )
  );

  return NextResponse.json({ createdCount: created.length, reminders: created });
}
