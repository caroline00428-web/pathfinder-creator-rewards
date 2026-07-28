import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCreator } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ rewardId: string }> }
) {
  const { rewardId } = await params;
  const creator = await getOrCreateCreator();
  if (!creator) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const creatorId = creator.id;

  const reward = await db.specialReward.findUnique({
    where: { id: rewardId },
    include: { campaign: true },
  });
  if (!reward || !reward.active) {
    return NextResponse.json({ error: "Reward not found" }, { status: 404 });
  }

  const { notes, videoId, followerCount, profileUrl } = await req.json();

  // Validate per reward type
  if (reward.rewardType === "AI_COMIC" && !videoId) {
    return NextResponse.json({ error: "Please select a video for AI Comic Award." }, { status: 400 });
  }

  if (reward.rewardType === "STAR_CREATOR") {
    if (!followerCount || followerCount < 5000) {
      return NextResponse.json({ error: "Star Creator Award requires 5,000+ followers." }, { status: 400 });
    }
    if (!profileUrl) {
      return NextResponse.json({ error: "Star Creator Award requires your profile page URL." }, { status: 400 });
    }
  }

  // Check duplicate (unique constraint: creatorId + rewardId + videoId)
  const existing = await db.specialRewardApplication.findFirst({
    where: videoId
      ? { creatorId, rewardId, videoId }
      : { creatorId, rewardId, videoId: null },
  });
  if (existing) {
    return NextResponse.json({ error: "You have already applied for this reward." }, { status: 409 });
  }

  // AI_COMIC: verify video belongs to creator
  if (reward.rewardType === "AI_COMIC" && videoId) {
    const video = await db.video.findUnique({ where: { id: videoId } });
    if (!video || video.creatorId !== creatorId) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }
  }

  const app = await db.specialRewardApplication.create({
    data: {
      creatorId,
      rewardId,
      campaignId: reward.campaignId,
      videoId: videoId || null,
      followerCount: followerCount || null,
      profileUrl: profileUrl || null,
      notes: notes || null,
      status: "PENDING",
    },
  });

  return NextResponse.json({ success: true, application: app }, { status: 201 });
}
