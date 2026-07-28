import { NextRequest, NextResponse } from "next/server";

// 不需要认证的测试端点
export async function POST(req: NextRequest) {
  try {
    console.log("[TEST-EMAIL] ========== START ==========");
    console.log("[TEST-EMAIL] Time:", new Date().toISOString());
    console.log("[TEST-EMAIL] GMAIL_USER set:", !!process.env.GMAIL_USER);
    console.log("[TEST-EMAIL] GMAIL_APP_PASSWORD set:", !!process.env.GMAIL_APP_PASSWORD);

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error("[TEST-EMAIL] Missing credentials");
      return NextResponse.json({
        success: false,
        error: "Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables",
      }, { status: 500 });
    }

    console.log("[TEST-EMAIL] Creating transporter...");
    const nodemailer = require("nodemailer");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    console.log("[TEST-EMAIL] Verifying transporter connection...");
    await transporter.verify();
    console.log("[TEST-EMAIL] ✅ Connection verified");

    console.log("[TEST-EMAIL] Sending test email...");
    const result = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: "1538308476@qq.com",
      subject: "🧪 Creator Reward Platform Test Email",
      text: `Test Email\n\nSent at: ${new Date().toISOString()}\n\nIf you receive this, the email system works!`,
    });

    console.log("[TEST-EMAIL] ✅ Email sent successfully");
    console.log("[TEST-EMAIL] Response:", result.response);

    return NextResponse.json({
      success: true,
      message: "Email sent successfully!",
      messageId: result.messageId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[TEST-EMAIL] ❌ Error:", error.message);
    console.error("[TEST-EMAIL] Full error:", JSON.stringify(error, null, 2));

    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.response || error.toString(),
    }, { status: 500 });
  }
}

// GET 也支持（浏览器直接访问）
export async function GET(req: NextRequest) {
  return POST(req);
}
