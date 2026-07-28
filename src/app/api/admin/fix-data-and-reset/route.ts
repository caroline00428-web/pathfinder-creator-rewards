import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// 直接用原始 SQL 修复数据问题
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    console.log("[DATA FIX] Starting data repair...");

    // 1. Fix followerCount: convert floats to integers
    console.log("[DATA FIX] Fixing followerCount (float to int)...");
    await db.$executeRawUnsafe(`
      UPDATE SpecialRewardApplication
      SET followerCount = CAST(ROUND(followerCount) AS INTEGER)
      WHERE followerCount IS NOT NULL AND typeof(followerCount) = 'real'
    `);

    // 2. Now try to reset special rewards
    console.log("[DATA FIX] Resetting special rewards to PENDING...");
    const resetResult = await db.specialRewardApplication.updateMany({
      where: {
        status: {
          not: "PENDING",
        },
      },
      data: {
        status: "PENDING",
        adminNotes: null,
        reviewedAt: null,
      },
    });

    console.log(`[DATA FIX] Successfully reset ${resetResult.count} applications`);

    return NextResponse.json({
      success: true,
      message: "Data repaired and rewards reset",
      dataFixed: {
        followerCountConverted: "float → integer (rounded)",
      },
      rewardsReset: resetResult.count,
    });
  } catch (error: any) {
    console.error("[DATA FIX] Error:", error);
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
