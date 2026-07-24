import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

export type CalendarFeedItem = {
  id: string;
  type: "task" | "deadline" | "pdf_revision" | "event" | "reminder";
  title: string;
  description: string | null;
  date: string;
  isCompleted: boolean;
  targetUrl: string | null;
  sourceId: string;
  meta?: {
    subject?: string;
    category?: string;
    lastPosition?: string;
    contextKey?: string;
    kind?: string;
    hasStoredFile?: boolean;
  };
};

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all 4 data sources in parallel
  const [tasks, events, files, reminders] = await Promise.all([
    prisma.artifact.findMany({
      where: { userId: user.id, type: "TASK" },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.plannerEvent.findMany({
      where: { userId: user.id },
      orderBy: { startAt: "desc" },
      take: 200,
    }),
    prisma.fileItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.notificationReminder.findMany({
      where: { userId: user.id },
      orderBy: { dueAt: "desc" },
      take: 200,
    }),
  ]);

  const items: CalendarFeedItem[] = [];

  // 1. Process Tasks
  tasks.forEach((t) => {
    const isDone = Boolean(t.isDone) || t.content?.includes("[COMPLETED]");
    const targetDate = t.dueAt || t.createdAt;
    items.push({
      id: `task-${t.id}`,
      type: "task",
      title: t.title,
      description: t.content || null,
      date: targetDate.toISOString(),
      isCompleted: isDone,
      targetUrl: `/workspace?module=dashboard`,
      sourceId: t.id,
      meta: {
        contextKey: t.contextKey || "General Task",
      },
    });
  });

  // 2. Process Deadlines / Planner Events
  events.forEach((e) => {
    items.push({
      id: `event-${e.id}`,
      type: "deadline",
      title: e.title,
      description: e.notes || null,
      date: e.startAt.toISOString(),
      isCompleted: Boolean(e.isDone),
      targetUrl: `/workspace?module=timeline`,
      sourceId: e.id,
      meta: {
        kind: "deadline",
      },
    });
  });

  // 3. Process PDF / Document Revision Schedule
  files.forEach((f) => {
    const isPdf = f.name.toLowerCase().endsWith(".pdf") || f.category === "study-material" || f.tags?.includes("pdf");
    const downloadUrl = f.storageData || f.pathOrUrl.startsWith("/api/files/") ? `/api/files/${f.id}/download` : f.pathOrUrl;

    items.push({
      id: `file-${f.id}`,
      type: "pdf_revision",
      title: `PDF Revision: ${f.name}`,
      description: f.progressNote ? `Note: ${f.progressNote}` : f.lastPosition ? `Last read: ${f.lastPosition}` : "Scheduled for review",
      date: f.updatedAt ? f.updatedAt.toISOString() : f.createdAt.toISOString(),
      isCompleted: Boolean(f.isCompleted),
      targetUrl: downloadUrl,
      sourceId: f.id,
      meta: {
        subject: f.subject || "General Study",
        category: f.category || (isPdf ? "PDF Document" : "Study Material"),
        lastPosition: f.lastPosition || undefined,
        hasStoredFile: Boolean(f.storageData),
      },
    });
  });

  // 4. Process Reminders (reading, revision, task reminders)
  reminders.forEach((r) => {
    const isRead = Boolean((r.metadata as Record<string, unknown> | null)?.isRead);
    items.push({
      id: `reminder-${r.id}`,
      type: "reminder",
      title: r.title,
      description: r.message || null,
      date: r.dueAt.toISOString(),
      isCompleted: isRead,
      targetUrl: `/workspace?module=dashboard`,
      sourceId: r.id,
      meta: {
        kind: r.kind,
      },
    });
  });

  // Sort all items chronologically (latest first or earliest depending on use case)
  items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return NextResponse.json({ items });
}
