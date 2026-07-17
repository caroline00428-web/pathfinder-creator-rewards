import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const campaigns = await db.campaign.findMany({
    include: { _count: { select: { videos: true, milestones: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { name, platform, startTime, endTime, description, active } = await req.json();

  if (!name || !platform || !startTime || !endTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const campaign = await db.campaign.create({
    data: {
      name,
      platform,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      description: description || null,
      active: active ?? true,
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}
