const { createClient } = require("@libsql/client");

const client = createClient({
  url: "libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1MzUxMzIsImlkIjoiMDE5ZjdlOTUtMDgwMS03NzQ3LWIzZmEtMTdlOTRhNTYwM2E2Iiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6ImNmMjgzYzRjLWZkMzUtNDQ4MC1hMjEzLTVjNWEyMjk1YjUxNCJ9.nWro0Km6Xq2Bh-7ReaOOwLWZSlBfkzTtqDC3RhHoL_dGCU8ITM9-6l-l4D4ELEH-apxD0VGJJHn4g8hfQzsqAg",
});

(async () => {
  try {
    console.log("🎯 检查 Campaign Milestone...\n");
    
    // 获取 campaign ID
    const campaignResult = await client.execute(
      `SELECT id, name FROM Campaign WHERE name LIKE '%GalaxyDefener%' LIMIT 1`
    );
    
    if (campaignResult.rows.length === 0) {
      console.log("❌ 找不到 Campaign");
      client.close();
      return;
    }
    
    const campaign = campaignResult.rows[0];
    console.log(`Campaign: ${campaign.name}\n`);
    
    // 查询 milestone
    const milestoneResult = await client.execute(
      `SELECT 
        id,
        platform,
        viewThreshold,
        creditsAwarded,
        active
       FROM Milestone
       WHERE campaignId = '${campaign.id}'
       ORDER BY viewThreshold ASC`
    );
    
    console.log(`✅ 找到 ${milestoneResult.rows.length} 个里程碑：`);
    milestoneResult.rows.forEach(m => {
      console.log(`   ${m.platform}: ${m.viewThreshold.toLocaleString()} 浏览 → ${m.creditsAwarded} 奖励 (${m.active ? '✅' : '❌ 已停用'})`);
    });
    
    // 查询这个 creator 的视频总浏览量
    console.log(`\n📊 edison3612 在此 Campaign 的视频：`);
    const videosResult = await client.execute(
      `SELECT 
        COUNT(*) as videoCount,
        SUM(CASE WHEN eligibilityStatus = 'ELIGIBLE' THEN 1 ELSE 0 END) as eligibleCount,
        SUM(viewCount) as totalViews
       FROM Video
       WHERE creatorId IN (SELECT id FROM Creator WHERE displayName = 'edison3612')
       AND campaignId = '${campaign.id}'`
    );
    
    const stats = videosResult.rows[0];
    console.log(`   总视频: ${stats.videoCount}`);
    console.log(`   合格视频: ${stats.eligibleCount}`);
    console.log(`   总浏览量: ${stats.totalViews || 0}`);
    
  } catch (e) {
    console.error("错误:", e.message);
  } finally {
    client.close();
  }
})();
