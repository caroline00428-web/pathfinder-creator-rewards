const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function check() {
  try {
    // Try to get all tables
    const tables = await db.$queryRawUnsafe(`SELECT name FROM sqlite_master WHERE type='table';`);
    console.log("Tables:", tables);
    
    // Try to check User table
    const users = await db.user.findMany({ take: 5 });
    console.log("Total users:", users.length);
    if (users.length > 0) {
      console.log("Sample user:", users[0]);
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await db.$disconnect();
  }
}

check();
