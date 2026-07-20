const dotenv = require("dotenv");
dotenv.config();
// Use a dummy SQLite URL — the adapter handles the real connection to Turso
process.env.DATABASE_URL = "file:./dummy.db";
const { createClient } = require("@libsql/client");
const { PrismaLibSQL } = require("@prisma/adapter-libsql");
const { PrismaClient } = require("@prisma/client");
async function test() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  const c = createClient({ url, authToken: token });
  const p = new PrismaClient({ adapter: new PrismaLibSQL(c) });
  const n = await p.user.count();
  console.log("✅ User count:", n);
  await p.$disconnect();
}
test().catch(e => console.error(e.message));
