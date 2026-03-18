import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

const schema = z.object({
  content: z.string().min(1).max(600),
  color: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notes = await prisma.stickyNote.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 80 });
  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const note = await prisma.stickyNote.create({
    data: {
      userId: user.id,
      content: parsed.data.content,
      color: parsed.data.color ?? "#fef08a",
    },
  });

  return NextResponse.json({ note }, { status: 201 });
}
