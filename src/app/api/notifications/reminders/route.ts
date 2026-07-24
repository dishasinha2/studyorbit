import { NotificationChannel, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

const REMINDER_KINDS = [
  "task",
  "deadline",
  "reading",
  "revision",
  "ai_recommendation",
  "daily_productivity",
  "learning",
  "goal",
  "resume",
  "certification",
  "interview",
] as const;

const createSchema = z.object({
  title: z.string().min(2).max(180),
  kind: z.enum(REMINDER_KINDS).default("task"),
  message: z.string().max(1000).nullable().optional(),
  dueAt: z.string().datetime().optional(),
  channels: z.array(z.nativeEnum(NotificationChannel)).min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = new URL(req.url).searchParams;
  const kind = searchParams.get("kind");
  const status = searchParams.get("status"); // "unread", "read", "all"

  const rawReminders = await prisma.notificationReminder.findMany({
    where: {
      userId: user.id,
      ...(kind && kind !== "all" ? { kind } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const reminders = rawReminders.filter((rem) => {
    const isRead = Boolean((rem.metadata as { isRead?: boolean } | null)?.isRead);
    if (status === "unread") return !isRead;
    if (status === "read") return isRead;
    return true;
  });

  return NextResponse.json({ reminders });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const dueAtDate = parsed.data.dueAt ? new Date(parsed.data.dueAt) : new Date();

  const reminder = await prisma.notificationReminder.create({
    data: {
      userId: user.id,
      title: parsed.data.title.trim(),
      kind: parsed.data.kind,
      message: parsed.data.message?.trim() || null,
      dueAt: dueAtDate,
      channels: parsed.data.channels ?? ["EMAIL", "WEB_PUSH"],
      metadata: ((parsed.data.metadata as Record<string, unknown> | undefined) ?? { source: "user-created", isRead: false }) as Prisma.InputJsonObject,
    },
  });

  return NextResponse.json({ reminder }, { status: 201 });
}
