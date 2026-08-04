require('dotenv').config({ path: '.env' });
const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

(async () => {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const r = await db.execute({
    sql: 'SELECT username, email, "passwordHash" FROM "User" WHERE username = ?',
    args: ['foko300_9689'],
  });

  if (r.rows.length === 0) {
    console.log('[ERROR] foko300_9689 NOT FOUND in Turso!');
  } else {
    const u = r.rows[0];
    const pwOk = bcrypt.compareSync('968925E5', u['passwordHash']);
    console.log('Found:', u.username, '|', u.email, '| pw match:', pwOk);
  }

  await db.close();
})();
