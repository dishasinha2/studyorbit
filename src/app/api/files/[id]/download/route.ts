import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "buffer";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const file = await prisma.fileItem.findFirst({
    where: { id, userId: user.id },
    select: {
      name: true,
      originalFileName: true,
      mimeType: true,
      storageData: true,
    },
  });

  if (!file?.storageData) {
    return NextResponse.json({ error: "Stored file not found" }, { status: 404 });
  }

  const filename = (file.originalFileName || file.name).replace(/"/g, "");
  return new NextResponse(Buffer.from(file.storageData), {
    status: 200,
    headers: {
      "Content-Type": file.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
