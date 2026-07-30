import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  // List first 10 users
  try {
    const users = await db.$queryRawUnsafe<any[]>(
      `SELECT username, email FROM "User" ORDER BY username LIMIT 10`
    );

    return NextResponse.json({
      firstUsers: users.map(u => ({ username: u.username, email: u.email })),
      totalCount: users.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}

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
        // Try case-insensitive search
        const caseInsensitive = await db.$queryRawUnsafe<any[]>(
          `SELECT id, username, email, passwordHash, role FROM "User" WHERE LOWER(username) = LOWER(?)`,
          username
        );

        if (caseInsensitive.length > 0) {
          const user = caseInsensitive[0];

          const isValid = await bcrypt.compare(password, user.passwordHash);

          if (!isValid) {
            return NextResponse.json({
              error: "Password mismatch",
              step: "password_check",
            });
          }

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
            note: "Found with case-insensitive search",
          });
        }

        // Count all users
        const allUsers = await db.$queryRawUnsafe<any[]>(
          `SELECT COUNT(*) as count FROM "User"`
        );

        return NextResponse.json({
          error: "User not found",
          step: "user_lookup",
          username,
          totalUsersInDb: allUsers[0]?.count || 0,
          searched: "case-sensitive",
        });
      }

      const user = users[0];

      const isValid = await bcrypt.compare(password, user.passwordHash);

      if (!isValid) {
        return NextResponse.json({
          error: "Password mismatch",
          step: "password_check",
        });
      }

      const creators = await db.$queryRawUnsafe<any[]>(
        `SELECT id FROM "Creator" WHERE userId = ? LIMIT 1`,
        user.id
      );

      const result = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        creatorId: creators?.[0]?.id,
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
