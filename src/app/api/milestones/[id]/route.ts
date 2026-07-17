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

  const { viewThreshold, creditsAwarded, active } = await req.json();
  const data: any = {};
  if (viewThreshold !== undefined) data.viewThreshold = viewThreshold;
  if (creditsAwarded !== undefined) data.creditsAwarded = creditsAwarded;
  if (active !== undefined) data.active = active;

  const milestone = await db.milestone.update({ where: { id }, data });
  return NextResponse.json(milestone);
}
