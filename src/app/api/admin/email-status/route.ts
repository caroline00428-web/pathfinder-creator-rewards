import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    console.log("[EMAIL STATUS] Checking email system status...\n");

    // Check recent SENT applications (should have emails sent)
    const sentApps = await db.specialRewardApplication.findMany({
      where: { status: "SENT" },
      include: { creator: true, reward: true },
      orderBy: { reviewedAt: "desc" },
      take: 10,
    });

    console.log(`[EMAIL STATUS] Found ${sentApps.length} applications with SENT status`);

    const sentAppsInfo = sentApps.map((app) => ({
      id: app.id,
      creator: app.creator.displayName,
      status: app.status,
      reviewedAt: app.reviewedAt,
      createdAt: app.createdAt,
      diamonds: app.reward.diamonds,
    }));

    // Check recent SENT orders (should have emails sent)
    const sentOrders = await db.rewardOrder.findMany({
      where: { status: "SENT" },
      include: { creator: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    console.log(`[EMAIL STATUS] Found ${sentOrders.length} orders with SENT status`);

    const sentOrdersInfo = sentOrders.map((order) => ({
      id: order.id,
      creator: order.creator.displayName,
      status: order.status,
      createdAt: order.createdAt,
    }));

    // Get the latest SENT application
    const latestSent = sentApps[0];

    return NextResponse.json({
      summary: {
        specialRewardsSent: sentApps.length,
        ordersSent: sentOrders.length,
        latestSentApplication: latestSent ? {
          id: latestSent.id,
          creator: latestSent.creator.displayName,
          reviewedAt: latestSent.reviewedAt,
        } : null,
      },
      specialRewards: sentAppsInfo,
      orders: sentOrdersInfo,
      timestamp: new Date().toISOString(),
      note: "If no recent SENT records (after 7/28), emails may not be sending",
    });
  } catch (error: any) {
    console.error("[EMAIL STATUS] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
