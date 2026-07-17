"use client";

import { useState, useEffect } from "react";

interface Order {
  id: string;
  totalCreditCost: number;
  status: string;
  playerId: string;
  createdAt: string;
  creator: { displayName: string; creatorCode: string; playerId: string };
  items: Array<{ gameItemId: string; itemName: string; quantity: number; creditCost: number }>;
}

interface ExportBatch {
  id: string;
  orderCount: number;
  fileName: string;
  exportedAt: string;
  status: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [batches, setBatches] = useState<ExportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [csvData, setCsvData] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then(r => r.json()),
      fetch("/api/export/batches").then(r => r.json()),
    ]).then(([o, b]) => {
      setOrders(o);
      setBatches(b);
    }).finally(() => setLoading(false));
  }, []);

  async function handleExport() {
    setExporting(true);
    const res = await fetch("/api/export/creator-orders", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setCsvData(data.csv);
      // Refresh orders
      const [o, b] = await Promise.all([
        fetch("/api/orders").then(r => r.json()),
        fetch("/api/export/batches").then(r => r.json()),
      ]);
      setOrders(o);
      setBatches(b);
    } else {
      alert(data.error || "Export failed");
    }
    setExporting(false);
  }

  function downloadCsv() {
    if (!csvData) return;
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `creator-rewards-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setCsvData(null);
  }

  const pendingOrders = orders.filter(o => o.status === "PENDING");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reward Orders</h2>
        <div className="flex gap-2">
          {csvData && (
            <button onClick={downloadCsv}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500 transition-colors">
              📥 Download CSV
            </button>
          )}
          <button onClick={handleExport} disabled={exporting || pendingOrders.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors">
            {exporting ? "Exporting..." : `Export (${pendingOrders.length} pending)`}
          </button>
        </div>
      </div>

      {/* Export History */}
      {batches.length > 0 && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Export History</h3>
          <div className="space-y-2">
            {batches.map(b => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <span>{b.fileName || "Export"}</span>
                <span className="text-gray-500">{b.orderCount} orders · {new Date(b.exportedAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? <p className="text-gray-500">Loading...</p> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">Creator</th>
                <th className="px-4 py-3 font-medium text-gray-500">Player ID</th>
                <th className="px-4 py-3 font-medium text-gray-500">Items</th>
                <th className="px-4 py-3 font-medium text-gray-500">Cost</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-t">
                  <td className="px-4 py-3">{o.creator.displayName}</td>
                  <td className="px-4 py-3 font-mono text-xs">{o.playerId}</td>
                  <td className="px-4 py-3 text-xs">{o.items.map(i => `${i.itemName} x${i.quantity}`).join(", ")}</td>
                  <td className="px-4 py-3 font-medium">{o.totalCreditCost.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      o.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                      o.status === "EXPORTED" ? "bg-purple-100 text-purple-800" :
                      "bg-green-100 text-green-800"
                    }`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
