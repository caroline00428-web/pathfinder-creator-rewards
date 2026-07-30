#!/usr/bin/env node

/**
 * 将新凭证导入数据库
 * 更新现有邮箱对应的 User 账户的 username 和 passwordHash
 */

require('dotenv').config({ path: '.env' });

const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');

async function main() {
  console.log('🔧 将新凭证导入数据库\n');

  const credentials = JSON.parse(
    fs.readFileSync('./new_creator_credentials.json', 'utf-8')
  );

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

  console.log(`准备更新 ${credentials.length} 个账户\n`);

  const results = {
    updated: [],
    failed: [],
  };

  for (let i = 0; i < credentials.length; i++) {
    const cred = credentials[i];
    process.stdout.write(`[${i + 1}/${credentials.length}] ${cred.email}... `);

    try {
      // 生成密码哈希
      const passwordHash = await bcrypt.hash(cred.password, 12);

      // 更新 User 表
      const result = await dbClient.execute({
        sql: `UPDATE "User" SET username = ?, passwordHash = ? WHERE email = ?`,
        args: [cred.username, passwordHash, cred.email],
      });

      if (result.rowsAffected === 0) {
        console.log('⚠️  未找到');
        results.failed.push({
          email: cred.email,
          error: 'Email not found in User table',
        });
      } else {
        console.log('✅');
        results.updated.push(cred.email);
      }
    } catch (error) {
      console.log(`❌ ${error.message}`);
      results.failed.push({
        email: cred.email,
        error: error.message,
      });
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 导入结果\n');
  console.log(`✅ 更新成功: ${results.updated.length}`);
  console.log(`❌ 失败: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ 失败的账户:');
    results.failed.forEach((f) => {
      console.log(`   • ${f.email}: ${f.error}`);
    });
  }

  console.log('\n🎉 完成！');
  console.log('\n✅ 所有账户已更新新的用户名和密码');
  console.log('📧 可以发送邮件给创作者，提供新凭证\n');
}

main().catch((error) => {
  console.error('❌ 错误:', error);
  process.exit(1);
});
