const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

async function test() {
  try {
    const username = "org_shiv123_AA9C";
    const password = "AA9C2376";

    console.log("Testing authorize function logic...\n");

    // This is what authorize does - Step 1: findUnique
    console.log("Step 1: db.user.findUnique()");
    try {
      const user = await db.user.findUnique({
        where: { username },
      });

      if (!user) {
        console.log("❌ User not found via ORM");
        return;
      }

      console.log("✅ User found via ORM");
      console.log("Username:", user.username);

      // Step 2: bcrypt compare
      console.log("\nStep 2: bcrypt.compare()");
      const isValid = await bcrypt.compare(password, user.passwordHash);
      console.log("Password valid:", isValid ? "✅ YES" : "❌ NO");

      if (!isValid) {
        console.log("❌ Password mismatch - authorize would return null");
        return;
      }

      // Step 3: Get creator
      console.log("\nStep 3: Get creator via raw SQL");
      const creator = await db.$queryRawUnsafe(
        `SELECT id FROM "Creator" WHERE userId = ? LIMIT 1`,
        user.id
      );
      console.log("Creator found:", creator.length > 0 ? "✅ YES" : "⏭️ NO");

      console.log("\n✅ authorize() should return user object");
      console.log("Returned user:", {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        creatorId: creator?.[0]?.id,
      });
    } catch (err) {
      console.error("❌ Error during authorize:", err.message);
      if (err.message.includes("rewardScheme")) {
        console.log("\n*** Found it: rewardScheme column issue! ***");
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await db.$disconnect();
  }
}

test();
