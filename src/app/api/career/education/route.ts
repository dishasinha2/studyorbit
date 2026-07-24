import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

const schema = z.object({
  institution: z.string().min(2).max(160),
  degree: z.string().max(120).nullable().optional(),
  field: z.string().max(120).nullable().optional(),
  startYear: z.number().int().min(1950).max(2100).nullable().optional(),
  endYear: z.number().int().min(1950).max(2100).nullable().optional(),
  grade: z.string().max(80).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const education = await prisma.educationHistory.findMany({ where: { userId: user.id }, orderBy: { startYear: "desc" } });
  return NextResponse.json({ education });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const education = await prisma.educationHistory.create({ data: { userId: user.id, ...parsed.data } });
  return NextResponse.json({ education }, { status: 201 });
}

