// Prisma requires DATABASE_URL to be set at module load time.
// On Vercel with Turso adapter, this is a dummy value — the adapter handles the real connection.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dummy.db";
}

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    // Prisma requires a valid DATABASE_URL at module load time.
    // The adapter handles the real connection — this is just to satisfy validation.
    process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./dummy.db";

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require("@libsql/client");
    const { PrismaLibSQL } = require("@prisma/adapter-libsql");
    const client = createClient({ url: tursoUrl, authToken: tursoToken });
    const adapter = new PrismaLibSQL(client);
    globalForPrisma.prisma = new PrismaClient({ adapter: adapter as any });
    console.log("✅ Turso database connected via adapter");
  } else {
    globalForPrisma.prisma = new PrismaClient();
  }

  return globalForPrisma.prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") return value.bind(client);
    return value;
  },
});
