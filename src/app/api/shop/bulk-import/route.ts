import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { detectCategory } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { items } = await req.json();
  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No items provided" }, { status: 400 });
  }

  const results: { success: boolean; item: string; error?: string }[] = [];

  for (const item of items) {
    try {
      if (!item.gameItemId || !item.itemName || !item.creditCost) {
        results.push({ success: false, item: item.itemName || "unknown", error: "Missing required fields (gameItemId, itemName, creditCost)" });
        continue;
      }

      await db.shopItem.create({
        data: {
          gameItemId: String(item.gameItemId),
          itemName: String(item.itemName),
          creditCost: parseInt(String(item.creditCost)) || 0,
          quantity: item.quantity !== undefined ? parseInt(String(item.quantity)) || -1 : -1,
          category: detectCategory(String(item.gameItemId)),
          description: item.description ? String(item.description) : null,
          active: true,
        },
      });

      results.push({ success: true, item: item.itemName });
    } catch (e: any) {
      results.push({ success: false, item: item.itemName || "unknown", error: "Import failed for this item" });
      console.error("Bulk import error:", e.message);
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return NextResponse.json({
    message: `Imported ${successCount} items${failCount > 0 ? `, ${failCount} failed` : ""}`,
    results,
  });
}
