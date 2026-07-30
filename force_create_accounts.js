const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs");

const db = new PrismaClient();

async function create() {
  try {
    const accounts = JSON.parse(fs.readFileSync("generated_accounts.json", "utf-8"));

    console.log(`Force creating ${accounts.length} accounts in production...\n`);

    let created = 0;
    let updated = 0;
    let failed = 0;

    for (const acc of accounts) {
      try {
        // First check if user exists by username
        const existing = await db.$queryRawUnsafe(
          `SELECT id FROM "User" WHERE username = ?`,
          acc.username
        );

        if (existing && existing.length > 0) {
          console.log(`⏭️  ${acc.username}: Already exists`);
          updated++;
          continue;
        }

        // Check by email instead
        const byEmail = await db.$queryRawUnsafe(
          `SELECT id FROM "User" WHERE email = ?`,
          acc.email
        );

        if (byEmail && byEmail.length > 0) {
          console.log(`⏭️  ${acc.email}: Already has a user`);
          updated++;
          continue;
        }

        // Hash password from generated_accounts.json
        const passwordHash = await bcrypt.hash(acc.password, 10);

        // Create user
        const userId = crypto.randomUUID();
        await db.$executeRawUnsafe(
          `INSERT INTO "User" (id, email, username, passwordHash, role, createdAt)
           VALUES (?, ?, ?, ?, 'CREATOR', datetime('now'))`,
          userId,
          acc.email,
          acc.username,
          passwordHash
        );

        // Create creator
        await db.$executeRawUnsafe(
          `INSERT INTO "Creator" (id, userId, displayName, creatorCode, status, createdAt)
           VALUES (?, ?, ?, ?, 'ACTIVE', datetime('now'))`,
          crypto.randomUUID(),
          userId,
          acc.discord,
          acc.creatorCode
        );

        console.log(`✅ Created: ${acc.username}`);
        created++;
      } catch (err) {
        console.error(`❌ Failed ${acc.email}: ${err.message}`);
        failed++;
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Created: ${created}`);
    console.log(`Already existed: ${updated}`);
    console.log(`Failed: ${failed}`);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await db.$disconnect();
  }
}

create();
