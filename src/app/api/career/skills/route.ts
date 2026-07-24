import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

const schema = z.object({
  name: z.string().min(1).max(80),
  category: z.string().max(80).nullable().optional(),
  level: z.number().int().min(1).max(5).optional(),
  targetLevel: z.number().int().min(1).max(5).nullable().optional(),
  evidence: z.string().max(500).nullable().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const skills = await prisma.userSkill.findMany({ where: { userId: user.id }, orderBy: [{ category: "asc" }, { name: "asc" }] });
  return NextResponse.json({ skills });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const skill = await prisma.userSkill.upsert({
    where: { userId_name: { userId: user.id, name: parsed.data.name.trim() } },
    update: {
      category: parsed.data.category?.trim() || null,
      level: parsed.data.level ?? 1,
      targetLevel: parsed.data.targetLevel ?? null,
      evidence: parsed.data.evidence?.trim() || null,
    },
    create: {
      userId: user.id,
      name: parsed.data.name.trim(),
      category: parsed.data.category?.trim() || null,
      level: parsed.data.level ?? 1,
      targetLevel: parsed.data.targetLevel ?? null,
      evidence: parsed.data.evidence?.trim() || null,
    },
  });
  return NextResponse.json({ skill }, { status: 201 });
}

