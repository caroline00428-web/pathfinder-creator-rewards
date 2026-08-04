const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture ALL network requests for debugging
  const requests = [];
  page.on('request', req => {
    if (req.url().includes('/api/auth/')) {
      requests.push({ url: req.url(), method: req.method(), postData: req.postData(), headers: req.headers() });
    }
  });
  page.on('response', async resp => {
    if (resp.url().includes('/api/auth/')) {
      const reqInfo = requests.find(r => r.url === resp.url() && !r._response);
      if (reqInfo) reqInfo._response = resp;
      console.log('RESPONSE:', resp.status(), resp.url());
      try {
        const ct = resp.headers()['content-type'] || '';
        if (ct.includes('json') || ct.includes('text')) {
          console.log('  Body:', await resp.text());
        }
      } catch(e) {}
    }
  });

  await page.goto('https://creator-reward-platform.vercel.app/login');
  await page.waitForTimeout(1000);
  
  await page.fill('input[name="username"]', 'foko300_9689');
  await page.fill('input[name="password"]', '968925E5');
  
  console.log('--- Clicking Sign In ---');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Check for error messages on page
  const errorText = await page.textContent('.bg-red-50') || '';
  const alertText = await page.textContent('[role="alert"]') || '';
  console.log('Error on page:', errorText || alertText || 'none visible');
  
  console.log('\n--- Full page URL ---');
  console.log(await page.url());
  
  await browser.close();
})();
