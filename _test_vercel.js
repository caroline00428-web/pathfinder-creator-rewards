/**
 * 直接测试 Vercel 线上登录 API
 */
const https = require('https');

function post(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: u.hostname,
      port: 443,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('=== 测试线上 auth-debug API ===\n');
  
  try {
    const r = await post('https://creator-reward-platform.vercel.app/api/admin/auth-debug', {
      username: 'natthoff_F8F8',
      password: 'FE041335',
    });
    console.log('Status:', r.status);
    console.log('Body:', r.body.substring(0, 500));
  } catch (e) {
    console.log('Error:', e.message);
  }
  
  // 也试一下 admin
  try {
    const r2 = await post('https://creator-reward-platform.vercel.app/api/admin/auth-debug', {
      username: 'admin',
      password: '64779785',
    });
    console.log('\nAdmin test - Status:', r2.status);
    console.log('Body:', r2.body.substring(0, 500));
  } catch (e) {
    console.log('Error:', e.message);
  }
}

main();
