import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordCareerActivity, gamificationSummary } from "@/lib/gamification";
import { getUserFromRequest } from "@/lib/route-auth";

const activitySchema = z.object({
  xp: z.number().int().min(0).max(1000).optional(),
  achievementCode: z.string().max(80).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ gamification: await gamificationSummary(user.id) });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = activitySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  await recordCareerActivity(user.id, parsed.data);
  return NextResponse.json({ gamification: await gamificationSummary(user.id) });
}

