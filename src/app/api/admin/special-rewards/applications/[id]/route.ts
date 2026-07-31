import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendRewardEmail } from "@/lib/send-reward-email";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { status, adminNotes } = await req.json();
  if (!status || !["APPROVED", "REJECTED", "SENT"].includes(status)) {
    return NextResponse.json({ error: "Invalid status. Use APPROVED, REJECTED, or SENT" }, { status: 400 });
  }

  try {
    // Use raw SQL to get initial application (avoids Prisma type conversion issues)
    const appRows = await db.$queryRawUnsafe(
      `SELECT * FROM SpecialRewardApplication WHERE id = ?`,
      id
    ) as any[];

    if (appRows.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const appInitial = appRows[0];

    if (appInitial.status !== "PENDING" && appInitial.status !== "APPROVED") {
      return NextResponse.json({ error: "Application already finalized" }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      // Re-read inside transaction using Prisma with select to avoid followerCount
      const current = await tx.specialRewardApplication.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          creatorId: true,
          reward: { select: { diamonds: true, name: true, rewardType: true } },
          creator: { select: { id: true } },
        },
      });
      if (!current) throw new Error("NOT_FOUND");

      // Only allow changes if not already SENT/REJECTED
      if (current.status === "SENT" || current.status === "REJECTED") {
        throw new Error("FINALIZED");
      }

      const updated = await tx.specialRewardApplication.update({
        where: { id },
        data: { status, adminNotes: adminNotes || null, reviewedAt: new Date() },
      });

      // Create diamond order (not wallet credit) when approving from PENDING → APPROVED
      if (status === "APPROVED" && current.status === "PENDING") {
        const creatorData = await tx.creator.findUnique({ where: { id: current.creatorId } });
        await tx.rewardOrder.create({
          data: {
            creatorId: current.creatorId,
            playerId: creatorData?.playerId || "PENDING",
            totalCreditCost: current.reward.diamonds,
            status: "PENDING",
            items: {
              create: {
                gameItemId: `SPECIAL_${current.reward.rewardType}`,
                itemName: `💎 ${current.reward.name}`,
                quantity: current.reward.diamonds,
                creditCost: 0,
              },
            },
          },
        });
        await tx.creditTransaction.create({
          data: {
            creatorId: current.creatorId,
            amount: current.reward.diamonds,
            type: "SPECIAL_REWARD",
            reason: `${current.reward.name} — ${current.reward.rewardType}`,
            relatedOrderId: undefined,
          },
        });
      }

      return updated;
    });

    // Send email AFTER transaction (outside tx block)
    if (status === "SENT") {
      const app = await db.specialRewardApplication.findUnique({
        where: { id },
        include: {
          creator: { include: { user: { select: { email: true } } } },
          reward: { select: { diamonds: true, name: true } },
        },
      });
      if (app?.creator.user.email) {
        try {
          await sendRewardEmail(app.creator.user.email, "SPECIAL", {
            diamonds: app.reward.diamonds,
            rewardName: app.reward.name,
          });
        } catch (emailErr) {
          console.error("Email send failed, but application updated:", emailErr);
        }
      }
    }

    return NextResponse.json({ success: true, application: result });
  } catch (e: any) {
    if (e.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    if (e.message === "FINALIZED") {
      return NextResponse.json({ error: "Cannot modify application that has been SENT or REJECTED." }, { status: 400 });
    }
    throw e;
  }
}
