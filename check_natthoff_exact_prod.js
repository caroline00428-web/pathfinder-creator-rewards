const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function check() {
  try {
    // Try exact match
    const user = await db.$queryRawUnsafe(
      `SELECT id, username, email FROM "User" WHERE username = ? COLLATE NOCASE`,
      "natthoff_56A7"
    );

    console.log("Exact match results:", user.length);
    user.forEach(u => console.log(`- ${u.username} (${u.email})`));

    // Try all variants
    const variants = [
      "natthoff_56A7",
      "natthoff_56a7",
      "NATTHOFF_56A7",
    ];

    for (const v of variants) {
      const r = await db.$queryRawUnsafe(
        `SELECT id, username, email FROM "User" WHERE username = ?`,
        v
      );
      console.log(`\nSearch '${v}': ${r.length} results`);
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await db.$disconnect();
  }
}

check();
