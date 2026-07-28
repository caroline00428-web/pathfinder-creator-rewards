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

  const { status } = await req.json();
  const order = await db.rewardOrder.update({
    where: { id },
    data: { status },
    include: { creator: { include: { user: true } }, items: true },
  });

  // Send email when marked SENT
  if (status === "SENT" && order.creator.user.email) {
    try {
      await sendRewardEmail(order.creator.user.email, "SHOP", {
        code: id, // Use order ID as ref
        items: order.items.map(i => `${i.quantity}x ${i.itemName}`),
      });
    } catch (emailErr) {
      console.error("Email send failed for order, but order updated:", emailErr);
    }
  }

  return NextResponse.json(order);
}
