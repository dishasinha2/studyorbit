import { PrismaClient } from "@prisma/client";

declare global { var prisma: PrismaClient | undefined; }

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be configured. StudyOrbit does not support mock persistence.");
}

export const prisma = global.prisma ?? new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
