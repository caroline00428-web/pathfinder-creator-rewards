import { PrismaClient } from "@prisma/client";

async function test() {
  const tursoUrl = "libsql://turso-staging-caroline00428-web.aws-us-east-2.turso.io";
  const tursoToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU0OTE2ODgsImlkIjoiMDE5ZmI3OTgtZTQwMS03ZDA2LTg0NjgtZDQ0ZTA4NDRiN2FiIiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6IjFhNjYzMmNhLWE5ZDktNGJhMi1hMjIwLTVhMDFmNzM3N2MwYyJ9.s3Wj4EZbJrtKkTQdVzQIUHENtUsY6e62h9VbeusXxwUNkVxSdmVYpn7d2nC5G5qtM7rRJkbDOuJcJ-EZad77BQ";

  try {
    console.log("🔗 连接到 Turso Staging 数据库...");
    const { PrismaLibSQL } = await import("@prisma/adapter-libsql");
    const adapter = new PrismaLibSQL({ url: tursoUrl, authToken: tursoToken });
    const db = new PrismaClient({ adapter });

    console.log("✅ 连接成功！");
    
    // 测试查询
    console.log("\n📊 测试查询 User 表...");
    const users = await db.user.findMany({ take: 1 });
    console.log(`✅ 用户数: ${await db.user.count()}`);

    console.log("\n📊 测试查询 Creator 表...");
    const creators = await db.creator.findMany({ take: 1 });
    console.log(`✅ 创作者数: ${await db.creator.count()}`);

    console.log("\n🎉 Staging 数据库连接和查询都正常！");
    
    await db.$disconnect();
  } catch (err) {
    console.error("❌ 错误:", err.message);
    process.exit(1);
  }
}

test();
