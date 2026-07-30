const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function find() {
  try {
    // Find any user with natthoff
    const users = await db.user.findMany({
      where: { username: { contains: "natthoff" } }
    });
    
    console.log("Users containing 'natthoff':", users.length);
    users.forEach(u => console.log(`- ${u.username} (${u.email})`));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await db.$disconnect();
  }
}

find();
