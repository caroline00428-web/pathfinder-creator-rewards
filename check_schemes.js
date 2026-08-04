const { createClient } = require("@libsql/client");

const client = createClient({
  url: "libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1MzUxMzIsImlkIjoiMDE5ZjdlOTUtMDgwMS03NzQ3LWIzZmEtMTdlOTRhNTYwM2E2Iiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6ImNmMjgzYzRjLWZkMzUtNDQ4MC1hMjEzLTVjNWEyMjk1YjUxNCJ9.nWro0Km6Xq2Bh-7ReaOOwLWZSlBfkzTtqDC3RhHoL_dGCU8ITM9-6l-l4D4ELEH-apxD0VGJJHn4g8hfQzsqAg",
});

(async () => {
  try {
    const result = await client.execute(
      `SELECT rewardScheme, COUNT(*) as count FROM Creator GROUP BY rewardScheme`
    );
    console.log("rewardScheme 分布:");
    console.log(result.rows);

    // 显示前 5 个 Creator 的详细信息
    const detail = await client.execute(
      `SELECT id, displayName, rewardScheme FROM Creator LIMIT 5`
    );
    console.log("\n前 5 个 Creator:");
    console.log(detail.rows);
  } catch (e) {
    console.error("错误:", e.message);
  } finally {
    client.close();
  }
})();
