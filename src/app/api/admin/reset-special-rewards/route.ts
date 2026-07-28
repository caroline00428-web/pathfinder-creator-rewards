import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Get all non-PENDING applications (APPROVED, SENT, REJECTED)
    const toReset = await db.specialRewardApplication.findMany({
      where: {
        status: {
          not: "PENDING",
        },
      },
    });

    console.log(`[RESET] Found ${toReset.length} applications to reset`);

    // Reset all to PENDING
    const result = await db.specialRewardApplication.updateMany({
      where: {
        status: {
          not: "PENDING",
        },
      },
      data: {
        status: "PENDING",
        adminNotes: null,
        reviewedAt: null,
      },
    });

    console.log(`[RESET] Successfully reset ${result.count} applications`);

    // Also need to revert wallet credits that were added
    // Get all applications that were SENT and deduct their rewards
    const sentApps = await db.specialRewardApplication.findMany({
      where: { status: "PENDING" }, // Now all are PENDING after update
      include: { creator: true, reward: true },
    });

    // For each creator that received credits from APPROVED apps,
    // we should have recorded it in creditTransaction with type SPECIAL_REWARD
    const specialRewardTxns = await db.creditTransaction.findMany({
      where: { type: "SPECIAL_REWARD" },
    });

    console.log(`[RESET] Found ${specialRewardTxns.length} special reward transactions`);
    console.log(`[RESET] Note: Credit wallets NOT auto-reverted (manual review recommended)`);

    return NextResponse.json({
      success: true,
      message: `Reset ${result.count} applications to PENDING`,
      applicationsReset: result.count,
      specialRewardTransactions: specialRewardTxns.length,
      warning: "Credit wallets were not automatically reverted. Review manually if needed.",
    });
  } catch (error: any) {
    console.error("[RESET] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
