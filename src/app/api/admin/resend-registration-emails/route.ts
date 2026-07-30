import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function sendRegistrationEmail(
  email: string,
  username: string,
  password: string,
  creatorCode: string
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

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Get all creators with their user info
    const creators = await db.creator.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    const stats = {
      total: creators.length,
      withEmail: creators.filter((c) => c.user.email).length,
      creators: creators.map((c) => ({
        id: c.id,
        displayName: c.displayName,
        creatorCode: c.creatorCode,
        username: c.user.username,
        email: c.user.email,
        createdAt: c.createdAt,
      })),
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("[REG EMAIL] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { creatorIds, startDate } = await req.json();

  try {
    console.log("[REG EMAIL] Sending registration emails...");

    // If creatorIds provided, use those; otherwise get all created after startDate
    let creators;

    if (creatorIds && Array.isArray(creatorIds) && creatorIds.length > 0) {
      creators = await db.creator.findMany({
        where: { id: { in: creatorIds } },
        include: { user: true },
      });
    } else if (startDate) {
      creators = await db.creator.findMany({
        where: {
          createdAt: { gte: new Date(startDate) },
        },
        include: { user: true },
      });
    } else {
      return NextResponse.json(
        { error: "Provide creatorIds or startDate" },
        { status: 400 }
      );
    }

    if (creators.length === 0) {
      return NextResponse.json({ error: "No creators found" }, { status: 404 });
    }

    console.log(`[REG EMAIL] Found ${creators.length} creators`);

    // Get passwords from CreatorAccount table
    const accounts = await db.$queryRawUnsafe(`
      SELECT id, username, password FROM CreatorAccount
    `) as any[];

    const accountMap = new Map(
      accounts.map((acc) => [acc.username, { username: acc.username, password: acc.password }])
    );

    const results = [];

    for (const creator of creators) {
      if (!creator.user.email) {
        console.log(`[REG EMAIL] Skipping ${creator.displayName} - no email`);
        results.push({
          creatorId: creator.id,
          displayName: creator.displayName,
          email: creator.user.email,
          status: "skipped",
          reason: "no_email",
        });
        continue;
      }

      // Get password from account
      const account = accountMap.get(creator.user.username);
      if (!account) {
        console.log(`[REG EMAIL] Skipping ${creator.displayName} - no account found`);
        results.push({
          creatorId: creator.id,
          displayName: creator.displayName,
          email: creator.user.email,
          status: "failed",
          reason: "no_account",
        });
        continue;
      }

      try {
        await sendRegistrationEmail(
          creator.user.email,
          creator.user.username,
          account.password,
          creator.creatorCode
        );

        console.log(`[REG EMAIL] ✅ Sent to ${creator.user.email}`);
        results.push({
          creatorId: creator.id,
          displayName: creator.displayName,
          email: creator.user.email,
          status: "sent",
        });
      } catch (err: any) {
        console.error(`[REG EMAIL] ❌ Failed for ${creator.displayName}:`, err.message);
        results.push({
          creatorId: creator.id,
          displayName: creator.displayName,
          email: creator.user.email,
          status: "failed",
          error: err.message,
        });
      }
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status === "failed").length;
    const skipped = results.filter((r) => r.status === "skipped").length;

    return NextResponse.json({
      summary: {
        total: creators.length,
        sent,
        failed,
        skipped,
      },
      results,
    });
  } catch (error: any) {
    console.error("[REG EMAIL] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
