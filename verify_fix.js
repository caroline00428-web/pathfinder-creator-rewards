const { createClient } = require("@libsql/client");

const client = createClient({
  url: "libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1MzUxMzIsImlkIjoiMDE5ZjdlOTUtMDgwMS03NzQ3LWIzZmEtMTdlOTRhNTYwM2E2Iiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6ImNmMjgzYzRjLWZkMzUtNDQ4MC1hMjEzLTVjNWEyMjk1YjUxNCJ9.nWro0Km6Xq2Bh-7ReaOOwLWZSlBfkzTtqDC3RhHoL_dGCU8ITM9-6l-l4D4ELEH-apxD0VGJJHn4g8hfQzsqAg",
});

async function verifyFix() {
  console.log("✅ 验证修复是否有效...\n");

  try {
    // 查询所有用户及其上传的视频
    const result = await client.execute(
      `SELECT 
        u.username,
        u.id as userId,
        c.id as creatorId,
        c.displayName,
        COUNT(v.id) as totalVideos,
        SUM(CASE WHEN v.status = 'APPROVED' THEN 1 ELSE 0 END) as approvedVideos
       FROM User u
       LEFT JOIN Creator c ON u.id = c.userId
       LEFT JOIN Video v ON c.id = v.creatorId
       WHERE u.username LIKE '%_[0-9A-F]%'
       GROUP BY u.id
       ORDER BY totalVideos DESC
       LIMIT 10`
    );

    console.log("📊 用户与视频关系验证：\n");
    console.log("Status | Username | Creator ID | Display Name | Total Videos | Approved");
    console.log("-------|----------|-----------|--------------|--------------|----------");

    let allValid = true;
    result.rows.forEach((row) => {
      const status = row.creatorId ? "✅" : "❌";
      const username = row.username.padEnd(20);
      const creatorId = (row.creatorId || "NULL").padEnd(15);
      const displayName = (row.displayName || "NULL").padEnd(15);
      const totalVideos = (row.totalVideos || 0).toString().padEnd(12);
      const approved = (row.approvedVideos || 0).toString();

      console.log(`${status} | ${username} | ${creatorId} | ${displayName} | ${totalVideos} | ${approved}`);

      if (!row.creatorId || row.totalVideos === null) {
        allValid = false;
      }
    });

    console.log("\n" + "=".repeat(80));
    if (allValid) {
      console.log("✅ 所有用户都有正确的 Creator 关系！修复有效！");
    } else {
      console.log("⚠️  还有问题存在");
    }

    // 特别检查 edison3612_0596
    console.log("\n📍 特别验证 edison3612_0596:");
    const edisonResult = await client.execute(
      `SELECT 
        u.username,
        u.id as userId,
        c.id as creatorId,
        COUNT(v.id) as totalVideos
       FROM User u
       LEFT JOIN Creator c ON u.id = c.userId
       LEFT JOIN Video v ON c.id = v.creatorId
       WHERE u.username = 'edison3612_0596'
       GROUP BY u.id`
    );

    if (edisonResult.rows.length > 0) {
      const row = edisonResult.rows[0];
      console.log(`   Username: ${row.username}`);
      console.log(`   User ID: ${row.userId}`);
      console.log(`   Creator ID: ${row.creatorId}`);
      console.log(`   Videos: ${row.totalVideos}`);
      
      if (row.creatorId && row.totalVideos > 0) {
        console.log(`   ✅ 可以看到视频！`);
      } else if (!row.creatorId) {
        console.log(`   ❌ 没有 Creator 关系`);
      } else if (row.totalVideos === 0) {
        console.log(`   ⚠️  没有上传视频`);
      }
    }

  } catch (e) {
    console.error("错误:", e.message);
  } finally {
    client.close();
  }
}

verifyFix();
