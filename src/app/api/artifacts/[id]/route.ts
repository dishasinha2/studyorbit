import { NextRequest, NextResponse } from "next/server";
import { TaskStatus } from "@prisma/client";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth-server";
import { ensureUserProfile } from "@/lib/ensure-user";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  isDone: z.boolean().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  projectId: z.string().nullable().optional(),
  contextKey: z.string().max(40).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const auth = await getAuthContext(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await ensureUserProfile(auth.authId);
  const { id } = await ctx.params;

  const artifact = await prisma.artifact.findFirst({
    where: { id, userId: user.id },
  });

  if (!artifact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nextStatus =
    parsed.data.status ?? (parsed.data.isDone === undefined ? undefined : parsed.data.isDone ? TaskStatus.COMPLETED : TaskStatus.PENDING);

  const updated = await prisma.artifact.update({
    where: { id },
    data: {
      isDone: nextStatus ? nextStatus === TaskStatus.COMPLETED : parsed.data.isDone,
      status: nextStatus,
      projectId: parsed.data.projectId,
      contextKey: parsed.data.contextKey,
    },
  });

  return NextResponse.json({ artifact: updated });
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const auth = await getAuthContext(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await ensureUserProfile(auth.authId);
  const { id } = await ctx.params;

  const artifact = await prisma.artifact.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });

  if (!artifact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.artifact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
