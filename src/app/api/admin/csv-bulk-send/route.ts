import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function sendRegistrationEmail(
  email: string,
  username: string,
  password: string,
  creatorCode: string,
  discordName: string
) {
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const text = `欢迎加入 Galaxy Defense 创作者计划！

您的账户已创建完成，以下是您的登录信息：

Discord 用户名: ${discordName}
用户名: ${username}
密码: ${password}
创作者代码: ${creatorCode}

登录地址: https://creator-reward-platform.vercel.app/login

请妥善保管您的登录信息。如有问题，请联系我们。

Galaxy Defense Creator Program`;

  const result = await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: "🎮 Galaxy Defense 创作者账户 - 登录信息",
    text,
  });

  return result;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { csvData, dryRun } = await req.json();

  if (!csvData || !Array.isArray(csvData)) {
    return NextResponse.json({ error: "Invalid CSV data" }, { status: 400 });
  }

  try {
    console.log(`[CSV] Processing ${csvData.length} records (dryRun: ${dryRun})`);

    // Get unused passwords from CreatorAccount (use raw query to handle invalid dates)
    const unusedAccounts = await db.$queryRawUnsafe<any[]>(`
      SELECT id, username, password FROM CreatorAccount
      WHERE used = false
      ORDER BY id ASC
      LIMIT 10000
    `);

    console.log(`[CSV] Found ${unusedAccounts.length} unused passwords`);

    const results: any[] = [];
    let passwordIndex = 0;

    for (const row of csvData) {
      const email = row.email?.trim();
      const discordName = row.discordUsername?.trim();
      const status = row.status?.trim();

      // Skip if already SENT or no email
      if (!email || status === "SENT" || status === "ERROR") {
        if (email) {
          results.push({
            email,
            discordName,
            status: "skipped",
            reason: `Already processed (${status || "empty"})`,
          });
        }
        continue;
      }

      // Check if we have passwords left
      if (passwordIndex >= unusedAccounts.length) {
        results.push({
          email,
          discordName,
          status: "failed",
          reason: "No more passwords available",
        });
        continue;
      }

      const account = unusedAccounts[passwordIndex];
      const username = `${discordName}_${account.password.slice(0, 4)}`;
      const creatorCode = `GDP_${discordName.toUpperCase().slice(0, 12)}_${account.password.slice(0, 4)}`;

      if (dryRun) {
        results.push({
          email,
          discordName,
          username,
          creatorCode,
          password: account.password,
          status: "would_send",
        });
      } else {
        try {
          // Send email
          await sendRegistrationEmail(email, username, account.password, creatorCode, discordName);

          // Mark password as used with raw query
          await db.$executeRawUnsafe(
            `UPDATE CreatorAccount SET used = true, usedAt = ?, email = ?, discordName = ? WHERE id = ?`,
            new Date(),
            email,
            discordName,
            account.id
          );

          console.log(`[CSV] ✅ Sent to ${email}`);
          results.push({
            email,
            discordName,
            username,
            creatorCode,
            status: "sent",
          });
        } catch (err: any) {
          console.error(`[CSV] ❌ Failed for ${email}:`, err.message);
          results.push({
            email,
            discordName,
            status: "failed",
            error: err.message,
          });
          continue; // Don't increment password index if failed
        }
      }

      passwordIndex++;
    }

    const summary = {
      total: csvData.length,
      would_send: results.filter((r) => r.status === "would_send").length,
      sent: results.filter((r) => r.status === "sent").length,
      failed: results.filter((r) => r.status === "failed").length,
      skipped: results.filter((r) => r.status === "skipped").length,
    };

    console.log(`[CSV] Summary:`, summary);

    return NextResponse.json({
      summary,
      results,
      dryRun,
    });
  } catch (error: any) {
    console.error("[CSV] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
