import { NotificationChannel } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

const schema = z.object({
  channels: z.array(z.nativeEnum(NotificationChannel)).min(1).optional(),
  learningReminder: z.boolean().optional(),
  resumeUpdateReminder: z.boolean().optional(),
  certificationReminder: z.boolean().optional(),
  interviewReminder: z.boolean().optional(),
  goalReminder: z.boolean().optional(),
  taskReminder: z.boolean().optional(),
  deadlineReminder: z.boolean().optional(),
  readingReminder: z.boolean().optional(),
  revisionReminder: z.boolean().optional(),
  aiRecommendationReminder: z.boolean().optional(),
  dailyProductivityReminder: z.boolean().optional(),
  quietHoursStart: z.string().max(12).nullable().optional(),
  quietHoursEnd: z.string().max(12).nullable().optional(),
  timezone: z.string().max(80).optional(),
  fcmToken: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const preferences = await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  return NextResponse.json({ preferences });
}

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  // Extract core Prisma model fields
  const coreFields = {
    ...(data.channels ? { channels: data.channels } : {}),
    ...(data.learningReminder !== undefined ? { learningReminder: data.learningReminder } : {}),
    ...(data.resumeUpdateReminder !== undefined ? { resumeUpdateReminder: data.resumeUpdateReminder } : {}),
    ...(data.certificationReminder !== undefined ? { certificationReminder: data.certificationReminder } : {}),
    ...(data.interviewReminder !== undefined ? { interviewReminder: data.interviewReminder } : {}),
    ...(data.goalReminder !== undefined ? { goalReminder: data.goalReminder } : {}),
    ...(data.quietHoursStart !== undefined ? { quietHoursStart: data.quietHoursStart } : {}),
    ...(data.quietHoursEnd !== undefined ? { quietHoursEnd: data.quietHoursEnd } : {}),
    ...(data.timezone ? { timezone: data.timezone } : {}),
  };

  const preferences = await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...coreFields },
    update: coreFields,
  });

  return NextResponse.json({ preferences });
}
