#!/usr/bin/env node

/**
 * 生成新的可用账户
 * 用于发送给之前没有得到正确凭证的创作者
 */

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

function generateRandomCredentials() {
  // 生成简单的用户名：creator_XXXX
  const num = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const username = `creator_${num}`;

  // 生成简单的密码：8位大小写+数字
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return { username, password };
}

async function main() {
  console.log('🔧 生成新的创作者账户\n');

  const dbUrl = process.env.TURSO_DATABASE_URL;
  const dbToken = process.env.TURSO_AUTH_TOKEN;

  if (!dbUrl || !dbToken) {
    console.error('❌ 数据库凭证未配置');
    process.exit(1);
  }

  const dbClient = createClient({
    url: dbUrl,
    authToken: dbToken,
  });

  // 获取创作者邮箱列表（需要手动指定）
  const creatorsToAdd = [
    { email: 'fokooo335@gmail.com', discordName: 'Foko300' },
    // 根据需要添加更多...
  ];

  if (creatorsToAdd.length === 0) {
    console.log('📝 请在脚本中添加需要的创作者邮箱');
    process.exit(1);
  }

  console.log(`准备为 ${creatorsToAdd.length} 个创作者生成账户\n`);

  const newAccounts = [];
  const results = {
    created: [],
    failed: [],
  };

  for (let i = 0; i < creatorsToAdd.length; i++) {
    const creator = creatorsToAdd[i];
    process.stdout.write(`[${i + 1}/${creatorsToAdd.length}] 生成 ${creator.discordName}... `);

    try {
      // 生成凭证
      let credentials;
      let attempts = 0;
      let userExists = true;

      // 确保用户名唯一
      while (userExists && attempts < 10) {
        credentials = generateRandomCredentials();
        const check = await dbClient.execute({
          sql: 'SELECT id FROM "User" WHERE username = ?',
          args: [credentials.username],
        });
        userExists = check.rows.length > 0;
        attempts++;
      }

      if (userExists) {
        throw new Error('无法生成唯一的用户名');
      }

      // 生成密码哈希
      const passwordHash = await bcrypt.hash(credentials.password, 12);
      const userId = generateCUID();
      const creatorId = generateCUID();
      const walletId = generateCUID();
      const now = new Date().toISOString();

      // 创建 User
      await dbClient.execute({
        sql: `INSERT INTO "User" (id, email, username, passwordHash, role, createdAt)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [userId, creator.email, credentials.username, passwordHash, 'CREATOR', now],
      });

      // 创建 Creator
      await dbClient.execute({
        sql: `INSERT INTO "Creator" (id, userId, displayName, creatorCode, status, createdAt)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          creatorId,
          userId,
          creator.discordName,
          `GDP_${credentials.username.toUpperCase()}`,
          'ACTIVE',
          now,
        ],
      });

      // 创建 CreditWallet
      await dbClient.execute({
        sql: 'INSERT INTO "CreditWallet" (id, creatorId, balance) VALUES (?, ?, ?)',
        args: [walletId, creatorId, 0],
      });

      console.log('✅');

      newAccounts.push({
        discordName: creator.discordName,
        email: creator.email,
        username: credentials.username,
        password: credentials.password,
        creatorCode: `GDP_${credentials.username.toUpperCase()}`,
      });

      results.created.push(creator.discordName);
    } catch (error) {
      console.log(`❌ ${error.message}`);
      results.failed.push({
        name: creator.discordName,
        error: error.message,
      });
    }
  }

  // 统计
  console.log('\n' + '='.repeat(70));
  console.log('📊 生成结果\n');
  console.log(`✅ 成功: ${results.created.length}`);
  console.log(`❌ 失败: ${results.failed.length}`);

  if (newAccounts.length > 0) {
    console.log('\n📋 新账户凭证 (用于发送给创作者):\n');
    console.log('='.repeat(70));

    newAccounts.forEach((acc, idx) => {
      console.log(`\n${idx + 1}. Discord: ${acc.discordName}`);
      console.log(`   Email: ${acc.email}`);
      console.log(`   Username: ${acc.username}`);
      console.log(`   Password: ${acc.password}`);
      console.log(`   Creator Code: ${acc.creatorCode}`);
    });

    console.log('\n' + '='.repeat(70));

    // 保存到 JSON 文件
    const outputPath = './new_creator_accounts.json';
    fs.writeFileSync(outputPath, JSON.stringify(newAccounts, null, 2));
    console.log(`\n✅ 账户已保存到 ${outputPath}`);

    // 生成邮件内容
    console.log('\n📧 邮件内容模板:\n');
    console.log('='.repeat(70));
    console.log(`
Hi Creator,

Your Galaxy Defense Pathfinder Creator Program account has been successfully created!

Here are your login credentials:

${newAccounts.map((acc, i) => `${i + 1}. Email: ${acc.email}
   Username: ${acc.username}
   Password: ${acc.password}
   Creator Code: ${acc.creatorCode}
`).join('\n')}

Login URL: https://creator-reward-platform.vercel.app/login

Please keep your login information safe.

Galaxy Defense Creator Program
    `);
    console.log('='.repeat(70));
  }

  if (results.failed.length > 0) {
    console.log('\n❌ 失败的账户:');
    results.failed.forEach(f => {
      console.log(`   • ${f.name}: ${f.error}`);
    });
  }

  console.log('\n🎉 完成！\n');
  process.exit(results.failed.length > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('❌ 错误:', error);
  process.exit(1);
});
