#!/usr/bin/env node

/**
 * 处理重复邮箱的账户
 * 这些账户共享同一个邮箱地址，我们需要为它们创建变体邮箱
 * 例如：user@email.com → user+1@email.com, user+2@email.com
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

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

  console.log('🔧 处理重复邮箱的账户...\n');

  // 这些账户共享同一个邮箱
  const duplicateAccounts = [
    {
      username: 'supernate0028_9AD2',
      password: '9AD20E03',
      creatorCode: 'GDP_SUPERNATE0028_9AD2',
      displayName: 'supernate0028',
      email: 'jncanlas16@gmail.com', // 与其他账户冲突
      originalEmail: 'jncanlas16@gmail.com',
      emailVariant: 'jncanlas16+1@gmail.com', // 使用 +1 变体
    },
    {
      username: 'scorp420x_1CB8',
      password: '1CB8F32D',
      creatorCode: 'GDP_SCORP420X_1CB8',
      displayName: 'scorp420x',
      email: 'scorp420x@gmail.com', // 与其他账户冲突
      originalEmail: 'scorp420x@gmail.com',
      emailVariant: 'scorp420x+2@gmail.com', // 使用 +2 变体
    },
    {
      username: 'supernate0028_1D85',
      password: '1D85F62E',
      creatorCode: 'GDP_SUPERNATE0028_1D85',
      displayName: 'supernate0028',
      email: 'jncanlas16@gmail.com', // 与其他账户冲突
      originalEmail: 'jncanlas16@gmail.com',
      emailVariant: 'jncanlas16+2@gmail.com', // 使用 +2 变体
    },
  ];

  const results = {
    created: [],
    failed: [],
  };

  for (const account of duplicateAccounts) {
    console.log(`处理 ${account.username}...`);

    try {
      // 生成密码哈希
      const passwordHash = await bcrypt.hash(account.password, 12);
      const userId = generateCUID();
      const creatorId = generateCUID();
      const walletId = generateCUID();
      const now = new Date().toISOString();

      // 创建 User 记录（使用邮箱变体）
      await dbClient.execute({
        sql: `
          INSERT INTO "User" (id, email, username, passwordHash, role, createdAt)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [userId, account.emailVariant, account.username, passwordHash, 'CREATOR', now],
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
          account.displayName,
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

      console.log(`✅ 创建成功 (邮箱: ${account.emailVariant})`);
      results.created.push({
        username: account.username,
        email: account.emailVariant,
        originalEmail: account.originalEmail,
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

  console.log('\n' + '='.repeat(60));
  console.log('📊 处理结果\n');
  console.log(`✅ 成功创建: ${results.created.length}`);
  console.log(`❌ 创建失败: ${results.failed.length}`);

  if (results.created.length > 0) {
    console.log('\n✅ 新创建的账户：');
    results.created.forEach((acc) => {
      console.log(`   • ${acc.username}`);
      console.log(`     原始邮箱: ${acc.originalEmail}`);
      console.log(`     实际邮箱: ${acc.email}`);
    });
  }

  if (results.failed.length > 0) {
    console.log('\n❌ 失败的账户：');
    results.failed.forEach((acc) => {
      console.log(`   • ${acc.username}: ${acc.error}`);
    });
  }

  console.log('\n📌 注意：');
  console.log('   邮箱变体（如 example+1@gmail.com）在 Gmail 中被视为同一个邮箱');
  console.log('   这些用户可以用变体邮箱登录，但邮件会发送到原始邮箱地址');

  console.log('\n' + '='.repeat(60) + '\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ 脚本错误:', error);
  process.exit(1);
});
