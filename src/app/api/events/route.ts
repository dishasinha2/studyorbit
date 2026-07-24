import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

const schema = z.object({
  title: z.string().min(2).max(120),
  notes: z.string().max(1000).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional().nullable(),
  reminderAt: z.string().datetime().optional().nullable(),
  isImportant: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 14);

  const events = await prisma.plannerEvent.findMany({
    where: { userId: user.id, startAt: { gte: from, lte: to } },
    orderBy: { startAt: "asc" },
    take: 200,
  });

  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const event = await prisma.plannerEvent.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      notes: parsed.data.notes,
      startAt: new Date(parsed.data.startAt),
      endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null,
      reminderAt: parsed.data.reminderAt ? new Date(parsed.data.reminderAt) : null,
      isImportant: parsed.data.isImportant ?? false,
    },
  });

  return NextResponse.json({ event }, { status: 201 });
}
