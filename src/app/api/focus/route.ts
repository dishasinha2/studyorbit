import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

const schema = z.object({
  durationMin: z.number().int().min(1).max(240),
  breakMin: z.number().int().min(0).max(60),
  screenLimitMin: z.number().int().min(15).max(720).optional().nullable(),
  blockedList: z.string().max(500).optional(),
  note: z.string().max(500).optional(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const sessions = await prisma.focusSession.findMany({
    where: { userId: user.id, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const usedMinutes = sessions.reduce((sum, s) => sum + s.durationMin, 0);
  return NextResponse.json({ sessions, usedMinutes });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const session = await prisma.focusSession.create({
    data: {
      userId: user.id,
      durationMin: parsed.data.durationMin,
      breakMin: parsed.data.breakMin,
      screenLimitMin: parsed.data.screenLimitMin,
      blockedList: parsed.data.blockedList,
      note: parsed.data.note,
      startedAt: new Date(parsed.data.startedAt),
      endedAt: parsed.data.endedAt ? new Date(parsed.data.endedAt) : null,
    },
  });

  return NextResponse.json({ session }, { status: 201 });
}
