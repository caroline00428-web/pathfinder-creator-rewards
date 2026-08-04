const { createClient } = require("@libsql/client");

const client = createClient({
  url: "libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1MzUxMzIsImlkIjoiMDE5ZjdlOTUtMDgwMS03NzQ3LWIzZmEtMTdlOTRhNTYwM2E2Iiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6ImNmMjgzYzRjLWZkMzUtNDQ4MC1hMjEzLTVjNWEyMjk1YjUxNCJ9.nWro0Km6Xq2Bh-7ReaOOwLWZSlBfkzTtqDC3RhHoL_dGCU8ITM9-6l-l4D4ELEH-apxD0VGJJHn4g8hfQzsqAg",
});

(async () => {
  try {
    console.log("🔍 检查 edison3612_0596 的账户信息...\n");
    
    // 查询 user
    const userResult = await client.execute(
      `SELECT id, username, role FROM User WHERE username = 'edison3612_0596'`
    );
    
    if (userResult.rows.length === 0) {
      console.log("❌ 找不到用户");
      client.close();
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`User:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Role: ${user.role}\n`);
    
    // 查询 creator
    const creatorResult = await client.execute(
      `SELECT id, displayName FROM Creator WHERE userId = '${user.id}'`
    );
    
    console.log(`Creator (associated with this User):`);
    if (creatorResult.rows.length > 0) {
      const creator = creatorResult.rows[0];
      console.log(`  ID: ${creator.id}`);
      console.log(`  Display Name: ${creator.displayName}\n`);
    } else {
      console.log(`  ❌ 未找到\n`);
    }
    
    // 查询这个用户上传的视频
    const videosResult = await client.execute(
      `SELECT id, title, creatorId, platform, status
       FROM Video
       WHERE creatorId IN (
         SELECT id FROM Creator WHERE userId = '${user.id}'
       )
       ORDER BY submittedAt DESC
       LIMIT 5`
    );
    
    console.log(`Videos uploaded by this user (${videosResult.rows.length}):`);
    videosResult.rows.forEach((v, i) => {
      console.log(`  ${i+1}. CreatorID: ${v.creatorId} | ${v.platform} | ${v.title || '(无标题)'} | ${v.status}`);
    });
    
  } catch (e) {
    console.error("错误:", e.message);
  } finally {
    client.close();
  }
})();
