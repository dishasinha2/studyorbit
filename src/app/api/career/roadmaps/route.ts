import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";
import { analyzeSkillGap, buildRoadmap } from "@/lib/career-analysis";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roadmaps = await prisma.careerRoadmap.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { goals: { orderBy: { dueAt: "asc" } } },
  });

  return NextResponse.json({ roadmaps });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const targetRole = typeof body.targetRole === "string" ? body.targetRole : "AI Engineer";
  const skills = await prisma.userSkill.findMany({ where: { userId: user.id }, select: { name: true } });
  const gap = analyzeSkillGap({ currentSkillsJson: user.skillsJson, explicitSkills: skills.map((skill) => skill.name), targetRole });
  const plan = buildRoadmap({ targetRole, missingSkills: gap.missingSkills });

  const roadmap = await prisma.careerRoadmap.create({
    data: {
      userId: user.id,
      targetRole,
      title: plan.title,
      summary: plan.summary,
      planJson: plan,
      goals: {
        create: plan.weeks.slice(0, 8).map((week, index) => ({
          userId: user.id,
          title: week.title,
          description: week.goals.join("\n"),
          category: "roadmap",
          dueAt: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000),
          xpReward: 25,
        })),
      },
    },
    include: { goals: true },
  });

  return NextResponse.json({ roadmap, gap }, { status: 201 });
}

