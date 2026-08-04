const { createClient } = require("@libsql/client");

const client = createClient({
  url: "libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1MzUxMzIsImlkIjoiMDE5ZjdlOTUtMDgwMS03NzQ3LWIzZmEtMTdlOTRhNTYwM2E2Iiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6ImNmMjgzYzRjLWZkMzUtNDQ4MC1hMjEzLTVjNWEyMjk1YjUxNCJ9.nWro0Km6Xq2Bh-7ReaOOwLWZSlBfkzTtqDC3RhHoL_dGCU8ITM9-6l-l4D4ELEH-apxD0VGJJHn4g8hfQzsqAg",
});

(async () => {
  try {
    console.log("=== Demo Creator 的钱包 ===\n");
    const wallet = await client.execute(
      `SELECT cw.* FROM CreditWallet cw WHERE cw.creatorId = 'cr_001'`
    );
    console.log(wallet.rows);

    console.log("\n=== Demo Creator 的 RewardOrder（待导出订单）===\n");
    const orders = await client.execute(
      `SELECT * FROM RewardOrder WHERE creatorId = 'cr_001'`
    );
    console.log(orders.rows);

    console.log("\n=== Demo Creator 的 CreditTransaction ===\n");
    const txs = await client.execute(
      `SELECT * FROM CreditTransaction WHERE creatorId = 'cr_001'`
    );
    console.log(txs.rows);
  } catch (e) {
    console.error("错误:", e.message);
  } finally {
    client.close();
  }
})();
