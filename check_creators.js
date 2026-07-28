require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@libsql/client');

async function check() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  
  console.log('[📊 CREATORS EMAIL CHECK]\n');
  
  try {
    // Count total creators
    const total = await db.execute('SELECT COUNT(*) as count FROM Creator');
    const totalCreators = total.rows[0]?.count || 0;
    console.log(`Total creators: ${totalCreators}\n`);
    
    // Get creators with their emails
    const result = await db.execute(`
      SELECT c.displayName, c.creatorCode, u.email
      FROM Creator c
      LEFT JOIN User u ON c.userId = u.id
      ORDER BY c.displayName
    `);
    
    const hasEmail = result.rows.filter(r => r.email).length;
    const noEmail = result.rows.filter(r => !r.email).length;
    
    console.log(`✅ With email: ${hasEmail}`);
    console.log(`❌ No email: ${noEmail}`);
    console.log(`📊 Coverage: ${totalCreators > 0 ? ((hasEmail / totalCreators) * 100).toFixed(1) : 0}%\n`);
    
    if (noEmail > 0) {
      console.log('Creators without email:');
      result.rows.filter(r => !r.email).forEach(c => {
        console.log(`  - ${c.displayName} (${c.creatorCode})`);
      });
    } else {
      console.log('✅ All creators have email addresses!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

check();
