const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function testAuthorize() {
  try {
    const credentials = {
      username: "natthoff_56A7",
      password: "56A759E4F545",
    };

    console.log("Testing new authorize function...");
    console.log("Credentials:", credentials);

    if (!credentials?.username || !credentials?.password) {
      console.log("❌ Missing username or password");
      return null;
    }

    // Changed: Don't include creator, query separately
    const user = await db.user.findUnique({
      where: { username: credentials.username },
    });

    if (!user) {
      console.log("❌ User not found");
      return null;
    }

    console.log("✅ User found:", user.username);

    const isValid = await bcrypt.compare(
      credentials.password,
      user.passwordHash
    );

    if (!isValid) {
      console.log("❌ Password mismatch");
      return null;
    }

    console.log("✅ Password valid");

    // Get creator separately
    const creator = await db.$queryRawUnsafe(
      `SELECT id FROM "Creator" WHERE userId = ? LIMIT 1`,
      user.id
    );

    console.log("Creator found:", !!creator?.[0]);

    const result = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      creatorId: creator?.[0]?.id ?? undefined,
    };

    console.log("✅ Login should succeed!");
    console.log("User object:", result);
    return result;
  } catch (err) {
    console.error("❌ Error:", err.message);
    return null;
  } finally {
    await db.$disconnect();
  }
}

testAuthorize();
