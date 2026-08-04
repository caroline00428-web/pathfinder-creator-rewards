const { createClient } = require("@libsql/client");

const client = createClient({
  url: "libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1MzUxMzIsImlkIjoiMDE5ZjdlOTUtMDgwMS03NzQ3LWIzZmEtMTdlOTRhNTYwM2E2Iiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6ImNmMjgzYzRjLWZkMzUtNDQ4MC1hMjEzLTVjNWEyMjk1YjUxNCJ9.nWro0Km6Xq2Bh-7ReaOOwLWZSlBfkzTtqDC3RhHoL_dGCU8ITM9-6l-l4D4ELEH-apxD0VGJJHn4g8hfQzsqAg",
});

(async () => {
  try {
    console.log("🔍 检查最近的 TikTok 视频...\n");
    
    const result = await client.execute(
      `SELECT 
        v.id,
        v.title,
        c.displayName,
        v.platform,
        v.viewCount,
        v.status,
        v.eligibilityStatus,
        cm.name as campaignName,
        datetime(v.submittedAt) as submittedAt
       FROM Video v
       LEFT JOIN Creator c ON v.creatorId = c.id
       LEFT JOIN Campaign cm ON v.campaignId = cm.id
       WHERE v.platform = 'TIKTOK'
       ORDER BY v.submittedAt DESC
       LIMIT 5`
    );

    result.rows.forEach((v, i) => {
      console.log(`${i+1}. ${v.title || '(无标题)'}`);
      console.log(`   创作者: ${v.displayName}`);
      console.log(`   浏览量: ${v.viewCount}`);
      console.log(`   状态: ${v.status}`);
      console.log(`   有效性: ${v.eligibilityStatus}`);
      console.log(`   Campaign: ${v.campaignName || '(无)'}`);
      console.log(`   提交时间: ${v.submittedAt}\n`);
    });
  } catch (e) {
    console.error("错误:", e.message);
  } finally {
    client.close();
  }
})();
