import { NextResponse, type NextRequest } from "next/server";
import { verifyFirebaseIdToken } from "@/lib/auth-server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookie";

const PROTECTED_PREFIXES = ["/dashboard", "/workspace", "/profile", "/ai", "/documents", "/roadmaps", "/skills", "/relax", "/focus", "/notifications", "/calendar", "/career", "/settings"];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const needsAuth = (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) || PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (token && (await verifyFirebaseIdToken(token))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL("/auth", req.url);
  url.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/workspace/:path*",
    "/profile/:path*",
    "/ai/:path*",
    "/documents/:path*",
    "/roadmaps/:path*",
    "/skills/:path*",
    "/relax/:path*",
    "/focus/:path*",
    "/notifications/:path*",
    "/calendar/:path*",
    "/career/:path*",
    "/settings/:path*",
    "/api/:path*",
    "/focus/:path*",
    "/notifications/:path*",
    "/calendar/:path*",
    "/career/:path*",
    "/settings/:path*",
  ],
};
