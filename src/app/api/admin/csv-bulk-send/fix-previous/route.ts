import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    console.log("[FIX] Starting to fix previous sent emails...");

    // Get all used passwords that don't have corresponding User records
    const usedAccounts = await db.$queryRawUnsafe<any[]>(`
      SELECT id, username, password, email, discordName
      FROM CreatorAccount
      WHERE used = true AND email IS NOT NULL AND email != ''
      ORDER BY usedAt ASC
    `);

    console.log(`[FIX] Found ${usedAccounts.length} used accounts`);

    const results: any[] = [];
    let created = 0;
    let skipped = 0;

    for (const account of usedAccounts) {
      try {
        // Check if user already exists
        const existingUser = await db.user.findUnique({
          where: { username: account.username },
        });

        if (existingUser) {
          console.log(`[FIX] User ${account.username} already exists, skipping`);
          results.push({
            email: account.email,
            username: account.username,
            status: "skipped",
            reason: "User already exists",
          });
          skipped++;
          continue;
        }

        // Hash the password
        const passwordHash = await bcrypt.hash(account.password, 10);

        // Create User record
        const user = await db.user.create({
          data: {
            email: account.email,
            username: account.username,
            passwordHash,
            role: "CREATOR",
          },
        });

        // Create Creator record
        await db.creator.create({
          data: {
            userId: user.id,
            displayName: account.discordName || account.username,
            creatorCode: `GDP_${(account.discordName || account.username).toUpperCase().slice(0, 12)}_${account.password.slice(0, 4)}`,
          },
        });

        console.log(`[FIX] ✅ Created user for ${account.email}`);
        results.push({
          email: account.email,
          username: account.username,
          status: "created",
        });
        created++;
      } catch (err: any) {
        console.error(`[FIX] ❌ Failed for ${account.email}:`, err.message);
        results.push({
          email: account.email,
          username: account.username,
          status: "failed",
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      summary: {
        total: usedAccounts.length,
        created,
        skipped,
        failed: results.filter((r) => r.status === "failed").length,
      },
      results,
    });
  } catch (error: any) {
    console.error("[FIX] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
