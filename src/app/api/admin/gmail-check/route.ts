import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    console.log("[GMAIL_CHECK] Checking Gmail connection...");
    console.log("[GMAIL_CHECK] GMAIL_USER:", process.env.GMAIL_USER);
    console.log("[GMAIL_CHECK] GMAIL_APP_PASSWORD exists:", !!process.env.GMAIL_APP_PASSWORD);

    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    console.log("[GMAIL_CHECK] Verifying connection...");
    await transporter.verify();
    console.log("[GMAIL_CHECK] ✅ Connection verified!");

    // Try sending test email
    console.log("[GMAIL_CHECK] Sending test email...");
    const result = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: "test@example.com",
      subject: "Gmail Connection Test",
      text: `Connection test at ${new Date().toISOString()}`,
    });

    console.log("[GMAIL_CHECK] ✅ Test email sent! Message ID:", result.messageId);

    return NextResponse.json({
      success: true,
      gmail_user: process.env.GMAIL_USER,
      timestamp: new Date().toISOString(),
      messageId: result.messageId,
      message: "Gmail connection is working",
    });
  } catch (error: any) {
    console.error("[GMAIL_CHECK] ❌ Error:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        gmail_user: process.env.GMAIL_USER,
      },
      { status: 500 }
    );
  }
}
