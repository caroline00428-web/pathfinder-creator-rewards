import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { isValidVideoUrl, isWithinCampaignPeriod, extractYouTubeId, extractTikTokId } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");

  const where: any = {};

  // Creators see only their own videos
  if (session.user.role === "CREATOR" && session.user.creatorId) {
    where.creatorId = session.user.creatorId;
  }

  if (platform) {
    where.platform = platform;
  }

  const videos = await db.video.findMany({
    where,
    include: {
      creator: { select: { displayName: true, creatorCode: true } },
      campaign: { select: { name: true } },
      claims: { select: { milestoneId: true, creditsAwarded: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json(videos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.creatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { campaignId, platform, url, uploadTime, title } = await req.json();

  if (!campaignId || !platform || !url || !uploadTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!isValidVideoUrl(url, platform)) {
    return NextResponse.json({ error: `Invalid ${platform} URL` }, { status: 400 });
  }

  // Check for duplicate
  const existing = await db.video.findFirst({
    where: { creatorId: session.user.creatorId, url },
  });
  if (existing) {
    return NextResponse.json({ error: "You have already submitted this video URL" }, { status: 409 });
  }

  // Check campaign eligibility
  const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || !campaign.active) {
    return NextResponse.json({ error: "Campaign not found or inactive" }, { status: 400 });
  }

  const uploadDate = new Date(uploadTime);
  const eligible = isWithinCampaignPeriod(uploadDate, campaign.startTime, campaign.endTime);
  const eligibilityStatus = eligible ? "ELIGIBLE" : "INELIGIBLE";

  // Extract external video ID for API sync
  const externalVideoId = platform === "YOUTUBE" ? extractYouTubeId(url) : extractTikTokId(url);

  const video = await db.video.create({
    data: {
      creatorId: session.user.creatorId,
      campaignId,
      platform,
      url,
      title: title || null,
      externalVideoId,
      uploadTime: uploadDate,
      eligibilityStatus,
      status: eligibilityStatus === "INELIGIBLE" ? "INELIGIBLE" : "PENDING",
    },
  });

  return NextResponse.json(video, { status: 201 });
}
