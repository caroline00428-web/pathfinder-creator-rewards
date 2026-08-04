import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform");
    const campaignId = searchParams.get("campaignId");

    // Use raw SQL to avoid Prisma datetime conversion errors
    let query = `SELECT id, platform, viewThreshold, creditsAwarded, active, campaignId FROM Milestone WHERE active = 1`;
    const params: any[] = [];

    if (platform) {
      query += ` AND platform = ?`;
      params.push(platform);
    }
    if (campaignId) {
      query += ` AND campaignId = ?`;
      params.push(campaignId);
    }

    query += ` ORDER BY platform ASC, viewThreshold ASC`;

    const milestones = await db.$queryRawUnsafe(query, ...params);

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

