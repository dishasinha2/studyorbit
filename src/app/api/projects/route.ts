import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth-server";
import { ensureUserProfile } from "@/lib/ensure-user";
import { prisma } from "@/lib/prisma";

const createProjectSchema = z.object({
  title: z.string().min(2).max(80),
  summary: z.string().max(200).optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await ensureUserProfile(auth.authId);
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    include: {
      _count: {
        select: { artifacts: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await ensureUserProfile(auth.authId);

  const project = await prisma.project.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      summary: parsed.data.summary,
      color: parsed.data.color ?? "#22d3ee",
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
