import { MessageRole, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  role: z.nativeEnum(MessageRole),
  content: z.string().min(1).max(8000),
  citations: z.unknown().optional(),
  metadata: z.unknown().optional(),
});

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const conversation = await prisma.conversation.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

  const messages = await prisma.message.findMany({ where: { conversationId: id }, orderBy: { createdAt: "asc" }, take: 100 });
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const conversation = await prisma.conversation.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const message = await prisma.message.create({
    data: {
      conversationId: id,
      role: parsed.data.role,
      content: parsed.data.content,
      citations:
        parsed.data.citations === undefined
          ? undefined
          : parsed.data.citations === null
            ? Prisma.JsonNull
            : JSON.parse(JSON.stringify(parsed.data.citations)),
      metadata:
        parsed.data.metadata === undefined
          ? undefined
          : parsed.data.metadata === null
            ? Prisma.JsonNull
            : JSON.parse(JSON.stringify(parsed.data.metadata)),
    },
  });
  await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

  return NextResponse.json({ message }, { status: 201 });
}
