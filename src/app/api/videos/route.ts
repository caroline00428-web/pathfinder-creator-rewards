import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrCreateCreator } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { isValidVideoUrl, isWithinCampaignPeriod, extractYouTubeId, extractTikTokId } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");
  const where: any = {};
  if (platform) where.platform = platform;

  // Non-admin: filter to own videos using session.user.creatorId
  if (session.user.role !== "ADMIN") {
    if (!session.user.creatorId) {
      return NextResponse.json({ error: "Creator not found" }, { status: 403 });
    }
    where.creatorId = session.user.creatorId;
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
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const creator = await getOrCreateCreator();
  if (!creator) return NextResponse.json({ error: "Creator not found" }, { status: 403 });
  const creatorId = creator.id;

  const { campaignId, platform, url, uploadTime, title } = await req.json();
  if (!campaignId || !platform || !url || !uploadTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!isValidVideoUrl(url, platform)) {
    return NextResponse.json({ error: `Invalid ${platform} URL` }, { status: 400 });
  }

  const existing = await db.video.findFirst({ where: { creatorId, url } });
  if (existing) return NextResponse.json({ error: "You have already submitted this video URL" }, { status: 409 });

  const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || !campaign.active) return NextResponse.json({ error: "Campaign not found or inactive" }, { status: 400 });

  const uploadDate = new Date(uploadTime);
  const eligible = isWithinCampaignPeriod(uploadDate, campaign.startTime, campaign.endTime);
  const eligibilityStatus = eligible ? "ELIGIBLE" : "INELIGIBLE";
  const externalVideoId = platform === "YOUTUBE" ? extractYouTubeId(url) : extractTikTokId(url);

  const video = await db.video.create({
    data: {
      creatorId,
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
