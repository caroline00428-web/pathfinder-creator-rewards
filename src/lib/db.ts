import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  initPromise: Promise<void> | undefined;
};

// Lazy-init: if Turso env vars are set, create Turso client, otherwise SQLite
function getClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    // On Vercel: need to create client synchronously but Turso adapter
    // requires async import. Use sync require() inside a try — this only
    // runs at request time on Vercel, not during build.
    try {
      const { PrismaLibSql } = require("@prisma/adapter-libsql");
      globalForPrisma.prisma = new PrismaClient({
        adapter: new PrismaLibSql({ url: tursoUrl, authToken: tursoToken }) as any,
      });
      console.log("✅ Turso database connected");
    } catch (e) {
      console.warn("⚠️ Turso adapter not available, falling back to SQLite");
      globalForPrisma.prisma = new PrismaClient();
    }
  } else {
    // Local dev: regular SQLite
    globalForPrisma.prisma = new PrismaClient();
  }

  if (process.env.NODE_ENV !== "production") {
    (globalForPrisma as any).prisma = globalForPrisma.prisma;
  }

  return globalForPrisma.prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    // Handle methods that need .bind() like $transaction
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
