const { createClient } = require("@libsql/client");

const client = createClient({
  url: "libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1MzUxMzIsImlkIjoiMDE5ZjdlOTUtMDgwMS03NzQ3LWIzZmEtMTdlOTRhNTYwM2E2Iiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6ImNmMjgzYzRjLWZkMzUtNDQ4MC1hMjEzLTVjNWEyMjk1YjUxNCJ9.nWro0Km6Xq2Bh-7ReaOOwLWZSlBfkzTtqDC3RhHoL_dGCU8ITM9-6l-l4D4ELEH-apxD0VGJJHn4g8hfQzsqAg",
});

(async () => {
  try {
    console.log("🔍 检查生产数据库中的视频...\n");
    
    // 1. 视频总数
    const countResult = await client.execute(
      `SELECT COUNT(*) as count FROM Video`
    );
    const totalCount = countResult.rows[0]?.count || 0;
    console.log(`📊 视频总数: ${totalCount}`);

    if (totalCount === 0) {
      console.log("❌ 没有视频！数据可能丢失了！");
      client.close();
      return;
    }

    // 2. 最近上传的视频
    console.log("\n最近上传的 5 个视频:");
    const recentResult = await client.execute(
      `SELECT id, creatorId, title, platform, status, datetime(submittedAt) as submittedAt
       FROM Video
       ORDER BY submittedAt DESC
       LIMIT 5`
    );

    recentResult.rows.forEach((v, i) => {
      console.log(`  ${i+1}. ${v.platform} | ${v.title || '(无标题)'} | CreatorID: ${v.creatorId} | Status: ${v.status} | ${v.submittedAt}`);
    });

    // 3. 按 creator 统计
    console.log("\n按 Creator 统计:");
    const creatorResult = await client.execute(
      `SELECT c.displayName, COUNT(v.id) as videoCount
       FROM Creator c
       LEFT JOIN Video v ON c.id = v.creatorId
       GROUP BY c.id
       HAVING COUNT(v.id) > 0
       ORDER BY COUNT(v.id) DESC
       LIMIT 10`
    );

    creatorResult.rows.forEach((row) => {
      console.log(`  ${row.displayName}: ${row.videoCount} 个视频`);
    });

  } catch (e) {
    console.error("❌ 错误:", e.message);
  } finally {
    client.close();
  }
})();
