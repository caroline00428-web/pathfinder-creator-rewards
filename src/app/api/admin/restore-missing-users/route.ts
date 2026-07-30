import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Create natthoff and other missing users directly in production
    const missingUsers = [
      {
        username: "natthoff_56A7",
        password: "56A759E4F545",
        email: "nonpoe@hotmail.com",
        discordName: "natthoff",
        creatorCode: "GDP_NATTHOFF_56A7",
      },
    ];

    const results = [];
    let created = 0;
    let skipped = 0;

    for (const userData of missingUsers) {
      try {
        // Check if exists
        const existing = await db.$queryRawUnsafe<any[]>(
          `SELECT id FROM "User" WHERE username = ?`,
          userData.username
        );

        if (existing && existing.length > 0) {
          console.log(`⏭️ ${userData.username}: Already exists`);
          skipped++;
          results.push({
            username: userData.username,
            status: "skipped",
            reason: "already_exists",
          });
          continue;
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

        console.log(`✅ Created ${userData.username}`);
        created++;
        results.push({
          username: userData.username,
          status: "created",
          email: userData.email,
        });
      } catch (err: any) {
        console.error(`❌ ${userData.username}: ${err.message}`);
        results.push({
          username: userData.username,
          status: "failed",
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      summary: {
        total: missingUsers.length,
        created,
        skipped,
        failed: results.filter((r) => r.status === "failed").length,
      },
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
