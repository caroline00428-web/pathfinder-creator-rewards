require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@libsql/client');

async function check() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  
  try {
    console.log('[CHECK] 查询创作者和邮箱数据...\n');
    
    const result = await db.execute(`
      SELECT c.displayName, c.creatorCode, u.email, u.username, c.createdAt
      FROM Creator c
      LEFT JOIN User u ON c.userId = u.id
      ORDER BY c.createdAt DESC
      LIMIT 50
    `);

    console.log(`找到 ${result.rows.length} 个创作者:\n`);
    
    result.rows.forEach((row, i) => {
      const displayName = row.displayName;
      const creatorCode = row.creatorCode;
      const email = row.email;
      const username = row.username;
      const createdAt = row.createdAt;
      
      console.log(`${i+1}. ${displayName}`);
      console.log(`   邮箱: ${email || '❌ 无邮箱'}`);
      console.log(`   用户名: ${username || '❌'}`);
      console.log(`   创作者代码: ${creatorCode}`);
      console.log(`   创建时间: ${createdAt?.toString().split('T')[0] || 'N/A'}\n`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

check();
