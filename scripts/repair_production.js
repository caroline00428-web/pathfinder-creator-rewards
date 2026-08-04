// 生产环境修复脚本：修正所有 POINTS 方案玩家的奖励金额
//
// 使用方法：
//   DATABASE_URL=libsql://pathfinder-test-... \
//   AUTH_TOKEN=eyJ... \
//   node repair_production.js
//
// 这个脚本会：
// 1. 找出所有 POINTS 方案的 Creator
// 2. 对每个 Creator 的每个 Milestone Claim 生成修复交易
// 3. 生成两条交易：REFUND（撤销错误）+ MILESTONE_REWARD（授予正确）
// 4. 更新钱包余额
// 5. 保存详细日志

const { createClient } = require("@libsql/client");
const fs = require("fs");

// 从环境变量读取凭证
const DB_URL = process.env.DATABASE_URL;
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!DB_URL || !AUTH_TOKEN) {
  console.error("❌ 错误：需要设置环境变量");
  console.error("   DATABASE_URL=libsql://... AUTH_TOKEN=eyJ... node repair_production.js");
  process.exit(1);
}

const client = createClient({
  url: DB_URL,
  authToken: AUTH_TOKEN,
});

async function repairPointsRewards() {
  console.log("🔧 开始修复生产环境中的 POINTS 方案奖励...\n");
  console.log(`📍 数据库: ${DB_URL}\n`);

  try {
    // 1. 找所有 POINTS 方案的 Creator
    const creatorsResult = await client.execute(
      `SELECT c.id, c.displayName, c.rewardScheme, cw.balance
       FROM Creator c
       LEFT JOIN CreditWallet cw ON c.id = cw.creatorId
       WHERE c.rewardScheme = 'POINTS'
       ORDER BY c.id`
    );

    const pointsCreators = creatorsResult.rows;
    console.log(`📋 找到 ${pointsCreators.length} 个 POINTS 方案的 Creator\n`);

    if (pointsCreators.length === 0) {
      console.log("✅ 没有需要修复的 Creator。");
      client.close();
      return { status: "success", affectedCount: 0 };
    }

    const repairs = [];
    let totalRefunded = 0;
    let totalCorrected = 0;

    // 2. 对每个 Creator 进行修复
    for (const creator of pointsCreators) {
      console.log(`\n👤 处理 Creator: ${creator.displayName} (ID: ${creator.id})`);

      // 获取这个 Creator 的所有 Milestone Claims
      const claimsResult = await client.execute(
        `SELECT mc.id, mc.creditsAwarded, mc.videoId, m.viewThreshold
         FROM MilestoneClaim mc
         JOIN Milestone m ON mc.milestoneId = m.id
         WHERE mc.creatorId = '${creator.id}'`
      );

      const claims = claimsResult.rows;
      console.log(`   领取的 Milestone: ${claims.length} 个`);

      let creatorWrongSum = 0;
      let creatorCorrectSum = 0;

      // 3. 为每个 Claim 创建修复交易
      for (const claim of claims) {
        const wrongAmount = claim.creditsAwarded; // 原始钻石数被错误用作点数
        const correctAmount = Math.floor(claim.creditsAwarded / 100); // 正确的点数

        if (wrongAmount !== correctAmount) {
          creatorWrongSum += wrongAmount;
          creatorCorrectSum += correctAmount;

          console.log(`   • Milestone ${claim.viewThreshold} views: ${wrongAmount} → ${correctAmount} 点数`);

          // 创建 REFUND 交易（撤销错误的奖励）
          await client.execute(
            `INSERT INTO CreditTransaction (id, creatorId, amount, type, reason, relatedVideoId, createdAt)
             VALUES ('${generateId()}', '${creator.id}', ${-wrongAmount}, 'REFUND',
                     'Refund incorrect POINTS reward: -${wrongAmount} (was incorrectly awarded for ${claim.viewThreshold} view milestone)',
                     '${claim.videoId}', '${new Date().toISOString()}')`
          );

          // 创建正确的 MILESTONE_REWARD 交易
          await client.execute(
            `INSERT INTO CreditTransaction (id, creatorId, amount, type, reason, relatedVideoId, createdAt)
             VALUES ('${generateId()}', '${creator.id}', ${correctAmount}, 'MILESTONE_REWARD',
                     'Corrected POINTS reward: +${correctAmount} (${wrongAmount} diamonds ÷ 100 = ${correctAmount} USD)',
                     '${claim.videoId}', '${new Date().toISOString()}')`
          );
        }
      }

      // 4. 更新钱包余额
      if (creatorWrongSum !== creatorCorrectSum) {
        const newBalance = creator.balance - (creatorWrongSum - creatorCorrectSum);

        await client.execute(
          `UPDATE CreditWallet SET balance = ${newBalance} WHERE creatorId = '${creator.id}'`
        );

        console.log(
          `   ✅ 修复完成: -${creatorWrongSum - creatorCorrectSum} 点数 (${creator.balance} → ${newBalance})`
        );

        repairs.push({
          creatorId: creator.id,
          displayName: creator.displayName,
          previousBalance: creator.balance,
          newBalance,
          wrongTotal: creatorWrongSum,
          correctTotal: creatorCorrectSum,
          overchargedBy: creatorWrongSum - creatorCorrectSum,
          claimCount: claims.length,
        });

        totalRefunded += creatorWrongSum;
        totalCorrected += creatorCorrectSum;
      }
    }

    // 5. 保存修复日志
    const logData = {
      timestamp: new Date().toISOString(),
      database: DB_URL,
      affectedCreators: repairs.length,
      repairs,
      summary: {
        totalAffected: repairs.length,
        totalRefunded,
        totalCorrected,
        totalOvercharged: totalRefunded - totalCorrected,
      },
    };

    const logFile = `repair_log_${new Date().toISOString().slice(0, 10)}.json`;
    fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));

    // 6. 输出总结
    console.log("\n" + "=".repeat(60));
    console.log("✅ 修复完成！");
    console.log("=".repeat(60));
    console.log(`📊 受影响的 Creator 数: ${repairs.length}`);
    console.log(`💰 撤销的总金额: ${totalRefunded} 点数`);
    console.log(`💎 授予的正确金额: ${totalCorrected} 点数`);
    console.log(`💵 修复的多给金额: ${totalRefunded - totalCorrected} 点数\n`);

    console.log("📋 修复详情:");
    repairs.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.displayName}`);
      console.log(`     钱包: ${r.previousBalance} → ${r.newBalance} 点数`);
      console.log(`     修复: -${r.overchargedBy} 点数 ✅`);
    });

    console.log(`\n📄 详细日志已保存到: ${logFile}\n`);

    return { status: "success", affectedCount: repairs.length, repairs };
  } catch (error) {
    console.error("❌ 修复失败:", error.message);
    throw error;
  } finally {
    client.close();
  }
}

// 生成唯一 ID（简化版）
function generateId() {
  return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 运行修复
repairPointsRewards().catch((e) => {
  console.error(e);
  process.exit(1);
});
