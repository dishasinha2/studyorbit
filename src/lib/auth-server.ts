import { NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookie";
import { getFirebaseAuthConfig } from "@/lib/auth-config";

export type AuthContext = {
  authId: string;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
};

type FirebaseAccountLookup = {
  users?: Array<{
    localId: string;
    email?: string;
    displayName?: string;
    photoUrl?: string;
  }>;
  error?: { message?: string };
};

function readBearer(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

export function readAuthToken(req: NextRequest) {
  return readBearer(req) || req.cookies.get(ACCESS_TOKEN_COOKIE)?.value || null;
}

export async function verifyFirebaseIdToken(token: string): Promise<AuthContext | null> {
  const config = getFirebaseAuthConfig();
  if (!config.apiKey || !token) return null;

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(config.apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token }),
    cache: "no-store",
  }).catch(() => null);
  if (!response?.ok) return null;

  const json = (await response.json().catch(() => null)) as FirebaseAccountLookup | null;
  const user = json?.users?.[0];
  if (!user?.localId) return null;

  return {
    authId: user.localId,
    email: user.email ?? null,
    name: user.displayName ?? null,
    picture: user.photoUrl ?? null,
  };
}

export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const token = readAuthToken(req);
  if (!token) return null;
  return verifyFirebaseIdToken(token);
}

