import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const accountsPath = path.join(process.cwd(), "generated_accounts.json");

    if (!fs.existsSync(accountsPath)) {
      return NextResponse.json({
        error: "No generated accounts found",
      });
    }

    const accounts = JSON.parse(fs.readFileSync(accountsPath, "utf-8"));

    console.log(`Force creating ${accounts.length} accounts...`);

    let created = 0;
    let failed = 0;
    const results = [];

    for (const acc of accounts) {
      try {
        // Check if this username already exists
        const existing = await db.$queryRawUnsafe<any[]>(
          `SELECT id FROM "User" WHERE username = ?`,
          acc.username
        );

        if (existing && existing.length > 0) {
          console.log(`⏭️ ${acc.username}: Already exists`);
          results.push({
            email: acc.email,
            username: acc.username,
            status: "already_exists",
          });
          continue;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(acc.password, 10);

        // Create user
        const userId = crypto.randomUUID();
        await db.$executeRawUnsafe(
          `INSERT INTO "User" (id, email, username, passwordHash, role, createdAt)
           VALUES (?, ?, ?, ?, 'CREATOR', datetime('now'))`,
          userId,
          acc.email,
          acc.username,
          passwordHash
        );

        // Create creator
        await db.$executeRawUnsafe(
          `INSERT INTO "Creator" (id, userId, displayName, creatorCode, status, createdAt)
           VALUES (?, ?, ?, ?, 'ACTIVE', datetime('now'))`,
          crypto.randomUUID(),
          userId,
          acc.discord,
          acc.creatorCode
        );

        console.log(`✅ Created ${acc.username}`);
        created++;
        results.push({
          email: acc.email,
          username: acc.username,
          status: "created",
        });
      } catch (err: any) {
        console.error(`❌ ${acc.username}: ${err.message}`);
        failed++;
        results.push({
          email: acc.email,
          username: acc.username,
          status: "failed",
          error: err.message,
        });
      }
    }

    console.log(`Summary - Created: ${created}, Failed: ${failed}`);

    return NextResponse.json({
      summary: {
        total: accounts.length,
        created,
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
