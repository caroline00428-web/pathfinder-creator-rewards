import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { detectCategory } from "@/lib/utils";

export async function GET() {
  const items = await db.shopItem.findMany({
    where: { active: true },
    orderBy: { creditCost: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { gameItemId, itemName, creditCost, quantity, description } = await req.json();

  if (!gameItemId || !itemName || !creditCost) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const item = await db.shopItem.create({
    data: {
      gameItemId,
      itemName,
      creditCost,
      quantity: quantity ?? -1,
      category: detectCategory(gameItemId),
      description: description || null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
