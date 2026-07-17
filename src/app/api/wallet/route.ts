import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.creatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const [wallet, transactions] = await Promise.all([
    db.creditWallet.findUnique({ where: { creatorId: session.user.creatorId } }),
    db.creditTransaction.findMany({
      where: { creatorId: session.user.creatorId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return NextResponse.json({
    balance: wallet?.balance ?? 0,
    transactions,
  });
}
