import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export type AuthContext = {
  authId: string;
  email?: string | null;
};

function readBearer(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return null;
  }

  return auth.slice(7);
}

export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const token = readBearer(req);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anon && token) {
    const supabase = createClient(url, anon);
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user?.id) {
      return { authId: data.user.id, email: data.user.email };
    }
  }

  const demoUser = req.headers.get("x-user-id");
  if (demoUser) {
    return { authId: demoUser, email: null };
  }

  return null;
}
