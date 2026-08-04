#!/usr/bin/env node

/**
 * 在生产 Turso 数据库中恢复所有 32 个创作者账户
 * 关键：使用 .env 中的生产数据库 URL，不使用 .env.local
 */

// ⚠️ 只加载 .env，不加载 .env.local
require('dotenv').config({ path: '.env' });

const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');

function generateCUID() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'c';
  for (let i = 0; i < 24; i++) {
    id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return id;
}

async function main() {
  console.log('🔧 在生产 Turso 数据库中恢复账户...\n');

  const dbUrl = process.env.TURSO_DATABASE_URL;
  const dbToken = process.env.TURSO_AUTH_TOKEN;

  console.log('📍 数据库连接信息:');
  console.log('   URL:', dbUrl);
  console.log('   Token 长度:', dbToken ? dbToken.length : '未设置');
  console.log('');

  if (!dbUrl || !dbToken) {
    console.error('❌ 数据库凭证未配置');
    console.error('   请确保 .env 中有 TURSO_DATABASE_URL 和 TURSO_AUTH_TOKEN');
    process.exit(1);
  }

  // 验证是否连接到生产库（不是 -test）
  if (dbUrl.includes('pathfinder-test')) {
    console.error('❌ 错误：连接的是测试数据库 (pathfinder-test)');
    console.error('   需要连接到生产数据库');
    console.error('   检查 .env 中的 TURSO_DATABASE_URL');
    process.exit(1);
  }

  console.log('✅ 确认：连接到生产数据库\n');

  const dbClient = createClient({
    url: dbUrl,
    authToken: dbToken,
  });

  // 解析账户
  const content = fs.readFileSync('./accounts_report.txt', 'utf-8');
  const accounts = parseAccountsReport(content);

  // 重复邮箱账户
  const extraAccounts = [
    { username: 'supernate0028_9AD2', password: '9AD20E03', email: 'jncanlas16+1@gmail.com', creatorCode: 'GDP_SUPERNATE0028_9AD2', displayName: 'supernate0028' },
    { username: 'scorp420x_1CB8', password: '1CB8F32D', email: 'scorp420x+2@gmail.com', creatorCode: 'GDP_SCORP420X_1CB8', displayName: 'scorp420x' },
    { username: 'supernate0028_1D85', password: '1D85F62E', email: 'jncanlas16+2@gmail.com', creatorCode: 'GDP_SUPERNATE0028_1D85', displayName: 'supernate0028' },
  ];

  console.log(`📄 准备导入 ${accounts.length + extraAccounts.length} 个账户\n`);

  const results = {
    created: [],
    skipped: [],
    failed: [],
  };

  const allAccounts = accounts.concat(extraAccounts);

  for (let i = 0; i < allAccounts.length; i++) {
    const account = allAccounts[i];
    process.stdout.write(`[${i + 1}/${allAccounts.length}] ${account.username}... `);

    try {
      // 检查用户是否已存在
      const existing = await dbClient.execute({
        sql: 'SELECT id FROM "User" WHERE username = ?',
        args: [account.username],
      });

      if (existing.rows.length > 0) {
        console.log('⏭️  已存在');
        results.skipped.push(account.username);
        continue;
      }

      // 生成密码哈希
      const passwordHash = await bcrypt.hash(account.password, 12);
      const userId = generateCUID();
      const creatorId = generateCUID();
      const walletId = generateCUID();
      const now = new Date().toISOString();

      // 创建 User
      await dbClient.execute({
        sql: `INSERT INTO "User" (id, email, username, passwordHash, role, createdAt)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [userId, account.email, account.username, passwordHash, 'CREATOR', now],
      });

      // 创建 Creator
      const displayName = account.displayName || account.username;
      await dbClient.execute({
        sql: `INSERT INTO "Creator" (id, userId, displayName, creatorCode, status, createdAt)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [creatorId, userId, displayName, account.creatorCode, 'ACTIVE', now],
      });

      // 创建 CreditWallet
      await dbClient.execute({
        sql: 'INSERT INTO "CreditWallet" (id, creatorId, balance) VALUES (?, ?, ?)',
        args: [walletId, creatorId, 0],
      });

      console.log('✅ 创建成功');
      results.created.push(account.username);
    } catch (error) {
      console.log(`❌ 错误: ${error.message}`);
      results.failed.push({
        username: account.username,
        error: error.message,
      });
    }
  }

  // 统计
  console.log('\n' + '='.repeat(70));
  console.log('📊 生产数据库导入结果\n');
  console.log(`✅ 新创建: ${results.created.length}`);
  console.log(`⏭️  已存在: ${results.skipped.length}`);
  console.log(`❌ 失败: ${results.failed.length}`);

  if (results.created.length > 0) {
    console.log(`\n✅ 成功创建的账户 (${results.created.length}/${allAccounts.length}):`);
    results.created.forEach((username, idx) => {
      if (idx < 5) console.log(`   • ${username}`);
    });
    if (results.created.length > 5) {
      console.log(`   ... 和 ${results.created.length - 5} 个其他账户`);
    }
  }

  if (results.failed.length > 0) {
    console.log('\n❌ 失败账户:');
    results.failed.forEach(f => {
      console.log(`   • ${f.username}: ${f.error}`);
    });
  }

  console.log('\n' + '='.repeat(70));

  if (results.created.length > 0) {
    console.log('\n🧪 验证第一个账户...\n');
    const testAccount = allAccounts[0];
    try {
      const user = await dbClient.execute({
        sql: 'SELECT id, username, email, passwordHash FROM "User" WHERE username = ?',
        args: [testAccount.username],
      });

      if (user.rows.length > 0) {
        const userData = user.rows[0];
        console.log(`✅ ${testAccount.username} 成功创建`);
        console.log(`   Email: ${userData.email}`);

        // 验证密码
        const isValid = await bcrypt.compare(testAccount.password, userData.passwordHash);
        console.log(`   密码验证: ${isValid ? '✅ 正确' : '❌ 失败'}`);
      }
    } catch (error) {
      console.error(`❌ 验证失败: ${error.message}`);
    }
  }

  console.log('\n🎉 完成！\n');
  console.log('接下来:');
  console.log('1. 清除浏览器缓存 (F12 → Empty cache and hard refresh)');
  console.log('2. 重新登录: https://creator-reward-platform.vercel.app/login');
  console.log('3. 使用同样的凭证尝试');
  console.log('');

  process.exit(results.failed.length > 0 ? 1 : 0);
}

function parseAccountsReport(content) {
  const accounts = [];
  const lines = content.split('\n');
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current && current.email && current.username) {
        accounts.push(current);
        current = null;
      }
      continue;
    }

    if (trimmed.match(/^\d+\./)) {
      if (current && current.email && current.username) {
        accounts.push(current);
      }
      current = {};
      if (trimmed.includes('Email:')) {
        const match = trimmed.match(/Email:\s*(.+?)(?:\s*$|$)/);
        if (match) current.email = match[1].trim();
      }
      continue;
    }

    if (current) {
      if (trimmed.startsWith('Email:')) {
        current.email = trimmed.replace('Email:', '').trim();
      } else if (trimmed.startsWith('Username:')) {
        current.username = trimmed.replace('Username:', '').trim();
      } else if (trimmed.startsWith('Password:')) {
        current.password = trimmed.replace('Password:', '').trim();
      } else if (trimmed.startsWith('Creator Code:')) {
        current.creatorCode = trimmed.replace('Creator Code:', '').trim();
        const parts = current.creatorCode.replace('GDP_', '').split('_');
        current.displayName = parts[0] || current.username;
      }
    }
  }

  if (current && current.email && current.username) {
    accounts.push(current);
  }

  return accounts;
}

main().catch(error => {
  console.error('❌ 脚本错误:', error);
  process.exit(1);
});
