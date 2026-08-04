import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform");
    const campaignId = searchParams.get("campaignId");

    const where: any = { active: 1 }; // SQLite: 1 = true, 0 = false
    if (platform) where.platform = platform;
    if (campaignId) where.campaignId = campaignId;

    const milestones = await db.milestone.findMany({
      where,
      orderBy: [{ platform: "asc" }, { viewThreshold: "asc" }],
    });

    return NextResponse.json(milestones);
  } catch (error: any) {
    console.error("Milestones API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch milestones", details: error.message },
      { status: 500 }
    );
  }
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
