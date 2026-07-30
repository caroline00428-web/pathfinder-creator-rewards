const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

async function test() {
  try {
    const username = "org_shiv123_AA9C";
    const password = "AA9C2376";

    console.log("Testing credentials:");
    console.log("Username:", username);
    console.log("Password:", password);
    console.log("");

    // Get user
    const users = await db.$queryRawUnsafe(
      `SELECT id, username, email, passwordHash, role FROM "User" WHERE username = ?`,
      username
    );

    if (users.length === 0) {
      console.log("❌ User not found in database");
      return;
    }

    const user = users[0];
    console.log("✅ User found");
    console.log("Email:", user.email);
    console.log("Role:", user.role);
    console.log("Hash:", user.passwordHash.substring(0, 30) + "...");

    // Test password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log("Password match:", isValid ? "✅ YES" : "❌ NO");

    if (!isValid) {
      console.log("\n❌ Problem: Password doesn't match the hash!");
      console.log("This means the password we sent is WRONG");
    } else {
      console.log("\n✅ Login should work!");
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await db.$disconnect();
  }
}

test();
