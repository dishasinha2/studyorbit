import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();

  // Retrieve user items to generate personalized, context-aware notifications
  const pendingTasks = await prisma.artifact.findMany({
    where: { userId: user.id, type: "TASK", isDone: false },
    take: 3,
  });

  const upcomingEvents = await prisma.plannerEvent.findMany({
    where: { userId: user.id, isDone: false },
    take: 3,
  });

  const readingFiles = await prisma.fileItem.findMany({
    where: { userId: user.id, isCompleted: false },
    take: 3,
  });

  const stickyNotes = await prisma.stickyNote.findMany({
    where: { userId: user.id, isPinned: true },
    take: 3,
  });

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
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

  // 1. Task Reminders
  if (pendingTasks.length > 0) {
    for (const task of pendingTasks) {
      newReminders.push({
        userId: user.id,
        title: `Task Reminder: ${task.title}`,
        kind: "task",
        message: `Keep up your momentum! Work on task "${task.title}".`,
        dueAt: task.dueAt || new Date(now.getTime() + 2 * 3600 * 1000),
        channels: ["EMAIL", "WEB_PUSH"],
        metadata: { source: "auto-generated", isRead: false },
      });
    }
  } else {
    newReminders.push({
      userId: user.id,
      title: "Task Reminder: Plan your high-priority items",
      kind: "task",
      message: "You have no pending tasks. Add a quick task in your Dashboard to stay organized.",
      dueAt: new Date(now.getTime() + 1 * 3600 * 1000),
      channels: ["WEB_PUSH"],
      metadata: { source: "auto-generated", isRead: false },
    });
  }

  // 2. Deadline Reminders
  if (upcomingEvents.length > 0) {
    for (const event of upcomingEvents) {
      newReminders.push({
        userId: user.id,
        title: `Deadline Alert: ${event.title}`,
        kind: "deadline",
        message: `Upcoming event on your schedule: ${event.title} scheduled for ${new Date(event.startAt).toLocaleString()}.`,
        dueAt: event.reminderAt || new Date(event.startAt),
        channels: ["EMAIL", "WEB_PUSH"],
        metadata: { source: "auto-generated", isRead: false },
      });
    }
  } else {
    newReminders.push({
      userId: user.id,
      title: "Deadline Reminder: Upcoming Milestones",
      kind: "deadline",
      message: "Check your planner and roadmap to ensure all certification and project deadlines are tracked.",
      dueAt: new Date(now.getTime() + 4 * 3600 * 1000),
      channels: ["EMAIL", "WEB_PUSH"],
      metadata: { source: "auto-generated", isRead: false },
    });
  }

  // 3. Reading Reminders
  if (readingFiles.length > 0) {
    const file = readingFiles[0];
    newReminders.push({
      userId: user.id,
      title: `Reading Reminder: ${file.name}`,
      kind: "reading",
      message: `Spend 15 minutes reviewing your uploaded document "${file.name}".`,
      dueAt: new Date(now.getTime() + 3 * 3600 * 1000),
      channels: ["WEB_PUSH"],
      metadata: { source: "auto-generated", isRead: false },
    });
  } else {
    newReminders.push({
      userId: user.id,
      title: "Reading Reminder: Ingest Study Materials",
      kind: "reading",
      message: "Upload a syllabus, chapter PDF, or research article in Documents to start active reading.",
      dueAt: new Date(now.getTime() + 5 * 3600 * 1000),
      channels: ["WEB_PUSH"],
      metadata: { source: "auto-generated", isRead: false },
    });
  }

  // 4. Revision Reminders
  if (stickyNotes.length > 0) {
    newReminders.push({
      userId: user.id,
      title: "Revision Reminder: Review Pinned Notes",
      kind: "revision",
      message: `Take 5 minutes to revise key concept: "${stickyNotes[0].content.slice(0, 80)}"`,
      dueAt: new Date(now.getTime() + 6 * 3600 * 1000),
      channels: ["WEB_PUSH"],
      metadata: { source: "auto-generated", isRead: false },
    });
  } else {
    newReminders.push({
      userId: user.id,
      title: "Revision Reminder: Active Recall Practice",
      kind: "revision",
      message: "Regular revision boosts long-term retention. Review your workspace notes and flashcards.",
      dueAt: new Date(now.getTime() + 7 * 3600 * 1000),
      channels: ["WEB_PUSH"],
      metadata: { source: "auto-generated", isRead: false },
    });
  }

  // 5. AI Recommendations
  const readiness = profile?.careerReadiness ?? 45;
  newReminders.push({
    userId: user.id,
    title: "AI Recommendation: Career Readiness Insight",
    kind: "ai_recommendation",
    message: `Your career readiness is at ${readiness}%. Add a target job role or upload a resume to receive tailored AI roadmap steps.`,
    dueAt: new Date(now.getTime() + 8 * 3600 * 1000),
    channels: ["EMAIL", "WEB_PUSH"],
    metadata: { source: "auto-generated", isRead: false },
  });

  // 6. Daily Productivity Reminders
  const streak = profile?.currentStreak ?? 1;
  newReminders.push({
    userId: user.id,
    title: "Daily Productivity Check",
    kind: "daily_productivity",
    message: `You are on a ${streak}-day focus streak! Complete a 25-minute Pomodoro focus session today to level up.`,
    dueAt: new Date(now.getTime() + 30 * 60 * 1000),
    channels: ["EMAIL", "WEB_PUSH"],
    metadata: { source: "auto-generated", isRead: false },
  });

  const created = await Promise.all(
    newReminders.map((r) =>
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
