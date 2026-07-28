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

  try {
    // Use raw SQL to avoid Prisma type conversion issues with followerCount
    let query = `
      SELECT
        sra.id,
        sra.rewardId,
        sra.creatorId,
        sra.campaignId,
        sra.videoId,
        CAST(sra.followerCount AS INTEGER) as followerCount,
        sra.profileUrl,
        sra.notes,
        sra.adminNotes,
        sra.status,
        sra.createdAt,
        c.id as creator_id,
        c.displayName as creator_displayName,
        c.creatorCode as creator_creatorCode,
        c.playerId as creator_playerId,
        r.id as reward_id,
        r.name as reward_name,
        r.rewardType as reward_rewardType,
        r.diamonds as reward_diamonds,
        camp.id as campaign_id,
        camp.name as campaign_name
      FROM SpecialRewardApplication sra
      JOIN Creator c ON sra.creatorId = c.id
      JOIN SpecialReward r ON sra.rewardId = r.id
      JOIN Campaign camp ON sra.campaignId = camp.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (status) {
      query += ` AND sra.status = ?`;
      params.push(status);
    }
    if (campaignId) {
      query += ` AND sra.campaignId = ?`;
      params.push(campaignId);
    }
    if (rewardType) {
      query += ` AND r.rewardType = ?`;
      params.push(rewardType);
    }

    query += ` ORDER BY sra.createdAt DESC`;

    const results = await db.$queryRawUnsafe(query, ...params);

    // Transform results to match expected format
    const applications = (results as any[]).map((row) => ({
      id: row.id,
      rewardId: row.rewardId,
      creatorId: row.creatorId,
      campaignId: row.campaignId,
      videoId: row.videoId,
      followerCount: row.followerCount,
      profileUrl: row.profileUrl,
      notes: row.notes,
      adminNotes: row.adminNotes,
      status: row.status,
      createdAt: row.createdAt,
      creator: {
        id: row.creator_id,
        displayName: row.creator_displayName,
        creatorCode: row.creator_creatorCode,
        playerId: row.creator_playerId,
      },
      reward: {
        id: row.reward_id,
        name: row.reward_name,
        rewardType: row.reward_rewardType,
        diamonds: row.reward_diamonds,
      },
      campaign: {
        id: row.campaign_id,
        name: row.campaign_name,
      },
    }));

    return NextResponse.json(applications);
  } catch (error: any) {
    console.error("[API] Error loading applications:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

