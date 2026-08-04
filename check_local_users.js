import { PrismaClient } from "@prisma/client";

async function checkUsers() {
  const tursoUrl = "libsql://turso-staging-caroline00428-web.aws-us-east-2.turso.io";
  const tursoToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU0OTE2ODgsImlkIjoiMDE5ZmI3OTgtZTQwMS03ZDA2LTg0NjgtZDQ0ZTA4NDRiN2FiIiwia2lkIjoiSG1INVpmd1FWT3A3UGY2N2lQRVBFWTdRMEZMTUkya2hxeklRT3ZwSERQYyIsInJpZCI6IjFhNjYzMmNhLWE5ZDktNGJhMi1hMjIwLTVhMDFmNzM3N2MwYyJ9.s3Wj4EZbJrtKkTQdVzQIUHENtUsY6e62h9VbeusXxwUNkVxSdmVYpn7d2nC5G5qtM7rRJkbDOuJcJ-EZad77BQ";

  try {
    const { PrismaLibSQL } = await import("@prisma/adapter-libsql");
    const adapter = new PrismaLibSQL({ url: tursoUrl, authToken: tursoToken });
    const db = new PrismaClient({ adapter });

    console.log("📊 本地 Staging 数据库用户:\n");
    const users = await db.user.findMany({
      include: {
        creator: {
          include: {
            wallet: true,
          },
        },
      },
    });

    users.forEach((u) => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`👤 用户名: ${u.username}`);
      console.log(`📧 邮箱: ${u.email}`);
      console.log(`🔑 密码: (已加密，查看 .env.staging)`);
      console.log(`👤 角色: ${u.role}`);
      if (u.creator) {
        console.log(`💎 创作者代码: ${u.creator.creatorCode}`);
        console.log(`💰 奖励方案: ${u.creator.rewardScheme || "未选择"}`);
        console.log(`💵 钱包余额: ${u.creator.wallet?.balance || 0}`);
      }
    });

    console.log(`\n总用户数: ${users.length}`);
    await db.$disconnect();
  } catch (err) {
    console.error("❌ 错误:", err.message);
  }
}

checkUsers();
