// 备份 pathfinder-test（真正的生产数据库）
const { createClient } = require("@libsql/client");
const fs = require("fs");

async function backupProduction() {
  console.log("🔄 连接到生产数据库（pathfinder-test）...\n");

  const client = createClient({
    url: "libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io",
    authToken:
      "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1MzUxMzIsImlkIjoiMDE5ZjdlOTUtMDgwMS03NzQ3LWIzZmEtMTdlOTRhNTYwM2E2Iiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6ImNmMjgzYzRjLWZkMzUtNDQ4MC1hMjEzLTVjNWEyMjk1YjUxNCJ9.nWro0Km6Xq2Bh-7ReaOOwLWZSlBfkzTtqDC3RhHoL_dGCU8ITM9-6l-l4D4ELEH-apxD0VGJJHn4g8hfQzsqAg",
  });

  try {
    console.log("📊 查询所有表...\n");

    const backup = {};
    const tables = [
      "User",
      "Creator",
      "Campaign",
      "Milestone",
      "Video",
      "MilestoneClaim",
      "CreditWallet",
      "CreditTransaction",
      "RewardOrder",
      "RewardOrderItem",
      "SpecialReward",
      "SpecialRewardApplication",
      "Announcement",
      "CreatorAccount",
    ];

    for (const table of tables) {
      try {
        const result = await client.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const count = result.rows[0]?.count || 0;

        if (count > 0) {
          const dataResult = await client.execute(`SELECT * FROM ${table}`);
          backup[table] = dataResult.rows;
          console.log(`✅ ${table}: ${count} records`);
        } else {
          backup[table] = [];
          console.log(`✅ ${table}: 0 records`);
        }
      } catch (e) {
        console.log(`⚠️  ${table}: 无法查询`);
      }
    }

    // 保存备份
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:-]/g, "");
    const backupFile = `production_backup_${timestamp}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    console.log(`\n✅ 备份完成: ${backupFile}`);
    console.log(
      `📦 文件大小: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB\n`
    );

    // 统计
    let totalRecords = 0;
    const summary = {};
    for (const [table, rows] of Object.entries(backup)) {
      const count = rows.length;
      summary[table] = count;
      totalRecords += count;
    }
    console.log("📈 备份统计:");
    console.log(JSON.stringify(summary, null, 2));
    console.log(`总记录数: ${totalRecords}\n`);

    return backup;
  } catch (error) {
    console.error("❌ 备份失败:", error.message);
    throw error;
  } finally {
    client.close();
  }
}

backupProduction().catch((e) => {
  console.error(e);
  process.exit(1);
});
