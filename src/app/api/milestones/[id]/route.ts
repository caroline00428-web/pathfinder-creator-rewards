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
  const updates: string[] = [];
  const queryParams: any[] = [];

  if (viewThreshold !== undefined) {
    updates.push("viewThreshold = ?");
    queryParams.push(viewThreshold);
  }
  if (creditsAwarded !== undefined) {
    updates.push("creditsAwarded = ?");
    queryParams.push(creditsAwarded);
  }
  if (active !== undefined) {
    updates.push("active = ?");
    queryParams.push(active ? 1 : 0);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  queryParams.push(id);
  const updateQuery = `UPDATE Milestone SET ${updates.join(", ")} WHERE id = ?`;
  await db.$executeRawUnsafe(updateQuery, ...queryParams);

  // Fetch updated milestone with raw SQL to avoid datetime conversion
  const result = await db.$queryRawUnsafe<any[]>(
    `SELECT id, platform, viewThreshold, creditsAwarded, active, campaignId FROM Milestone WHERE id = ?`,
    id
  );

  return NextResponse.json(result[0] || null);
}
