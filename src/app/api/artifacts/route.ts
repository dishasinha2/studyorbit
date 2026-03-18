import { NextRequest, NextResponse } from "next/server";
import { ArtifactType, TaskStatus } from "@prisma/client";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth-server";
import { ensureUserProfile } from "@/lib/ensure-user";
import { prisma } from "@/lib/prisma";

const artifactType = z.nativeEnum(ArtifactType);
const taskStatus = z.nativeEnum(TaskStatus);

const createArtifactSchema = z.object({
  title: z.string().min(2).max(120),
  content: z.string().min(1).max(4000),
  type: artifactType,
  source: z.string().max(300).optional(),
  projectId: z.string().optional().nullable(),
  contextKey: z.string().max(40).optional(),
  dueAt: z.string().datetime().optional().nullable(),
  occurredAt: z.string().datetime().optional().nullable(),
  status: taskStatus.optional(),
});

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await ensureUserProfile(auth.authId);
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const type = searchParams.get("type");
  const q = searchParams.get("q");

  const artifacts = await prisma.artifact.findMany({
    where: {
      userId: user.id,
      ...(projectId ? { projectId } : {}),
      ...(type && Object.values(ArtifactType).includes(type as ArtifactType)
        ? { type: type as ArtifactType }
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
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    take: 120,
  });

  return NextResponse.json({ artifacts });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createArtifactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await ensureUserProfile(auth.authId);

  const artifact = await prisma.artifact.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      content: parsed.data.content,
      type: parsed.data.type,
      source: parsed.data.source,
      contextKey: parsed.data.contextKey,
      projectId: parsed.data.projectId,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      occurredAt: parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : null,
      status:
        parsed.data.type === ArtifactType.TASK
          ? (parsed.data.status ?? TaskStatus.PENDING)
          : TaskStatus.PENDING,
      isDone:
        parsed.data.type === ArtifactType.TASK
          ? (parsed.data.status ?? TaskStatus.PENDING) === TaskStatus.COMPLETED
          : false,
    },
  });

  return NextResponse.json({ artifact }, { status: 201 });
}
