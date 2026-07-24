import { prisma } from "@/lib/prisma";
import { createLocalEmbedding, vectorSqlLiteral } from "@/lib/ai/embeddings";

const careerTerms = [
  "career",
  "resume",
  "cv",
  "interview",
  "job",
  "placement",
  "skill",
  "roadmap",
  "certification",
  "portfolio",
  "linkedin",
  "github",
  "salary",
  "role",
  "internship",
  "learning",
];

export function isCareerRelated(input: string) {
  const text = input.toLowerCase();
  return careerTerms.some((term) => text.includes(term));
}

export type RetrievedContext = {
  chunkId: string | null;
  documentId: string;
  documentName: string;
  content: string;
  score: number;
};

function scoreText(text: string, query: string) {
  const terms = query.toLowerCase().split(/\s+/).filter((term) => term.length > 2);
  const lower = text.toLowerCase();
  return terms.reduce((score, term) => score + (lower.includes(term) ? 1 : 0), 0);
}

export function buildStoredContextNotFoundReply(question: string) {
  return `I could not find information for "${question}" in your uploaded PDFs, notes, resume, career profile, or stored links.`;
}

export async function retrieveDocumentContext(input: { userId: string; documentId: string; query: string; topK?: number }) {
  const topK = input.topK ?? 6;
  const [chunks, document, artifacts] = await Promise.all([
    prisma.documentChunk.findMany({
      where: {
        userId: input.userId,
        documentId: input.documentId,
        OR: [
          { content: { contains: input.query, mode: "insensitive" } },
          { document: { name: { contains: input.query, mode: "insensitive" } } },
        ],
      },
      include: { document: { select: { id: true, name: true } } },
      take: 40,
      orderBy: { createdAt: "desc" },
    }),
    prisma.document.findFirst({
      where: { id: input.documentId, userId: input.userId },
      select: { id: true, name: true, summary: true },
    }),
    prisma.artifact.findMany({
      where: {
        userId: input.userId,
        contextKey: `document:${input.documentId}`,
        OR: [
          { title: { contains: input.query, mode: "insensitive" } },
          { content: { contains: input.query, mode: "insensitive" } },
          { source: { contains: input.query, mode: "insensitive" } },
        ],
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!document) return [];

  const chunkContexts: RetrievedContext[] = chunks.map((chunk) => ({
    chunkId: chunk.id,
    documentId: chunk.documentId,
    documentName: chunk.document.name,
    content: chunk.content,
    score: scoreText(`${chunk.document.name} ${chunk.content}`, input.query) + 2,
  }));

  const artifactContexts: RetrievedContext[] = artifacts.map((artifact) => ({
    chunkId: null,
    documentId: input.documentId,
    documentName: artifact.title,
    content: `${artifact.title}\n${artifact.content}${artifact.source ? `\nSource: ${artifact.source}` : ""}`,
    score: scoreText(`${artifact.title} ${artifact.content} ${artifact.source ?? ""}`, input.query) + 1.5,
  }));

  return [...chunkContexts, ...artifactContexts]
    .filter((item) => item.content.trim())
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export async function retrieveCareerContext(input: { userId: string; query: string; topK?: number }) {
  const topK = input.topK ?? 6;
  const queryVector = createLocalEmbedding(input.query);

  const vectorRows = await prisma.$queryRawUnsafe<
    Array<{
      chunkId: string;
      documentId: string;
      documentName: string;
      content: string;
      distance: number;
    }>
  >(
    `
    SELECT
      dc."id" AS "chunkId",
      d."id" AS "documentId",
      d."name" AS "documentName",
      dc."content" AS "content",
      e."vector" <=> $1::vector AS "distance"
    FROM "public"."Embedding" e
    JOIN "public"."DocumentChunk" dc ON dc."id" = e."chunkId"
    JOIN "public"."Document" d ON d."id" = dc."documentId"
    WHERE e."userId" = $2 AND e."vector" IS NOT NULL
    ORDER BY e."vector" <=> $1::vector
    LIMIT $3
    `,
    vectorSqlLiteral(queryVector),
    input.userId,
    topK,
  ).catch(() => []);

  if (vectorRows.length) {
    return vectorRows.map((row) => ({
      chunkId: row.chunkId,
      documentId: row.documentId,
      documentName: row.documentName,
      content: row.content,
      score: Number((1 - Number(row.distance)).toFixed(4)),
    }));
  }

  const [chunks, documents, artifacts, profile] = await Promise.all([
    prisma.documentChunk.findMany({
      where: {
        userId: input.userId,
        OR: [
          { content: { contains: input.query, mode: "insensitive" } },
          { document: { name: { contains: input.query, mode: "insensitive" } } },
          { document: { tagsJson: { contains: input.query, mode: "insensitive" } } },
        ],
      },
      include: { document: { select: { id: true, name: true } } },
      take: 40,
      orderBy: { createdAt: "desc" },
    }),
    prisma.document.findMany({
      where: {
        userId: input.userId,
        OR: [
          { name: { contains: input.query, mode: "insensitive" } },
          { summary: { contains: input.query, mode: "insensitive" } },
          { category: { contains: input.query, mode: "insensitive" } },
          { tagsJson: { contains: input.query, mode: "insensitive" } },
        ],
      },
      take: 20,
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.artifact.findMany({
      where: {
        userId: input.userId,
        type: { in: ["NOTE", "LINK"] },
        OR: [
          { title: { contains: input.query, mode: "insensitive" } },
          { content: { contains: input.query, mode: "insensitive" } },
          { source: { contains: input.query, mode: "insensitive" } },
        ],
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
    prisma.userProfile.findFirst({
      where: { id: input.userId },
      select: {
        id: true,
        name: true,
        college: true,
        degree: true,
        skillsJson: true,
        interestsJson: true,
        careerGoalsJson: true,
      },
    }),
  ]);

  const chunkContexts: RetrievedContext[] = chunks.map((chunk) => ({
    chunkId: chunk.id,
    documentId: chunk.documentId,
    documentName: chunk.document.name,
    content: chunk.content,
    score: scoreText(`${chunk.document.name} ${chunk.content}`, input.query) + 2,
  }));

  const documentContexts: RetrievedContext[] = documents.map((document) => ({
    chunkId: null,
    documentId: document.id,
    documentName: document.name,
    content: document.summary || document.extractedText?.slice(0, 1200) || document.name,
    score: scoreText(`${document.name} ${document.summary ?? ""} ${document.tagsJson}`, input.query) + 1,
  }));

  const artifactContexts: RetrievedContext[] = artifacts.map((artifact) => ({
    chunkId: null,
    documentId: artifact.id,
    documentName: artifact.title,
    content: `${artifact.title}\n${artifact.content}${artifact.source ? `\nSource: ${artifact.source}` : ""}`,
    score: scoreText(`${artifact.title} ${artifact.content} ${artifact.source ?? ""}`, input.query) + 1.2,
  }));

  const profileText = profile
    ? [
        profile.name,
        profile.college,
        profile.degree,
        profile.skillsJson,
        profile.interestsJson,
        profile.careerGoalsJson,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const profileContext: RetrievedContext[] = profileText && profile
    ? [
        {
          chunkId: null,
          documentId: profile.id,
          documentName: "Career Profile",
          content: profileText,
          score: scoreText(profileText, input.query) + 0.8,
        },
      ]
    : [];

  return [...chunkContexts, ...documentContexts, ...artifactContexts, ...profileContext]
    .filter((item) => item.content.trim())
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function buildRetrievalAnswer(question: string, contexts: RetrievedContext[]) {
  if (!contexts.length) {
    return buildStoredContextNotFoundReply(question);
  }

  const bullets = contexts
    .slice(0, 4)
    .map((context, index) => `${index + 1}. ${context.documentName}: ${context.content.slice(0, 280)}`)
    .join("\n");

  return [
    "I found relevant career context in your uploaded documents. Here are the strongest matches:",
    bullets,
    "Use these as source material for your roadmap, resume improvements, or interview preparation. LLM generation is not enabled yet, so this response is retrieval-only.",
  ].join("\n\n");
}
