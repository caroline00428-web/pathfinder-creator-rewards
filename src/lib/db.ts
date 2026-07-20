import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require("@libsql/client");
    const { PrismaLibSQL } = require("@prisma/adapter-libsql");
    const client = createClient({ url: tursoUrl, authToken: tursoToken });
    const adapter = new PrismaLibSQL(client);
    globalForPrisma.prisma = new PrismaClient({
      adapter: adapter as any,
      // Skip migration check — not supported by Turso HTTP API
      datasourceUrl: tursoUrl,
    } as any);
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
