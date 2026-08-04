const https = require('https');

const data = JSON.stringify({
  username: 'foko300_9689',
  password: '968925E5',
});

const url = 'creator-reward-platform-ew7hj8evy-caroline00428-7478s-projects.vercel.app';

const options = {
  hostname: url,
  path: '/api/auth/callback/credentials',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers));
  let body = '';
  res.on('data', (d) => { body += d; });
  res.on('end', () => {
    console.log('Body:', body);
    
    // Also try the initial CSRF endpoint
    const opts2 = {
      hostname: url,
      path: '/api/auth/csrf',
      method: 'GET',
    };
    https.get(opts2, (res2) => {
      let b2 = '';
      res2.on('data', d => b2 += d);
      res2.on('end', () => {
        console.log('\nCSRF:', b2);
      });
    });
  });
});

req.on('error', (e) => console.error('Error:', e));
req.write(data);
req.end();
