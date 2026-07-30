const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function testAuthorize() {
  try {
    const credentials = {
      username: "natthoff_56A7",
      password: "56A759E4F545",
    };

    console.log("Testing authorize function...");
    console.log("Credentials:", credentials);

    if (!credentials?.username || !credentials?.password) {
      console.log("❌ Missing username or password");
      return null;
    }

    const user = await db.user.findUnique({
      where: { username: credentials.username },
      include: { creator: true },
    });

    console.log("User found:", !!user);
    if (!user) {
      console.log("❌ User not found in database");
      return null;
    }

    console.log("User details:", {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      creatorId: user.creator?.id,
    });

    const isValid = await bcrypt.compare(
      credentials.password,
      user.passwordHash
    );

    console.log("Password valid:", isValid);

    if (!isValid) {
      console.log("❌ Password mismatch");
      return null;
    }

    const result = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      creatorId: user.creator?.id ?? undefined,
    };

    console.log("✅ Login should succeed!");
    console.log("User object to return:", result);
    return result;
  } catch (err) {
    console.error("❌ Error:", err.message);
    return null;
  } finally {
    await db.$disconnect();
  }
}

testAuthorize();
