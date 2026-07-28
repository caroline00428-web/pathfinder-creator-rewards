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
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Get or find creator by userId (supports both CREATOR role and ADMIN testing)
  let creator = await db.creator.findFirst({ where: { userId: session.user.id } });
  if (!creator && session.user.role === "ADMIN") {
    creator = await db.creator.create({
      data: {
        userId: session.user.id,
        displayName: session.user.username || "Admin Creator",
        creatorCode: "ADMIN" + session.user.id.slice(-4).toUpperCase(),
      },
    });
    await db.creditWallet.create({ data: { creatorId: creator.id, balance: 0 } });
  }
  if (!creator) {
    return NextResponse.json({ error: "Creator profile not found" }, { status: 403 });
  }
  const creatorId = creator.id;

  const video = await db.video.findUnique({
    where: { id },
    select: { id: true, campaignId: true, platform: true, creatorId: true },
  });
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });
  if (video.creatorId !== creatorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const claimable = await getClaimableMilestones(
    creatorId,
    video.campaignId,
    video.platform
  );
  const unclaimed = claimable.filter(
    (m) => !m.isClaimed && m.totalViews >= m.viewThreshold
  );

  if (unclaimed.length === 0) {
    return NextResponse.json(
      { error: `No claimable milestones available. Total campaign views: ${claimable[0]?.totalViews?.toLocaleString() ?? 0}` },
      { status: 400 }
    );
  }

  // Check reward scheme — must be chosen before first claim
  const creatorData = await db.creator.findUnique({ where: { id: creatorId } });
  if (!creatorData?.rewardScheme) {
    const totalViews = claimable[0]?.totalViews ?? 0;
    return NextResponse.json({
      needSchemeChoice: true,
      totalViews,
      message: "Please choose your reward scheme before claiming: DIAMOND or POINTS. This cannot be changed later.",
    }, { status: 400 });
  }

  const toClaim = unclaimed[0];
  const result = await claimMilestone(id, toClaim.milestoneId, creatorId, creatorData.rewardScheme);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    message: "Milestone claimed",
    creditsAwarded: result.creditsAwarded,
    milestone: toClaim,
  });
}
