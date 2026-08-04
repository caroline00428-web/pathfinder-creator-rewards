require('dotenv').config({path:'.env.local'});
const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

async function main() {
  const db = createClient({url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN});
  
  // 验证你的账号
  const r1 = await db.execute('SELECT passwordHash FROM "User" WHERE username=?', ['natthoff_F8F8']);
  console.log('natthoff_F8F8 -> FE041335:', bcrypt.compareSync('FE041335', r1.rows[0].passwordHash));
  
  // 验证 admin
  const r2 = await db.execute('SELECT passwordHash FROM "User" WHERE username=?', ['admin']);
  console.log('admin -> 64779785:', bcrypt.compareSync('64779785', r2.rows[0].passwordHash));
}
main();
