import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureUserProfile } from "@/lib/ensure-user";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await ensureUserProfile(auth.authId);

  const [projects, artifacts, events, stickyNotes, whiteboards, videoBookmarks, fileItems, focusSessions] = await Promise.all([
    prisma.project.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    prisma.artifact.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    prisma.plannerEvent.findMany({ where: { userId: user.id }, orderBy: { startAt: "desc" } }),
    prisma.stickyNote.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    prisma.whiteboard.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    prisma.videoBookmark.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    prisma.fileItem.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        pathOrUrl: true,
        originalFileName: true,
        mimeType: true,
        sizeBytes: true,
        category: true,
        subject: true,
        tags: true,
        lastPosition: true,
        progressNote: true,
        isCompleted: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.focusSession.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    profile: {
      id: user.id,
      authId: user.authId,
      name: user.name,
      avatarUrl: user.avatarUrl,
      email: auth.email ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    data: {
      projects,
      artifacts,
      events,
      stickyNotes,
      whiteboards,
      videoBookmarks,
      fileItems,
      focusSessions,
    },
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="studyorbit-profile-export-${user.id}.json"`,
    },
  });
}
