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
  const status = searchParams.get("status");
  const campaignId = searchParams.get("campaignId");
  const rewardType = searchParams.get("rewardType");

  const where: any = {};
  if (status) where.status = status;
  if (campaignId) where.campaignId = campaignId;
  if (rewardType) where.reward = { rewardType };

  const applications = await db.specialRewardApplication.findMany({
    where,
    include: {
      creator: { select: { id: true, displayName: true, creatorCode: true, playerId: true } },
      reward: { select: { id: true, name: true, rewardType: true, diamonds: true } },
      campaign: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(applications);
}
