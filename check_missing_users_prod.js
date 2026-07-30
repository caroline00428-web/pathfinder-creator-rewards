const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const db = new PrismaClient();

async function check() {
  try {
    const sentRecords = JSON.parse(fs.readFileSync("sent_records.json", "utf-8"));

    console.log(`Checking ${sentRecords.length} SENT records against production database...\n`);

    const missing = [];
    const found = [];

    for (const record of sentRecords) {
      const user = await db.$queryRawUnsafe(
        `SELECT id, username FROM "User" WHERE email = ?`,
        record.email
      );

      if (user && user.length > 0) {
        found.push({
          email: record.email,
          username: user[0].username,
        });
      } else {
        missing.push(record);
      }
    }

    console.log(`✅ Found: ${found.length}`);
    console.log(`❌ Missing: ${missing.length}\n`);

    if (missing.length > 0) {
      console.log("Missing users:");
      missing.forEach((m, i) => {
        console.log(`${i + 1}. ${m.email} | ${m.username} | ${m.discord}`);
      });

      fs.writeFileSync("missing_users.json", JSON.stringify(missing, null, 2));
      console.log(`\n✅ Saved ${missing.length} missing records to missing_users.json`);
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await db.$disconnect();
  }
}

check();
