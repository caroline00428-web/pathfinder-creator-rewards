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

  const rewards = await db.specialReward.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(rewards);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { campaignId, rewardType, name, description, diamonds } = await req.json();
  if (!campaignId || !rewardType || !name || !diamonds) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const reward = await db.specialReward.create({
    data: { campaignId, rewardType, name, description: description || "", diamonds },
  });
  return NextResponse.json(reward, { status: 201 });
}
