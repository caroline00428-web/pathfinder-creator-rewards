require('dotenv').config({path:'.env.local'});
const { createClient } = require('@libsql/client');

async function main() {
  const c = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // 检查是否有 CreatorAccount 表（存储明文密码）
  try {
    const r = await c.execute('SELECT * FROM "CreatorAccount" LIMIT 1');
    console.log('CreatorAccount exists:', r.rows.length, 'rows');
    if (r.rows.length > 0) {
      console.log('Columns:', Object.keys(r.rows[0]));
      console.log('Sample:', JSON.stringify(r.rows[0]));
    }
  } catch (e) {
    console.log('CreatorAccount table:', e.message);
  }

  // 检查 User 表是否有额外的密码相关字段
  try {
    const cols = await c.execute('PRAGMA table_info("User")');
    console.log('\nUser columns:', cols.rows.map(r => r.name));
  } catch (e) {
    console.log('PRAGMA failed:', e.message);
  }

  // 列出所有用户和邮箱（密码已加密无法反推）
  console.log('\n=== 线上用户列表 (无法反推密码) ===');
  const users = await c.execute('SELECT username, email, role FROM "User" ORDER BY username');
  for (const u of users.rows) {
    console.log(`${u.username} | ${u.email} | ${u.role}`);
  }
}

main().catch(e => console.error(e.message));
