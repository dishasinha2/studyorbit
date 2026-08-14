import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const docs = await prisma.document.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      originalName: true,
      storageKey: true,
      storageData: true,
      status: true,
      mimeType: true,
      sizeBytes: true,
      uploadedAt: true,
      ingestionJobs: { select: { id: true, status: true, error: true, metadata: true, createdAt: true, updatedAt: true }, orderBy: { createdAt: "desc" }, take: 5 },
    },
    orderBy: { uploadedAt: "desc" },
    take: 200,
  });

  const results = await Promise.all(
    docs.map(async (d) => {
      const chunkCount = await prisma.documentChunk.count({ where: { documentId: d.id, userId: user.id } });
      const embeddingCount = await prisma.embedding.count({ where: { chunk: { documentId: d.id } } });
      return {
        id: d.id,
        name: d.name,
        originalName: d.originalName,
        storageKey: d.storageKey,
        hasStorageData: Boolean(d.storageData),
        status: d.status,
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes,
        uploadedAt: d.uploadedAt,
        chunkCount,
        embeddingCount,
        ingestionJobs: d.ingestionJobs,
      };
    }),
  );

  return NextResponse.json({ userId: user.id, documents: results });
}
