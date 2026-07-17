import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractYouTubeId } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !session.user.creatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const video = await db.video.findUnique({ where: { id } });
  if (!video || video.creatorId !== session.user.creatorId) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  if (video.platform !== "YOUTUBE") {
    return NextResponse.json({ error: "Only YouTube videos can be synced" }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      error: "YouTube API key not configured. Admin needs to set YOUTUBE_API_KEY in .env",
    }, { status: 400 });
  }

  // Extract YouTube video ID
  const videoId = video.externalVideoId || extractYouTubeId(video.url);
  if (!videoId) {
    return NextResponse.json({ error: "Could not extract YouTube video ID from URL" }, { status: 400 });
  }

  try {
    // Call YouTube Data API v3
    const ytUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoId}&key=${apiKey}`;
    const ytRes = await fetch(ytUrl);

    if (!ytRes.ok) {
      return NextResponse.json({
        error: `YouTube API error: ${ytRes.status}. Check your API key.`,
      }, { status: 502 });
    }

    const ytData = await ytRes.json();

    if (!ytData.items || ytData.items.length === 0) {
      return NextResponse.json({ error: "Video not found on YouTube. It may have been deleted or made private." }, { status: 404 });
    }

    const ytVideo = ytData.items[0];
    const newViewCount = parseInt(ytVideo.statistics.viewCount) || video.viewCount;
    const ytTitle = ytVideo.snippet?.title || video.title;

    // Update video
    const updated = await db.video.update({
      where: { id },
      data: {
        viewCount: newViewCount,
        title: ytTitle,
        externalVideoId: videoId,
        lastSyncedAt: new Date(),
        status: "SYNCED",
      },
    });

    // Record view history
    await db.viewCountHistory.create({
      data: {
        videoId: id,
        viewCount: newViewCount,
        source: "API",
        recordedBy: session.user.id,
      },
    });

    return NextResponse.json({
      message: "Views synced successfully",
      previousViewCount: video.viewCount,
      viewCount: newViewCount,
      title: ytTitle,
      lastSyncedAt: updated.lastSyncedAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: `Sync failed: ${error.message}` }, { status: 500 });
  }
}
