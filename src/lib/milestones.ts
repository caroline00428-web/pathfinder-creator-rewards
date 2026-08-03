import { db } from "./db";

export interface ClaimableMilestone {
  milestoneId: string;
  platform: string;
  viewThreshold: number;
  creditsAwarded: number;
  isClaimed: boolean;
  totalViews: number;
}

export interface ClaimResult {
  success: boolean;
  error?: string;
  creditsAwarded?: number;
}

export async function getClaimableMilestones(
  creatorId: string,
  campaignId: string,
  platform: string
): Promise<ClaimableMilestone[]> {
  // Compute total views across ALL eligible videos in this campaign + platform for this creator
  const aggregate = await db.video.aggregate({
    where: {
      creatorId,
      campaignId,
      platform,
      eligibilityStatus: { not: "INELIGIBLE" },
    },
    _sum: { viewCount: true },
  });
  const totalViews = aggregate._sum.viewCount ?? 0;

  // Get all active milestones for the platform
  const milestones = await db.milestone.findMany({
    where: {
      platform,
      active: true,
      OR: [
        { campaignId },
        { campaignId: null }, // global milestones
      ],
    },
    orderBy: { viewThreshold: "asc" },
  });

  // Get claimed milestones for this creator (unique per creator+milestone)
  const claimed = await db.milestoneClaim.findMany({
    where: { creatorId },
    select: { milestoneId: true },
  });
  const claimedIds = new Set(claimed.map((c) => c.milestoneId));

  return milestones.map((m) => ({
    milestoneId: m.id,
    platform: m.platform,
    viewThreshold: m.viewThreshold,
    creditsAwarded: m.creditsAwarded,
    isClaimed: claimedIds.has(m.id),
    totalViews,
  }));
}

export async function claimMilestone(
  videoId: string,
  milestoneId: string,
  creatorId: string,
  rewardScheme?: string | null
): Promise<ClaimResult> {
  // Verify video belongs to creator
  const video = await db.video.findUnique({
    where: { id: videoId },
  });

  if (!video || video.creatorId !== creatorId) {
    return { success: false, error: "Video not found" };
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

  // Compute total views across ALL eligible videos in this campaign + platform
  const aggregate = await db.video.aggregate({
    where: {
      creatorId,
      campaignId: video.campaignId,
      platform: video.platform,
      eligibilityStatus: { not: "INELIGIBLE" },
    },
    _sum: { viewCount: true },
  });
  const totalViews = aggregate._sum.viewCount ?? 0;

  // Check view threshold against TOTAL views
  if (totalViews < milestone.viewThreshold) {
    return {
      success: false,
      error: `Total campaign views (${totalViews.toLocaleString()}) haven't reached ${milestone.viewThreshold.toLocaleString()} yet`,
    };
  }

  // Check for duplicate claim (now unique per creator+milestone)
  const existing = await db.milestoneClaim.findFirst({
    where: { creatorId, milestoneId },
  });

  if (existing) {
    return { success: false, error: "Milestone already claimed for this campaign" };
  }

  // Perform claim in a transaction
  try {
    let pointsAmount = 0;
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

      // POINTS: credit wallet (1 point = $1 USD, diamonds/100)
      // DIAMOND: record as order for admin manual export
      if (rewardScheme === "POINTS") {
        pointsAmount = Math.floor(milestone.creditsAwarded / 100); // e.g. 300 diamonds → $3
        await tx.creditWallet.upsert({
          where: { creatorId },
          create: { creatorId, balance: pointsAmount },
          update: { balance: { increment: pointsAmount } },
        });
        await tx.creditTransaction.create({
          data: {
            creatorId,
            amount: pointsAmount,
            type: "MILESTONE_REWARD",
            reason: `Milestone: ${milestone.viewThreshold.toLocaleString()} views → $${pointsAmount} points`,
            relatedVideoId: videoId,
          },
        });
      } else {
        // DIAMOND: create pending order for admin to export and send manually
        const creatorData = await tx.creator.findUnique({ where: { id: creatorId } });
        await tx.rewardOrder.create({
          data: {
            creatorId,
            playerId: creatorData?.playerId || "PENDING",
            totalCreditCost: milestone.creditsAwarded,
            status: "PENDING",
            items: {
              create: {
                gameItemId: `DIAMOND_${milestone.viewThreshold}`,
                itemName: `💎 Diamond Reward (${milestone.viewThreshold.toLocaleString()} views)`,
                quantity: milestone.creditsAwarded,
                creditCost: 0,
              },
            },
          },
        });
      }

      return claim;
    });

    return {
      success: true,
      creditsAwarded: rewardScheme === "POINTS" ? pointsAmount : result.creditsAwarded,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Claim failed";
    if (message.includes("Unique constraint")) {
      return { success: false, error: "Milestone already claimed for this campaign" };
    }
    console.error("Claim error:", message);
    return { success: false, error: "Claim failed. Please try again." };
  }
}
