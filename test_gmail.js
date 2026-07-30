require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

async function test() {
  console.log('[TEST] Environment Check:');
  console.log('GMAIL_USER:', process.env.GMAIL_USER);
  console.log('GMAIL_APP_PASSWORD exists:', !!process.env.GMAIL_APP_PASSWORD);
  console.log('GMAIL_APP_PASSWORD length:', process.env.GMAIL_APP_PASSWORD?.length);
  
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    console.log('\n[TEST] Verifying transporter...');
    await transporter.verify();
    console.log('[TEST] ✅ Connection OK');
  } catch (error) {
    console.error('[TEST] ❌ Error:', error.message);
  }
  
  process.exit(0);
}

test();
