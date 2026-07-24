import crypto from "crypto";

export type ExtractedDocumentText = {
  text: string;
  metadata: Record<string, unknown>;
};

export type DocumentChunkInput = {
  content: string;
  chunkIndex: number;
  tokenCount: number;
  metadata?: Record<string, unknown>;
};

export interface TextExtractionService {
  extract(input: { buffer: Buffer; mimeType: string; filename: string }): Promise<ExtractedDocumentText>;
}

export interface EmbeddingService {
  embed(input: string[]): Promise<{
    provider: string;
    model: string;
    dimensions: number;
    vectors: number[][];
  }>;
}

export interface VectorStore {
  upsert(input: Array<{ id: string; vector: number[]; metadata: Record<string, unknown> }>): Promise<void>;
  search(input: { vector: number[]; topK: number; filter?: Record<string, unknown> }): Promise<
    Array<{ id: string; score: number; metadata: Record<string, unknown> }>
  >;
}

export interface RetrievalService {
  retrieve(input: { userId: string; query: string; topK?: number }): Promise<
    Array<{ chunkId: string; documentId: string; content: string; score: number }>
  >;
}

export class PlainTextExtractionService implements TextExtractionService {
  async extract(input: { buffer: Buffer; mimeType: string; filename: string }) {
    const lowerName = input.filename.toLowerCase();
    const isText =
      input.mimeType.startsWith("text/") ||
      lowerName.endsWith(".txt") ||
      lowerName.endsWith(".md");

    if (input.mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: input.buffer });
      const [parsed, info] = await Promise.all([parser.getText(), parser.getInfo().catch(() => null)]);
      await parser.destroy();
      return {
        text: parsed.text ?? "",
        metadata: {
          filename: input.filename,
          mimeType: input.mimeType,
          parser: "pdf-parse",
          pages: parsed.pages?.length ?? null,
          info,
        },
      };
    }

    if (
      input.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      lowerName.endsWith(".docx")
    ) {
      const mammoth = await import("mammoth");
      const parsed = await mammoth.extractRawText({ buffer: input.buffer });
      return {
        text: parsed.value ?? "",
        metadata: {
          filename: input.filename,
          mimeType: input.mimeType,
          parser: "mammoth",
          messages: parsed.messages ?? [],
        },
      };
    }

    return {
      text: isText ? input.buffer.toString("utf8") : "",
      metadata: {
        filename: input.filename,
        mimeType: input.mimeType,
        parser: isText ? "plain-text" : "pending-parser",
      },
    };
  }
}

export function chunkText(text: string, maxChars = 1200): DocumentChunkInput[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const chunks: DocumentChunkInput[] = [];
  for (let start = 0; start < clean.length; start += maxChars) {
    const content = clean.slice(start, start + maxChars).trim();
    if (!content) continue;
    chunks.push({
      content,
      chunkIndex: chunks.length,
      tokenCount: Math.ceil(content.length / 4),
      metadata: { hash: crypto.createHash("sha256").update(content).digest("hex") },
    });
  }
  return chunks;
}
