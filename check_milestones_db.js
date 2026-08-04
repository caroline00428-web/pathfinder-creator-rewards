const { createClient } = require("@libsql/client");

const client = createClient({
  url: "libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1MzUxMzIsImlkIjoiMDE5ZjdlOTUtMDgwMS03NzQ3LWIzZmEtMTdlOTRhNTYwM2E2Iiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6ImNmMjgzYzRjLWZkMzUtNDQ4MC1hMjEzLTVjNWEyMjk1YjUxNCJ9.nWro0Km6Xq2Bh-7ReaOOwLWZSlBfkzTtqDC3RhHoL_dGCU8ITM9-6l-l4D4ELEH-apxD0VGJJHn4g8hfQzsqAg",
});

(async () => {
  try {
    console.log("🔍 检查 Milestone 数据...\n");
    
    // 1. 总数
    const countResult = await client.execute(
      `SELECT COUNT(*) as count FROM Milestone`
    );
    console.log(`📊 Milestone 总数: ${countResult.rows[0]?.count || 0}\n`);

    // 2. 所有 milestone
    console.log("所有 Milestone:");
    const result = await client.execute(
      `SELECT 
        id,
        campaignId,
        platform,
        viewThreshold,
        creditsAwarded,
        active,
        createdAt
       FROM Milestone
       ORDER BY platform, viewThreshold`
    );

    result.rows.forEach((m) => {
      console.log(`  ${m.platform} | ${m.viewThreshold.toLocaleString()} views → ${m.creditsAwarded} | Campaign: ${m.campaignId || '(全局)'} | Active: ${m.active ? '✅' : '❌'}`);
    });

    // 3. 检查是否有数据类型问题
    console.log(`\n🔍 检查第一个 Milestone 的详细信息:`);
    if (result.rows.length > 0) {
      const first = result.rows[0];
      console.log(`  ID: ${first.id} (类型: ${typeof first.id})`);
      console.log(`  viewThreshold: ${first.viewThreshold} (类型: ${typeof first.viewThreshold})`);
      console.log(`  creditsAwarded: ${first.creditsAwarded} (类型: ${typeof first.creditsAwarded})`);
      console.log(`  active: ${first.active} (类型: ${typeof first.active})`);
      console.log(`  createdAt: ${first.createdAt}`);
    }

  } catch (e) {
    console.error("❌ 错误:", e.message);
  } finally {
    client.close();
  }
})();
