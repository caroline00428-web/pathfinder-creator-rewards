import { NextResponse } from "next/server";
import { getOrCreateCreator } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export async function GET() {
  const creator = await getOrCreateCreator();
  if (!creator) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const applications = await db.specialRewardApplication.findMany({
    where: { creatorId: creator.id },
    include: {
      reward: { select: { id: true, name: true, rewardType: true, diamonds: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(applications);
}
