import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

const createFolderSchema = z.object({
  name: z.string().min(2).max(80),
  parentId: z.string().nullable().optional(),
  color: z.string().max(40).nullable().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const folders = await prisma.documentFolder.findMany({
    where: { userId: user.id },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
    include: { _count: { select: { documents: true, children: true } } },
  });

  return NextResponse.json({ folders });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createFolderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (parsed.data.parentId) {
    const parent = await prisma.documentFolder.findFirst({
      where: { id: parsed.data.parentId, userId: user.id },
      select: { id: true },
    });
    if (!parent) return NextResponse.json({ error: "Parent folder not found." }, { status: 404 });
  }

  const folder = await prisma.documentFolder.create({
    data: {
      userId: user.id,
      name: parsed.data.name.trim(),
      parentId: parsed.data.parentId ?? null,
      color: parsed.data.color?.trim() || null,
    },
  });

  return NextResponse.json({ folder }, { status: 201 });
}

