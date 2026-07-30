#!/usr/bin/env node

/**
 * 测试生产数据库中的账户登录
 */

require('dotenv').config({ path: '.env' });

const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

async function main() {
  const dbClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log('🔐 测试生产数据库登录...\n');

  // 测试账户
  const testAccounts = [
    { username: 'foko300_9689', password: '968925E5' },
    { username: 'org_shiv123_AA9C', password: 'AA9C2376' },
    { username: 'natthoff_F8F8', password: 'F8F86874' },
  ];

  for (const creds of testAccounts) {
    console.log(`测试 ${creds.username}:`);

    try {
      // Step 1: 查询用户
      const result = await dbClient.execute({
        sql: 'SELECT id, username, email, passwordHash, role FROM "User" WHERE username = ?',
        args: [creds.username],
      });

      if (result.rows.length === 0) {
        console.log('  ❌ 用户不存在\n');
        continue;
      }

      const user = result.rows[0];
      console.log(`  ✅ 用户存在 (ID: ${user.id})`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Role: ${user.role}`);

      // Step 2: 验证密码
      const isValid = await bcrypt.compare(creds.password, user.passwordHash);
      console.log(`  ${isValid ? '✅' : '❌'} 密码: ${isValid ? '正确' : '错误'}`);

      if (!isValid) {
        console.log(`     输入: ${creds.password}`);
        console.log(`     Hash: ${user.passwordHash.substring(0, 40)}...`);
        console.log('');
        continue;
      }

      // Step 3: 检查 Creator
      const creatorResult = await dbClient.execute({
        sql: 'SELECT id FROM "Creator" WHERE userId = ?',
        args: [user.id],
      });

      const creatorId = creatorResult.rows.length > 0 ? creatorResult.rows[0].id : null;
      console.log(`  ${creatorId ? '✅' : '❌'} Creator: ${creatorId || '无'}`);

      if (!isValid || !creatorId) {
        console.log('');
        continue;
      }

      // Step 4: 模拟 NextAuth 授权返回值
      console.log('  📋 NextAuth 应该返回:');
      console.log(`     {`);
      console.log(`       id: "${user.id}",`);
      console.log(`       email: "${user.email}",`);
      console.log(`       username: "${user.username}",`);
      console.log(`       role: "${user.role}",`);
      console.log(`       creatorId: "${creatorId}"`);
      console.log(`     }`);
      console.log(`  ✅ 应该重定向到: /creator/dashboard\n`);
    } catch (error) {
      console.log(`  ❌ 错误: ${error.message}\n`);
    }
  }

  console.log('='.repeat(60));
  console.log('\n💡 如果测试通过但网站仍无法登录，可能的原因：');
  console.log('1. NextAuth 配置问题');
  console.log('2. JWT 令牌生成失败');
  console.log('3. Session 存储问题');
  console.log('4. Vercel 环境变量与本地不同');
  console.log('5. 浏览器 cookie 或缓存问题\n');

  process.exit(0);
}

main().catch(error => {
  console.error('❌ 错误:', error);
  process.exit(1);
});
