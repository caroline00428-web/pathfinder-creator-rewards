#!/usr/bin/env node

/**
 * 发送创作者账户凭证邮件
 * 使用方式：
 *   node send-credentials-email.js test       # 只发送测试邮件
 *   node send-credentials-email.js send-all   # 发送给所有 29 个创作者
 */

require('dotenv').config({ path: '.env.local' });

const nodemailer = require('nodemailer');
const fs = require('fs');

async function main() {
  const mode = process.argv[2] || 'test'; // test 或 send-all

  if (!['test', 'send-all'].includes(mode)) {
    console.error('❌ 无效的模式。使用: node send-credentials-email.js [test|send-all]');
    process.exit(1);
  }

  console.log('📧 发送创作者凭证邮件\n');

  // Gmail 配置
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPassword) {
    console.error('❌ Gmail 配置未找到');
    console.error('   GMAIL_USER:', gmailUser ? '✅' : '❌');
    console.error('   GMAIL_APP_PASSWORD:', gmailPassword ? '✅' : '❌');
    process.exit(1);
  }

  console.log('Gmail 配置: ✅\n');

  // 创建邮件传输器
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
  });

  // 验证连接
  try {
    await transporter.verify();
    console.log('SMTP 连接: ✅\n');
  } catch (error) {
    console.error('❌ SMTP 连接失败:', error.message);
    process.exit(1);
  }

  // 读取凭证
  const credentials = JSON.parse(
    fs.readFileSync('./new_creator_credentials.json', 'utf-8')
  );

  // 邮件内容模板
  const emailTemplate = (cred) => `
Dear Creator,

We sincerely apologize for the confusion with the previous account credentials. Those were incorrect, and we're reaching out with the correct login information.

Your Galaxy Defense Creator Program account is now ready with verified credentials:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Your Account Credentials (Correct)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Email: ${cred.email}
Username: ${cred.username}
Password: ${cred.password}
Creator Code: ${cred.creatorCode}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Login URL: https://creator-reward-platform.vercel.app/login

What to do next:
1. Visit the login URL above
2. Enter your username and password
3. Complete your creator profile
4. Submit your first video
5. Start earning rewards!

💎 Rewards You Can Earn:
• Milestone Rewards: 300 → 30,000 diamonds
• Special Bonuses: Registration, Participation, Diligence, Star Creator, AI Comic
• Redeem for diamonds or shop points

If you have any questions or issues logging in, please reach out on Discord.

Again, we apologize for the earlier confusion. These credentials are verified and ready to use.

Best regards,
Galaxy Defense Creator Program
`;

  if (mode === 'test') {
    // 发送测试邮件
    const testEmail = '1538308476@qq.com';
    console.log('🧪 发送测试邮件到:', testEmail);
    console.log('');

    try {
      const testCred = credentials[0]; // 使用第一个真实凭证作为测试

      const mailOptions = {
        from: gmailUser,
        to: testEmail,
        subject:
          '🎬 Galaxy Defense Creator Program - Your Account Credentials (CORRECTED)',
        text: emailTemplate(testCred),
      };

      console.log('邮件内容预览:');
      console.log('━'.repeat(80));
      console.log('收件人:', testEmail);
      console.log('主题:', mailOptions.subject);
      console.log('━'.repeat(80));
      console.log(emailTemplate(testCred));
      console.log('━'.repeat(80));
      console.log('');

      console.log('发送中...\n');
      const result = await transporter.sendMail(mailOptions);

      console.log('✅ 测试邮件发送成功！');
      console.log('   Message ID:', result.messageId);
      console.log('');
    } catch (error) {
      console.error('❌ 邮件发送失败:', error.message);
      process.exit(1);
    }
  } else if (mode === 'send-all') {
    // 发送给所有创作者
    console.log(`🔄 准备发送给所有 ${credentials.length} 个创作者...\n`);

    let successCount = 0;
    let failedCount = 0;
    const failed = [];

    for (let i = 0; i < credentials.length; i++) {
      const cred = credentials[i];
      process.stdout.write(
        `[${i + 1}/${credentials.length}] ${cred.email}... `
      );

      try {
        const mailOptions = {
          from: gmailUser,
          to: cred.email,
          subject:
            '🎬 Galaxy Defense Creator Program - Your Account Credentials (CORRECTED)',
          text: emailTemplate(cred),
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅');
        successCount++;
      } catch (error) {
        console.log(`❌ ${error.message}`);
        failedCount++;
        failed.push({
          email: cred.email,
          error: error.message,
        });
      }

      // 延迟以避免限流
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // 统计
    console.log('\n' + '='.repeat(80));
    console.log('📊 邮件发送结果\n');
    console.log(`✅ 成功: ${successCount}`);
    console.log(`❌ 失败: ${failedCount}`);

    if (failed.length > 0) {
      console.log('\n失败的邮箱:');
      failed.forEach((f) => {
        console.log(`   • ${f.email}: ${f.error}`);
      });
    }

    console.log('\n🎉 完成！\n');
  }
}

main().catch((error) => {
  console.error('❌ 错误:', error);
  process.exit(1);
});
