// 分析生产数据中受影响的 POINTS 方案 Creator
const { createClient } = require("@libsql/client");

async function analyzeAffectedCreators() {
  console.log("🔍 分析生产数据中受影响的 POINTS 方案 Creator...\n");

  const client = createClient({
    url: "libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io",
    authToken:
      "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1MzUxMzIsImlkIjoiMDE5ZjdlOTUtMDgwMS03NzQ3LWIzZmEtMTdlOTRhNTYwM2E2Iiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6ImNmMjgzYzRjLWZkMzUtNDQ4MC1hMjEzLTVjNWEyMjk1YjUxNCJ9.nWro0Km6Xq2Bh-7ReaOOwLWZSlBfkzTtqDC3RhHoL_dGCU8ITM9-6l-l4D4ELEH-apxD0VGJJHn4g8hfQzsqAg",
  });

  try {
    // 1. 找所有 POINTS 方案的 Creator
    const pointsResult = await client.execute(
      `SELECT c.id, c.displayName, c.rewardScheme, cw.balance
       FROM Creator c
       LEFT JOIN CreditWallet cw ON c.id = cw.creatorId
       WHERE c.rewardScheme = 'POINTS'
       ORDER BY cw.balance DESC`
    );

    const pointsCreators = pointsResult.rows;
    console.log(`📊 POINTS 方案的 Creator 数: ${pointsCreators.length}\n`);

    if (pointsCreators.length === 0) {
      console.log("✅ 好消息：没有 POINTS 方案的 Creator，无需修复！");
      client.close();
      return;
    }

    // 2. 分析每个 Creator 的 Milestone Claims
    console.log("💰 受影响的 Creator 和他们的钱包余额：\n");

    let totalAffected = 0;
    let totalCurrentBalance = 0;
    let totalWrongAmount = 0;
    let totalCorrectAmount = 0;

    const affectedData = [];

    for (const creator of pointsCreators) {
      // 获取这个 Creator 的所有 Milestone Claims
      const claimsResult = await client.execute(
        `SELECT mc.id, mc.creditsAwarded, m.viewThreshold
         FROM MilestoneClaim mc
         JOIN Milestone m ON mc.milestoneId = m.id
         WHERE mc.creatorId = '${creator.id}'`
      );

      const claims = claimsResult.rows;

      if (claims.length > 0) {
        let creatorWrongSum = 0;
        let creatorCorrectSum = 0;

        claims.forEach((claim) => {
          const wrongAmount = claim.creditsAwarded; // 原始钻石数被错误用作点数
          const correctAmount = Math.floor(claim.creditsAwarded / 100); // 正确的点数
          creatorWrongSum += wrongAmount;
          creatorCorrectSum += correctAmount;
        });

        totalAffected++;
        totalCurrentBalance += creator.balance || 0;
        totalWrongAmount += creatorWrongSum;
        totalCorrectAmount += creatorCorrectSum;

        affectedData.push({
          id: creator.id,
          name: creator.displayName,
          currentBalance: creator.balance || 0,
          wrongTotal: creatorWrongSum,
          correctTotal: creatorCorrectSum,
          claimCount: claims.length,
          overchargedBy: creatorWrongSum - creatorCorrectSum,
        });

        const overcharged = creatorWrongSum - creatorCorrectSum;
        console.log(`👤 ${creator.displayName}`);
        console.log(`   ID: ${creator.id}`);
        console.log(`   当前钱包: ${creator.balance || 0} 点数`);
        console.log(`   声称的 Milestone: ${claims.length} 个`);
        console.log(`   错误金额: ${creatorWrongSum} 点数`);
        console.log(`   正确金额: ${creatorCorrectSum} 点数`);
        console.log(`   多给了: ${overcharged} 点数 ❌\n`);
      }
    }

    // 3. 总结
    console.log("=".repeat(60));
    console.log("📊 修复统计汇总");
    console.log("=".repeat(60));
    console.log(`✅ 受影响的 Creator 数: ${totalAffected}`);
    console.log(`💰 当前总钱包余额: ${totalCurrentBalance} 点数`);
    console.log(`❌ 错误给出的总金额: ${totalWrongAmount} 点数`);
    console.log(`✅ 应该给的总金额: ${totalCorrectAmount} 点数`);
    console.log(`📌 总共多给的金额: ${totalWrongAmount - totalCorrectAmount} 点数\n`);

    // 保存分析结果
    const analysisResult = {
      timestamp: new Date().toISOString(),
      affectedCreators: affectedData,
      summary: {
        totalAffected,
        currentTotalBalance: totalCurrentBalance,
        totalWrongAmount,
        totalCorrectAmount,
        totalOvercharged: totalWrongAmount - totalCorrectAmount,
      },
    };

    const fs = require("fs");
    fs.writeFileSync(
      "repair_analysis.json",
      JSON.stringify(analysisResult, null, 2)
    );

    console.log("✅ 详细分析已保存到: repair_analysis.json");
    console.log("\n⏳ 现在可以继续进行修复了。");
  } catch (error) {
    console.error("❌ 分析失败:", error.message);
    throw error;
  } finally {
    client.close();
  }
}

analyzeAffectedCreators().catch((e) => {
  console.error(e);
  process.exit(1);
});
