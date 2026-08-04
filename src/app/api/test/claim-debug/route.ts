import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getClaimableMilestones } from "@/lib/milestones";

export async function POST(req: NextRequest) {
  try {
    const { videoId } = await req.json();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ step: "auth", error: "Unauthorized" }, { status: 403 });
    }

    // Step 1: Find creator
    let creator = await db.creator.findFirst({
      where: { userId: session.user.id },
    });
    if (!creator) {
      return NextResponse.json({
        step: "creator_lookup",
        error: "Creator not found",
        userId: session.user.id,
      });
    }

    // Step 2: Find video
    const video = await db.video.findUnique({
      where: { id: videoId },
      select: { id: true, campaignId: true, platform: true, creatorId: true, viewCount: true },
    });
    if (!video) {
      return NextResponse.json({ step: "video_lookup", error: "Video not found", videoId });
    }
    if (video.creatorId !== creator.id) {
      return NextResponse.json({
        step: "video_ownership",
        error: "Video not owned by creator",
        videoCreatorId: video.creatorId,
        sessionCreatorId: creator.id,
      });
    }

    // Step 3: Get claimable milestones
    const claimable = await getClaimableMilestones(creator.id, video.campaignId, video.platform);
    const unclaimed = claimable.filter((m) => !m.isClaimed && m.totalViews >= m.viewThreshold);

    // Step 4: Check reward scheme
    const creatorData = await db.creator.findUnique({ where: { id: creator.id } });

    return NextResponse.json({
      step: "success",
      debug: {
        videoId: video.id,
        videoViewCount: video.viewCount,
        campaignId: video.campaignId,
        platform: video.platform,
        creatorId: creator.id,
        rewardScheme: creatorData?.rewardScheme || null,
        claimableCount: claimable.length,
        unclaimedCount: unclaimed.length,
        claimable: claimable.slice(0, 3), // Show first 3
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        step: "error",
        error: message,
        stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : "") : undefined,
      },
      { status: 500 }
    );
  }
}
