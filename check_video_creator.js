const { createClient } = require("@libsql/client");

const client = createClient({
  url: "libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1MzUxMzIsImlkIjoiMDE5ZjdlOTUtMDgwMS03NzQ3LWIzZmEtMTdlOTRhNTYwM2E2Iiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6ImNmMjgzYzRjLWZkMzUtNDQ4MC1hMjEzLTVjNWEyMjk1YjUxNCJ9.nWro0Km6Xq2Bh-7ReaOOwLWZSlBfkzTtqDC3RhHoL_dGCU8ITM9-6l-l4D4ELEH-apxD0VGJJHn4g8hfQzsqAg",
});

(async () => {
  try {
    console.log("🔍 检查最新上传的视频...\n");
    
    // 查询最新视频
    const result = await client.execute(
      `SELECT 
        v.id,
        v.title,
        v.creatorId,
        c.displayName as creatorName,
        v.platform,
        v.viewCount,
        v.status,
        datetime(v.submittedAt) as submittedAt
       FROM Video v
       LEFT JOIN Creator c ON v.creatorId = c.id
       ORDER BY v.submittedAt DESC
       LIMIT 5`
    );

    console.log("最新 5 个视频:");
    result.rows.forEach((v, i) => {
      console.log(`${i+1}. ${v.title || '(无标题)'}`);
      console.log(`   CreatorID: ${v.creatorId}`);
      console.log(`   Creator: ${v.creatorName}`);
      console.log(`   Platform: ${v.platform}`);
      console.log(`   Status: ${v.status}`);
      console.log(`   提交时间: ${v.submittedAt}\n`);
    });
    
    // 查询 edison3612 的 creator ID
    console.log("\n🔍 查询 edison3612 的 Creator ID...\n");
    const creatorResult = await client.execute(
      `SELECT u.id as userId, c.id as creatorId, c.displayName 
       FROM User u
       LEFT JOIN Creator c ON u.id = c.userId
       WHERE u.username = 'edison3612'`
    );
    
    if (creatorResult.rows.length > 0) {
      const creator = creatorResult.rows[0];
      console.log(`User ID: ${creator.userId}`);
      console.log(`Creator ID: ${creator.creatorId}`);
      console.log(`Display Name: ${creator.displayName}\n`);
    }
    
  } catch (e) {
    console.error("错误:", e.message);
  } finally {
    client.close();
  }
})();
