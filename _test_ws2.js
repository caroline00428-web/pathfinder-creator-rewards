// Test production login via auth-debug API
const url = 'https://creator-reward-platform.vercel.app/api/test/auth-debug';

(async () => {
  try {
    // First try GET to list users
    console.log('=== Testing GET (list users) ===');
    const r1 = await fetch(url);
    console.log('GET Status:', r1.status);
    const t1 = await r1.text();
    console.log('GET Body (first 500 chars):', t1.substring(0, 500));
    
    // Then try POST to test login
    console.log('\n=== Testing POST (login test) ===');
    const r2 = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'foko300_9689', password: '968925E5' }),
    });
    console.log('POST Status:', r2.status);
    const t2 = await r2.text();
    console.log('POST Body:', t2);
  } catch (e) {
    console.error('Fetch error:', e.message);
    console.error('This indicates the site is behind Vercel Authentication or network issue.');
    console.error('Try running this script from your own terminal to test directly.');
  }
})();
