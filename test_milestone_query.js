const { createClient } = require("@libsql/client");

const client = createClient({
  url: "libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1MzUxMzIsImlkIjoiMDE5ZjdlOTUtMDgwMS03NzQ3LWIzZmEtMTdlOTRhNTYwM2E2Iiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6ImNmMjgzYzRjLWZkMzUtNDQ4MC1hMjEzLTVjNWEyMjk1YjUxNCJ9.nWro0Km6Xq2Bh-7ReaOOwLWZSlBfkzTtqDC3RhHoL_dGCU8ITM9-6l-l4D4ELEH-apxD0VGJJHn4g8hfQzsqAg",
});

(async () => {
  try {
    console.log("测试不同的 active 查询方式...\n");
    
    // 方式 1: active = 1
    console.log("1️⃣ SELECT 其中 active = 1:");
    const result1 = await client.execute(
      `SELECT COUNT(*) as count FROM Milestone WHERE active = 1`
    );
    console.log(`   结果: ${result1.rows[0]?.count} 条\n`);
    
    // 方式 2: active = true (SQLite 会自动转换为 1)
    console.log("2️⃣ SELECT 其中 active = true:");
    const result2 = await client.execute(
      `SELECT COUNT(*) as count FROM Milestone WHERE active = true`
    );
    console.log(`   结果: ${result2.rows[0]?.count} 条\n`);
    
    // 方式 3: 检查 schema
    console.log("3️⃣ Milestone 表的 schema:");
    const schema = await client.execute(
      `PRAGMA table_info(Milestone)`
    );
    schema.rows.forEach(r => {
      if (r.name === 'active') {
        console.log(`   ${r.name}: ${r.type} (notnull: ${r.notnull}, default: ${r.dflt_value})`);
      }
    });
    
  } catch (e) {
    console.error("❌ 错误:", e.message);
  } finally {
    client.close();
  }
})();
