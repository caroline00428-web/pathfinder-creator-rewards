import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function createAccount() {
  const db = new PrismaClient();

  try {
    console.log("🧪 在本地 dev.db 创建测试账户...\n");

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
    console.log(`   密码: test123456\n`);

    // 创建创作者
    const creator = await db.creator.create({
      data: {
        userId: user.id,
        displayName: "测试Bug账户",
        creatorCode: "TESTBUG001",
        status: "ACTIVE",
        rewardScheme: "POINTS",
      },
    });
    console.log("✅ 创作者已创建");
    console.log(`   代码: TESTBUG001`);
    console.log(`   奖励方案: POINTS\n`);

    // 创建钱包
    await db.creditWallet.create({
      data: {
        creatorId: creator.id,
        balance: 0,
      },
    });
    console.log("✅ 钱包已创建 (初始余额: 0)\n");

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎯 现在可以用这个账户登录:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("访问: http://localhost:3000/login");
    console.log("用户名: testbug");
    console.log("密码: test123456");

    await db.$disconnect();
  } catch (err) {
    console.error("❌ 错误:", err.message);
    await db.$disconnect();
    process.exit(1);
  }
}

createAccount();
