import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { extractYouTubeId } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.creatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { url, platform } = await req.json();
  if (!url || !platform) {
    return NextResponse.json({ error: "Missing url or platform" }, { status: 400 });
  }

  // TikTok: no automatic fetch available, return manual prompt
  if (platform === "TIKTOK") {
    return NextResponse.json({
      platform: "TIKTOK",
      message: "TikTok requires manual entry. Please enter the publish date from your TikTok app.",
      requiresManualEntry: true,
    });
  }

  // YouTube: try API if key is configured
  const apiKey = process.env.YOUTUBE_API_KEY;
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return NextResponse.json({ error: "Could not extract YouTube video ID from URL" }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({
      platform: "YOUTUBE",
      videoId,
      message: "YouTube API key not configured. Please enter the publish date manually.",
      requiresManualEntry: true,
    });
  }

  try {
    const ytUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
    const ytRes = await fetch(ytUrl);

    if (!ytRes.ok) {
      return NextResponse.json({
        platform: "YOUTUBE",
        videoId,
        message: `YouTube API returned error ${ytRes.status}. Please enter manually.`,
        requiresManualEntry: true,
      });
    }

    const ytData = await ytRes.json();
    if (!ytData.items || ytData.items.length === 0) {
      return NextResponse.json({
        platform: "YOUTUBE",
        videoId,
        message: "Video not found on YouTube. It may be private or deleted.",
        requiresManualEntry: true,
      });
    }

    const snippet = ytData.items[0].snippet;
    return NextResponse.json({
      platform: "YOUTUBE",
      videoId,
      title: snippet.title,
      channelTitle: snippet.channelTitle,
      publishedAt: snippet.publishedAt, // ISO 8601 format
      thumbnailUrl: snippet.thumbnails?.default?.url || snippet.thumbnails?.medium?.url,
      requiresManualEntry: false,
    });
  } catch (error: any) {
    return NextResponse.json({
      platform: "YOUTUBE",
      videoId,
      message: `Fetch failed: ${error.message}. Please enter manually.`,
      requiresManualEntry: true,
    });
  }
}
