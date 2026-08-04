const { createClient } = require("@libsql/client");

const client = createClient({
  url: "libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1MzUxMzIsImlkIjoiMDE5ZjdlOTUtMDgwMS03NzQ3LWIzZmEtMTdlOTRhNTYwM2E2Iiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6ImNmMjgzYzRjLWZkMzUtNDQ4MC1hMjEzLTVjNWEyMjk1YjUxNCJ9.nWro0Km6Xq2Bh-7ReaOOwLWZSlBfkzTtqDC3RhHoL_dGCU8ITM9-6l-l4D4ELEH-apxD0VGJJHn4g8hfQzsqAg",
});

(async () => {
  try {
    console.log("=== MilestoneClaim 详情 ===\n");
    const result = await client.execute(
      `SELECT mc.id, mc.creatorId, c.displayName, c.rewardScheme, mc.creditsAwarded, m.viewThreshold
       FROM MilestoneClaim mc
       JOIN Creator c ON mc.creatorId = c.id
       JOIN Milestone m ON mc.milestoneId = m.id`
    );
    console.log(result.rows);

    console.log("\n=== CreditTransaction 详情 ===\n");
    const txResult = await client.execute(
      `SELECT ct.id, ct.creatorId, c.displayName, ct.amount, ct.type, ct.reason, ct.createdAt
       FROM CreditTransaction ct
       JOIN Creator c ON ct.creatorId = c.id
       ORDER BY ct.createdAt DESC
       LIMIT 10`
    );
    console.log(txResult.rows);
  } catch (e) {
    console.error("错误:", e.message);
  } finally {
    client.close();
  }
})();
