import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  pathOrUrl: z.string().min(2).max(500).optional(),
  category: z.string().max(80).nullable().optional(),
  subject: z.string().max(80).nullable().optional(),
  tags: z.string().max(200).nullable().optional(),
  lastPosition: z.string().max(120).nullable().optional(),
  progressNote: z.string().max(800).nullable().optional(),
  isCompleted: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { id } = await params;
  const file = await prisma.fileItem.updateMany({
    where: { id, userId: user.id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
      ...(parsed.data.pathOrUrl !== undefined ? { pathOrUrl: parsed.data.pathOrUrl.trim() } : {}),
      ...(parsed.data.category !== undefined ? { category: parsed.data.category?.trim() || null } : {}),
      ...(parsed.data.subject !== undefined ? { subject: parsed.data.subject?.trim() || null } : {}),
      ...(parsed.data.tags !== undefined ? { tags: parsed.data.tags?.trim() || null } : {}),
      ...(parsed.data.lastPosition !== undefined ? { lastPosition: parsed.data.lastPosition?.trim() || null } : {}),
      ...(parsed.data.progressNote !== undefined ? { progressNote: parsed.data.progressNote?.trim() || null } : {}),
      ...(parsed.data.isCompleted !== undefined ? { isCompleted: parsed.data.isCompleted } : {}),
    },
  });

  if (file.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await prisma.fileItem.deleteMany({
    where: { id, userId: user.id },
  });

  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
