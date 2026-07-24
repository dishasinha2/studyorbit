import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";
import { analyzeResume } from "@/lib/career-analysis";
import { parseStringList } from "@/lib/career-scoring";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const targetRole = typeof body.targetRole === "string" ? body.targetRole : "AI Engineer";
  const documentId = typeof body.documentId === "string" ? body.documentId : user.resumeFileId;

  const resume = documentId
    ? await prisma.document.findFirst({ where: { id: documentId, userId: user.id }, select: { id: true, extractedText: true, name: true } })
    : await prisma.document.findFirst({
        where: { userId: user.id, type: "RESUME" },
        orderBy: { uploadedAt: "desc" },
        select: { id: true, extractedText: true, name: true },
      });

  if (!resume) return NextResponse.json({ error: "Upload a resume first." }, { status: 404 });
  if (!resume.extractedText) return NextResponse.json({ error: "Run document ingestion before analyzing this resume." }, { status: 422 });

  const analysis = analyzeResume({
    resumeText: resume.extractedText,
    profileSkills: parseStringList(user.skillsJson),
    targetRole,
  });

  return NextResponse.json({ documentId: resume.id, documentName: resume.name, analysis });
}

