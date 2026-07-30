import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    // Read generated accounts
    const accountsPath = path.join(process.cwd(), "generated_accounts.json");

    if (!fs.existsSync(accountsPath)) {
      return NextResponse.json({
        error: "No generated accounts found",
      });
    }

    const accounts = JSON.parse(fs.readFileSync(accountsPath, "utf-8"));

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    let sent = 0;
    let failed = 0;
    const results = [];

    for (const acc of accounts) {
      try {
        const text = `Welcome to the Galaxy Defense Creator Program!

Your account has been successfully created. Here is your login information:

Discord Username: ${acc.discord}
Username: ${acc.username}
Password: ${acc.password}
Creator Code: ${acc.creatorCode}

Login URL: https://creator-reward-platform.vercel.app/login

Please keep your login information safe. If you have any questions, please contact us.

Galaxy Defense Creator Program`;

        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: acc.email,
          subject: "🎮 Galaxy Defense Creator Account - Login Information",
          text,
        });

        console.log(`✅ Sent to ${acc.email}`);
        sent++;
        results.push({
          email: acc.email,
          status: "sent",
        });
      } catch (err: any) {
        console.error(`❌ Failed for ${acc.email}: ${err.message}`);
        failed++;
        results.push({
          email: acc.email,
          status: "failed",
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      summary: {
        total: accounts.length,
        sent,
        failed,
      },
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err.message,
      },
      { status: 500 }
    );
  }
}
