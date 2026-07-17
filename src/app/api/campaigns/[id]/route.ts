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

  const { name, platform, startTime, endTime, description, active } = await req.json();

  const data: any = {};
  if (name !== undefined) data.name = name;
  if (platform !== undefined) data.platform = platform;
  if (startTime !== undefined) data.startTime = new Date(startTime);
  if (endTime !== undefined) data.endTime = new Date(endTime);
  if (description !== undefined) data.description = description;
  if (active !== undefined) data.active = active;

  const campaign = await db.campaign.update({
    where: { id },
    data,
  });

  return NextResponse.json(campaign);
}
