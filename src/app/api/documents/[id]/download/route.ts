import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";
import { readStoredObject } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const document = await prisma.document.findFirst({
    where: { id, userId: user.id },
    select: { name: true, originalName: true, mimeType: true, storageKey: true, storageData: true },
  });

  if (!document) return NextResponse.json({ error: "Stored document not found." }, { status: 404 });

  const bytes = await readStoredObject({ key: document.storageKey, fallbackData: document.storageData });
  if (!bytes) return NextResponse.json({ error: "Stored document not found." }, { status: 404 });

  const filename = (document.originalName || document.name).replace(/"/g, "");
  const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": document.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
