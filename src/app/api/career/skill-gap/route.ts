import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";
import { analyzeSkillGap } from "@/lib/career-analysis";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const targetRole = typeof body.targetRole === "string" ? body.targetRole : "AI Engineer";
  const skills = await prisma.userSkill.findMany({ where: { userId: user.id }, select: { name: true } });

  const analysis = analyzeSkillGap({
    currentSkillsJson: user.skillsJson,
    explicitSkills: skills.map((skill) => skill.name),
    targetRole,
  });

  return NextResponse.json({ analysis });
}

