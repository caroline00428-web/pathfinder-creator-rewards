import { createClient } from "@libsql/client";

async function listUsers() {
  const db = createClient({
    url: "libsql://pathfiner-caroline00428-web.aws-us-east-2.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQzMDcyOTksImlkIjoiMDE5ZjcxMDAtNGQwMS03ODAzLTg1NzItN2IwMGMxMDBiYTExIiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6IjZkZmZkNGQ1LWI1ZmQtNGU2Ny1hOWU1LWVlMmVhNWI0NDM3NCJ9.1eD1FqwLh_URjiqSu18N6ZzqLdUWyf3Wt6RAFKNpyWDkSuMP46CzJYBvPrGuKM8ZM8Jkcy5i4y1H7uIJ36keCg",
  });

  try {
    console.log("📊 生产环境所有用户:\n");
    
    const result = await db.execute("SELECT username, email FROM \"User\"");
    
    result.rows.forEach((row) => {
      console.log(`${row.username}`);
    });

    console.log(`\n总数: ${result.rows.length}`);

  } catch (err) {
    console.error("❌ 错误:", err.message);
  }
}

listUsers();
