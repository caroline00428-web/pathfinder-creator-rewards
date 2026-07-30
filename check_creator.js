const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function check() {
  try {
    const user = await db.user.findFirst({
      where: { username: "natthoff_56A7" }
    });

    console.log("User:", user?.username);
    console.log("User ID:", user?.id);

    // Check creator with raw SQL
    const creators = await db.$queryRawUnsafe(
      `SELECT id, userId, displayName, creatorCode, status FROM "Creator" WHERE userId = ?`,
      user?.id
    );

    console.log("Creator records found:", creators.length);
    if (creators.length > 0) {
      console.log("Creator:", creators[0]);
    } else {
      console.log("❌ NO CREATOR FOUND!");
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await db.$disconnect();
  }
}

check();
