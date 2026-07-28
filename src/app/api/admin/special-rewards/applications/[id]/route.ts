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

  const { status, adminNotes } = await req.json();
  if (!status || !["APPROVED", "REJECTED", "SENT"].includes(status)) {
    return NextResponse.json({ error: "Invalid status. Use APPROVED, REJECTED, or SENT" }, { status: 400 });
  }

  const application = await db.specialRewardApplication.findUnique({
    where: { id },
    include: { reward: true },
  });
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.status !== "PENDING" && application.status !== "APPROVED") {
    return NextResponse.json({ error: "Application already finalized" }, { status: 400 });
  }

  try {
    const result = await db.$transaction(async (tx) => {
      // Re-read inside transaction to prevent double-credit race
      const current = await tx.specialRewardApplication.findUnique({
        where: { id },
        include: { reward: true },
      });
      if (!current || current.status !== "PENDING") {
        throw new Error("ALREADY_PROCESSED");
      }

      const updated = await tx.specialRewardApplication.update({
        where: { id },
        data: { status, adminNotes: adminNotes || null, reviewedAt: new Date() },
      });

      if (status === "APPROVED") {
        await tx.creditWallet.upsert({
          where: { creatorId: current.creatorId },
          create: { creatorId: current.creatorId, balance: current.reward.diamonds },
          update: { balance: { increment: current.reward.diamonds } },
        });
        await tx.creditTransaction.create({
          data: {
            creatorId: current.creatorId,
            amount: current.reward.diamonds,
            type: "SPECIAL_REWARD",
            reason: `${current.reward.name} — ${current.reward.rewardType}`,
          },
        });
      }

      return updated;
    });

    return NextResponse.json({ success: true, application: result });
  } catch (e: any) {
    if (e.message === "ALREADY_PROCESSED") {
      return NextResponse.json({ error: "Application has already been processed by another admin." }, { status: 409 });
    }
    throw e;
  }
}
