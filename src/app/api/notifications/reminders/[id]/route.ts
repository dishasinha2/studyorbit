import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

const patchSchema = z.object({
  isRead: z.boolean().optional(),
  isSent: z.boolean().optional(),
  title: z.string().optional(),
  message: z.string().nullable().optional(),
  dueAt: z.string().datetime().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  if (id === "read-all") {
    const allReminders = await prisma.notificationReminder.findMany({
      where: { userId: user.id },
    });
    await Promise.all(
      allReminders.map((item) => {
        const meta = (item.metadata as Prisma.JsonObject | null) ?? {};
        return prisma.notificationReminder.update({
          where: { id: item.id },
          data: {
            isSent: true,
            metadata: { ...meta, isRead: true } as Prisma.InputJsonObject,
          },
        });
      })
    );
    return NextResponse.json({ success: true, count: allReminders.length });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.notificationReminder.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  const existingMeta = (existing.metadata as Prisma.JsonObject | null) ?? {};
  const updatedMeta: Prisma.JsonObject = { ...existingMeta };
  if (parsed.data.isRead !== undefined) {
    updatedMeta.isRead = parsed.data.isRead;
  }

  const updated = await prisma.notificationReminder.update({
    where: { id },
    data: {
      ...(parsed.data.title ? { title: parsed.data.title } : {}),
      ...(parsed.data.message !== undefined ? { message: parsed.data.message } : {}),
      ...(parsed.data.dueAt ? { dueAt: new Date(parsed.data.dueAt) } : {}),
      ...(parsed.data.isSent !== undefined ? { isSent: parsed.data.isSent } : {}),
      metadata: updatedMeta as Prisma.InputJsonObject,
    },
  });

  return NextResponse.json({ reminder: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (id === "clear-read") {
    const allReminders = await prisma.notificationReminder.findMany({
      where: { userId: user.id },
    });
    const readIds = allReminders
      .filter((r) => Boolean((r.metadata as Record<string, unknown> | null)?.isRead))
      .map((r) => r.id);

    if (readIds.length > 0) {
      await prisma.notificationReminder.deleteMany({
        where: { id: { in: readIds }, userId: user.id },
      });
    }
    return NextResponse.json({ success: true, count: readIds.length });
  }

  const existing = await prisma.notificationReminder.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  await prisma.notificationReminder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
