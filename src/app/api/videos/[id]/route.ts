import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

const schema = z.object({
  isCompleted: z.boolean().optional(),
  comment: z.string().max(1000).optional(),
  tags: z.string().max(200).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const current = await prisma.videoBookmark.findFirst({ where: { id, userId: user.id } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const video = await prisma.videoBookmark.update({
    where: { id },
    data: {
      isCompleted: parsed.data.isCompleted,
      completedAt: parsed.data.isCompleted === true ? new Date() : parsed.data.isCompleted === false ? null : undefined,
      comment: parsed.data.comment,
      tags: parsed.data.tags,
    },
  });

  return NextResponse.json({ video });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const current = await prisma.videoBookmark.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.videoBookmark.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
