import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    // Test 1: Count all users
    const totalUsers = await db.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as count FROM "User"`
    );

    // Test 2: Try to find user
    const users = await db.$queryRawUnsafe<any[]>(
      `SELECT id, username, email, passwordHash, role FROM "User" WHERE username = ?`,
      username
    );

    if (users.length === 0) {
      return NextResponse.json({
        error: "User not found",
        totalUsersInDb: totalUsers[0]?.count || 0,
        username,
        searched: "case-sensitive",
      });
    }

    const user = users[0];

    // Test 3: Compare password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    // Test 4: Try the exact authorize logic
    if (!isValid) {
      return NextResponse.json({
        error: "Password mismatch",
        step: "password_check",
        found: true,
      });
    }

    // Test 5: Get creator
    const creators = await db.$queryRawUnsafe<any[]>(
      `SELECT id FROM "Creator" WHERE userId = ? LIMIT 1`,
      user.id
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        creatorId: creators?.[0]?.id,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
      step: "exception",
    });
  }
}
