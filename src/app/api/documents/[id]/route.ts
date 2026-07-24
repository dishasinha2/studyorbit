import { DocumentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";
import { serializeDocument } from "@/lib/document-utils";
import { parseStoredDocumentSummary, serializeStoredDocumentSummary } from "@/lib/document-workspace";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const document = await prisma.document.findFirst({
    where: { id, userId: user.id },
    include: {
      folder: { select: { id: true, name: true, color: true } },
      chunks: { select: { id: true, chunkIndex: true, tokenCount: true, createdAt: true }, orderBy: { chunkIndex: "asc" } },
      ingestionJobs: { select: { id: true, status: true, provider: true, error: true, createdAt: true, updatedAt: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  const parsedSummary = parseStoredDocumentSummary(document.summary);
  return NextResponse.json({
    document: {
      ...serializeDocument(document),
      workspace: parsedSummary.workspace,
      documentSummary: parsedSummary.documentSummary,
    },
    chunks: document.chunks,
    ingestionJobs: document.ingestionJobs,
  });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) updateData.name = body.name.trim();
  if (body.folderId === null || typeof body.folderId === "string") updateData.folderId = body.folderId || null;
  if (typeof body.isFavorite === "boolean") updateData.isFavorite = body.isFavorite;
  if (typeof body.status === "string" && Object.values(DocumentStatus).includes(body.status as DocumentStatus)) {
    updateData.status = body.status as DocumentStatus;
  }

  const existingDoc = await prisma.document.findFirst({ where: { id, userId: user.id }, select: { summary: true } });
  const existing = parseStoredDocumentSummary(existingDoc?.summary ?? null);

  const nextDocumentSummary = typeof body.documentSummary === "string" ? body.documentSummary.trim() : existing.documentSummary;
  if (typeof body.summary === "string" && body.summary.trim()) {
    updateData.summary = serializeStoredDocumentSummary(body.summary.trim(), existing.workspace);
  } else if (body.workspace && typeof body.workspace === "object") {
    const mergedWorkspace = {
      ...existing.workspace,
      ...body.workspace,
      revisionHistory: Array.isArray(body.workspace.revisionHistory) ? body.workspace.revisionHistory : existing.workspace.revisionHistory,
    };
    updateData.summary = serializeStoredDocumentSummary(nextDocumentSummary, mergedWorkspace);
  } else if (typeof body.documentSummary === "string") {
    updateData.summary = serializeStoredDocumentSummary(nextDocumentSummary, existing.workspace);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid changes provided." }, { status: 400 });
  }

  const updated = await prisma.document.updateMany({
    where: { id, userId: user.id },
    data: updateData,
  });

  if (updated.count === 0) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const deleted = await prisma.document.deleteMany({ where: { id, userId: user.id } });
  if (deleted.count === 0) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

