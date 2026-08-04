import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function createTestUser() {
  const { PrismaLibSQL } = await import("@prisma/adapter-libsql");
  const adapter = new PrismaLibSQL({
    url: "libsql://turso-staging-caroline00428-web.aws-us-east-2.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU0OTE2ODgsImlkIjoiMDE5ZmI3OTgtZTQwMS03ZDA2LTg0NjgtZDQ0ZTA4NDRiN2FiIiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6IjFhNjYzMmNhLWE5ZDktNGJhMi1hMjIwLTVhMDFmNzM3N2MwYyJ9.s3Wj4EZbJrtKkTQdVzQIUHENtUsY6e62h9VbeusXxwUNkVxSdmVYpn7d2nC5G5qtM7rRJkbDOuJcJ-EZad77BQ",
  });
  const db = new PrismaClient({ adapter });

  try {
    console.log("🧪 在本地 Staging 创建测试账户...\n");

    // 先检查表是否存在
    try {
      const count = await db.user.count();
      console.log(`✅ 数据库连接正常，已有 ${count} 个用户\n`);
    } catch (e) {
      console.error("❌ 无法连接数据库:", e.message);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash("test123456", 10);
    
    // 删除同名用户（如果存在）
    await db.user.deleteMany({
      where: { username: "testbug" },
    }).catch(() => {});

    // 创建用户
    const user = await db.user.create({
      data: {
        username: "testbug",
        email: "testbug@example.com",
        passwordHash,
        role: "CREATOR",
      },
    });
    console.log("✅ 用户已创建");
    console.log(`   用户名: testbug`);
    console.log(`   密码: test123456`);
    console.log(`   邮箱: testbug@example.com\n`);

    // 创建创作者
    const creator = await db.creator.create({
      data: {
        userId: user.id,
        displayName: "测试BUG账户",
        creatorCode: "TESTBUG001",
        status: "ACTIVE",
        rewardScheme: "POINTS", // 选择 POINTS (GAME CREDIT)
      },
    });
    console.log("✅ 创作者已创建");
    console.log(`   代码: TESTBUG001`);
    console.log(`   奖励方案: POINTS (GAME CREDIT)\n`);

    // 创建钱包
    const wallet = await db.creditWallet.create({
      data: {
        creatorId: creator.id,
        balance: 0,
      },
    });
    console.log("✅ 钱包已创建 (初始余额: 0)\n");

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎯 现在可以用这个账户登录测试 BUG:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("访问: http://localhost:3000");
    console.log("用户名: testbug");
    console.log("密码: test123456");
    console.log("\n创作者代码: TESTBUG001");
    console.log("奖励方案: POINTS (应该发 GAME CREDIT，不是钻石)");

    await db.$disconnect();
  } catch (err) {
    console.error("❌ 错误:", err.message);
    await db.$disconnect();
    process.exit(1);
  }
}

createTestUser();
