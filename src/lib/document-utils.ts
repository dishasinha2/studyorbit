import type { Document, DocumentFolder, DocumentType } from "@prisma/client";

export function parseTags(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => String(item).trim()).filter(Boolean);
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
}

export function stringifyTags(value: string[] | string | undefined) {
  const raw = Array.isArray(value) ? value : (value ?? "").split(",");
  const clean = Array.from(new Set(raw.map((item) => item.trim().toLowerCase()).filter(Boolean)));
  return JSON.stringify(clean.slice(0, 30));
}

export function inferDocumentType(name: string, mimeType = ""): DocumentType {
  const text = `${name} ${mimeType}`.toLowerCase();
  if (text.includes("resume") || text.includes("cv")) return "RESUME";
  if (text.includes("certificate") || text.includes("certification")) return "CERTIFICATE";
  if (text.includes("pdf") || text.endsWith(".pdf")) return "PDF";
  if (text.includes("word") || text.includes("docx") || text.endsWith(".docx")) return "DOCX";
  if (text.includes("note") || text.includes("text") || text.endsWith(".txt") || text.endsWith(".md")) return "NOTE";
  return "OTHER";
}

export function inferDocumentCategory(name: string, requested?: string | null) {
  if (requested?.trim()) return requested.trim();
  const text = name.toLowerCase();
  if (text.includes("resume") || text.includes("cv")) return "resume";
  if (text.includes("certificate") || text.includes("certification")) return "certificate";
  if (text.includes("interview")) return "interview-prep";
  if (text.includes("roadmap")) return "roadmap";
  if (text.includes("note")) return "notes";
  return "career-document";
}

export function serializeDocument(
  document: Document & { folder?: Pick<DocumentFolder, "id" | "name" | "color"> | null },
) {
  return {
    id: document.id,
    name: document.name,
    originalName: document.originalName,
    type: document.type,
    status: document.status,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    storageKey: document.storageKey,
    category: document.category,
    youtubeUrl: document.youtubeUrl,
    chatgptUrl: document.chatgptUrl,
    tags: parseTags(document.tagsJson),
    isFavorite: document.isFavorite,
    uploadedAt: document.uploadedAt,
    updatedAt: document.updatedAt,
    summary: document.summary,
    hasStoredFile: Boolean(document.storageData),
    folder: document.folder ?? null,
  };
}
