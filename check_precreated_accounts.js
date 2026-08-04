const { createClient } = require("@libsql/client");

const client = createClient({
  url: "libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1MzUxMzIsImlkIjoiMDE5ZjdlOTUtMDgwMS03NzQ3LWIzZmEtMTdlOTRhNTYwM2E2Iiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6ImNmMjgzYzRjLWZkMzUtNDQ4MC1hMjEzLTVjNWEyMjk1YjUxNCJ9.nWro0Km6Xq2Bh-7ReaOOwLWZSlBfkzTtqDC3RhHoL_dGCU8ITM9-6l-l4D4ELEH-apxD0VGJJHn4g8hfQzsqAg",
});

(async () => {
  try {
    console.log("🔍 检查所有预先创建的账户...\n");
    
    // 查询所有 u_pre_* 的 Creator
    const result = await client.execute(
      `SELECT 
        u.id as userId,
        u.username,
        c.id as creatorId,
        c.displayName,
        (SELECT COUNT(*) FROM Video WHERE creatorId = c.id) as videoCount,
        (SELECT COUNT(*) FROM Video WHERE creatorId = c.id AND status = 'APPROVED') as approvedCount
       FROM User u
       LEFT JOIN Creator c ON u.id = c.userId
       WHERE u.username LIKE '%_[0-9]%'
       ORDER BY u.username
       LIMIT 10`
    );

    console.log(`找到 ${result.rows.length} 个预先创建的账户:\n`);
    
    result.rows.forEach((row, i) => {
      console.log(`${i+1}. Username: ${row.username}`);
      console.log(`   User ID: ${row.userId}`);
      console.log(`   Creator ID: ${row.creatorId}`);
      console.log(`   Display Name: ${row.displayName}`);
      console.log(`   Videos: ${row.videoCount} (${row.approvedCount} approved)\n`);
    });
    
  } catch (e) {
    console.error("错误:", e.message);
  } finally {
    client.close();
  }
})();
