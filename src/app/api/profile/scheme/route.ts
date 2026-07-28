import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  let creator = await db.creator.findFirst({ where: { userId: session.user.id } });
  if (!creator && session.user.role === "ADMIN") {
    creator = await db.creator.create({ data: { userId: session.user.id, displayName: session.user.username || "Admin", creatorCode: "ADMIN" + session.user.id.slice(-4).toUpperCase() } });
    await db.creditWallet.create({ data: { creatorId: creator.id, balance: 0 } });
  }
  if (!creator) return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  if (creator.rewardScheme) return NextResponse.json({ error: "Scheme already chosen and locked" }, { status: 400 });

  const { rewardScheme } = await req.json();
  if (!["DIAMOND", "POINTS"].includes(rewardScheme)) {
    return NextResponse.json({ error: "Must be DIAMOND or POINTS" }, { status: 400 });
  }

  await db.creator.update({ where: { id: creator.id }, data: { rewardScheme } });
  return NextResponse.json({ rewardScheme });
}
