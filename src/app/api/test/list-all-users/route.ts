import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const users = await db.$queryRawUnsafe<any[]>(
      `SELECT id, username, email FROM "User" LIMIT 50`
    );

    return NextResponse.json({
      total: users.length,
      users: users.map(u => ({
        username: u.username,
        email: u.email,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
    });
  }
}
