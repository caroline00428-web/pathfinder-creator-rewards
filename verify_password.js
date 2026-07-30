const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");

const db = new PrismaClient();

async function verify() {
  try {
    const accounts = JSON.parse(fs.readFileSync("generated_accounts.json", "utf-8"));
    const targetAccount = accounts.find(a => a.username === "org_shiv123_AA9C");

    if (!targetAccount) {
      console.log("❌ Account not found in generated_accounts.json");
      return;
    }

    console.log("Account from generated_accounts.json:");
    console.log("Username:", targetAccount.username);
    console.log("Password:", targetAccount.password);
    console.log("Email:", targetAccount.email);
    console.log("");

    // Get user from database
    const users = await db.$queryRawUnsafe(
      `SELECT id, username, email, passwordHash FROM "User" WHERE username = ?`,
      targetAccount.username
    );

    if (users.length === 0) {
      console.log("❌ User not found in database by username");
      return;
    }

    const user = users[0];
    console.log("User from database:");
    console.log("Username:", user.username);
    console.log("Email:", user.email);
    console.log("");

    // Verify password
    const isValid = await bcrypt.compare(targetAccount.password, user.passwordHash);
    console.log("Password verification:");
    console.log("Input password: " + targetAccount.password);
    console.log("Hash match: " + (isValid ? "✅ YES" : "❌ NO"));
    
    if (isValid) {
      console.log("\n✅ This account SHOULD be able to login!");
    } else {
      console.log("\n❌ Password does not match!");
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await db.$disconnect();
  }
}

verify();
