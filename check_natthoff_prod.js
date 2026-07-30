const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function check() {
  try {
    // Search for exact match
    const user = await db.user.findFirst({
      where: { username: "natthoff_56A7" }
    });

    if (user) {
      console.log("Found user:");
      console.log("- Username:", user.username);
      console.log("- Email:", user.email);
      console.log("- Role:", user.role);
    } else {
      console.log("User not found");
    }

    // Also search for any username containing natthoff
    const all = await db.user.findMany({
      where: { username: { contains: "natthoff" } }
    });

    console.log("\nUsers containing 'natthoff':", all.length);
    all.forEach(u => console.log("- " + u.username));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await db.$disconnect();
  }
}

check();
