import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function createTestData() {
  const { PrismaLibSQL } = await import("@prisma/adapter-libsql");
  const adapter = new PrismaLibSQL({
    url: "libsql://turso-staging-caroline00428-web.aws-us-east-2.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU0OTE2ODgsImlkIjoiMDE5ZmI3OTgtZTQwMS03ZDA2LTg0NjgtZDQ0ZTA4NDRiN2FiIiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6IjFhNjYzMmNhLWE5ZDktNGJhMi1hMjIwLTVhMDFmNzM3N2MwYyJ9.s3Wj4EZbJrtKkTQdVzQIUHENtUsY6e62h9VbeusXxwUNkVxSdmVYpn7d2nC5G5qtM7rRJkbDOuJcJ-EZad77BQ",
  });
  const db = new PrismaClient({ adapter });

  try {
    console.log("🧪 创建测试数据...\n");

    const passwordHash = await bcrypt.hash("test123", 10);
    
    // 创建用户
    const user = await db.user.create({
      data: {
        username: "testcreator",
        email: "test@example.com",
        passwordHash,
        role: "CREATOR",
      },
    });
    console.log("✅ 用户已创建:");
    console.log(`   用户名: testcreator`);
    console.log(`   密码: test123\n`);

    // 创建创作者
    const creator = await db.creator.create({
      data: {
        userId: user.id,
        displayName: "测试创作者",
        creatorCode: "TEST001",
        status: "ACTIVE",
      },
    });
    console.log("✅ 创作者已创建:");
    console.log(`   代码: TEST001\n`);

    // 创建钱包
    await db.creditWallet.create({
      data: {
        creatorId: creator.id,
        balance: 0,
      },
    });
    console.log("✅ 钱包已创建 (初始余额: 0)\n");

    // 创建活动
    const campaign = await db.campaign.create({
      data: {
        name: "测试活动",
        platform: "YOUTUBE",
        startTime: new Date("2024-01-01"),
        endTime: new Date("2024-12-31"),
        active: true,
      },
    });
    console.log("✅ 活动已创建: 测试活动\n");

    // 创建里程碑
    await db.milestone.create({
      data: {
        campaignId: campaign.id,
        platform: "YOUTUBE",
        viewThreshold: 10000,
        creditsAwarded: 300,
        active: true,
      },
    });
    console.log("✅ 里程碑已创建:");
    console.log(`   观看数: 10,000`);
    console.log(`   奖励: 300 credits\n`);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎯 测试账户信息:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("用户名: testcreator");
    console.log("密码: test123");
    console.log("\n现在可以在 http://localhost:3000 登录测试了！");

    await db.$disconnect();
  } catch (err) {
    console.error("❌ 错误:", err.message);
    await db.$disconnect();
  }
}

createTestData();
