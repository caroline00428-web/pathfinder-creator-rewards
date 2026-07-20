import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Test basic query
    const userCount = await db.user.count();
    const creatorCount = await db.creator.count();
    const adminUser = await db.user.findFirst({ where: { username: "admin" }, select: { username: true, role: true } });

    return NextResponse.json({
      ok: true,
      turso: !!process.env.TURSO_DATABASE_URL,
      userCount,
      creatorCount,
      adminUser,
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: e.message,
      turso: !!process.env.TURSO_DATABASE_URL,
    }, { status: 500 });
  }
}
