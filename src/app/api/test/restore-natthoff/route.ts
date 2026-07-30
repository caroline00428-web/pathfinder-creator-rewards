import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";

async function sendEmail(
  email: string,
  username: string,
  password: string,
  creatorCode: string,
  discordName: string
) {
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

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: "🎮 Galaxy Defense Creator Account - Login Information",
    text,
  });
}

export async function POST(req: NextRequest) {
  try {
    // Create natthoff in production
    const userData = {
      username: "natthoff_56A7",
      password: "56A759E4F545",
      email: "nonpoe@hotmail.com",
      discordName: "natthoff",
      creatorCode: "GDP_NATTHOFF_56A7",
    };

    // Check if already exists
    const existing = await db.$queryRawUnsafe<any[]>(
      `SELECT id FROM "User" WHERE username = ?`,
      userData.username
    );

    if (existing && existing.length > 0) {
      return NextResponse.json({
        status: "skipped",
        message: "User already exists",
        username: userData.username,
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 10);

    // Create user
    const userId = crypto.randomUUID();
    await db.$executeRawUnsafe(
      `INSERT INTO "User" (id, email, username, passwordHash, role, createdAt)
       VALUES (?, ?, ?, ?, 'CREATOR', datetime('now'))`,
      userId,
      userData.email,
      userData.username,
      passwordHash
    );

    // Create creator
    await db.$executeRawUnsafe(
      `INSERT INTO "Creator" (id, userId, displayName, creatorCode, status, createdAt)
       VALUES (?, ?, ?, ?, 'ACTIVE', datetime('now'))`,
      crypto.randomUUID(),
      userId,
      userData.discordName,
      userData.creatorCode
    );

    // Send email
    try {
      await sendEmail(
        userData.email,
        userData.username,
        userData.password,
        userData.creatorCode,
        userData.discordName
      );
    } catch (emailErr: any) {
      console.error("Email send error:", emailErr.message);
      // Don't fail the whole operation if email fails
    }

    return NextResponse.json({
      status: "created",
      message: "User created and email sent",
      user: {
        username: userData.username,
        email: userData.email,
        discord: userData.discordName,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        message: err.message,
      },
      { status: 500 }
    );
  }
}
