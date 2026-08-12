import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

const moodSchema = z.object({ mood: z.enum(["great", "good", "okay", "tired", "burned_out"]), label: z.string().trim().min(1).max(40), emoji: z.string().trim().min(1).max(16) });

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const logs = await prisma.relaxMoodEntry.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 14 });
  return NextResponse.json({ logs, success: true });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = moodSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const entry = await prisma.relaxMoodEntry.create({ data: { userId: user.id, ...parsed.data } });
  const logs = await prisma.relaxMoodEntry.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 14 });
  return NextResponse.json({ entry, logs, success: true }, { status: 201 });
}
