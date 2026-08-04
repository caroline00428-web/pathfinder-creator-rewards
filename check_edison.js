const { createClient } = require("@libsql/client");

const client = createClient({
  url: "libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1MzUxMzIsImlkIjoiMDE5ZjdlOTUtMDgwMS03NzQ3LWIzZmEtMTdlOTRhNTYwM2E2Iiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6ImNmMjgzYzRjLWZkMzUtNDQ4MC1hMjEzLTVjNWEyMjk1YjUxNCJ9.nWro0Km6Xq2Bh-7ReaOOwLWZSlBfkzTtqDC3RhHoL_dGCU8ITM9-6l-l4D4ELEH-apxD0VGJJHn4g8hfQzsqAg",
});

(async () => {
  try {
    console.log("🔍 检查 edison3612 账户...\n");
    
    // User 表
    const userResult = await client.execute(
      `SELECT * FROM User WHERE username = 'edison3612'`
    );
    
    console.log("User 表:");
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log(`  ID: ${user.id}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Role: ${user.role}\n`);
    } else {
      console.log("  ❌ 未找到\n");
    }
    
    // Creator 表
    const creatorResult = await client.execute(
      `SELECT * FROM Creator WHERE displayName = 'edison3612'`
    );
    
    console.log("Creator 表:");
    if (creatorResult.rows.length > 0) {
      const creator = creatorResult.rows[0];
      console.log(`  ID: ${creator.id}`);
      console.log(`  UserID: ${creator.userId}`);
      console.log(`  Display Name: ${creator.displayName}`);
      console.log(`  Creator Code: ${creator.creatorCode}\n`);
    } else {
      console.log("  ❌ 未找到\n");
    }
    
    // 预先创建的账户表
    const preResult = await client.execute(
      `SELECT * FROM CreatorAccount WHERE username = 'edison3612'`
    );
    
    console.log("CreatorAccount 表（预先创建）:");
    if (preResult.rows.length > 0) {
      const pre = preResult.rows[0];
      console.log(`  Username: ${pre.username}`);
      console.log(`  Creator Code: ${pre.creatorCode}`);
      console.log(`  Used: ${pre.used}`);
      console.log(`  Used At: ${pre.usedAt}\n`);
    } else {
      console.log("  ❌ 未找到\n");
    }
    
    // 查询 c_pre_146 的 creator
    console.log("Creator c_pre_146:");
    const c146 = await client.execute(
      `SELECT u.id, u.username, u.role, c.id, c.userId, c.displayName
       FROM Creator c
       LEFT JOIN User u ON c.userId = u.id
       WHERE c.id = 'c_pre_146'`
    );
    
    if (c146.rows.length > 0) {
      const row = c146.rows[0];
      console.log(`  User ID: ${row.id}`);
      console.log(`  Username: ${row.username}`);
      console.log(`  Creator ID: ${row.id}`);
      console.log(`  Creator User ID: ${row.userId}`);
      console.log(`  Display Name: ${row.displayName}`);
    }
    
  } catch (e) {
    console.error("错误:", e.message);
  } finally {
    client.close();
  }
})();
