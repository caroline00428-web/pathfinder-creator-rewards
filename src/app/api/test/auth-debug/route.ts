import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    let credentials;
    try {
      credentials = await req.json();
    } catch (parseErr: any) {
      return NextResponse.json({
        error: "JSON parse error: " + parseErr.message,
        step: "json_parse",
      });
    }

    const { username, password } = credentials;

    if (!username || !password) {
      return NextResponse.json({ error: "Missing credentials" });
    }

    // Try to find user - use raw SQL to debug
    try {
      const users = await db.$queryRawUnsafe<any[]>(
        `SELECT id, username, email, passwordHash, role FROM "User" WHERE username = ?`,
        username
      );

      if (users.length === 0) {
        // Try to count all users
        const allUsers = await db.$queryRawUnsafe<any[]>(
          `SELECT COUNT(*) as count FROM "User"`
        );

        return NextResponse.json({
          error: "User not found",
          step: "user_lookup",
          username,
          totalUsersInDb: allUsers[0]?.count || 0,
        });
      }

      const user = users[0];

      // Try password comparison
      let isValid = false;
      try {
        isValid = await bcrypt.compare(password, user.passwordHash);
      } catch (bcErr: any) {
        return NextResponse.json({
          error: "bcrypt error: " + bcErr.message,
          step: "bcrypt_compare",
        });
      }

      if (!isValid) {
        return NextResponse.json({
          error: "Password mismatch",
          step: "password_check",
        });
      }

      // Get creator
      let creatorId = undefined;
      try {
        const creators = await db.$queryRawUnsafe<any[]>(
          `SELECT id FROM "Creator" WHERE userId = ? LIMIT 1`,
          user.id
        );
        creatorId = creators?.[0]?.id;
      } catch (crErr: any) {
        console.error("Creator lookup error:", crErr.message);
      }

      const result = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        creatorId,
      };

      return NextResponse.json({
        success: true,
        user: result,
      });
    } catch (dbErr: any) {
      return NextResponse.json({
        error: "Database error: " + dbErr.message,
        step: "database_query",
      });
    }
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
      step: "general_error",
    });
  }
}
