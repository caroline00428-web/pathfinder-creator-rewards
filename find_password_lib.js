require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@libsql/client');

async function check() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  
  try {
    console.log('[SEARCH] 查找未使用的密码库账户...\n');
    
    const result = await db.execute(`
      SELECT id, username, password, creatorCode, used, createdAt
      FROM CreatorAccount
      WHERE used = 0
      LIMIT 20
    `);

    console.log(`找到 ${result.rows.length} 个未使用的账户\n`);
    
    if (result.rows.length > 0) {
      console.log('示例数据:');
      result.rows.slice(0, 5).forEach((row, i) => {
        console.log(`${i+1}. ID: ${row.id}`);
        console.log(`   Username: ${row.username}`);
        console.log(`   Password: ${row.password}`);
        console.log(`   CreatorCode: ${row.creatorCode}`);
        console.log(`   Used: ${row.used}\n`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

check();
