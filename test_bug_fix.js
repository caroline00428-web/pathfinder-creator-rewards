import { PrismaClient } from "@prisma/client";

async function testBugFix() {
  const db = new PrismaClient();

  try {
    console.log("🧪 开始测试 BUG 修复...\n");

    // 获取测试账户
    const user = await db.user.findFirst({
      where: { username: "testbug" },
      include: { creator: { include: { wallet: true } } },
    });

    if (!user || !user.creator) {
      console.error("❌ 找不到测试账户");
      process.exit(1);
    }

    console.log(`✅ 测试账户: ${user.username}\n`);

    const creatorId = user.creator.id;
    const campaignId = (await db.campaign.findFirst())?.id;

    if (!campaignId) {
      console.error("❌ 找不到测试活动");
      process.exit(1);
    }

    // 创建测试视频
    const video = await db.video.create({
      data: {
        creatorId,
        campaignId,
        platform: "YOUTUBE",
        url: `https://www.youtube.com/watch?v=test${Date.now()}`,
        title: "测试视频",
        uploadTime: new Date("2024-06-01"),
        viewCount: 200, // 超过阈值
        eligibilityStatus: "ELIGIBLE",
        status: "PENDING",
      },
    });

    console.log("✅ 测试视频已创建");
    console.log(`   观看数: ${video.viewCount}\n`);

    // 获取里程碑
    const milestone = await db.milestone.findFirst({
      where: { active: true },
    });

    if (!milestone) {
      console.error("❌ 找不到里程碑");
      process.exit(1);
    }

    console.log("✅ 里程碑信息:");
    console.log(`   阈值: ${milestone.viewThreshold} 观看数`);
    console.log(`   奖励: ${milestone.creditsAwarded} 钻石\n`);

    // 领取里程碑
    console.log("🎯 领取里程碑奖励...\n");

    const claim = await db.milestoneClaim.create({
      data: {
        creatorId,
        videoId: video.id,
        milestoneId: milestone.id,
        platform: video.platform,
        creditsAwarded: milestone.creditsAwarded,
      },
    });

    // 根据 rewardScheme 处理奖励
    const rewardScheme = user.creator.rewardScheme;
    console.log(`✅ 奖励方案: ${rewardScheme}\n`);

    let expectedAmount = 0;

    if (rewardScheme === "POINTS") {
      expectedAmount = Math.floor(milestone.creditsAwarded / 100);
      console.log(`📊 应该发放: ${expectedAmount} POINTS (${milestone.creditsAwarded} / 100)\n`);

      // 增加钱包余额
      await db.creditWallet.upsert({
        where: { creatorId },
        create: { creatorId, balance: expectedAmount },
        update: { balance: { increment: expectedAmount } },
      });

      await db.creditTransaction.create({
        data: {
          creatorId,
          amount: expectedAmount,
          type: "MILESTONE_REWARD",
          reason: `里程碑: ${milestone.viewThreshold} 观看数 → $${expectedAmount} points`,
          relatedVideoId: video.id,
        },
      });
    } else {
      expectedAmount = milestone.creditsAwarded;
      console.log(
        `📊 应该发放: ${expectedAmount} DIAMOND (创建待导出订单)\n`
      );

      // 创建订单
      await db.rewardOrder.create({
        data: {
          creatorId,
          playerId: user.creator.playerId || "PENDING",
          totalCreditCost: milestone.creditsAwarded,
          status: "PENDING",
          items: {
            create: {
              gameItemId: `DIAMOND_${milestone.viewThreshold}`,
              itemName: `💎 钻石奖励 (${milestone.viewThreshold} 观看数)`,
              quantity: milestone.creditsAwarded,
              creditCost: 0,
            },
          },
        },
      });
    }

    // 检查钱包
    const updatedWallet = await db.creditWallet.findUnique({
      where: { creatorId },
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎯 测试结果:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`期望钱包余额: ${expectedAmount}`);
    console.log(`实际钱包余额: ${updatedWallet?.balance ?? 0}`);
    console.log();

    if (updatedWallet?.balance === expectedAmount) {
      console.log("✅ ✅ ✅ BUG 修复正确！");
      console.log(`   POINTS 方案发放 ${expectedAmount} (正确)，而不是 ${milestone.creditsAwarded}`);
    } else {
      console.log(
        `❌ ❌ ❌ BUG 未修复！`
      );
      console.log(
        `   期望: ${expectedAmount}，实际: ${updatedWallet?.balance ?? 0}`
      );
    }

    await db.$disconnect();
  } catch (err) {
    console.error("❌ 错误:", err.message);
    console.error(err);
    await db.$disconnect();
    process.exit(1);
  }
}

testBugFix();
