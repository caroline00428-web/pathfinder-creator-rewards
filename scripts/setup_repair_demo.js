// 演示用修复脚本：在本地 dev.db 创建测试数据，模拟受影响的玩家状态
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function setupDemo() {
  console.log("🔧 设置演示数据...\n");

  // 1. 创建测试用户和 Creator（POINTS 方案）
  const user = await db.user.create({
    data: {
      email: "testcreator@example.com",
      username: "testcreator_points",
      passwordHash: "hash123",
      role: "CREATOR",
    },
  });

  const creator = await db.creator.create({
    data: {
      userId: user.id,
      displayName: "Test Creator (POINTS)",
      creatorCode: "TEST_POINTS_001",
      rewardScheme: "POINTS", // 关键：领取的是点数方案
    },
  });

  // 2. 创建 Campaign 和 Milestone
  const campaign = await db.campaign.create({
    data: {
      name: "Test Campaign",
      platform: "YOUTUBE",
      startTime: new Date("2026-01-01"),
      endTime: new Date("2026-12-31"),
    },
  });

  const milestone = await db.milestone.create({
    data: {
      campaignId: campaign.id,
      platform: "YOUTUBE",
      viewThreshold: 1000,
      creditsAwarded: 300, // 300 钻石 → 应该是 $3 点数
    },
  });

  // 3. 创建 Video
  const video = await db.video.create({
    data: {
      creatorId: creator.id,
      campaignId: campaign.id,
      platform: "YOUTUBE",
      url: "https://youtube.com/watch?v=test",
      title: "Test Video",
      uploadTime: new Date(),
      viewCount: 1500,
      status: "APPROVED",
      eligibilityStatus: "ELIGIBLE",
    },
  });

  // 4. 创建 MilestoneClaim（记录声称的事实）
  const claim = await db.milestoneClaim.create({
    data: {
      creatorId: creator.id,
      videoId: video.id,
      milestoneId: milestone.id,
      platform: "YOUTUBE",
      creditsAwarded: 300, // 原始钻石数量
    },
  });

  // 5. 创建 CreditWallet（初始化钱包）
  const wallet = await db.creditWallet.create({
    data: {
      creatorId: creator.id,
      balance: 0,
    },
  });

  // 6. 模拟 BUG：错误的交易记录（300 点数而不是 3 点数）
  const wrongTransaction = await db.creditTransaction.create({
    data: {
      creatorId: creator.id,
      amount: 300, // 错误：应该是 3
      type: "MILESTONE_REWARD",
      reason: "Milestone: 1,000 views → $300 points (错误)",
      relatedVideoId: video.id,
    },
  });

  // 7. 更新 CreditWallet 余额为错误的金额
  await db.creditWallet.update({
    where: { creatorId: creator.id },
    data: { balance: 300 }, // 错误：应该是 3
  });

  console.log("✅ 演示数据已创建！\n");
  console.log("📊 当前状态（错误的）：");
  console.log(`   Creator: ${creator.displayName}`);
  console.log(`   Reward Scheme: ${creator.rewardScheme}`);
  console.log(`   Milestone Credits: ${milestone.creditsAwarded} 钻石`);
  console.log(`   Current Wallet Balance: 300 点数 ❌ (应该是 3)`);
  console.log(`   Wrong Transaction: +300 点数\n`);

  console.log("🎯 演示数据准备完成，现在可以运行修复脚本了。\n");

  await db.$disconnect();
}

setupDemo().catch((e) => {
  console.error(e);
  process.exit(1);
});
