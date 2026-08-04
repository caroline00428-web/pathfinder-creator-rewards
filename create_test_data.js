import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

async function createTestData() {
  const db = createClient({
    url: "libsql://turso-staging-caroline00428-web.aws-us-east-2.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU0OTE2ODgsImlkIjoiMDE5ZmI3OTgtZTQwMS03ZDA2LTg0NjgtZDQ0ZTA4NDRiN2FiIiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6IjFhNjYzMmNhLWE5ZDktNGJhMi1hMjIwLTVhMDFmNzM3N2MwYyJ9.s3Wj4EZbJrtKkTQdVzQIUHENtUsY6e62h9VbeusXxwUNkVxSdmVYpn7d2nC5G5qtM7rRJkbDOuJcJ-EZad77BQ",
  });

  try {
    console.log("🧪 创建测试数据...\n");

    // 创建测试账户
    const passwordHash = await bcrypt.hash("test123", 10);
    
    const userId = "test_user_001";
    const creatorId = "creator_001";
    
    // 创建用户
    await db.execute({
      sql: `INSERT INTO "User" (id, username, email, "passwordHash", role) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [userId, "testcreator", "test@example.com", passwordHash, "CREATOR"],
    });
    console.log("✅ 用户已创建:");
    console.log(`   用户名: testcreator`);
    console.log(`   密码: test123`);
    console.log(`   邮箱: test@example.com\n`);

    // 创建创作者
    await db.execute({
      sql: `INSERT INTO "Creator" (id, "userId", "displayName", "creatorCode", status)
            VALUES (?, ?, ?, ?, ?)`,
      args: [creatorId, userId, "测试创作者", "TEST001", "ACTIVE"],
    });
    console.log("✅ 创作者已创建:");
    console.log(`   代码: TEST001\n`);

    // 创建创作者钱包
    await db.execute({
      sql: `INSERT INTO "CreditWallet" (id, "creatorId", balance)
            VALUES (?, ?, ?)`,
      args: ["wallet_001", creatorId, 0],
    });
    console.log("✅ 钱包已创建 (初始余额: 0)\n");

    // 创建活动
    const campaignId = "campaign_001";
    await db.execute({
      sql: `INSERT INTO "Campaign" (id, name, platform, "startTime", "endTime", active)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        campaignId,
        "测试活动",
        "YOUTUBE",
        new Date("2024-01-01").toISOString(),
        new Date("2024-12-31").toISOString(),
        true,
      ],
    });
    console.log("✅ 活动已创建: 测试活动\n");

    // 创建里程碑 (GAME CREDIT 版本)
    const milestoneId1 = "milestone_001";
    await db.execute({
      sql: `INSERT INTO "Milestone" (id, "campaignId", platform, "viewThreshold", "creditsAwarded", active)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [milestoneId1, campaignId, "YOUTUBE", 10000, 300, true],
    });
    console.log("✅ 里程碑已创建 (GAME CREDIT):");
    console.log(`   观看数: 10,000`);
    console.log(`   奖励: 300 credits\n`);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎯 测试账户信息:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("用户名: testcreator");
    console.log("密码: test123");
    console.log("邮箱: test@example.com");
    console.log("\n现在可以在 http://localhost:3000 登录测试了！");

  } catch (err) {
    console.error("❌ 错误:", err.message);
  }
}

createTestData();
