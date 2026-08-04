// 这个脚本模拟前端调用，看 session 中是否真的有 creatorId

const { createClient } = require("@libsql/client");

const client = createClient({
  url: "libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1MzUxMzIsImlkIjoiMDE5ZjdlOTUtMDgwMS03NzQ3LWIzZmEtMTdlOTRhNTYwM2E2Iiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6ImNmMjgzYzRjLWZkMzUtNDQ4MC1hMjEzLTVjNWEyMjk1YjUxNCJ9.nWro0Km6Xq2Bh-7ReaOOwLWZSlBfkzTtqDC3RhHoL_dGCU8ITM9-6l-l4D4ELEH-apxD0VGJJHn4g8hfQzsqAg",
});

(async () => {
  try {
    console.log("🔍 模拟 NextAuth authorize() 流程...\n");
    
    // 用户登录：edison3612_0596
    const username = "edison3612_0596";
    
    // Step 1: 查询 User
    const userResult = await client.execute(
      `SELECT id, username, email, role FROM "User" WHERE username = ?`,
      [username]
    );
    
    const user = userResult.rows[0];
    console.log(`Step 1 - User lookup:`);
    console.log(`  User ID: ${user.id}`);
    console.log(`  Username: ${user.username}\n`);
    
    // Step 2: 查询 Creator（auth.ts 在这里做的）
    const creatorResult = await client.execute(
      `SELECT id FROM "Creator" WHERE "userId" = ? LIMIT 1`,
      [user.id]
    );
    
    const creatorId = creatorResult.rows[0]?.id;
    console.log(`Step 2 - Creator lookup:`);
    console.log(`  Creator ID: ${creatorId}\n`);
    
    // Step 3: 这是 NextAuth 返回给 session 的数据
    const sessionData = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      creatorId: creatorId  // ✅ 这个应该有值
    };
    
    console.log(`Step 3 - Session data (from NextAuth):`);
    console.log(JSON.stringify(sessionData, null, 2));
    
    // Step 4: 前端调用 /api/videos 时使用的过滤
    console.log(`\nStep 4 - API /videos query filter:`);
    console.log(`  Expected creatorId filter: ${creatorId}`);
    
    // 验证：查询这个 creatorId 的视频
    const videosResult = await client.execute(
      `SELECT COUNT(*) as count FROM Video WHERE creatorId = ?`,
      [creatorId]
    );
    
    console.log(`  Videos found with this creatorId: ${videosResult.rows[0].count}`);
    
  } catch (e) {
    console.error("错误:", e.message);
  } finally {
    client.close();
  }
})();
