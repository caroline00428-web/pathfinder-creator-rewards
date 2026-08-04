import { PrismaClient } from "@prisma/client";

async function createTestData() {
  const db = new PrismaClient();

  try {
    console.log("🧪 创建测试数据...\n");

    // 创建活动
    const campaign = await db.campaign.create({
      data: {
        name: "测试活动",
        platform: "YOUTUBE",
        startTime: new Date("2024-01-01"),
        endTime: new Date("2024-12-31"),
        active: true,
        description: "用于测试修复的活动",
      },
    });
    console.log("✅ 活动已创建");
    console.log(`   名称: ${campaign.name}`);
    console.log(`   ID: ${campaign.id}\n`);

    // 创建里程碑
    const milestone = await db.milestone.create({
      data: {
        campaignId: campaign.id,
        platform: "YOUTUBE",
        viewThreshold: 100, // 低阈值便于测试
        creditsAwarded: 300, // 300 钻石
        active: true,
      },
    });
    console.log("✅ 里程碑已创建");
    console.log(`   观看数: ${milestone.viewThreshold}`);
    console.log(`   奖励: ${milestone.creditsAwarded} 钻石\n`);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎯 测试数据已准备好!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("现在可以:");
    console.log("1. 在创作者面板上传视频");
    console.log("2. 提交视频到: " + campaign.name);
    console.log("3. 手动更新观看数为 100+");
    console.log("4. 领取里程碑奖励");
    console.log("5. 检查钱包是否显示 3 (而不是 300)");

    await db.$disconnect();
  } catch (err) {
    console.error("❌ 错误:", err.message);
    await db.$disconnect();
    process.exit(1);
  }
}

createTestData();
