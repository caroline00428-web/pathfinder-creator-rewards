import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let creator = await db.creator.findFirst({ where: { userId: session.user.id } });
  if (!creator && session.user.role === "ADMIN") {
    creator = await db.creator.create({
      data: { userId: session.user.id, displayName: session.user.username || "Admin", creatorCode: "ADMIN" + session.user.id.slice(-4).toUpperCase() },
    });
    await db.creditWallet.create({ data: { creatorId: creator.id, balance: 0 } });
  }
  if (!creator) {
    return NextResponse.json({ error: "Creator profile not found" }, { status: 403 });
  }
  const creatorId = creator.id;

  const { items } = await req.json(); // items: [{ shopItemId, quantity }]

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No items provided" }, { status: 400 });
  }

  // Validate creator has playerId set
  const creatorData = await db.creator.findUnique({ where: { id: creatorId } });
  if (!creatorData || !creatorData.playerId) {
    return NextResponse.json({ error: "You must bind your Player ID before redeeming rewards" }, { status: 400 });
  }

  // Validate items and calculate total
  let totalCost = 0;
  const orderItems: Array<{ shopItem: any; quantity: number }> = [];

  for (const { shopItemId, quantity } of items) {
    const shopItem = await db.shopItem.findUnique({ where: { id: shopItemId } });
    if (!shopItem || !shopItem.active) {
      return NextResponse.json({ error: `Item ${shopItemId} not found or inactive` }, { status: 400 });
    }
    if (shopItem.quantity !== -1 && shopItem.quantity < quantity) {
      return NextResponse.json({ error: `Insufficient stock for ${shopItem.itemName}` }, { status: 400 });
    }
    if (quantity < 1) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }
    totalCost += shopItem.creditCost * quantity;
    orderItems.push({ shopItem, quantity });
  }

  // Check wallet balance
  const wallet = await db.creditWallet.findUnique({ where: { creatorId: creatorId } });
  if (!wallet || wallet.balance < totalCost) {
    return NextResponse.json({ error: `Insufficient credits. You have ${wallet?.balance ?? 0}, need ${totalCost}` }, { status: 400 });
  }

  // Process redemption with atomic balance check
  const result = await db.$transaction(async (tx) => {
    // Re-check wallet inside transaction to prevent negative balance race
    const currentWallet = await tx.creditWallet.findUnique({ where: { creatorId } });
    if (!currentWallet || currentWallet.balance < totalCost) {
      throw new Error(`INSUFFICIENT:${currentWallet?.balance ?? 0}`);
    }
    // Deduct credits
    await tx.creditWallet.update({
      where: { creatorId: creatorId },
      data: { balance: { decrement: totalCost } },
    });

    // Create transaction record
    await tx.creditTransaction.create({
      data: {
        creatorId: creatorId,
        amount: -totalCost,
        type: "SHOP_REDEMPTION",
        reason: `Redeemed ${orderItems.length} item(s)`,
      },
    });

    // Create order
    const order = await tx.rewardOrder.create({
      data: {
        creatorId: creatorId,
        playerId: creatorData.playerId!,
        totalCreditCost: totalCost,
        status: "PENDING",
        items: {
          create: orderItems.map(({ shopItem, quantity }) => ({
            gameItemId: shopItem.gameItemId,
            itemName: shopItem.itemName,
            quantity,
            creditCost: shopItem.creditCost,
          })),
        },
      },
      include: { items: true },
    });

    // Update transaction with order ID
    await tx.creditTransaction.updateMany({
      where: { creatorId: creatorId, relatedOrderId: null, type: "SHOP_REDEMPTION" },
      data: { relatedOrderId: order.id },
    });

    return order;
  });

  return NextResponse.json(result, { status: 201 });
}
