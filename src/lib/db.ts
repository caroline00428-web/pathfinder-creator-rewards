import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Called by instrumentation.ts on server startup in production
export async function initTursoIfNeeded(): Promise<void> {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    const { PrismaLibSql } = await import("@prisma/adapter-libsql");
    const client = new PrismaClient({
      adapter: new PrismaLibSql({ url: tursoUrl, authToken: tursoToken }) as any,
    });
    (globalForPrisma as any).prisma = client;
    console.log("✅ Turso database connected");
  }
}
