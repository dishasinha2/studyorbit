import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/route-auth";

function includesText(haystack: string | null | undefined, q: string) {
  return (haystack ?? "").toLowerCase().includes(q.toLowerCase());
}

function scoreMatch(title: string, preview: string, q: string) {
  const lowerQ = q.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const lowerPreview = preview.toLowerCase();
  let score = 0;
  if (lowerTitle === lowerQ) score += 12;
  if (lowerTitle.startsWith(lowerQ)) score += 8;
  if (lowerTitle.includes(lowerQ)) score += 5;
  if (lowerPreview.includes(lowerQ)) score += 3;
  return score;
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = new URL(req.url).searchParams;
  const q = searchParams.get("q")?.trim();
  const kindFilter = searchParams.get("kind")?.trim().toLowerCase();
  if (!q) return NextResponse.json({ results: [] });

  const [artifacts, events, notes, videos, files] = await Promise.all([
    prisma.artifact.findMany({ where: { userId: user.id }, take: 120, orderBy: { updatedAt: "desc" } }),
    prisma.plannerEvent.findMany({ where: { userId: user.id }, take: 80, orderBy: { startAt: "desc" } }),
    prisma.stickyNote.findMany({ where: { userId: user.id }, take: 80, orderBy: { updatedAt: "desc" } }),
    prisma.videoBookmark.findMany({ where: { userId: user.id }, take: 80, orderBy: { createdAt: "desc" } }),
    prisma.fileItem.findMany({ where: { userId: user.id }, take: 80, orderBy: { createdAt: "desc" } }),
  ]);

  const mapped = [
    ...artifacts
      .filter((item) => includesText(item.title, q) || includesText(item.content, q) || includesText(item.contextKey, q))
      .map((item) => ({ id: item.id, kind: "artifact", title: item.title, preview: item.content.slice(0, 120) })),
    ...events
      .filter((item) => includesText(item.title, q) || includesText(item.notes, q))
      .map((item) => ({ id: item.id, kind: "event", title: item.title, preview: item.notes ?? "" })),
    ...notes
      .filter((item) => includesText(item.content, q))
      .map((item) => ({ id: item.id, kind: "sticky", title: "Sticky Note", preview: item.content })),
    ...videos
      .filter((item) => includesText(item.title, q) || includesText(item.comment, q) || includesText(item.tags, q))
      .map((item) => ({ id: item.id, kind: "video", title: item.title, preview: item.comment ?? item.url })),
    ...files
      .filter(
        (item) =>
          includesText(item.name, q) ||
          includesText(item.pathOrUrl, q) ||
          includesText(item.tags, q) ||
          includesText(item.subject, q) ||
          includesText(item.lastPosition, q) ||
          includesText(item.progressNote, q),
      )
      .map((item) => ({
        id: item.id,
        kind: "file",
        title: item.name,
        preview: item.progressNote || item.lastPosition || item.pathOrUrl,
      })),
  ]
    .map((item) => ({ ...item, score: scoreMatch(item.title, item.preview, q) }))
    .filter((item) => (!kindFilter || kindFilter === "all" ? true : item.kind === kindFilter))
    .sort((a, b) => b.score - a.score);

  const counts = mapped.reduce<Record<string, number>>((acc, item) => {
    acc[item.kind] = (acc[item.kind] ?? 0) + 1;
    return acc;
  }, {});

  const results = mapped.slice(0, 50).map((item) => ({
    id: item.id,
    kind: item.kind,
    title: item.title,
    preview: item.preview,
  }));

  return NextResponse.json({
    results,
    counts: { all: mapped.length, ...counts },
  });
}
