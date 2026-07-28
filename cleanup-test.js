// Clean up test accounts from DB
const { createClient } = require("@libsql/client");
require("dotenv").config({ path: ".env.local" });

async function main() {
  const c = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
  const testUserIds = ["cmrt0cpdd0000utiwsi328yg5", "cmrt3ygd90000l804dnhjq7o0"];

  for (const uid of testUserIds) {
    try {
      // Find creator record
      const cr = await c.execute("SELECT id FROM Creator WHERE userId = ?", [uid]);
      for (const row of cr.rows) {
        const cid = row[0];
        // Delete ALL child records in correct order
        await c.execute("DELETE FROM ViewCountHistory WHERE videoId IN (SELECT id FROM Video WHERE creatorId = ?)", [cid]);
        await c.execute("DELETE FROM MilestoneClaim WHERE creatorId = ?", [cid]);
        await c.execute("DELETE FROM Video WHERE creatorId = ?", [cid]);
        await c.execute("DELETE FROM SpecialRewardApplication WHERE creatorId = ?", [cid]);
        await c.execute("DELETE FROM RewardOrderItem WHERE orderId IN (SELECT id FROM RewardOrder WHERE creatorId = ?)", [cid]);
        await c.execute("DELETE FROM RewardOrder WHERE creatorId = ?", [cid]);
        await c.execute("DELETE FROM CreditTransaction WHERE creatorId = ?", [cid]);
        await c.execute("DELETE FROM CreditWallet WHERE creatorId = ?", [cid]);
        await c.execute("DELETE FROM Creator WHERE id = ?", [cid]);
        console.log("Deleted creator:", cid);
      }
      await c.execute("DELETE FROM User WHERE id = ?", [uid]);
      console.log("Deleted user:", uid);
    } catch (e) { console.log("Skip", uid, e.message); }
  }

  const users = await c.execute("SELECT id, username FROM User");
  console.log("Remaining:", users.rows.length, "users");
  for (const u of users.rows) console.log("  ", u[0], u[1]);
}
main();
