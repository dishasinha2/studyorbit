import { prisma } from "@/lib/prisma";

export async function ensureUserProfile(authId: string) {
  const existing = await prisma.userProfile.findUnique({ where: { authId } });
  if (existing) {
    return existing;
  }

  return prisma.userProfile.create({
    data: {
      authId,
    },
  });
}
