import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

const schema = z.object({
  title: z.string().max(120).nullable().optional(),
  scope: z.string().max(40).optional(),
  documentId: z.string().max(120).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get("documentId")?.trim();
  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { _count: { select: { messages: true } } },
  });
  const filtered = documentId
    ? conversations.filter((conversation) => (conversation.metadata as { documentId?: string } | null)?.documentId === documentId)
    : conversations;
  return NextResponse.json({ conversations: filtered });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const conversation = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: parsed.data.title?.trim() || "Career guidance chat",
      scope: parsed.data.scope?.trim() || (parsed.data.documentId ? "document" : "career"),
      metadata: parsed.data.documentId ? { documentId: parsed.data.documentId, llmStatus: "not-configured" } : { llmStatus: "not-configured" },
    },
  });
  return NextResponse.json({ conversation }, { status: 201 });
}

