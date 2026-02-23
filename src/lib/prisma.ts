import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  (() => {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error"] : [],
    });
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
    return client;
  })();
