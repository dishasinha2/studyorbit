import { GoalStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

const schema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(1000).nullable().optional(),
  category: z.string().max(80).nullable().optional(),
  status: z.nativeEnum(GoalStatus).optional(),
  dueAt: z.string().datetime().nullable().optional(),
  xpReward: z.number().int().min(0).max(1000).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const goals = await prisma.userGoal.findMany({ where: { userId: user.id }, orderBy: [{ status: "asc" }, { dueAt: "asc" }] });
  return NextResponse.json({ goals });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const goal = await prisma.userGoal.create({
    data: {
      userId: user.id,
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || null,
      category: parsed.data.category?.trim() || null,
      status: parsed.data.status ?? "NOT_STARTED",
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      xpReward: parsed.data.xpReward ?? 10,
    },
  });
  return NextResponse.json({ goal }, { status: 201 });
}

