const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function listUsers() {
  try {
    const users = await db.user.findMany({
      take: 20,
      select: { username: true, email: true, role: true, createdAt: true }
    });

    console.log("Users in production database:");
    console.log("Total found:", users.length);
    users.forEach(u => {
      console.log(`- ${u.username} (${u.email}) [${u.role}]`);
    });
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await db.$disconnect();
  }
}

listUsers();
