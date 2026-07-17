import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getClaimableMilestones, claimMilestone } from "@/lib/milestones";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !session.user.creatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const video = await db.video.findUnique({ where: { id }, select: { viewCount: true } });
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  const claimable = await getClaimableMilestones(id);
  const unclaimed = claimable.filter((m) => !m.isClaimed && m.viewThreshold <= video.viewCount);

  if (unclaimed.length === 0) {
    return NextResponse.json({ error: "No claimable milestones available." }, { status: 400 });
  }

  const toClaim = unclaimed[0];
  const result = await claimMilestone(id, toClaim.milestoneId, session.user.creatorId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ message: "Milestone claimed", creditsAwarded: result.creditsAwarded, milestone: toClaim });
}
