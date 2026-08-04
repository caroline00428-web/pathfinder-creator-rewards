const { createClient } = require("@libsql/client");
const crypto = require("crypto");

const client = createClient({
  url: "libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1MzUxMzIsImlkIjoiMDE5ZjdlOTUtMDgwMS03NzQ3LWIzZmEtMTdlOTRhNTYwM2E2Iiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6ImNmMjgzYzRjLWZkMzUtNDQ4MC1hMjEzLTVjNWEyMjk1YjUxNCJ9.nWro0Km6Xq2Bh-7ReaOOwLWZSlBfkzTtqDC3RhHoL_dGCU8ITM9-6l-l4D4ELEH-apxD0VGJJHn4g8hfQzsqAg",
});

async function copyMilestones() {
  console.log("🔄 复制 Milestone 到活跃 Campaign...\n");

  try {
    // 源 Campaign（已停用）
    const oldCampaignId = "camp_001";
    
    // 目标 Campaign（活跃）
    const newCampaignId = "cmrx7bo650000l10400rxh41d";
    
    console.log("源: Pathfinder Program - Season 1 (已停用)");
    console.log("目标: GalaxyDefener Pathfinder Season1 (活跃)\n");
    
    // 查询源 Campaign 的所有 Milestone
    const sourceMilestones = await client.execute(
      `SELECT platform, viewThreshold, creditsAwarded, active
       FROM Milestone
       WHERE campaignId = '${oldCampaignId}'
       ORDER BY platform, viewThreshold`
    );
    
    console.log(`✅ 找到 ${sourceMilestones.rows.length} 个 Milestone 要复制\n`);
    
    // 复制每个 Milestone
    let copied = 0;
    for (const milestone of sourceMilestones.rows) {
      const id = crypto.randomUUID();
      
      await client.execute(
        `INSERT INTO Milestone (id, campaignId, platform, viewThreshold, creditsAwarded, active, createdAt)
         VALUES ('${id}', '${newCampaignId}', '${milestone.platform}', ${milestone.viewThreshold}, ${milestone.creditsAwarded}, ${milestone.active ? 1 : 0}, datetime('now'))`
      );
      
      console.log(`✅ ${milestone.platform} ${milestone.viewThreshold.toLocaleString()} 浏览 → ${milestone.creditsAwarded} 钻石`);
      copied++;
    }
    
    console.log(`\n✅ 完成！已复制 ${copied} 个 Milestone`);
    console.log("\n🎯 现在 edison3612 应该可以声称 Milestone 了！");
    
  } catch (error) {
    console.error("❌ 复制失败:", error.message);
  } finally {
    client.close();
  }
}

copyMilestones();
