const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

async function check() {
  try {
    // Get user
    const user = await db.user.findFirst({
      where: { username: "natthoff_56A7" }
    });
    
    if (!user) {
      console.log("User not found");
      return;
    }
    
    console.log("User found:", user.username);
    console.log("Email:", user.email);
    console.log("Password hash:", user.passwordHash);
    
    // Test password
    const password = "56A759E4F545";
    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log("\nPassword test:");
    console.log("Input password:", password);
    console.log("Is valid:", isValid);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await db.$disconnect();
  }
}

check();
