import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Check used accounts and their User/Creator status
    const usedAccounts = await db.$queryRawUnsafe<any[]>(`
      SELECT id, username, password, email, discordName, used, usedAt
      FROM CreatorAccount
      WHERE used = true AND email IS NOT NULL
      LIMIT 10
    `);

    const diagnostic = [];

    for (const account of usedAccounts) {
      const user = await db.user.findUnique({
        where: { username: account.username },
      });

      const creator = await db.creator.findFirst({
        where: { user: { email: account.email } },
      });

      diagnostic.push({
        username: account.username,
        email: account.email,
        discordName: account.discordName,
        createdAt: account.usedAt,
        hasUser: !!user,
        hasCreator: !!creator,
        userEmail: user?.email,
        creatorDisplayName: creator?.displayName,
      });
    }

    return NextResponse.json({ diagnostic, total: usedAccounts.length });
  } catch (error: any) {
    console.error("[DIAG] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
