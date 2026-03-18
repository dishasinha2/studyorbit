import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

const schema = z.object({
  title: z.string().min(2).max(80),
  dataJson: z.string().min(1).max(10000),
});

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const boards = await prisma.whiteboard.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ boards });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const board = await prisma.whiteboard.create({ data: { userId: user.id, ...parsed.data } });
  return NextResponse.json({ board }, { status: 201 });
}
