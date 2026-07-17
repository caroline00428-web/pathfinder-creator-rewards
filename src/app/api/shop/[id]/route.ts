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

  const { gameItemId, itemName, creditCost, quantity, description, active } = await req.json();
  const data: any = {};
  if (gameItemId !== undefined) data.gameItemId = gameItemId;
  if (itemName !== undefined) data.itemName = itemName;
  if (creditCost !== undefined) data.creditCost = creditCost;
  if (quantity !== undefined) data.quantity = quantity;
  if (description !== undefined) data.description = description;
  if (active !== undefined) data.active = active;

  const item = await db.shopItem.update({ where: { id }, data });
  return NextResponse.json(item);
}
