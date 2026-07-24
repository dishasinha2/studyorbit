import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { persistServerSession } from "@/lib/auth-cookie";
import { verifyFirebaseIdToken } from "@/lib/auth-server";

const schema = z.object({
  idToken: z.string().min(20),
  refreshToken: z.string().min(20).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid session payload." }, { status: 400 });
  }

  const auth = await verifyFirebaseIdToken(parsed.data.idToken);
  if (!auth) {
    return NextResponse.json({ error: "Invalid Firebase session." }, { status: 401 });
  }

  const response = NextResponse.json({ user: auth });
  persistServerSession(response, parsed.data.idToken, parsed.data.refreshToken);
  return response;
}

