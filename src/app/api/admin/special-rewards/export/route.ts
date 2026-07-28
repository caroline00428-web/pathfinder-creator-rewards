import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: export approved (not yet sent) applications grouped by creator, tab-separated format
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const week = searchParams.get("week"); // optional: filter by week (YYYY-WW format)

  const where: any = { status: "APPROVED" };
  // If week filter: get applications from that ISO week
  if (week) {
    const [year, weekNum] = week.split("-").map(Number);
    // Simple approximation: filter by createdAt range
    const start = new Date(year, 0, 1 + (weekNum - 1) * 7);
    const end = new Date(year, 0, 1 + weekNum * 7);
    where.createdAt = { gte: start, lt: end };
    where.status = "APPROVED";
  }

  const apps = await db.specialRewardApplication.findMany({
    where,
    include: {
      creator: { select: { id: true, displayName: true, playerId: true } },
      reward: { select: { id: true, name: true, rewardType: true, diamonds: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by creator
  const byCreator: Record<string, { playerId: string; displayName: string; rewards: typeof apps }> = {};
  for (const app of apps) {
    const cid = app.creatorId;
    if (!byCreator[cid]) {
      byCreator[cid] = { playerId: app.creator.playerId || "NO_PID", displayName: app.creator.displayName, rewards: [] };
    }
    byCreator[cid].rewards.push(app);
  }

  // Build tab-separated output. Header + one row per creator (max 5 rewards per row)
  const header = "id\treward1\tnum1\tname1\treward2\tnum2\tname2\treward3\tnum3\tname3\treward4\tnum4\tname4\treward5\tnum5\tname5";
  const rows: string[] = [];
  for (const [cid, data] of Object.entries(byCreator)) {
    const rewards = data.rewards.slice(0, 5); // max 5 per row
    const cells = [data.playerId];
    for (let i = 0; i < 5; i++) {
      if (i < rewards.length) {
        cells.push(rewards[i].rewardId, "1", rewards[i].reward.name);
      } else {
        cells.push("", "", "");
      }
    }
    rows.push(cells.join("\t"));
  }

  const tsv = [header, ...rows].join("\n");

  return new NextResponse(tsv, {
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
      "Content-Disposition": `attachment; filename=rewards-export-${week || "all"}.tsv`,
    },
  });
}
