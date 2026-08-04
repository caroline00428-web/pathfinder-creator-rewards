import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform");
    const campaignId = searchParams.get("campaignId");

    // Build filter
    const where: any = {};
    if (platform) where.platform = platform;
    if (campaignId) where.campaignId = campaignId;
    where.active = true;

    const milestones = await db.milestone.findMany({
      where,
      select: {
        id: true,
        platform: true,
        viewThreshold: true,
        creditsAwarded: true,
        active: true,
        campaignId: true,
      },
      orderBy: [{ platform: "asc" }, { viewThreshold: "asc" }],
    });

    return NextResponse.json(milestones);
  } catch (error: any) {
    console.error("Milestones API error:", error);
    // Return empty array on error to avoid breaking UI
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
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
        active: true,
      },
    });

    return NextResponse.json(milestone, { status: 201 });
  } catch (error: any) {
    console.error("Create milestone error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

