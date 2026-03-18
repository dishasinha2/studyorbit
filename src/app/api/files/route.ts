import { Buffer } from "buffer";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

const schema = z.object({
  name: z.string().min(2).max(120),
  pathOrUrl: z.string().min(2).max(500),
  category: z.string().max(80).optional(),
  subject: z.string().max(80).optional(),
  tags: z.string().max(200).optional(),
  lastPosition: z.string().max(120).optional(),
  progressNote: z.string().max(800).optional(),
});

function normalizeTags(input: string[] | string | undefined) {
  const raw = Array.isArray(input) ? input : (input ?? "").split(",");
  const clean = raw.map((item) => item.trim().toLowerCase()).filter(Boolean);
  return Array.from(new Set(clean)).slice(0, 12);
}

function inferMeta(name: string, pathOrUrl: string) {
  const text = `${name} ${pathOrUrl}`.toLowerCase();
  const inferredTags: string[] = [];
  let category = "general";

  if (text.includes("figma") || text.includes("design") || text.includes(".psd")) {
    category = "design";
    inferredTags.push("ui", "design");
  } else if (text.includes(".pdf") || text.includes("syllabus") || text.includes("chapter") || text.includes("lecture")) {
    category = "study-material";
    inferredTags.push("study", "pdf");
  } else if (text.includes("docs") || text.includes("notion") || text.includes(".md")) {
    category = "docs";
    inferredTags.push("documentation", "notes");
  } else if (text.includes("meeting") || text.includes("recording")) {
    category = "meetings";
    inferredTags.push("meeting");
  } else if (text.includes("invoice") || text.includes("budget") || text.includes("finance")) {
    category = "finance";
    inferredTags.push("finance");
  } else if (text.includes("src") || text.includes(".ts") || text.includes(".js") || text.includes("repo")) {
    category = "engineering";
    inferredTags.push("code", "project");
  }

  const projectMatch = text.match(/project[-_\s]?([a-z0-9]+)/i);
  if (projectMatch?.[1]) inferredTags.push(`project-${projectMatch[1]}`);

  return { category, inferredTags };
}

function serializeFileItem(file: {
  id: string;
  name: string;
  pathOrUrl: string;
  originalFileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  storageData: Uint8Array | null;
  category: string | null;
  subject: string | null;
  tags: string | null;
  lastPosition: string | null;
  progressNote: string | null;
  isCompleted: boolean;
  createdAt: Date;
}) {
  return {
    ...file,
    hasStoredFile: Boolean(file.storageData),
    pathOrUrl: file.storageData ? `/api/files/${file.id}/download` : file.pathOrUrl,
    storageData: undefined,
  };
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = new URL(req.url).searchParams;
  const sort = searchParams.get("sort")?.toLowerCase() ?? "new";
  const includeCompleted = searchParams.get("completed")?.toLowerCase() !== "false";
  const subject = searchParams.get("subject")?.trim();

  let orderBy: { createdAt?: "asc" | "desc"; name?: "asc" | "desc" } = { createdAt: "desc" };
  if (sort === "old") orderBy = { createdAt: "asc" };
  if (sort === "az") orderBy = { name: "asc" };
  if (sort === "za") orderBy = { name: "desc" };

  const rows = await prisma.fileItem.findMany({
    where: {
      userId: user.id,
      ...(includeCompleted ? {} : { isCompleted: false }),
      ...(subject ? { subject: { contains: subject } } : {}),
    },
    orderBy,
    take: 180,
  });

  return NextResponse.json({ files: rows.map(serializeFileItem) });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const upload = formData.get("file");
    if (!(upload instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const maxBytes = 15 * 1024 * 1024;
    if (upload.size > maxBytes) {
      return NextResponse.json({ error: "File too large (max 15MB)" }, { status: 400 });
    }

    const raw = {
      name: String(formData.get("name") ?? upload.name ?? "").trim(),
      pathOrUrl: String(formData.get("pathOrUrl") ?? upload.name ?? "").trim(),
      category: String(formData.get("category") ?? "").trim() || undefined,
      subject: String(formData.get("subject") ?? "").trim() || undefined,
      tags: String(formData.get("tags") ?? "").trim() || undefined,
      lastPosition: String(formData.get("lastPosition") ?? "").trim() || undefined,
      progressNote: String(formData.get("progressNote") ?? "").trim() || undefined,
    };

    const parsed = schema.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const inferred = inferMeta(parsed.data.name, parsed.data.pathOrUrl);
    const combinedTags = normalizeTags([...(parsed.data.tags ?? "").split(","), ...inferred.inferredTags]).join(", ");
    const created = await prisma.fileItem.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        pathOrUrl: "pending",
        originalFileName: upload.name || parsed.data.name,
        mimeType: upload.type || "application/octet-stream",
        sizeBytes: upload.size,
        storageData: Buffer.from(await upload.arrayBuffer()),
        category: parsed.data.category?.trim() || inferred.category,
        subject: parsed.data.subject?.trim() || undefined,
        tags: combinedTags || undefined,
        lastPosition: parsed.data.lastPosition?.trim() || undefined,
        progressNote: parsed.data.progressNote?.trim() || undefined,
      },
    });

    const file = await prisma.fileItem.update({
      where: { id: created.id },
      data: { pathOrUrl: `/api/files/${created.id}/download` },
    });

    return NextResponse.json({ file: serializeFileItem(file) }, { status: 201 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const inferred = inferMeta(parsed.data.name, parsed.data.pathOrUrl);
  const combinedTags = normalizeTags([...(parsed.data.tags ?? "").split(","), ...inferred.inferredTags]).join(", ");

  const file = await prisma.fileItem.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      pathOrUrl: parsed.data.pathOrUrl,
      category: parsed.data.category?.trim() || inferred.category,
      subject: parsed.data.subject?.trim() || undefined,
      tags: combinedTags || undefined,
      lastPosition: parsed.data.lastPosition?.trim() || undefined,
      progressNote: parsed.data.progressNote?.trim() || undefined,
    },
  });

  return NextResponse.json({ file: serializeFileItem({ ...file, storageData: null }) }, { status: 201 });
}
