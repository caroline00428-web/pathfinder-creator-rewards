const { createClient } = require("@libsql/client");

const client = createClient({
  url: "libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1MzUxMzIsImlkIjoiMDE5ZjdlOTUtMDgwMS03NzQ3LWIzZmEtMTdlOTRhNTYwM2E2Iiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6ImNmMjgzYzRjLWZkMzUtNDQ4MC1hMjEzLTVjNWEyMjk1YjUxNCJ9.nWro0Km6Xq2Bh-7ReaOOwLWZSlBfkzTtqDC3RhHoL_dGCU8ITM9-6l-l4D4ELEH-apxD0VGJJHn4g8hfQzsqAg",
});

(async () => {
  try {
    console.log("🔍 检查所有 User 和 Creator 的关系...\n");
    
    // 查询所有 user
    const result = await client.execute(
      `SELECT 
        u.id,
        u.username,
        u.role,
        c.id as creatorId,
        c.displayName,
        (SELECT COUNT(*) FROM Video WHERE creatorId = c.id) as videoCount
       FROM User u
       LEFT JOIN Creator c ON u.id = c.userId
       ORDER BY u.username
       LIMIT 20`
    );

    console.log(`找到 ${result.rows.length} 个用户:\n`);
    
    let noCreator = 0;
    result.rows.forEach((row) => {
      if (!row.creatorId) {
        console.log(`❌ ${row.username} - NO CREATOR!`);
        noCreator++;
      } else if (row.videoCount === 0) {
        console.log(`⚠️  ${row.username} - Creator: ${row.displayName} (${row.videoCount} videos)`);
      } else {
        console.log(`✅ ${row.username} - Creator: ${row.displayName} (${row.videoCount} videos)`);
      }
    });
    
    console.log(`\n📊 统计：`);
    console.log(`   没有 Creator 的用户: ${noCreator}`);
    
  } catch (e) {
    console.error("错误:", e.message);
  } finally {
    client.close();
  }
})();
