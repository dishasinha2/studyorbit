import { NextRequest, NextResponse } from "next/server";
import { ArtifactType } from "@prisma/client";
import { getAuthContext } from "@/lib/auth-server";
import { ensureUserProfile } from "@/lib/ensure-user";
import { prisma } from "@/lib/prisma";

const typeWeight: Record<ArtifactType, number> = {
  TASK: 8,
  CALENDAR: 7,
  EMAIL: 6,
  NOTE: 5,
  LINK: 4,
  FILE: 3,
};

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await ensureUserProfile(auth.authId);
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const q = searchParams.get("q");

  const artifacts = await prisma.artifact.findMany({
    where: {
      userId: user.id,
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { content: { contains: q } },
              { contextKey: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          color: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 200,
  });

  const ranked = artifacts
    .map((item) => {
      const isTaskOpen = item.type === "TASK" ? item.status !== "COMPLETED" : !item.isDone;
      const urgencyBoost = item.dueAt && item.dueAt < new Date() && isTaskOpen ? 5 : 0;
      const unresolvedBoost = isTaskOpen ? 2 : 0;
      return {
        ...item,
        score: typeWeight[item.type] + urgencyBoost + unresolvedBoost,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  const groupedByContext = ranked.reduce<Record<string, typeof ranked>>((acc, artifact) => {
    const key = artifact.contextKey || artifact.project?.title || "Inbox";
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(artifact);
    return acc;
  }, {});

  return NextResponse.json({
    highlights: ranked,
    groupedByContext,
  });
}
