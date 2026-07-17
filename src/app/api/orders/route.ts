import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const where: any = {};

  if (session.user.role === "CREATOR" && session.user.creatorId) {
    where.creatorId = session.user.creatorId;
  }

  const orders = await db.rewardOrder.findMany({
    where,
    include: {
      items: true,
      creator: { select: { displayName: true, creatorCode: true, playerId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}
