#!/usr/bin/env node

/**
 * 模拟完整的 NextAuth authorize() 流程
 * 调试：检查 Prisma DateTime 和数据库查询问题
 */

require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('🔍 诊断 NextAuth authorize() 流程...\n');

  // 初始化 Prisma（同 src/lib/db.ts）
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./dummy.db';
  }

  const adapter = new PrismaLibSQL({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const prisma = new PrismaClient({ adapter });

  const username = 'foko300_9689';
  const password = '968925E5';

  console.log(`📝 输入凭证:`);
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${password}\n`);

  try {
    // Step 1: Prisma findUnique - 这是授权函数的第一步
    console.log('Step 1: Prisma findUnique("User")...');
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      console.log('❌ 用户未找到\n');
      console.log('🔍 尝试使用原生 SQL...');

      // 使用原生查询
      const libsqlClient = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });

      const result = await libsqlClient.execute({
        sql: 'SELECT id, username, email, passwordHash, role, createdAt FROM "User" WHERE username = ?',
        args: [username],
      });

      if (result.rows.length === 0) {
        console.log('❌ 原生 SQL 也未找到\n');
      } else {
        console.log('✅ 原生 SQL 找到用户！');
        console.log('   Data:', result.rows[0]);
        console.log('\n   → Prisma 可能有 DateTime 解析问题');
      }

      process.exit(1);
    }

    console.log('✅ Prisma 查询成功');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.createdAt}`);

    // Step 2: bcrypt 比对
    console.log('\nStep 2: bcrypt.compare()...');
    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log(`${isValid ? '✅' : '❌'} 密码验证: ${isValid ? '正确' : '错误'}`);

    if (!isValid) {
      process.exit(1);
    }

    // Step 3: 查询 Creator（使用原生 SQL，正如 auth.ts 中所做）
    console.log('\nStep 3: 查询 Creator...');
    console.log('   使用原生 SQL: SELECT id FROM "Creator" WHERE userId = ?');

    const libsqlClient = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const creatorResult = await libsqlClient.execute({
      sql: 'SELECT id FROM "Creator" WHERE userId = ?',
      args: [user.id],
    });

    const creatorId = creatorResult.rows.length > 0 ? creatorResult.rows[0].id : null;
    console.log(`${creatorId ? '✅' : '⚠️'} Creator: ${creatorId || 'N/A'}`);

    // Step 4: 返回用户对象（这是 authorize 应该返回的）
    console.log('\nStep 4: 返回 authorize 用户对象...');
    const returnedUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      creatorId: creatorId,
    };

    console.log('✅ 授权成功！返回对象:');
    console.log(JSON.stringify(returnedUser, null, 2));

    console.log('\n✅ 完整流程成功！');
    console.log('   如果网站仍然无法登录，问题可能在：');
    console.log('   • JWT callback 中的 token 生成');
    console.log('   • session callback 中的 session 构建');
    console.log('   • NEXTAUTH_SECRET 不匹配');
    console.log('   • 浏览器 cookie 问题');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error('\n完整错误:');
    console.error(error);

    if (error.message.includes('DateTime')) {
      console.log('\n🔴 检测到 DateTime 相关错误');
      console.log('   原因: Turso 中的 DateTime 格式可能不被 Prisma 正确解析');
      console.log('   解决方案: 需要更新 DateTime 格式');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
