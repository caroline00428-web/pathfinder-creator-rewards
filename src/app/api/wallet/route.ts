import { NextResponse } from "next/server";
import { getOrCreateCreator } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export async function GET() {
  const creator = await getOrCreateCreator();
  if (!creator) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const [wallet, transactions] = await Promise.all([
    db.creditWallet.findUnique({ where: { creatorId: creator.id } }),
    db.creditTransaction.findMany({ where: { creatorId: creator.id }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  return NextResponse.json({ balance: wallet?.balance ?? 0, transactions });
}
