const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function create() {
  try {
    // Create CreatorAccount table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CreatorAccount" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "username" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "creatorCode" TEXT NOT NULL UNIQUE,
        "discordName" TEXT,
        "email" TEXT,
        "used" BOOLEAN NOT NULL DEFAULT 0,
        "usedAt" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("✅ CreatorAccount table created successfully");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await db.$disconnect();
  }
}

create();
