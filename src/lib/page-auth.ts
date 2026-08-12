import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookie";
import { verifyFirebaseIdToken } from "@/lib/auth-server";

/** Server-side backstop for every private page, in addition to middleware. */
export async function requireAuthenticatedPage() {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!(token && await verifyFirebaseIdToken(token))) {
    redirect("/auth");
  }
}
