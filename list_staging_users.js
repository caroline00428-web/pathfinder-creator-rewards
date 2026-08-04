import { createClient } from "@libsql/client";

async function listUsers() {
  const db = createClient({
    url: "libsql://turso-staging-caroline00428-web.aws-us-east-2.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU0OTE2ODgsImlkIjoiMDE5ZmI3OTgtZTQwMS03ZDA2LTg0NjgtZDQ0ZTA4NDRiN2FiIiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6IjFhNjYzMmNhLWE5ZDktNGJhMi1hMjIwLTVhMDFmNzM3N2MwYyJ9.s3Wj4EZbJrtKkTQdVzQIUHENtUsY6e62h9VbeusXxwUNkVxSdmVYpn7d2nC5G5qtM7rRJkbDOuJcJ-EZad77BQ",
  });

  try {
    console.log("📊 本地 Staging 数据库可用账户:\n");
    
    const result = await db.execute("SELECT username, email FROM \"User\" LIMIT 20");
    
    console.log("用户名                      | 邮箱");
    console.log("─────────────────────────────┼──────────────────────────────");
    
    result.rows.forEach((row) => {
      console.log(`${row.username.padEnd(27)} | ${row.email}`);
    });

    console.log(`\n💡 提示: 所有生产账户的密码保持不变`);
    console.log(`📍 访问: http://localhost:3000`);

  } catch (err) {
    console.error("❌ 错误:", err.message);
  }
}

listUsers();
