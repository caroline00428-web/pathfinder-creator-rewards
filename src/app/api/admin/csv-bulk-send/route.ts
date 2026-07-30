import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

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

  const text = `Welcome to the Galaxy Defense Creator Program!

Your account has been successfully created. Here is your login information:

Discord Username: ${discordName}
Username: ${username}
Password: ${password}
Creator Code: ${creatorCode}

Login URL: https://creator-reward-platform.vercel.app/login

Please keep your login information safe. If you have any questions, please contact us.

Galaxy Defense Creator Program`;

  const result = await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: "🎮 Galaxy Defense Creator Account - Login Information",
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
          // Hash the password
          const passwordHash = await bcrypt.hash(account.password, 10);

          // Create User record
          const user = await db.user.create({
            data: {
              email,
              username,
              passwordHash,
              role: "CREATOR",
            },
          });

          // Create Creator record
          await db.creator.create({
            data: {
              userId: user.id,
              displayName: discordName,
              creatorCode,
            },
          });

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

          console.log(`[CSV] ✅ Created user and sent to ${email}`);
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
