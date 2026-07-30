const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function check() {
  try {
    // Check user
    const user = await db.user.findFirst({
      where: { username: "natthoff_56A7" }
    });
    
    console.log("=== User Check ===");
    console.log("User found:", user ? "YES" : "NO");
    if (user) {
      console.log("User ID:", user.id);
      console.log("User email:", user.email);
      console.log("User created at:", user.createdAt);

      // Check creator
      const creator = await db.creator.findFirst({
        where: { userId: user.id }
      });
      console.log("\n=== Creator Check ===");
      console.log("Creator found:", creator ? "YES" : "NO");
      if (creator) {
        console.log("Creator code:", creator.creatorCode);
        console.log("Creator display name:", creator.displayName);
      }
    }

    // Check password record
    console.log("\n=== Password Record Check ===");
    const passRec = await db.$queryRawUnsafe(
      `SELECT username, password, email, discordName, used, usedAt FROM CreatorAccount WHERE username = 'natthoff_56A7' LIMIT 1`
    );
    if (passRec.length > 0) {
      console.log("Password record found: YES");
      console.log("Username:", passRec[0].username);
      console.log("Password:", passRec[0].password);
      console.log("Email:", passRec[0].email);
      console.log("Discord Name:", passRec[0].discordName);
      console.log("Used:", passRec[0].used);
    } else {
      console.log("Password record found: NO");
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await db.$disconnect();
  }
}

check();
