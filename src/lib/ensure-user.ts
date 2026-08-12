import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/auth-server";

/** Creates/updates the private application profile for a verified Firebase identity. */
export async function ensureUserProfile(identity: string | AuthContext) {
  const authId = typeof identity === "string" ? identity : identity.authId;
  const name = typeof identity === "string" ? undefined : identity.name ?? undefined;
  const email = typeof identity === "string" ? undefined : identity.email ?? undefined;
  const avatarUrl = typeof identity === "string" ? undefined : identity.picture ?? undefined;

  return prisma.userProfile.upsert({
    where: { authId },
    create: { authId, name, email, avatarUrl },
    update: {
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
      ...(avatarUrl ? { avatarUrl } : {}),
    },
  });
}
