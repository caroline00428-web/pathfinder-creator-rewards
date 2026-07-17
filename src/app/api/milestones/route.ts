import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");
  const campaignId = searchParams.get("campaignId");

  const where: any = { active: true };
  if (platform) where.platform = platform;
  if (campaignId) where.campaignId = campaignId;

  const milestones = await db.milestone.findMany({
    where,
    include: { campaign: { select: { name: true } } },
    orderBy: [{ platform: "asc" }, { viewThreshold: "asc" }],
  });

  return NextResponse.json(milestones);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { campaignId, platform, viewThreshold, creditsAwarded } = await req.json();

  if (!platform || !viewThreshold || !creditsAwarded) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const milestone = await db.milestone.create({
    data: {
      campaignId: campaignId || null,
      platform,
      viewThreshold,
      creditsAwarded,
    },
  });

  return NextResponse.json(milestone, { status: 201 });
}
