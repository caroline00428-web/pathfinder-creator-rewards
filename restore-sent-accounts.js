#!/usr/bin/env node

/**
 * 恢复之前通过邮件发送的账户凭证
 * 目的：将 accounts_report.txt 中的 32 个账户添加到数据库，使其能够登录
 * 策略：直接使用 @libsql/client 避免 Prisma DateTime 格式问题
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const { v4: uuidv4 } = require('crypto');

// 简单的 CUID 生成（模拟 Prisma CUID）
function generateCUID() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'c';
  for (let i = 0; i < 24; i++) {
    id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return id;
}

async function main() {
  const dbClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log('🔧 启动账户恢复脚本...\n');

  // 1. 解析 accounts_report.txt
  console.log('📄 解析 accounts_report.txt...');
  const reportPath = './accounts_report.txt';
  if (!fs.existsSync(reportPath)) {
    console.error('❌ 文件不存在:', reportPath);
    process.exit(1);
  }

  const content = fs.readFileSync(reportPath, 'utf-8');
  const accounts = parseAccountsReport(content);
  console.log(`✅ 解析完成，找到 ${accounts.length} 个账户\n`);

  // 2. 连接数据库并创建账户
  const results = {
    created: [],
    skipped: [],
    failed: [],
  };

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    process.stdout.write(`[${i + 1}/${accounts.length}] ${account.username}... `);

    try {
      // 检查用户是否已存在
      const existingUser = await dbClient.execute({
        sql: 'SELECT id FROM "User" WHERE username = ?',
        args: [account.username],
      });

      if (existingUser.rows.length > 0) {
        console.log('⏭️  已存在');
        results.skipped.push(account.username);
        continue;
      }

      // 生成密码哈希
      const passwordHash = await bcrypt.hash(account.password, 12);
      const userId = generateCUID();
      const creatorId = generateCUID();
      const walletId = generateCUID();

      // 获取 ISO 格式的时间戳
      const now = new Date().toISOString();

      // 创建 User 记录
      await dbClient.execute({
        sql: `
          INSERT INTO "User" (id, email, username, passwordHash, role, createdAt)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [userId, account.email, account.username, passwordHash, 'CREATOR', now],
      });

      // 创建 Creator 记录
      await dbClient.execute({
        sql: `
          INSERT INTO "Creator" (id, userId, displayName, creatorCode, status, createdAt)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [
          creatorId,
          userId,
          account.displayName || account.username,
          account.creatorCode,
          'ACTIVE',
          now,
        ],
      });

      // 创建 CreditWallet 记录
      await dbClient.execute({
        sql: 'INSERT INTO "CreditWallet" (id, creatorId, balance) VALUES (?, ?, ?)',
        args: [walletId, creatorId, 0],
      });

      console.log('✅ 创建成功');
      results.created.push({
        username: account.username,
        email: account.email,
        creatorCode: account.creatorCode,
      });
    } catch (error) {
      console.log(`❌ 失败: ${error.message}`);
      results.failed.push({
        username: account.username,
        error: error.message,
      });
    }
  }

  // 3. 输出统计
  console.log('\n' + '='.repeat(60));
  console.log('📊 恢复结果统计\n');
  console.log(`✅ 成功创建: ${results.created.length}`);
  console.log(`⏭️  已存在（跳过）: ${results.skipped.length}`);
  console.log(`❌ 创建失败: ${results.failed.length}`);

  if (results.created.length > 0) {
    console.log('\n✅ 新创建的账户：');
    results.created.forEach((acc) => {
      console.log(`   • ${acc.username} (${acc.email})`);
    });
  }

  if (results.failed.length > 0) {
    console.log('\n❌ 失败的账户：');
    results.failed.forEach((acc) => {
      console.log(`   • ${acc.username}: ${acc.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // 4. 验证登录功能
  if (results.created.length > 0) {
    console.log('\n🧪 验证登录功能...\n');
    const testAccount = results.created[0];
    try {
      const user = await dbClient.execute({
        sql: 'SELECT id, username, email, passwordHash FROM "User" WHERE username = ?',
        args: [testAccount.username],
      });

      if (user.rows.length > 0) {
        const userData = user.rows[0];
        console.log(`✅ 查询成功: ${testAccount.username}`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   Hash 长度: ${userData.passwordHash.length} 字符`);

        // 验证密码
        const isValid = await bcrypt.compare(
          accounts.find((a) => a.username === testAccount.username).password,
          userData.passwordHash
        );
        console.log(`   密码验证: ${isValid ? '✅ 正确' : '❌ 失败'}`);
      }
    } catch (error) {
      console.error(`❌ 验证失败: ${error.message}`);
    }
  }

  console.log('\n🎉 修复完成！\n');
  process.exit(0);
}

/**
 * 解析 accounts_report.txt 文件
 * 格式：
 * 序号. Email: xxx
 *    Username: xxx
 *    Password: xxx
 *    Creator Code: xxx
 */
function parseAccountsReport(content) {
  const accounts = [];
  const lines = content.split('\n');

  let currentAccount = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (currentAccount && currentAccount.email && currentAccount.username) {
        accounts.push(currentAccount);
        currentAccount = null;
      }
      continue;
    }

    // 检查是否是新账户的开始
    if (trimmed.match(/^\d+\./)) {
      if (currentAccount && currentAccount.email && currentAccount.username) {
        accounts.push(currentAccount);
      }
      currentAccount = {};

      // 从这一行解析 Email
      if (trimmed.includes('Email:')) {
        const match = trimmed.match(/Email:\s*(.+?)(?:\s*$|$)/);
        if (match) {
          currentAccount.email = match[1].trim();
        }
      }
      continue;
    }

    if (currentAccount) {
      if (trimmed.startsWith('Email:')) {
        currentAccount.email = trimmed.replace('Email:', '').trim();
      } else if (trimmed.startsWith('Username:')) {
        currentAccount.username = trimmed.replace('Username:', '').trim();
      } else if (trimmed.startsWith('Password:')) {
        currentAccount.password = trimmed.replace('Password:', '').trim();
      } else if (trimmed.startsWith('Creator Code:')) {
        currentAccount.creatorCode = trimmed.replace('Creator Code:', '').trim();
        // 从 Creator Code 推导显示名称
        const parts = currentAccount.creatorCode.replace('GDP_', '').split('_');
        currentAccount.displayName = parts[0] || currentAccount.username;
      }
    }
  }

  // 添加最后一个账户
  if (currentAccount && currentAccount.email && currentAccount.username) {
    accounts.push(currentAccount);
  }

  return accounts;
}

main().catch((error) => {
  console.error('❌ 脚本错误:', error);
  process.exit(1);
});
