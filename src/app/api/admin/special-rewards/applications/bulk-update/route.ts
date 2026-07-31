import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendRewardEmail } from "@/lib/send-reward-email";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { applicationIds, newStatus, adminNotes } = await req.json();

  if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
    return NextResponse.json(
      { error: "No applications selected" },
      { status: 400 }
    );
  }

  if (!["APPROVED", "REJECTED", "SENT"].includes(newStatus)) {
    return NextResponse.json(
      { error: "Invalid status" },
      { status: 400 }
    );
  }

  try {
    console.log(`[BULK] Updating ${applicationIds.length} applications to ${newStatus}`);

    // Update all applications in a transaction
    const updated = await db.$transaction(async (tx) => {
      // Get all applications to check their current status
      const apps = await tx.specialRewardApplication.findMany({
        where: { id: { in: applicationIds } },
        include: { creator: { include: { user: true } }, reward: true },
      });

      if (apps.length === 0) {
        throw new Error("No applications found");
      }

      // Update all applications
      const updatePromises = apps.map(async (app) => {
        // Check if can be updated
        if (app.status === "SENT" || app.status === "REJECTED") {
          console.log(`[BULK] Skipping ${app.id} - already finalized`);
          return null;
        }

        // Update status
        const updated = await tx.specialRewardApplication.update({
          where: { id: app.id },
          data: {
            status: newStatus,
            adminNotes: adminNotes || null,
            reviewedAt: new Date(),
          },
        });

        // Create diamond order (not wallet credit) if approving from PENDING
        if (newStatus === "APPROVED" && app.status === "PENDING") {
          const creatorData = await tx.creator.findUnique({ where: { id: app.creatorId } });
          await tx.rewardOrder.create({
            data: {
              creatorId: app.creatorId,
              playerId: creatorData?.playerId || "PENDING",
              totalCreditCost: app.reward.diamonds,
              status: "PENDING",
              items: {
                create: {
                  gameItemId: `SPECIAL_${app.reward.rewardType}`,
                  itemName: `💎 ${app.reward.name}`,
                  quantity: app.reward.diamonds,
                  creditCost: 0,
                },
              },
            },
          });
          await tx.creditTransaction.create({
            data: {
              creatorId: app.creatorId,
              amount: app.reward.diamonds,
              type: "SPECIAL_REWARD",
              reason: `${app.reward.name} — ${app.reward.rewardType}`,
              relatedOrderId: undefined,
            },
          });
        }

        return { app, updated };
      });

      return await Promise.all(updatePromises);
    });

    // Send emails if status is SENT (outside transaction)
    if (newStatus === "SENT") {
      for (const result of updated) {
        if (result?.app?.creator?.user?.email) {
          try {
            await sendRewardEmail(result.app.creator.user.email, "SPECIAL", {
              diamonds: result.app.reward.diamonds,
              rewardName: result.app.reward.name,
            });
            console.log(`[BULK] Email sent to ${result.app.creator.user.email}`);
          } catch (emailErr) {
            console.error(`[BULK] Email failed for ${result.app.creator.displayName}:`, emailErr);
          }
        }
      }
    }

    const successCount = updated.filter((r) => r !== null).length;

    return NextResponse.json({
      success: true,
      message: `Updated ${successCount} applications to ${newStatus}`,
      updated: successCount,
      total: applicationIds.length,
    });
  } catch (error: any) {
    console.error("[BULK] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
