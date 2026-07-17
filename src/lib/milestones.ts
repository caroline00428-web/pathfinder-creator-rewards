import { db } from "./db";

export interface ClaimableMilestone {
  milestoneId: string;
  platform: string;
  viewThreshold: number;
  creditsAwarded: number;
  isClaimed: boolean;
}

export interface ClaimResult {
  success: boolean;
  error?: string;
  creditsAwarded?: number;
}

export async function getClaimableMilestones(
  videoId: string
): Promise<ClaimableMilestone[]> {
  const video = await db.video.findUnique({
    where: { id: videoId },
    include: { campaign: true },
  });

  if (!video) throw new Error("Video not found");

  // Get all active milestones for the video's platform
  const milestones = await db.milestone.findMany({
    where: {
      platform: video.platform,
      active: true,
      OR: [
        { campaignId: video.campaignId },
        { campaignId: null }, // global milestones
      ],
    },
    orderBy: { viewThreshold: "asc" },
  });

  // Get claimed milestones for this video
  const claimed = await db.milestoneClaim.findMany({
    where: { videoId },
    select: { milestoneId: true },
  });

  const claimedIds = new Set(claimed.map((c) => c.milestoneId));

  return milestones.map((m) => ({
    milestoneId: m.id,
    platform: m.platform,
    viewThreshold: m.viewThreshold,
    creditsAwarded: m.creditsAwarded,
    isClaimed: claimedIds.has(m.id),
  }));
}

export async function claimMilestone(
  videoId: string,
  milestoneId: string,
  creatorId: string
): Promise<ClaimResult> {
  // Verify video belongs to creator
  const video = await db.video.findUnique({
    where: { id: videoId },
  });

  if (!video || video.creatorId !== creatorId) {
    return { success: false, error: "Video not found" };
  }

  // Check eligibility
  if (video.eligibilityStatus === "INELIGIBLE") {
    return { success: false, error: "Video is not eligible for rewards" };
  }

  // Get milestone
  const milestone = await db.milestone.findUnique({
    where: { id: milestoneId },
  });

  if (!milestone || !milestone.active) {
    return { success: false, error: "Milestone not found or inactive" };
  }

  // Check platform match
  if (milestone.platform !== video.platform) {
    return { success: false, error: "Milestone platform does not match video platform" };
  }

  // Check view threshold
  if (video.viewCount < milestone.viewThreshold) {
    return {
      success: false,
      error: `Video has ${video.viewCount} views, needs ${milestone.viewThreshold}`,
    };
  }

  // Check for duplicate claim (also enforced by unique constraint)
  const existing = await db.milestoneClaim.findUnique({
    where: {
      videoId_milestoneId: {
        videoId,
        milestoneId,
      },
    },
  });

  if (existing) {
    return { success: false, error: "Milestone already claimed for this video" };
  }

  // Perform claim in a transaction
  try {
    const result = await db.$transaction(async (tx) => {
      // Create claim
      const claim = await tx.milestoneClaim.create({
        data: {
          creatorId,
          videoId,
          milestoneId,
          platform: video.platform,
          creditsAwarded: milestone.creditsAwarded,
        },
      });

      // Credit wallet
      await tx.creditWallet.upsert({
        where: { creatorId },
        create: { creatorId, balance: milestone.creditsAwarded },
        update: { balance: { increment: milestone.creditsAwarded } },
      });

      // Create transaction record
      await tx.creditTransaction.create({
        data: {
          creatorId,
          amount: milestone.creditsAwarded,
          type: "MILESTONE_REWARD",
          reason: `Milestone reward: ${milestone.viewThreshold.toLocaleString()} views on ${video.platform}`,
          relatedVideoId: videoId,
        },
      });

      return claim;
    });

    return {
      success: true,
      creditsAwarded: result.creditsAwarded,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Claim failed";
    // Check for unique constraint violation
    if (message.includes("Unique constraint")) {
      return { success: false, error: "Milestone already claimed for this video" };
    }
    return { success: false, error: message };
  }
}
