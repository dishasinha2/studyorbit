import { NextRequest } from "next/server";
import { getAuthContext } from "@/lib/auth-server";
import { ensureUserProfile } from "@/lib/ensure-user";

export async function getUserFromRequest(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) {
    return null;
  }

  return ensureUserProfile(auth.authId);
}
