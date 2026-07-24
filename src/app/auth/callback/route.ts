import { NextResponse, type NextRequest } from "next/server";

function safeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const next = safeRedirectPath(url.searchParams.get("next"));
  return NextResponse.redirect(new URL(`/auth?next=${encodeURIComponent(next)}`, req.url));
}

