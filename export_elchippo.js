import { createClient } from "@libsql/client";

async function exportElChippo() {
  const prodDb = createClient({
    url: "libsql://pathfiner-caroline00428-web.aws-us-east-2.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQzMDcyOTksImlkIjoiMDE5ZjcxMDAtNGQwMS03ODAzLTg1NzItN2IwMGMxMDBiYTExIiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6IjZkZmZkNGQ1LWI1ZmQtNGU2Ny1hOWU1LWVlMmVhNWI0NDM3NCJ9.1eD1FqwLh_URjiqSu18N6ZzqLdUWyf3Wt6RAFKNpyWDkSuMP46CzJYBvPrGuKM8ZM8Jkcy5i4y1H7uIJ36keCg",
  });

  try {
    console.log("📊 查询 ElChippo_84B0 的生产数据...\n");

    // 查询用户信息
    const userResult = await prodDb.execute({
      sql: `SELECT id, username, email, role FROM "User" WHERE username = ?`,
      args: ["ElChippo_84B0"],
    });

    if (userResult.rows.length === 0) {
      console.error("❌ 用户 ElChippo_84B0 不存在");
      return;
    }

    const user = userResult.rows[0];
    console.log("✅ 用户信息:");
    console.log(`   用户名: ${user.username}`);
    console.log(`   邮箱: ${user.email}`);
    console.log(`   角色: ${user.role}`);
    console.log(`   ID: ${user.id}\n`);

    // 查询创作者信息
    const creatorResult = await prodDb.execute({
      sql: `SELECT * FROM "Creator" WHERE "userId" = ?`,
      args: [user.id],
    });

    if (creatorResult.rows.length === 0) {
      console.error("❌ 创作者信息不存在");
      return;
    }

    const creator = creatorResult.rows[0];
    console.log("✅ 创作者信息:");
    console.log(`   创作者代码: ${creator.creatorCode}`);
    console.log(`   显示名称: ${creator.displayName}`);
    console.log(`   奖励方案: ${creator.rewardScheme || "未选择"}`);
    console.log(`   状态: ${creator.status}\n`);

    // 查询钱包信息
    const walletResult = await prodDb.execute({
      sql: `SELECT * FROM "CreditWallet" WHERE "creatorId" = ?`,
      args: [creator.id],
    });

    if (walletResult.rows.length > 0) {
      const wallet = walletResult.rows[0];
      console.log("✅ 钱包信息:");
      console.log(`   余额: ${wallet.balance}\n`);
    }

    // 查询交易记录
    const transResult = await prodDb.execute({
      sql: `SELECT * FROM "CreditTransaction" WHERE "creatorId" = ? ORDER BY "createdAt" DESC LIMIT 10`,
      args: [creator.id],
    });

    console.log("✅ 交易记录 (最近 10 条):");
    transResult.rows.forEach((trans, idx) => {
      console.log(`   ${idx + 1}. ${trans.type}: ${trans.amount} (${trans.reason || "无"})`);
    });
    console.log();

    // 查询订单
    const orderResult = await prodDb.execute({
      sql: `SELECT * FROM "RewardOrder" WHERE "creatorId" = ? ORDER BY "createdAt" DESC LIMIT 5`,
      args: [creator.id],
    });

    console.log("✅ 订单记录 (最近 5 条):");
    orderResult.rows.forEach((order, idx) => {
      console.log(`   ${idx + 1}. 订单ID: ${order.id.substring(0, 8)}... | 总额: ${order.totalCreditCost} | 状态: ${order.status}`);
    });
    console.log();

    // 查询里程碑领取
    const claimResult = await prodDb.execute({
      sql: `SELECT mc.*, m."viewThreshold", m."creditsAwarded" FROM "MilestoneClaim" mc 
            LEFT JOIN "Milestone" m ON mc."milestoneId" = m.id 
            WHERE mc."creatorId" = ? ORDER BY mc."claimedAt" DESC LIMIT 5`,
      args: [creator.id],
    });

    console.log("✅ 里程碑领取记录 (最近 5 条):");
    claimResult.rows.forEach((claim, idx) => {
      console.log(`   ${idx + 1}. ${claim.viewThreshold} 观看数 → ${claim.creditsAwarded} credits 已领取`);
    });
    console.log();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎯 BUG 检查:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`当前奖励方案: ${creator.rewardScheme}`);
    console.log(`钱包余额: ${walletResult.rows[0]?.balance || 0}`);
    
    if (creator.rewardScheme === "POINTS") {
      console.log("\n⚠️  这个账户选了 POINTS (GAME CREDIT)");
      console.log(`钱包应该显示: diamonds / 100`);
      console.log(`如果钱包显示的和里程碑奖励相同，就是有 BUG！`);
    }

  } catch (err) {
    console.error("❌ 错误:", err.message);
  }
}

exportElChippo();
