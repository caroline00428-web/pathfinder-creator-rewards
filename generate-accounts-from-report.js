#!/usr/bin/env node

/**
 * 从 accounts_report.txt 中提取邮箱并生成新账户
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
  const num = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  const username = `creator_${num}`;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return { username, password };
}

function parseAccountsReport(content) {
  const accounts = [];
  const lines = content.split('\n');
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current && current.email) {
        accounts.push(current);
        current = null;
      }
      continue;
    }

    if (trimmed.match(/^\d+\./)) {
      if (current && current.email) {
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
      } else if (trimmed.startsWith('Discord Username:')) {
        current.discordName = trimmed.replace('Discord Username:', '').trim();
      }
    }
  }

  if (current && current.email) {
    accounts.push(current);
  }

  return accounts;
}

async function main() {
  console.log('🔧 生成新的创作者账户 (从原始列表提取)\n');

  // 解析 accounts_report.txt
  const content = fs.readFileSync('./accounts_report.txt', 'utf-8');
  const creatorsToAdd = parseAccountsReport(content);

  console.log(`📋 从 accounts_report.txt 中找到 ${creatorsToAdd.length} 个创作者\n`);

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

  const newAccounts = [];
  const results = {
    created: [],
    failed: [],
  };

  for (let i = 0; i < creatorsToAdd.length; i++) {
    const creator = creatorsToAdd[i];
    process.stdout.write(
      `[${i + 1}/${creatorsToAdd.length}] ${creator.email}... `
    );

    try {
      // 生成唯一的用户名
      let credentials;
      let attempts = 0;
      let userExists = true;

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
          creator.discordName || credentials.username,
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
        email: creator.email,
        discordName: creator.discordName || '(未提供)',
        username: credentials.username,
        password: credentials.password,
        creatorCode: `GDP_${credentials.username.toUpperCase()}`,
      });

      results.created.push(creator.email);
    } catch (error) {
      console.log(`❌ ${error.message}`);
      results.failed.push({
        email: creator.email,
        error: error.message,
      });
    }
  }

  // 输出结果
  console.log('\n' + '='.repeat(80));
  console.log('📊 生成结果\n');
  console.log(`✅ 成功创建: ${results.created.length}`);
  console.log(`❌ 失败: ${results.failed.length}`);

  if (newAccounts.length > 0) {
    // 保存到 JSON 文件
    const outputPath = './new_creator_accounts.json';
    fs.writeFileSync(outputPath, JSON.stringify(newAccounts, null, 2));
    console.log(`\n✅ 账户已保存到 ${outputPath}`);

    // 生成邮件内容
    console.log('\n📧 邮件内容:\n');
    console.log('='.repeat(80));
    console.log(`
Dear Galaxy Defense Creators,

Your accounts for the Creator Reward Program have been created!

Here are your login credentials:

${newAccounts
  .map(
    (acc, i) => `
${i + 1}. Email: ${acc.email}
   Discord: ${acc.discordName}
   Username: ${acc.username}
   Password: ${acc.password}
   Creator Code: ${acc.creatorCode}
`
  )
  .join('')}

Login here: https://creator-reward-platform.vercel.app/login

Questions? Contact us on Discord.

Galaxy Defense Creator Program
    `);
    console.log('='.repeat(80));

    // 生成 CSV 用于邮件合并
    const csvPath = './new_creator_accounts.csv';
    const csvHeader = 'Email,Discord Name,Username,Password,Creator Code\n';
    const csvData = newAccounts
      .map(
        (acc) =>
          `"${acc.email}","${acc.discordName}","${acc.username}","${acc.password}","${acc.creatorCode}"`
      )
      .join('\n');
    fs.writeFileSync(csvPath, csvHeader + csvData);
    console.log(`\n✅ CSV 文件已保存到 ${csvPath}`);
  }

  if (results.failed.length > 0) {
    console.log('\n❌ 失败的账户:');
    results.failed.forEach((f) => {
      console.log(`   • ${f.email}: ${f.error}`);
    });
  }

  console.log('\n🎉 完成！\n');
}

main().catch((error) => {
  console.error('❌ 错误:', error);
  process.exit(1);
});
