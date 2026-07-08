import { PrismaClient } from "@/generated/prisma/client";

// The Prisma schema declares the datasource url as `env("POSTGRES_URL")`.
// When the database is connected through the Neon integration, the connection
// string is exposed under a `NEON_`-prefixed variable instead. Resolve the URL
// here and pass it explicitly to the client so it works regardless of which
// variable name the current environment provides.
const databaseUrl =
  process.env.POSTGRES_URL ??
  process.env.NEON_POSTGRES_URL ??
  process.env.NEON_DATABASE_URL ??
  process.env.NEON_POSTGRES_URL_NON_POOLING;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
