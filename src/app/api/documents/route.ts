import { Buffer } from "buffer";
import { DocumentType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";
import {
  inferDocumentCategory,
  inferDocumentType,
  serializeDocument,
  stringifyTags,
} from "@/lib/document-utils";
import { storeUploadedObject } from "@/lib/storage";

const documentTypeSchema = z.nativeEnum(DocumentType);

const createDocumentSchema = z.object({
  name: z.string().min(2).max(160),
  type: documentTypeSchema.optional(),
  folderId: z.string().nullable().optional(),
  category: z.string().max(80).nullable().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  summary: z.string().max(1200).nullable().optional(),
});

const patchDocumentSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  folderId: z.string().nullable().optional(),
  category: z.string().max(80).nullable().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  isFavorite: z.boolean().optional(),
  summary: z.string().max(1200).nullable().optional(),
});

function allowedMime(mimeType: string, filename: string) {
  const lower = filename.toLowerCase();
  return (
    mimeType === "application/pdf" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType.startsWith("text/") ||
    lower.endsWith(".pdf") ||
    lower.endsWith(".docx") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md")
  );
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = new URL(req.url).searchParams;
  const q = searchParams.get("q")?.trim();
  const type = searchParams.get("type") as DocumentType | null;
  const folderId = searchParams.get("folderId");
  const favorite = searchParams.get("favorite");
  const category = searchParams.get("category")?.trim();
  const sort = searchParams.get("sort") ?? "new";

  const orderBy = sort === "az" ? { name: "asc" as const } : sort === "old" ? { uploadedAt: "asc" as const } : { uploadedAt: "desc" as const };

  const documents = await prisma.document.findMany({
    where: {
      userId: user.id,
      ...(type && Object.values(DocumentType).includes(type) ? { type } : {}),
      ...(folderId ? { folderId } : {}),
      ...(favorite === "true" ? { isFavorite: true } : {}),
      ...(category ? { category: { contains: category, mode: "insensitive" } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { originalName: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
              { summary: { contains: q, mode: "insensitive" } },
              { tagsJson: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { folder: { select: { id: true, name: true, color: true } } },
    orderBy,
    take: 200,
  });

  return NextResponse.json({ documents: documents.map(serializeDocument) });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Documents must be uploaded as multipart/form-data." }, { status: 415 });
  }

  const formData = await req.formData();
  const upload = formData.get("file");
  if (!(upload instanceof File)) return NextResponse.json({ error: "Missing file." }, { status: 400 });

  const maxBytes = 20 * 1024 * 1024;
  if (upload.size > maxBytes) return NextResponse.json({ error: "File too large (max 20MB)." }, { status: 400 });
  if (!allowedMime(upload.type || "", upload.name)) {
    return NextResponse.json({ error: "Only PDF, DOCX, TXT, and MD files are supported." }, { status: 400 });
  }

  const raw = {
    name: String(formData.get("name") ?? upload.name).trim(),
    type: String(formData.get("type") ?? "") || undefined,
    folderId: String(formData.get("folderId") ?? "").trim() || undefined,
    category: String(formData.get("category") ?? "").trim() || undefined,
    tags: String(formData.get("tags") ?? "").trim() || undefined,
    summary: String(formData.get("summary") ?? "").trim() || undefined,
  };
  const parsed = createDocumentSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (parsed.data.folderId) {
    const folder = await prisma.documentFolder.findFirst({
      where: { id: parsed.data.folderId, userId: user.id },
      select: { id: true },
    });
    if (!folder) return NextResponse.json({ error: "Folder not found." }, { status: 404 });
  }

  const resolvedType = parsed.data.type ?? inferDocumentType(upload.name, upload.type);
  const storageKey = `${user.id}/${Date.now()}-${upload.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
  const stored = await storeUploadedObject({
    key: storageKey,
    bytes: Buffer.from(await upload.arrayBuffer()),
    contentType: upload.type || "application/octet-stream",
  });
  const document = await prisma.document.create({
    data: {
      userId: user.id,
      folderId: parsed.data.folderId ?? null,
      name: parsed.data.name,
      originalName: upload.name,
      type: resolvedType,
      mimeType: upload.type || "application/octet-stream",
      sizeBytes: upload.size,
      storageKey: stored.storageKey,
      storageData: stored.storageData ? new Uint8Array(stored.storageData) : null,
      category: inferDocumentCategory(parsed.data.name, parsed.data.category),
      tagsJson: stringifyTags(parsed.data.tags),
      summary: parsed.data.summary?.trim() || null,
      status: "UPLOADED",
      ingestionJobs: {
        create: {
          userId: user.id,
          status: "PENDING",
          metadata: { source: "document-upload", type: resolvedType, storageBackend: stored.backend },
        },
      },
    },
    include: { folder: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json({ document: serializeDocument(document) }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing document id." }, { status: 400 });

  const body = await req.json();
  const parsed = patchDocumentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const document = await prisma.document.updateMany({
    where: { id, userId: user.id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
      ...(parsed.data.folderId !== undefined ? { folderId: parsed.data.folderId } : {}),
      ...(parsed.data.category !== undefined ? { category: parsed.data.category?.trim() || null } : {}),
      ...(parsed.data.tags !== undefined ? { tagsJson: stringifyTags(parsed.data.tags) } : {}),
      ...(parsed.data.isFavorite !== undefined ? { isFavorite: parsed.data.isFavorite } : {}),
      ...(parsed.data.summary !== undefined ? { summary: parsed.data.summary?.trim() || null } : {}),
    },
  });

  if (document.count === 0) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
