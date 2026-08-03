import { createClient } from "@libsql/client";
import fs from "fs";

async function initializeDatabase() {
  const db = createClient({
    url: "libsql://turso-staging-caroline00428-web.aws-us-east-2.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU0OTE2ODgsImlkIjoiMDE5ZmI3OTgtZTQwMS03ZDA2LTg0NjgtZDQ0ZTA4NDRiN2FiIiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6IjFhNjYzMmNhLWE5ZDktNGJhMi1hMjIwLTVhMDFmNzM3N2MwYyJ9.s3Wj4EZbJrtKkTQdVzQIUHENtUsY6e62h9VbeusXxwUNkVxSdmVYpn7d2nC5G5qtM7rRJkbDOuJcJ-EZad77BQ",
  });

  try {
    console.log("🔗 连接到 Turso Staging 数据库...");
    
    const sql = fs.readFileSync("init_staging_db.sql", "utf-8");
    
    console.log("📝 执行 SQL schema...");
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("--"));

    for (const stmt of statements) {
      try {
        await db.execute(stmt);
      } catch (err) {
        if (err.message.includes("already exists")) {
          console.log(`⏭️  跳过已存在的表`);
        } else {
          throw err;
        }
      }
    }

    console.log(`✅ 已执行 ${statements.length} 个 SQL 语句`);

    // Verify tables
    const result = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    console.log(`\n📊 创建的表数量: ${result.rows.length}`);
    result.rows.forEach((row) => {
      console.log(`   - ${row.name}`);
    });

    console.log("\n🎉 Staging 数据库初始化完成！");
    process.exit(0);
  } catch (err) {
    console.error("❌ 错误:", err.message);
    process.exit(1);
  }
}

initializeDatabase();
