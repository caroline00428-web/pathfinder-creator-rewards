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
    const existing = await db.user.findFirst({
      where: { username }
    });

    if (existing) {
      console.log("User already exists");
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        username,
        passwordHash,
        role: "CREATOR",
      },
    });

    console.log("✅ User created:", username);

    // Create creator using raw SQL
    await db.$executeRawUnsafe(
      `INSERT INTO "Creator" (id, userId, displayName, creatorCode, status, createdAt)
       VALUES (?, ?, ?, ?, 'ACTIVE', datetime('now'))`,
      crypto.randomUUID(),
      user.id,
      discordName,
      creatorCode
    );

    console.log("✅ Creator created");
    console.log(`\n✅ Now ${username} can login with password: ${password}`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await db.$disconnect();
  }
}

create();
