// Generate N creator accounts and store in Turso DB.
// Usage: npx tsx prisma/generate-accounts.ts [count]
// Default: 500 accounts. Run once to pre-fill the account pool.

import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: ".env.local" });
// Also try from project root
dotenv.config({ path: "C:/Users/Leocool/creator-reward-platform/.env.local" });

const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;
if (!url || !token) { console.error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN"); process.exit(1); }

const db = createClient({ url, authToken: token });
const COUNT = parseInt(process.argv[2] || "500");

function randomStr(len: number) {
  return randomBytes(Math.ceil(len / 2)).toString("hex").slice(0, len).toUpperCase();
}

async function main() {
  console.log(`Generating ${COUNT} accounts...`);
  const existing = await db.execute("SELECT COUNT(*) FROM CreatorAccount WHERE used = 0");
  console.log(`Already have ${existing.rows[0][0]} unused accounts`);

  const batchSize = 50;
  for (let batch = 0; batch < Math.ceil(COUNT / batchSize); batch++) {
    const stmts: Array<{ sql: string; args: any[] }> = [];
    for (let i = 0; i < batchSize && batch * batchSize + i < COUNT; i++) {
      const idx = batch * batchSize + i + 1;
      const username = `GDP_${randomStr(6)}`;
      const password = randomStr(12);
      const hash = await bcrypt.hash(password, 12);
      const code = `GDP${randomStr(4)}${String(idx).padStart(3, "0")}`;
      stmts.push({
        sql: "INSERT OR IGNORE INTO CreatorAccount (id, username, password, passwordHash, creatorCode) VALUES (?, ?, ?, ?, ?)",
        args: [`pre_${idx}`, username, password, hash, code],
      });
    }
    for (const s of stmts) {
      try { await db.execute(s); } catch (e: any) { if (!e.message?.includes("UNIQUE")) console.error(e.message); }
    }
    console.log(`  Batch ${batch + 1}/${Math.ceil(COUNT / batchSize)} done`);
  }

  const final = await db.execute("SELECT COUNT(*) FROM CreatorAccount WHERE used = 0");
  console.log(`\nDone! ${final.rows[0][0]} unused accounts in pool.`);
}

main().catch(e => { console.error(e); process.exit(1); });
