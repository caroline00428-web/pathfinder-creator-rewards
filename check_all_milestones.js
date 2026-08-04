const { createClient } = require("@libsql/client");

const client = createClient({
  url: "libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1MzUxMzIsImlkIjoiMDE5ZjdlOTUtMDgwMS03NzQ3LWIzZmEtMTdlOTRhNTYwM2E2Iiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6ImNmMjgzYzRjLWZkMzUtNDQ4MC1hMjEzLTVjNWEyMjk1YjUxNCJ9.nWro0Km6Xq2Bh-7ReaOOwLWZSlBfkzTtqDC3RhHoL_dGCU8ITM9-6l-l4D4ELEH-apxD0VGJJHn4g8hfQzsqAg",
});

(async () => {
  try {
    console.log("🎯 检查所有 Milestone（包括全局）...\n");
    
    // 查询所有 milestone
    const milestoneResult = await client.execute(
      `SELECT 
        id,
        campaignId,
        platform,
        viewThreshold,
        creditsAwarded,
        active
       FROM Milestone
       ORDER BY platform ASC, viewThreshold ASC`
    );
    
    console.log(`✅ 找到 ${milestoneResult.rows.length} 个 Milestone：\n`);
    
    let currentPlatform = null;
    milestoneResult.rows.forEach(m => {
      if (m.platform !== currentPlatform) {
        currentPlatform = m.platform;
        console.log(`\n${currentPlatform}:`);
      }
      const campaignType = m.campaignId ? `(Campaign: ${m.campaignId})` : '(全局)';
      console.log(`   ${m.viewThreshold.toLocaleString()} 浏览 → ${m.creditsAwarded} 钻石 ${campaignType} ${m.active ? '✅' : '❌'}`);
    });
    
    // 现在查询 edison3612 的 claimable milestone
    console.log(`\n\n🎯 检查 edison3612 的可声称 Milestone...\n`);
    
    const creatorResult = await client.execute(
      `SELECT id FROM Creator WHERE displayName = 'edison3612'`
    );
    
    if (creatorResult.rows.length === 0) {
      console.log("❌ 找不到 Creator");
      client.close();
      return;
    }
    
    const creatorId = creatorResult.rows[0].id;
    
    // 获取这个 creator 的第一个视频（APPROVED）
    const videoResult = await client.execute(
      `SELECT id, campaignId, platform FROM Video 
       WHERE creatorId = '${creatorId}' AND status = 'APPROVED'
       LIMIT 1`
    );
    
    if (videoResult.rows.length === 0) {
      console.log("❌ 找不到 APPROVED 视频");
      client.close();
      return;
    }
    
    const video = videoResult.rows[0];
    console.log(`视频: ${video.id} (Campaign: ${video.campaignId}, Platform: ${video.platform})`);
    
    // 查询这个 creator 在这个 campaign+platform 的总浏览量
    const viewsResult = await client.execute(
      `SELECT SUM(viewCount) as totalViews FROM Video
       WHERE creatorId = '${creatorId}' 
       AND campaignId = '${video.campaignId}'
       AND platform = '${video.platform}'
       AND eligibilityStatus = 'ELIGIBLE'`
    );
    
    const totalViews = viewsResult.rows[0]?.totalViews || 0;
    console.log(`总浏览量: ${totalViews}`);
    
    // 查询可以声称的 milestone
    const claimableResult = await client.execute(
      `SELECT m.id, m.viewThreshold, m.creditsAwarded
       FROM Milestone m
       WHERE m.platform = '${video.platform}'
       AND (m.campaignId IS NULL OR m.campaignId = '${video.campaignId}')
       AND m.active = 1
       AND m.viewThreshold <= ${totalViews}
       AND m.id NOT IN (
         SELECT milestoneId FROM MilestoneClaim WHERE creatorId = '${creatorId}'
       )
       ORDER BY m.viewThreshold DESC`
    );
    
    console.log(`\n✅ 可声称的 Milestone (${claimableResult.rows.length} 个):`);
    claimableResult.rows.forEach(m => {
      console.log(`   ${m.viewThreshold.toLocaleString()} 浏览 → ${m.creditsAwarded} 钻石`);
    });
    
  } catch (e) {
    console.error("错误:", e.message);
  } finally {
    client.close();
  }
})();
