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

  const { orderIds, newStatus } = await req.json();

  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    return NextResponse.json(
      { error: "No orders selected" },
      { status: 400 }
    );
  }

  if (!["PENDING", "EXPORTED", "SENT", "FAILED"].includes(newStatus)) {
    return NextResponse.json(
      { error: "Invalid status" },
      { status: 400 }
    );
  }

  try {
    console.log(`[BULK ORDERS] Updating ${orderIds.length} orders to ${newStatus}`);

    // Update all orders and send emails if marking as SENT
    const orders = await db.rewardOrder.findMany({
      where: { id: { in: orderIds } },
      include: { creator: { include: { user: true } }, items: true },
    });

    if (orders.length === 0) {
      throw new Error("No orders found");
    }

    // Update all orders
    const updatePromises = orders.map((order) =>
      db.rewardOrder.update({
        where: { id: order.id },
        data: { status: newStatus },
      })
    );

    const updated = await Promise.all(updatePromises);

    console.log(`[BULK ORDERS] Updated ${updated.length} orders`);

    // Send emails if status is SENT
    if (newStatus === "SENT") {
      for (const order of orders) {
        if (order.creator.user.email) {
          try {
            await sendRewardEmail(order.creator.user.email, "SHOP", {
              code: order.id,
              items: order.items.map((i) => `${i.quantity}x ${i.itemName}`),
            });
            console.log(`[BULK ORDERS] Email sent to ${order.creator.user.email}`);
          } catch (emailErr) {
            console.error(`[BULK ORDERS] Email failed for ${order.creator.displayName}:`, emailErr);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated.length} orders to ${newStatus}`,
      updated: updated.length,
      total: orderIds.length,
    });
  } catch (error: any) {
    console.error("[BULK ORDERS] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
