#!/usr/bin/env node

/**
 * 验证所有恢复的账户是否能够正常登录
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');

async function main() {
  const dbClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log('🧪 验证账户登录功能...\n');

  // 读取账户报告文件来获取所有用户名和密码
  const content = fs.readFileSync('./accounts_report.txt', 'utf-8');
  const accounts = parseAccountsReport(content);

  // 额外的重复邮箱账户
  const extraAccounts = [
    { username: 'supernate0028_9AD2', password: '9AD20E03' },
    { username: 'scorp420x_1CB8', password: '1CB8F32D' },
    { username: 'supernate0028_1D85', password: '1D85F62E' },
  ];

  const allAccounts = [...accounts, ...extraAccounts];

  const results = {
    success: [],
    failed: [],
    notFound: [],
  };

  for (let i = 0; i < allAccounts.length; i++) {
    const account = allAccounts[i];
    process.stdout.write(
      `[${i + 1}/${allAccounts.length}] ${account.username}... `
    );

    try {
      // 查询用户
      const userResult = await dbClient.execute({
        sql: 'SELECT id, username, email, passwordHash FROM "User" WHERE username = ?',
        args: [account.username],
      });

      if (userResult.rows.length === 0) {
        console.log('❌ 未找到');
        results.notFound.push(account.username);
        continue;
      }

      const user = userResult.rows[0];

      // 验证密码
      const isValid = await bcrypt.compare(account.password, user.passwordHash);

      if (!isValid) {
        console.log('❌ 密码不匹配');
        results.failed.push({
          username: account.username,
          reason: 'Password mismatch',
        });
        continue;
      }

      // 验证 creator 关联
      const creatorResult = await dbClient.execute({
        sql: 'SELECT id FROM "Creator" WHERE userId = ?',
        args: [user.id],
      });

      if (creatorResult.rows.length === 0) {
        console.log('⚠️  无创作者关联');
        results.failed.push({
          username: account.username,
          reason: 'No creator association',
        });
        continue;
      }

      console.log('✅ 通过');
      results.success.push({
        username: account.username,
        email: user.email,
      });
    } catch (error) {
      console.log(`❌ 错误: ${error.message}`);
      results.failed.push({
        username: account.username,
        reason: error.message,
      });
    }
  }

  // 输出统计
  console.log('\n' + '='.repeat(60));
  console.log('📊 验证结果\n');
  console.log(`✅ 通过验证: ${results.success.length}`);
  console.log(`❌ 验证失败: ${results.failed.length}`);
  console.log(`⚠️  未找到: ${results.notFound.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ 失败的账户：');
    results.failed.forEach((acc) => {
      console.log(`   • ${acc.username}: ${acc.reason}`);
    });
  }

  if (results.notFound.length > 0) {
    console.log('\n⚠️  未找到的账户：');
    results.notFound.forEach((username) => {
      console.log(`   • ${username}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // 测试实际登录流程（模拟 NextAuth authorize 函数）
  if (results.success.length > 0) {
    console.log('\n🔐 测试登录流程（第一个账户）\n');
    const testAccount = results.success[0];
    const testCreds = allAccounts.find(
      (a) => a.username === testAccount.username
    );

    try {
      // 这是 NextAuth CredentialsProvider 的授权流程
      const userResult = await dbClient.execute({
        sql: 'SELECT id, username, email, role FROM "User" WHERE username = ?',
        args: [testCreds.username],
      });

      if (userResult.rows.length === 0) {
        console.log('❌ 用户不存在');
      } else {
        const user = userResult.rows[0];

        // 检查密码
        const userWithHash = await dbClient.execute({
          sql: 'SELECT passwordHash FROM "User" WHERE id = ?',
          args: [user.id],
        });

        if (userWithHash.rows.length > 0) {
          const isValid = await bcrypt.compare(
            testCreds.password,
            userWithHash.rows[0].passwordHash
          );

          if (!isValid) {
            console.log('❌ 密码验证失败');
          } else {
            console.log('✅ 密码验证成功');

            // 获取 creator 信息
            const creatorResult = await dbClient.execute({
              sql: 'SELECT id FROM "Creator" WHERE userId = ?',
              args: [user.id],
            });

            const creatorId =
              creatorResult.rows.length > 0 ? creatorResult.rows[0].id : null;

            console.log('\n✅ 登录流程成功！返回的用户对象：');
            console.log(`   ID: ${user.id}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Creator ID: ${creatorId || 'N/A'}`);
            console.log(`\n   → 这个用户应该重定向到 /creator/dashboard`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ 错误: ${error.message}`);
    }
  }

  console.log('\n🎉 验证完成！\n');
  process.exit(results.failed.length > 0 ? 1 : 0);
}

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

    if (trimmed.match(/^\d+\./)) {
      if (currentAccount && currentAccount.email && currentAccount.username) {
        accounts.push(currentAccount);
      }
      currentAccount = {};

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
      }
    }
  }

  if (currentAccount && currentAccount.email && currentAccount.username) {
    accounts.push(currentAccount);
  }

  return accounts;
}

main().catch((error) => {
  console.error('❌ 脚本错误:', error);
  process.exit(1);
});
