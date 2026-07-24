import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  try {
    if (process.env.DATABASE_URL) {
      return new PrismaClient({
        log: ["error"],
      });
    }
  } catch (e) {
    console.warn("[AI Studio] Prisma initialization failed, using mock:", e);
  }

  console.warn("[AI Studio] Database not connected (DATABASE_URL missing) — using mock");
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    findRaw: async () => [],
    aggregate: async () => ({ _count: 0 }),
    count: async () => 0,
    create: async (d: { data?: unknown }) => d?.data ?? {},
    createMany: async () => ({ count: 0 }),
    update: async (d: { data?: unknown }) => d?.data ?? {},
    updateMany: async () => ({ count: 0 }),
    upsert: async (d: { create?: unknown }) => d?.create ?? {},
    delete: async () => ({}),
    deleteMany: async () => ({ count: 0 }),
    $queryRaw: async () => [],
    $executeRaw: async () => 0,
    $transaction: async (cb: unknown) => (typeof cb === "function" ? cb(mockPrisma) : Promise.resolve([])),
  };

  const handler: ProxyHandler<Record<string, unknown>> = {
    get(target, prop) {
      if (typeof prop === "string") {
        if (prop in noOp) return (noOp as Record<string, unknown>)[prop];
        if (prop.startsWith("$")) return (noOp as Record<string, unknown>)[prop] ?? (async () => []);
      }
      return new Proxy({}, handler);
    },
  };
  const mockPrisma = new Proxy({}, handler);
  return mockPrisma as unknown as PrismaClient;
}

export const prisma = global.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

