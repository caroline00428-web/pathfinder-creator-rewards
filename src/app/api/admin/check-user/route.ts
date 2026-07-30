import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  try {
    // Find user
    const user = await db.user.findUnique({
      where: { username },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });

    // Find creator
    const creator = await db.creator.findFirst({
      where: { userId: user?.id },
      select: { id: true, displayName: true, creatorCode: true, userId: true },
    });

    // Find password record
    const passwordRec = await db.$queryRawUnsafe<any[]>(
      `SELECT username, email, discordName, used FROM CreatorAccount WHERE username = ?`,
      username
    );

    return NextResponse.json({
      user,
      creator,
      passwordRecord: passwordRec?.[0],
      found: !!user,
    });
  } catch (error: any) {
    console.error("[QUERY] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
