import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const rewards = await db.specialReward.findMany({
    where: { active: true },
    include: { campaign: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(rewards);
}
