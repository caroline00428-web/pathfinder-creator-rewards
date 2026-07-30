#!/usr/bin/env node

/**
 * 在生产 Turso 数据库中恢复所有 32 个创作者账户
 * 这个脚本针对生产环境（使用 .env 配置）
 */

// 首先加载 .env（生产配置）
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
  console.log('🔧 在生产数据库中恢复账户...\n');

  const dbUrl = process.env.TURSO_DATABASE_URL;
  const dbToken = process.env.TURSO_AUTH_TOKEN;

  console.log('连接信息:');
  console.log('数据库 URL:', dbUrl);
  console.log('Token 存在:', !!dbToken);
  console.log('');

  if (!dbUrl || !dbToken) {
    console.error('❌ 数据库凭证未配置');
    process.exit(1);
  }

  const dbClient = createClient({
    url: dbUrl,
    authToken: dbToken,
  });

  // 解析账户
  const content = fs.readFileSync('./accounts_report.txt', 'utf-8');
  const accounts = parseAccountsReport(content);

  // 重复邮箱账户
  const extraAccounts = [
    { username: 'supernate0028_9AD2', password: '9AD20E03', email: 'jncanlas16+1@gmail.com', creatorCode: 'GDP_SUPERNATE0028_9AD2' },
    { username: 'scorp420x_1CB8', password: '1CB8F32D', email: 'scorp420x+2@gmail.com', creatorCode: 'GDP_SCORP420X_1CB8' },
    { username: 'supernate0028_1D85', password: '1D85F62E', email: 'jncanlas16+2@gmail.com', creatorCode: 'GDP_SUPERNATE0028_1D85' },
  ];

  console.log(`📄 解析完成，准备导入 ${accounts.length + extraAccounts.length} 个账户\n`);

  const results = {
    created: [],
    skipped: [],
    failed: [],
  };

  // 创建所有账户
  const allAccounts = accounts.map(acc => ({
    ...acc,
    email: acc.email,
  })).concat(extraAccounts);

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
  console.log('\n' + '='.repeat(60));
  console.log('📊 生产数据库导入结果\n');
  console.log(`✅ 新创建: ${results.created.length}`);
  console.log(`⏭️  已存在: ${results.skipped.length}`);
  console.log(`❌ 失败: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ 失败账户:');
    results.failed.forEach(f => {
      console.log(`   • ${f.username}: ${f.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n🎉 完成！\n');
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
  console.error('❌ 错误:', error);
  process.exit(1);
});
