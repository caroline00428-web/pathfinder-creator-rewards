/**
 * 为线上 Turso 所有 34 个用户重置密码，导出 CSV 供手动分发
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');

function genPassword() {
  // 8位：4个随机字母 + 4个随机数字，好读好打
  const letters = crypto.randomBytes(3).toString('hex').slice(0, 4);
  const digits = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return (letters + digits).toUpperCase();
}

async function main() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // 1. 读取所有用户
  const users = await db.execute('SELECT id, username, email FROM "User" ORDER BY username');
  console.log(`找到 ${users.rows.length} 个用户\n`);

  const records = [];

  for (const user of users.rows) {
    const password = genPassword();
    const hash = bcrypt.hashSync(password, 12);
    await db.execute('UPDATE "User" SET passwordHash = ? WHERE id = ?', [hash, user.id]);
    records.push({
      username: user.username,
      email: user.email,
      password: password,
    });
    console.log(`✅ ${user.username} -> ${password}`);
  }

  // 2. 导出 CSV
  const csv = 'username,email,password\n' + records.map(r => `${r.username},${r.email},${r.password}`).join('\n');
  fs.writeFileSync('new_creator_credentials.csv', csv, 'utf8');
  fs.writeFileSync('new_creator_credentials.json', JSON.stringify(records, null, 2), 'utf8');

  console.log(`\n✅ 已完成！`);
  console.log(`   共更新 ${records.length} 个用户密码`);
  console.log(`   密码 CSV: new_creator_credentials.csv`);
  console.log(`   密码 JSON: new_creator_credentials.json`);
}

main().catch(e => { console.error(e); process.exit(1); });
