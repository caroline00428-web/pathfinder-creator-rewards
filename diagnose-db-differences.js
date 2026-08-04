#!/usr/bin/env node

/**
 * 诊断：检查两个 Turso 数据库中的账户
 * 比较测试库和生产库的账户差异
 */

const { createClient } = require('@libsql/client');

async function checkDatabase(name, url, token) {
  console.log(`\n📍 检查 ${name}:`);
  console.log(`   URL: ${url.substring(0, 60)}...`);

  try {
    const client = createClient({ url, authToken: token });

    // 查询 User 表
    const users = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM "User"',
    });

    const userCount = users.rows[0]?.count || 0;
    console.log(`   ✅ User 表: ${userCount} 条记录`);

    if (userCount > 0) {
      // 查询前 5 个用户
      const sample = await client.execute({
        sql: 'SELECT username, email FROM "User" LIMIT 5',
      });

      console.log(`   示例用户:`);
      sample.rows.forEach(row => {
        console.log(`     • ${row.username} (${row.email})`);
      });
    }

    // 查询 Creator 表
    const creators = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM "Creator"',
    });

    const creatorCount = creators.rows[0]?.count || 0;
    console.log(`   ✅ Creator 表: ${creatorCount} 条记录`);

  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
  }
}

async function main() {
  require('dotenv').config({ path: '.env' });
  require('dotenv').config({ path: '.env.local' });

  console.log('🔍 数据库对比诊断\n');
  console.log('='.repeat(70));

  // 生产数据库
  const prodUrl = 'libsql://pathfiner-caroline00428-web.aws-us-east-2.turso.io';
  const prodToken = process.env.TURSO_AUTH_TOKEN;

  // 测试数据库（从 .env.local）
  const testUrl = 'libsql://pathfinder-test-caroline00428-web.aws-us-east-2.turso.io';
  const testToken = process.env.TURSO_AUTH_TOKEN; // 应该是相同的 token

  console.log('\n📊 对比两个数据库的账户情况:\n');

  await checkDatabase('生产数据库 (pathfiner)', prodUrl, prodToken);
  await checkDatabase('测试数据库 (pathfinder-test)', testUrl, testToken);

  console.log('\n' + '='.repeat(70));
  console.log('\n💡 诊断结论:');
  console.log('   如果生产数据库中没有账户');
  console.log('   而测试数据库中有账户');
  console.log('   那说明账户被创建到了错误的数据库');
  console.log('\n');

  process.exit(0);
}

main().catch(error => {
  console.error('❌ 错误:', error);
  process.exit(1);
});
