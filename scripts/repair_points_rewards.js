// 修复脚本：对所有 POINTS 方案的 Creator 进行奖励数量修正
// 步骤：
// 1. 找出所有 POINTS 方案的 Creator
// 2. 对每个 Creator，找出他们领取的所有 Milestone
// 3. 计算应该的正确点数 = creditsAwarded / 100
// 4. 创建 REFUND 交易来撤销错误的奖励
// 5. 创建新的 MILESTONE_REWARD 交易记录正确的奖励
// 6. 更新 CreditWallet 余额

const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function repairPointsRewards() {
  console.log("🔧 开始修复 POINTS 方案奖励...\n");

  try {
    // 1. 找所有 POINTS 方案的 Creator
    const pointsCreators = await db.creator.findMany({
      where: { rewardScheme: "POINTS" },
      include: {
        claims: {
          include: {
            milestone: true,
            video: true,
          },
        },
        transactions: true,
        wallet: true,
      },
    });

    console.log(`📋 找到 ${pointsCreators.length} 个 POINTS 方案的 Creator\n`);

    let totalRefunded = 0;
    let totalCorrected = 0;
    const repairLog = [];

    for (const creator of pointsCreators) {
      // 2. 对每个 Creator 的每个 Milestone Claim
      for (const claim of creator.claims) {
        const milestone = claim.milestone;
        const wrongAmount = milestone.creditsAwarded; // 原始值（被错误用作点数）
        const correctAmount = Math.floor(milestone.creditsAwarded / 100); // 正确的点数

        // 只有在金额不同时才修复
        if (wrongAmount !== correctAmount) {
          console.log(
            `\n👤 Creator: ${creator.displayName} (ID: ${creator.id})`
          );
          console.log(`   Milestone: ${milestone.viewThreshold.toLocaleString()} views`);
          console.log(`   原始钻石数: ${wrongAmount}`);
          console.log(`   错误的点数: ${wrongAmount}`);
          console.log(`   正确的点数: ${correctAmount}`);

          // 3. 在数据库事务中进行修复
          const repaired = await db.$transaction(async (tx) => {
            // 创建 REFUND 交易（撤销错误的奖励）
            const refund = await tx.creditTransaction.create({
              data: {
                creatorId: creator.id,
                amount: -wrongAmount, // 负数表示扣除
                type: "REFUND",
                reason: `Refund incorrect POINTS reward: -${wrongAmount} (was incorrectly awarded for milestone)`,
                relatedVideoId: claim.videoId,
              },
            });

            // 创建正确的 MILESTONE_REWARD 交易
            const correct = await tx.creditTransaction.create({
              data: {
                creatorId: creator.id,
                amount: correctAmount, // 正确的点数
                type: "MILESTONE_REWARD",
                reason: `Corrected POINTS reward: +${correctAmount} (${wrongAmount} diamonds ÷ 100)`,
                relatedVideoId: claim.videoId,
              },
            });

            // 计算新的钱包余额
            const allTransactions = await tx.creditTransaction.findMany({
              where: { creatorId: creator.id },
            });

            const newBalance = allTransactions.reduce(
              (sum, tx) => sum + tx.amount,
              0
            );

            // 更新钱包余额
            const updatedWallet = await tx.creditWallet.update({
              where: { creatorId: creator.id },
              data: { balance: newBalance },
            });

            return { refund, correct, newBalance };
          });

          console.log(`   ✅ 修复完成`);
          console.log(
            `   新钱包余额: ${repaired.newBalance} 点数 (原来: ${creator.wallet?.balance || 0})`
          );

          totalRefunded += wrongAmount;
          totalCorrected += correctAmount;

          repairLog.push({
            creatorId: creator.id,
            creatorName: creator.displayName,
            milestone: milestone.viewThreshold,
            wrongAmount,
            correctAmount,
            newBalance: repaired.newBalance,
          });
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 修复统计");
    console.log("=".repeat(60));
    console.log(`✅ 受影响的 Creator 数: ${repairLog.length}`);
    console.log(`💰 撤销的错误点数总额: ${totalRefunded}`);
    console.log(`💎 授予的正确点数总额: ${totalCorrected}`);
    console.log(`💵 实际多给的点数: ${totalRefunded - totalCorrected}`);
    console.log("\n详细日志：");
    repairLog.forEach((log, i) => {
      console.log(
        `  ${i + 1}. ${log.creatorName}: -${log.wrongAmount} → +${log.correctAmount} (新余额: ${log.newBalance})`
      );
    });

    console.log("\n✅ 修复完成！所有 POINTS 方案的奖励已纠正。\n");

    return repairLog;
  } catch (error) {
    console.error("❌ 修复失败:", error.message);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// 运行修复
repairPointsRewards().catch((e) => {
  console.error(e);
  process.exit(1);
});
