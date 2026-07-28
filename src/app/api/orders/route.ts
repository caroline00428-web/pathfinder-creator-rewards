import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrCreateCreator } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const where: any = {};
  if (session.user.role !== "ADMIN") {
    const creator = await getOrCreateCreator();
    if (!creator) return NextResponse.json({ error: "Creator not found" }, { status: 403 });
    where.creatorId = creator.id;
  }

  const orders = await db.rewardOrder.findMany({
    where,
    include: { items: true, creator: { select: { displayName: true, creatorCode: true, playerId: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}
