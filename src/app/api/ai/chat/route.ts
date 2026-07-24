import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";
import { buildRetrievalAnswer, buildStoredContextNotFoundReply, isCareerRelated, retrieveCareerContext, retrieveDocumentContext } from "@/lib/ai/retrieval";
import { type AiProviderId, type ChatMemoryMessage } from "@/lib/ai/providers";
import { routeChatCompletion } from "@/lib/ai/provider-router";
import { recordCareerActivity } from "@/lib/gamification";

const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().optional(),
  documentId: z.string().max(120).optional(),
  provider: z.enum(["openai", "gemini", "groq", "claude", "ollama"]).optional(),
  fallbackProvider: z.enum(["openai", "gemini", "groq", "claude", "ollama"]).optional(),
  model: z.string().max(80).optional(),
});

function buildRagMessages(question: string, contexts: Awaited<ReturnType<typeof retrieveCareerContext>>, history: ChatMemoryMessage[], options?: { documentScope?: boolean }) {
  const sourceBlock = contexts.length
    ? contexts
        .map((context, index) => `[${index + 1}] ${context.documentName}\n${context.content.slice(0, 1600)}`)
        .join("\n\n")
    : "No retrieved uploaded document context was found.";

  const instructions = options?.documentScope
    ? [
        "You are StudyOrbit, a document study assistant.",
        "Answer only from the retrieved PDF/document context that is provided below.",
        "Do not invent facts or go beyond the supplied content.",
        "If the context is insufficient, say so clearly and suggest what to look for next.",
        "Keep the answer concise and practical.",
      ]
    : [
        "You are StudyOrbit, a career guidance assistant.",
        "Answer only career, resume, interview, skill, roadmap, certification, placement, or job-preparation questions.",
        "Use the provided retrieved sources first. Do not invent facts about the user's documents.",
        "Preserve citations by referencing source numbers like [1] or [2] next to claims from documents.",
        "If the sources are insufficient, say what is missing and provide conservative next steps.",
        "Keep the answer practical, personalized, and concise.",
      ];

  return [
    {
      role: "system" as const,
      content: instructions.join("\n"),
    },
    ...history.slice(-8),
    {
      role: "tool" as const,
      content: `Retrieved sources:\n\n${sourceBlock}`,
    },
    {
      role: "user" as const,
      content: question,
    },
  ];
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = chatSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const documentId = parsed.data.documentId?.trim();
  const isDocumentScoped = Boolean(documentId);

  let conversationId = parsed.data.conversationId;
  if (conversationId) {
    const existing = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: user.id },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  } else {
    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        title: parsed.data.message.slice(0, 80),
        scope: isDocumentScoped ? "document" : "career",
        metadata: documentId
          ? { mode: "retrieval-only", documentId }
          : { mode: "retrieval-only" },
      },
    });
    conversationId = conversation.id;
  }

  await prisma.message.create({
    data: {
      conversationId,
      role: "USER",
      content: parsed.data.message,
    },
  });

  if (!isDocumentScoped && !isCareerRelated(parsed.data.message)) {
    const content = "I can only help with career guidance, resumes, interviews, skills, roadmaps, certifications, placements, and job preparation.";
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId,
        role: "ASSISTANT",
        content,
        metadata: { policy: "career-only-refusal", mode: "retrieval-only" },
      },
    });
    return NextResponse.json({
      conversationId,
      message: assistantMessage,
      citations: [],
      ai: { provider: "retrieval", model: null, fallbackStatus: "retrieval-only" },
    });
  }

  const contexts = isDocumentScoped && documentId
    ? await retrieveDocumentContext({ userId: user.id, documentId, query: parsed.data.message, topK: 6 })
    : await retrieveCareerContext({ userId: user.id, query: parsed.data.message, topK: 6 });
  const citations = contexts.map((context) => ({
    documentId: context.documentId,
    chunkId: context.chunkId,
    documentName: context.documentName,
    score: context.score,
  }));

  const historyRows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  let content = buildRetrievalAnswer(parsed.data.message, contexts);
  let responseMode = "retrieval-only";
  if (!contexts.length) {
    content = buildStoredContextNotFoundReply(parsed.data.message);
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId,
        role: "ASSISTANT",
        content,
        citations: [],
        metadata: {
          mode: "retrieval-only",
          provider: "retrieval",
          model: null,
          fallbackStatus: "retrieval-only",
          groundedContextCount: 0,
          documentScope: isDocumentScoped,
        },
      },
    });

    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    return NextResponse.json({ conversationId, message: assistantMessage, citations: [], ai: { provider: "retrieval", model: null, fallbackStatus: "retrieval-only" } });
  }
  let aiPayload: Prisma.InputJsonObject = { provider: "retrieval", model: null, fallbackStatus: "retrieval-only" };
  let metadata: Prisma.InputJsonObject = {
    mode: "retrieval-only",
    provider: "retrieval",
    model: null,
    fallbackStatus: "retrieval-only",
    groundedContextCount: contexts.length,
    documentScope: isDocumentScoped,
  };

  const testScenario = process.env.ALLOW_AI_PROVIDER_TESTING === "true" ? req.headers.get("x-ai-test-scenario") || undefined : undefined;
  const routed = await routeChatCompletion({
    primaryProvider: parsed.data.provider as AiProviderId | undefined,
    fallbackProvider: parsed.data.fallbackProvider as AiProviderId | undefined,
    request: {
      model: parsed.data.model,
      temperature: 0.15,
      maxOutputTokens: 900,
      metadata: testScenario ? { testScenario } : undefined,
      messages: buildRagMessages(
        parsed.data.message,
        contexts,
        historyRows.map((message) => ({
          role: message.role.toLowerCase() as ChatMemoryMessage["role"],
          content: message.content,
        })),
        { documentScope: isDocumentScoped },
      ),
    },
  });

  if (routed.ok) {
    content = routed.completion.content;
    responseMode = "rag-generation";
    aiPayload = {
      provider: routed.completion.provider,
      model: routed.completion.model,
      fallbackStatus: routed.fallbackStatus,
    };
    metadata = {
      mode: "rag-generation",
      provider: routed.completion.provider,
      model: routed.completion.model,
      fallbackStatus: routed.fallbackStatus,
      usage: routed.completion.usage ? { ...routed.completion.usage } : null,
      attempts: routed.attempts.map((attempt) => ({ ...attempt, usage: attempt.usage ? { ...attempt.usage } : null })),
      groundedContextCount: contexts.length,
    };
  } else {
    responseMode = "retrieval-only";
    aiPayload = { provider: "retrieval", model: null, fallbackStatus: "retrieval-only" };
    metadata = {
      mode: "retrieval-only",
      provider: "retrieval",
      model: null,
      fallbackStatus: "retrieval-only",
      fallbackReason: routed.fallbackReason,
      attempts: routed.attempts.map((attempt) => ({ ...attempt, usage: attempt.usage ? { ...attempt.usage } : null })),
      groundedContextCount: contexts.length,
      documentScope: isDocumentScoped,
    };
  }

  const assistantMessage = await prisma.message.create({
    data: {
      conversationId,
      role: "ASSISTANT",
      content,
      citations,
      metadata,
    },
  });

  await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  await recordCareerActivity(user.id, { xp: responseMode === "rag-generation" ? 8 : 4 }).catch(() => null);

  return NextResponse.json({ conversationId, message: assistantMessage, citations, ai: aiPayload });
}
