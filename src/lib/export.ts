import { db } from "./db";

interface ExportRow {
  playerId: string;
  items: {
    rewardId: string;
    rewardName: string;
    quantity: number;
  }[];
}

export function generateCreatorRewardCsv(rows: ExportRow[]): string {
  const BOM = "﻿";
  const headers = [
    "玩家ID",
    "奖励1ID", "奖励1数量", "奖励1道具名",
    "奖励2ID", "奖励2数量", "奖励2道具名",
    "奖励3ID", "奖励3数量", "奖励3道具名",
    "奖励4ID", "奖励4数量", "奖励4道具名",
    "奖励5ID", "奖励5数量", "奖励5道具名",
    "需要客户端最低大版本",
    "发放结果",
  ];

  const enHeaders = [
    "id",
    "reward1", "num1", "name1",
    "reward2", "num2", "name2",
    "reward3", "num3", "name3",
    "reward4", "num4", "name4",
    "reward5", "num5", "name5",
    "minVersion",
    "result",
  ];

  const lines: string[] = [];
  lines.push(headers.join(","));
  lines.push(enHeaders.join(","));

  for (const row of rows) {
    // Split into chunks of 5 items per row
    const chunks: ExportRow["items"][] = [];
    for (let i = 0; i < row.items.length; i += 5) {
      chunks.push(row.items.slice(i, i + 5));
    }

    for (const chunk of chunks) {
      const cells: string[] = [];
      cells.push(escapeCsvField(row.playerId));

      for (let i = 0; i < 5; i++) {
        const item = chunk[i];
        if (item) {
          cells.push(escapeCsvField(item.rewardId));
          cells.push(item.quantity.toString());
          cells.push(escapeCsvField(item.rewardName));
        } else {
          cells.push("", "", "");
        }
      }

      cells.push("0.11"); // minVersion
      cells.push(""); // result (empty = pending)

      lines.push(cells.join(","));
    }
  }

  return BOM + lines.join("\n");
}

function escapeCsvField(field: string): string {
  if (!field) return "";
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export async function buildExportRows(): Promise<ExportRow[]> {
  // Get all pending orders with items, grouped by creator
  const orders = await db.rewardOrder.findMany({
    where: { status: "PENDING" },
    include: {
      items: true,
      creator: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Group orders by player ID (creator's locked playerId)
  const playerOrders: Record<string, ExportRow["items"]> = {};

  for (const order of orders) {
    const playerId = order.playerId || order.creator.playerId || "UNKNOWN";
    if (!playerOrders[playerId]) {
      playerOrders[playerId] = [];
    }
    for (const item of order.items) {
      playerOrders[playerId].push({
        rewardId: item.gameItemId,
        rewardName: item.itemName,
        quantity: item.quantity,
      });
    }
  }

  return Object.entries(playerOrders).map(([playerId, items]) => ({
    playerId,
    items,
  }));
}

export async function markOrdersAsExported(
  exportBatchId: string,
  adminUserId: string
): Promise<{ batchId: string; orderCount: number; fileName: string }> {
  const orders = await db.rewardOrder.findMany({
    where: { status: "PENDING" },
  });

  if (orders.length === 0) {
    throw new Error("No pending orders to export");
  }

  // Update all pending orders to EXPORTED
  await db.rewardOrder.updateMany({
    where: { status: "PENDING" },
    data: {
      status: "EXPORTED",
      exportBatchId,
    },
  });

  const fileName = `creator-rewards-${new Date().toISOString().slice(0, 10)}.csv`;

  // Update the export batch
  await db.exportBatch.update({
    where: { id: exportBatchId },
    data: {
      orderCount: orders.length,
      fileName,
    },
  });

  return {
    batchId: exportBatchId,
    orderCount: orders.length,
    fileName,
  };
}
