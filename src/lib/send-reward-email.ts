export async function sendRewardEmail(
  to: string,
  type: "SPECIAL" | "MILESTONE" | "SHOP",
  data: any
) {
  console.log(`[Email] ===== START SEND ===== `);
  console.log(`[Email] Type: ${type}`);
  console.log(`[Email] Recipient: ${to}`);
  console.log(`[Email] Data:`, data);

  const subjects = {
    SPECIAL: "🎁 Reward Unlocked!",
    MILESTONE: "🎬 Congratulations! Milestone Reached!",
    SHOP: "📦 Your Reward Order is Ready!",
  };

  const texts = {
    SPECIAL: `Hi Creator,\n\nCongratulations! You've earned ${data.diamonds} 💎 for "${data.rewardName}"!\n\nCheck your game account to claim your reward.\n\nGalaxy Defense Creator Program`,
    MILESTONE: `Hi Creator,\n\nCongratulations! You reached ${data.views} views! 🚀\n\nYou've earned ${data.diamonds} 💎!\n\nLog into your game account to claim.\n\nGalaxy Defense Creator Program`,
    SHOP: `Hi Creator,\n\nYour reward order is ready! 🎁\n\nRedemption Code: ${data.code}\nItems: ${data.items.join(", ")}\n\nValid for 30 days.\n\nGalaxy Defense Creator Program`,
  };

  // Validate email
  if (!to || to.trim() === "") {
    console.error("[Email] ❌ Recipient email is empty!");
    return { success: false, reason: "empty_email" };
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("[Email] ❌ Gmail credentials not configured");
    console.warn("[Email] GMAIL_USER:", !!process.env.GMAIL_USER);
    console.warn("[Email] GMAIL_APP_PASSWORD:", !!process.env.GMAIL_APP_PASSWORD);
    return { success: false, reason: "no_gmail" };
  }

  try {
    console.log(`[Email] ✓ Creating nodemailer transporter`);

    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    console.log(`[Email] ✓ Transporter created, sending...`);

    const result = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,  // 发给真实创作者
      subject: subjects[type],
      text: texts[type],
    });

    console.log(`[Email] ✅ SUCCESS - Message ID: ${result.messageId}`);
    return { success: true, result };
  } catch (error: any) {
    console.error(`[Email] ❌ ERROR: ${error.message}`);
    console.error(`[Email] Full error:`, error);
    return { success: false, error: error.message };
  }
}
