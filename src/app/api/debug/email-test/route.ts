import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const testEmail = searchParams.get("email") || "1538308476@qq.com";

  console.log(`[DEBUG] Testing email send to: ${testEmail}`);
  console.log(`[DEBUG] GMAIL_USER: ${process.env.GMAIL_USER}`);
  console.log(`[DEBUG] GMAIL_APP_PASSWORD exists: ${!!process.env.GMAIL_APP_PASSWORD}`);

  try {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const result = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: testEmail,
      subject: `🧪 Debug Email Test - ${new Date().toISOString()}`,
      text: `This is a test email sent at ${new Date().toISOString()}\n\nIf you receive this, email system is working!\n\nDEBUG INFO:\n- From: ${process.env.GMAIL_USER}\n- To: ${testEmail}`,
    });

    console.log(`✅ [DEBUG] Email sent successfully to ${testEmail}`);
    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      from: process.env.GMAIL_USER,
      to: testEmail,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(`❌ [DEBUG] Failed to send email:`, error.message);
    return NextResponse.json({
      success: false,
      error: error.message,
      from: process.env.GMAIL_USER,
      to: testEmail,
    }, { status: 500 });
  }
}
