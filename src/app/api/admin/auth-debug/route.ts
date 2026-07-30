import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    console.log("=== Authorize Debug ===");
    console.log("Username:", username);
    console.log("Password length:", password?.length);

    if (!username || !password) {
      return NextResponse.json({ error: "Missing credentials" });
    }

    // Try to find user
    try {
      const user = await db.user.findUnique({
        where: { username },
      });

      if (!user) {
        return NextResponse.json({
          error: "User not found",
          step: "user_lookup",
          username,
        });
      }

      console.log("User found:", user.username);

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

      console.log("Password valid");

      // Get creator
      let creatorId = undefined;
      try {
        const creator = await db.$queryRawUnsafe<any[]>(
          `SELECT id FROM "Creator" WHERE userId = ? LIMIT 1`,
          user.id
        );
        creatorId = creator?.[0]?.id;
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
