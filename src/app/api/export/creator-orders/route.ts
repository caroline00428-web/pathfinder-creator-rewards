import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateCreatorRewardCsv, buildExportRows, markOrdersAsExported } from "@/lib/export";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Create export batch
    const batch = await db.exportBatch.create({
      data: {
        exportedBy: session.user.id,
        status: "processing",
      },
    });

    // Build rows and generate CSV
    const rows = await buildExportRows();

    if (rows.length === 0) {
      return NextResponse.json({ error: "No pending orders to export" }, { status: 400 });
    }

    const csv = generateCreatorRewardCsv(rows);
    const result = await markOrdersAsExported(batch.id, session.user.id);

    return NextResponse.json({
      batchId: result.batchId,
      orderCount: result.orderCount,
      fileName: result.fileName,
      csv,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Export failed" }, { status: 500 });
  }
}
