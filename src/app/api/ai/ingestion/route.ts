import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";
import { PlainTextExtractionService, chunkText } from "@/lib/ai/ingestion";
import { readStoredObject } from "@/lib/storage";
import {
  createLocalEmbedding,
  LOCAL_EMBEDDING_DIMENSIONS,
  LOCAL_EMBEDDING_MODEL,
  LOCAL_EMBEDDING_PROVIDER,
  vectorHash,
  vectorSqlLiteral,
} from "@/lib/ai/embeddings";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId } = await req.json().catch(() => ({ documentId: null }));
  if (!documentId || typeof documentId !== "string") {
    return NextResponse.json({ error: "Missing documentId." }, { status: 400 });
  }

  const document = await prisma.document.findFirst({
    where: { id: documentId, userId: user.id },
    select: { id: true, name: true, originalName: true, mimeType: true, storageData: true },
  });
  if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  const job = await prisma.documentIngestionJob.create({
    data: { userId: user.id, documentId: document.id, status: "EXTRACTING", provider: "local-placeholder" },
  });

  // Load bytes either from stored DB blob or from configured storage backend
  let fileBuffer: Buffer | null = null;
  if (document.storageData) {
    fileBuffer = Buffer.from(document.storageData);
  } else {
    // Attempt to read from storage backend using the document.storageKey
    try {
      const stored = await prisma.document.findUnique({ where: { id: document.id }, select: { storageKey: true } });
      if (stored?.storageKey) {
        const downloaded = await readStoredObject({ key: stored.storageKey });
        if (downloaded) fileBuffer = Buffer.from(downloaded);
      }
    } catch (err) {
      // ignore and let extractor handle null buffer
    }
  }

  const extractor = new PlainTextExtractionService();
  let extracted;
  try {
    if (!fileBuffer) throw new Error("No stored file data available for extraction.");
    extracted = await extractor.extract({
      buffer: fileBuffer,
      mimeType: document.mimeType,
      filename: document.originalName || document.name,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to extract document text.";
    await prisma.$transaction([
      prisma.document.update({ where: { id: document.id }, data: { status: "FAILED" } }),
      prisma.documentIngestionJob.update({ where: { id: job.id }, data: { status: "FAILED", error: message } }),
    ]);
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const chunks = chunkText(extracted.text);

  await prisma.$transaction([
    prisma.document.update({
      where: { id: document.id },
      data: {
        extractedText: extracted.text || null,
        status: chunks.length ? "INGESTING" : "FAILED",
      },
    }),
    prisma.embedding.deleteMany({ where: { chunk: { documentId: document.id } } }),
    prisma.documentChunk.deleteMany({ where: { documentId: document.id } }),
    ...(chunks.length
      ? [
          prisma.documentChunk.createMany({
            data: chunks.map((chunk) => ({
              documentId: document.id,
              userId: user.id,
              chunkIndex: chunk.chunkIndex,
              content: chunk.content,
              tokenCount: chunk.tokenCount,
              metadata: chunk.metadata ? (JSON.parse(JSON.stringify(chunk.metadata)) as Prisma.InputJsonValue) : undefined,
            })),
          }),
        ]
      : []),
    prisma.documentIngestionJob.update({
      where: { id: job.id },
      data: {
        status: chunks.length ? "EMBEDDING" : "FAILED",
        error: chunks.length ? null : "No text could be extracted from this document.",
        metadata: JSON.parse(JSON.stringify({ ...extracted.metadata, chunkCount: chunks.length })),
      },
    }),
  ]);

  if (!chunks.length) {
    return NextResponse.json({
      jobId: job.id,
      extractedCharacters: extracted.text.length,
      chunkCount: 0,
      embeddingStatus: "failed",
    });
  }

  const storedChunks = await prisma.documentChunk.findMany({
    where: { documentId: document.id, userId: user.id },
    orderBy: { chunkIndex: "asc" },
  });

  let embeddingCount = 0;
  for (const chunk of storedChunks) {
    const vector = createLocalEmbedding(chunk.content);
    const embedding = await prisma.embedding.create({
      data: {
        userId: user.id,
        chunkId: chunk.id,
        provider: LOCAL_EMBEDDING_PROVIDER,
        model: LOCAL_EMBEDDING_MODEL,
        dimensions: LOCAL_EMBEDDING_DIMENSIONS,
        vectorJson: vector,
        vectorHash: vectorHash(vector),
        metadata: { source: "local-deterministic", documentId: document.id },
      },
      select: { id: true },
    });
    await prisma.$executeRawUnsafe(
      `UPDATE "public"."Embedding" SET "vector" = $1::vector WHERE "id" = $2`,
      vectorSqlLiteral(vector),
      embedding.id,
    );
    embeddingCount += 1;
  }

  await prisma.$transaction([
    prisma.document.update({ where: { id: document.id }, data: { status: "READY" } }),
    prisma.documentIngestionJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        metadata: JSON.parse(JSON.stringify({ ...extracted.metadata, chunkCount: chunks.length, embeddingCount })),
      },
    }),
  ]);

  return NextResponse.json({
    jobId: job.id,
    extractedCharacters: extracted.text.length,
    chunkCount: chunks.length,
    embeddingCount,
    embeddingStatus: "completed",
  });
}
