const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const db = new PrismaClient();

async function create() {
  try {
    const username = "natthoff_56A7";
    const password = "56A759E4F545";
    const email = "nonpoe@hotmail.com";
    const discordName = "natthoff";
    const creatorCode = "GDP_NATTHOFF_56A7";

    // Check if exists
    const existing = await db.$queryRawUnsafe(
      `SELECT id FROM "User" WHERE username = ?`,
      username
    );

    if (existing && existing.length > 0) {
      console.log("User already exists");
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = crypto.randomUUID();
    await db.$executeRawUnsafe(
      `INSERT INTO "User" (id, email, username, passwordHash, role, createdAt)
       VALUES (?, ?, ?, ?, 'CREATOR', datetime('now'))`,
      userId,
      email,
      username,
      passwordHash
    );

    console.log("✅ User created:", username);

    // Create creator
    await db.$executeRawUnsafe(
      `INSERT INTO "Creator" (id, userId, displayName, creatorCode, status, createdAt)
       VALUES (?, ?, ?, ?, 'ACTIVE', datetime('now'))`,
      crypto.randomUUID(),
      userId,
      discordName,
      creatorCode
    );

    console.log("✅ Creator created");
    console.log(`\n✅ ${username} can now login with password: ${password}`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await db.$disconnect();
  }
}

create();
