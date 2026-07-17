import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { status, viewCount } = await req.json();

  const data: any = {};
  if (status) data.status = status;
  if (viewCount !== undefined) {
    data.viewCount = viewCount;
    data.lastSyncedAt = new Date();
  }

  const video = await db.video.update({ where: { id }, data });

  // Record view count history
  if (viewCount !== undefined) {
    await db.viewCountHistory.create({
      data: {
        videoId: id,
        viewCount,
        source: "MANUAL",
        recordedBy: session.user.id,
      },
    });
  }

  return NextResponse.json(video);
}
