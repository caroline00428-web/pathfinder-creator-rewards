// 从生产数据库导出所有 Creator 数据
const { createClient } = require("@libsql/client");
const fs = require("fs");
const { createObjectCsvWriter } = require("csv-writer");

const client = createClient({
  url: "libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1MzUxMzIsImlkIjoiMDE5ZjdlOTUtMDgwMS03NzQ3LWIzZmEtMTdlOTRhNTYwM2E2Iiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6ImNmMjgzYzRjLWZkMzUtNDQ4MC1hMjEzLTVjNWEyMjk1YjUxNCJ9.nWro0Km6Xq2Bh-7ReaOOwLWZSlBfkzTtqDC3RhHoL_dGCU8ITM9-6l-l4D4ELEH-apxD0VGJJHn4g8hfQzsqAg",
});

async function exportCreators() {
  console.log("📊 导出 Creator 数据...\n");

  try {
    // 获取所有 creators 和他们的数据
    const result = await client.execute(
      `SELECT
        c.id,
        c.displayName as '创作者名称',
        c.creatorCode as '创作者代码',
        u.username as '用户名',
        u.email as '邮箱',
        COALESCE(cw.balance, 0) as '获得点数',
        COALESCE((SELECT SUM(viewCount) FROM Video WHERE creatorId = c.id), 0) as '总浏览量',
        (SELECT COUNT(*) FROM Video WHERE creatorId = c.id) as '视频数',
        (SELECT COUNT(*) FROM RewardOrder WHERE creatorId = c.id) as '奖励订单数',
        c.playerId as 'Player ID',
        c.status as '状态',
        datetime(c.createdAt) as '创建时间'
       FROM Creator c
       LEFT JOIN User u ON c.userId = u.id
       LEFT JOIN CreditWallet cw ON c.id = cw.creatorId
       ORDER BY cw.balance DESC, c.displayName ASC`
    );

    const creators = result.rows;
    console.log(`✅ 找到 ${creators.length} 个 Creator\n`);

    // 1. 导出为 JSON
    const jsonFile = "creators_export.json";
    fs.writeFileSync(jsonFile, JSON.stringify(creators, null, 2));
    console.log(`✅ JSON 导出: ${jsonFile}`);

    // 2. 导出为 CSV
    const csvFile = "creators_export.csv";
    const csvWriter = createObjectCsvWriter({
      path: csvFile,
      header: [
        { id: "id", title: "ID" },
        { id: "创作者名称", title: "创作者名称" },
        { id: "创作者代码", title: "创作者代码" },
        { id: "用户名", title: "用户名" },
        { id: "邮箱", title: "邮箱" },
        { id: "获得点数", title: "获得点数" },
        { id: "总浏览量", title: "总浏览量" },
        { id: "视频数", title: "视频数" },
        { id: "奖励订单数", title: "奖励订单数" },
        { id: "Player ID", title: "Player ID" },
        { id: "状态", title: "状态" },
        { id: "创建时间", title: "创建时间" },
      ],
    });

    await csvWriter.writeRecords(creators);
    console.log(`✅ CSV 导出: ${csvFile}`);

    // 3. 统计信息
    console.log("\n📈 统计信息：");
    const totalCredits = creators.reduce((sum, c) => sum + (c["获得点数"] || 0), 0);
    const totalViews = creators.reduce((sum, c) => sum + (c["总浏览量"] || 0), 0);
    const totalVideos = creators.reduce((sum, c) => sum + (c["视频数"] || 0), 0);
    const totalOrders = creators.reduce((sum, c) => sum + (c["奖励订单数"] || 0), 0);

    console.log(`   总 Creator 数: ${creators.length}`);
    console.log(`   总点数: ${totalCredits.toLocaleString()}`);
    console.log(`   总浏览量: ${totalViews.toLocaleString()}`);
    console.log(`   总视频数: ${totalVideos}`);
    console.log(`   总订单数: ${totalOrders}\n`);

    // 4. 排名前 10
    console.log("🏆 点数排名前 10：");
    creators.slice(0, 10).forEach((c, i) => {
      console.log(
        `   ${i + 1}. ${c["创作者名称"]} - ${c["获得点数"]} 点数 (${c["总浏览量"]} 浏览)`
      );
    });

    console.log(`\n✅ 导出完成！`);
  } catch (error) {
    console.error("❌ 导出失败:", error.message);
  } finally {
    client.close();
  }
}

exportCreators();
