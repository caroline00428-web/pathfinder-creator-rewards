import { createClient } from "@libsql/client";

async function exportData() {
  // 生产数据库
  const prodDb = createClient({
    url: "libsql://pathfiner-caroline00428-web.aws-us-east-2.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQzMDcyOTksImlkIjoiMDE5ZjcxMDAtNGQwMS03ODAzLTg1NzItN2IwMGMxMDBiYTExIiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6IjZkZmZkNGQ1LWI1ZmQtNGU2Ny1hOWU1LWVlMmVhNWI0NDM3NCJ9.1eD1FqwLh_URjiqSu18N6ZzqLdUWyf3Wt6RAFKNpyWDkSuMP46CzJYBvPrGuKM8ZM8Jkcy5i4y1H7uIJ36keCg",
  });

  // Staging 数据库
  const stagingDb = createClient({
    url: "libsql://turso-staging-caroline00428-web.aws-us-east-2.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU0OTE2ODgsImlkIjoiMDE5ZmI3OTgtZTQwMS03ZDA2LTg0NjgtZDQ0ZTA4NDRiN2FiIiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6IjFhNjYzMmNhLWE5ZDktNGJhMi1hMjIwLTVhMDFmNzM3N2MwYyJ9.s3Wj4EZbJrtKkTQdVzQIUHENtUsY6e62h9VbeusXxwUNkVxSdmVYpn7d2nC5G5qtM7rRJkbDOuJcJ-EZad77BQ",
  });

  try {
    console.log("📥 从生产环境导出数据...\n");

    // 获取生产环境的 User 表
    const prodUsers = await prodDb.execute("SELECT * FROM \"User\"");
    console.log(`✅ 获取用户: ${prodUsers.rows.length} 条`);

    // 获取生产环境的 Creator 表
    const prodCreators = await prodDb.execute("SELECT * FROM \"Creator\"");
    console.log(`✅ 获取创作者: ${prodCreators.rows.length} 条`);

    // 获取生产环境的 Campaign 表
    const prodCampaigns = await prodDb.execute("SELECT * FROM \"Campaign\"");
    console.log(`✅ 获取活动: ${prodCampaigns.rows.length} 条`);

    // 获取生产环境的 Milestone 表
    const prodMilestones = await prodDb.execute("SELECT * FROM \"Milestone\"");
    console.log(`✅ 获取里程碑: ${prodMilestones.rows.length} 条\n`);

    // 导入到 Staging
    console.log("📤 导入到 Staging 环境...\n");

    // 清空 staging 的相关表（谨慎操作）
    try {
      await stagingDb.execute("DELETE FROM \"MilestoneClaim\"");
      await stagingDb.execute("DELETE FROM \"Video\"");
      await stagingDb.execute("DELETE FROM \"Milestone\"");
      await stagingDb.execute("DELETE FROM \"Campaign\"");
      await stagingDb.execute("DELETE FROM \"Creator\"");
      await stagingDb.execute("DELETE FROM \"User\"");
      console.log("🗑️  已清空 Staging 表\n");
    } catch (e) {
      console.log("⚠️  清空表时出错（可能是外键约束）\n");
    }

    // 复制用户
    for (const user of prodUsers.rows) {
      try {
        await stagingDb.execute({
          sql: `INSERT INTO "User" (id, email, username, "passwordHash", role, "createdAt") 
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [user.id, user.email, user.username, user.passwordHash, user.role, user.createdAt],
        });
      } catch (e) {
        console.log(`⚠️  用户 ${user.username} 导入失败`);
      }
    }
    console.log(`✅ 已导入 ${prodUsers.rows.length} 个用户\n`);

    // 复制创作者
    for (const creator of prodCreators.rows) {
      try {
        await stagingDb.execute({
          sql: `INSERT INTO "Creator" (id, "userId", "displayName", "creatorCode", status, "rewardScheme", "createdAt", "playerId", "playerIdLocked", "discordId", "youtubeChannelId")
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            creator.id,
            creator.userId,
            creator.displayName,
            creator.creatorCode,
            creator.status,
            creator.rewardScheme,
            creator.createdAt,
            creator.playerId,
            creator.playerIdLocked,
            creator.discordId,
            creator.youtubeChannelId,
          ],
        });
      } catch (e) {
        console.log(`⚠️  创作者 ${creator.creatorCode} 导入失败`);
      }
    }
    console.log(`✅ 已导入 ${prodCreators.rows.length} 个创作者\n`);

    // 复制活动
    for (const campaign of prodCampaigns.rows) {
      try {
        await stagingDb.execute({
          sql: `INSERT INTO "Campaign" (id, name, platform, "startTime", "endTime", active, description, "createdAt")
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            campaign.id,
            campaign.name,
            campaign.platform,
            campaign.startTime,
            campaign.endTime,
            campaign.active,
            campaign.description,
            campaign.createdAt,
          ],
        });
      } catch (e) {
        console.log(`⚠️  活动 ${campaign.name} 导入失败`);
      }
    }
    console.log(`✅ 已导入 ${prodCampaigns.rows.length} 个活动\n`);

    // 复制里程碑
    for (const milestone of prodMilestones.rows) {
      try {
        await stagingDb.execute({
          sql: `INSERT INTO "Milestone" (id, "campaignId", platform, "viewThreshold", "creditsAwarded", active, "createdAt")
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            milestone.id,
            milestone.campaignId,
            milestone.platform,
            milestone.viewThreshold,
            milestone.creditsAwarded,
            milestone.active,
            milestone.createdAt,
          ],
        });
      } catch (e) {
        console.log(`⚠️  里程碑导入失败`);
      }
    }
    console.log(`✅ 已导入 ${prodMilestones.rows.length} 个里程碑\n`);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 数据导入完成！");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n现在可以用生产账户登录本地 staging 环境测试了！");

  } catch (err) {
    console.error("❌ 错误:", err.message);
  }
}

exportData();
