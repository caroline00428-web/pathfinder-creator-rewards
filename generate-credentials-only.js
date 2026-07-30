#!/usr/bin/env node

/**
 * 为所有创作者生成新的可用凭证列表
 * 不修改数据库，直接生成凭证供导入或手动更新
 */

const fs = require('fs');

function generateRandomCredentials() {
  const num = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  const username = `creator${num}`;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
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

  // 去重：只保留第一个邮箱实例
  const seen = new Set();
  return accounts.filter((acc) => {
    if (seen.has(acc.email)) return false;
    seen.add(acc.email);
    return true;
  });
}

function main() {
  console.log('🔧 为所有创作者生成新凭证\n');

  // 解析报告
  const content = fs.readFileSync('./accounts_report.txt', 'utf-8');
  const creators = parseAccountsReport(content);

  console.log(`📋 为 ${creators.length} 个创作者生成新凭证\n`);

  const newAccounts = [];

  creators.forEach((creator, idx) => {
    process.stdout.write(`[${idx + 1}/${creators.length}] ${creator.email}... `);

    let credentials = generateRandomCredentials();
    let attempts = 0;

    // 确保用户名唯一
    while (
      newAccounts.some((acc) => acc.username === credentials.username) &&
      attempts < 5
    ) {
      credentials = generateRandomCredentials();
      attempts++;
    }

    newAccounts.push({
      email: creator.email,
      discordName: creator.discordName || '(未提供)',
      username: credentials.username,
      password: credentials.password,
      creatorCode: `GDP_${credentials.username.toUpperCase()}`,
    });

    console.log('✅');
  });

  console.log('\n' + '='.repeat(90));
  console.log('✅ 生成完成！新凭证列表:\n');

  // 打印表格
  console.log('Email | Discord Name | Username | Password | Creator Code');
  console.log('-'.repeat(90));
  newAccounts.forEach((acc) => {
    console.log(
      `${acc.email} | ${acc.discordName} | ${acc.username} | ${acc.password} | ${acc.creatorCode}`
    );
  });

  // 保存到 JSON
  const jsonPath = './new_creator_credentials.json';
  fs.writeFileSync(jsonPath, JSON.stringify(newAccounts, null, 2));
  console.log(`\n✅ JSON 已保存: ${jsonPath}`);

  // 保存到 CSV
  const csvPath = './new_creator_credentials.csv';
  const csvHeader = 'Email,Discord Name,Username,Password,Creator Code\n';
  const csvData = newAccounts
    .map(
      (acc) =>
        `"${acc.email}","${acc.discordName}","${acc.username}","${acc.password}","${acc.creatorCode}"`
    )
    .join('\n');
  fs.writeFileSync(csvPath, csvHeader + csvData);
  console.log(`✅ CSV 已保存: ${csvPath}`);

  // 生成邮件内容
  console.log('\n' + '='.repeat(90));
  console.log('\n📧 邮件内容 (可复制粘贴):\n');
  console.log(
    `
Dear Galaxy Defense Creators,

Your accounts for the Creator Reward Program have been created!

Here are your login credentials:

${newAccounts
  .map(
    (acc, i) => `
${i + 1}. Discord: ${acc.discordName}
   Email: ${acc.email}
   Username: ${acc.username}
   Password: ${acc.password}
   Creator Code: ${acc.creatorCode}
`
  )
  .join('')}

Login here: https://creator-reward-platform.vercel.app/login

Please keep your credentials safe.

Galaxy Defense Creator Program
  `
  );

  console.log('='.repeat(90));
  console.log('\n🎉 完成！');
  console.log('\n📝 下一步：');
  console.log('   1. 使用 new_creator_credentials.csv 在邮件中进行邮件合并');
  console.log('   2. 或将 new_creator_credentials.json 导入数据库');
  console.log('   3. 通过邮件发送给每个创作者\n');
}

main();
