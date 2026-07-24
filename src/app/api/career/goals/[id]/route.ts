import { GoalStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordCareerActivity } from "@/lib/gamification";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

const schema = z.object({
  title: z.string().min(2).max(160).optional(),
  description: z.string().max(1000).nullable().optional(),
  category: z.string().max(80).nullable().optional(),
  status: z.nativeEnum(GoalStatus).optional(),
  dueAt: z.string().datetime().nullable().optional(),
  xpReward: z.number().int().min(0).max(1000).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.userGoal.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Goal not found." }, { status: 404 });

  const completingNow = parsed.data.status === "COMPLETED" && existing.status !== "COMPLETED";
  const goal = await prisma.userGoal.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title.trim() } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description?.trim() || null } : {}),
      ...(parsed.data.category !== undefined ? { category: parsed.data.category?.trim() || null } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.dueAt !== undefined ? { dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null } : {}),
      ...(parsed.data.xpReward !== undefined ? { xpReward: parsed.data.xpReward } : {}),
      ...(completingNow ? { completedAt: new Date() } : {}),
    },
  });

  let gamification = null;
  if (completingNow) {
    await recordCareerActivity(user.id, { xp: goal.xpReward, achievementCode: "first_goal" });
    gamification = true;
  }

  return NextResponse.json({ goal, gamification });
}

