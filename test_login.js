const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

async function test() {
  try {
    const username = "natthoff_56A7";
    const password = "56A759E4F545";

    console.log("Testing login for:", username);
    console.log("Password:", password);

    // Get user with raw SQL to avoid rewardScheme issue
    const users = await db.$queryRawUnsafe(
      `SELECT id, email, username, passwordHash, role FROM "User" WHERE username = ?`,
      username
    );

    if (users.length === 0) {
      console.log("❌ User not found");
      return;
    }

    const user = users[0];

    console.log("✅ User found");
    console.log("Email:", user.email);
    console.log("Password hash:", user.passwordHash.substring(0, 30) + "...");

    // Test bcrypt comparison
    console.log("\nTesting bcrypt.compare...");
    const isValid = await bcrypt.compare(password, user.passwordHash);

    console.log("Result:", isValid ? "✅ VALID" : "❌ INVALID");

    if (isValid) {
      console.log("\n✅ Login should work!");
    } else {
      console.log("\n❌ Password mismatch!");

      // Try to debug
      console.log("\nDebug info:");
      console.log("- Input password is plain text:", /^[A-F0-9]+$/.test(password));
      console.log("- Hash starts with $2a or $2b (bcrypt):", user.passwordHash.startsWith("$2"));

      // Also try with some variations
      console.log("\nTrying password variations...");
      const variations = [
        password,
        password.toLowerCase(),
        password.toUpperCase(),
      ];

      for (const v of variations) {
        const result = await bcrypt.compare(v, user.passwordHash);
        if (result) {
          console.log(`✅ Found match with: ${v}`);
        }
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await db.$disconnect();
  }
}

test();
