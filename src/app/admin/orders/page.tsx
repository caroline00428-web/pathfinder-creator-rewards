"use client";

import { formatDate } from "@/lib/utils";
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
    ]).then(([o, b]) => { setOrders(o); setBatches(b); }).finally(() => setLoading(false));
  }, []);

  async function handleMarkSent(orderId: string) {
    await fetch(`/api/orders/${orderId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "SENT" }) });
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "SENT" } : o));
  }

  async function handleExport() {
    setExporting(true);
    const res = await fetch("/api/export/creator-orders", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setCsvData(data.csv);
      const [o, b] = await Promise.all([fetch("/api/orders").then(r => r.json()), fetch("/api/export/batches").then(r => r.json())]);
      setOrders(o); setBatches(b);
    } else { alert(data.error || "Export failed"); }
    setExporting(false);
  }

  function copyCsv() { if (csvData) { navigator.clipboard.writeText(csvData).then(() => alert("Copied!")); } }
  function downloadCsv() {
    if (!csvData) return;
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `creator-rewards-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(a.href); setCsvData(null);
  }

  const pendingOrders = orders.filter(o => o.status === "PENDING");
  const diamondOrders = orders.filter(o => o.items?.some((i: any) => i.gameItemId?.startsWith("DIAMOND_")));
  const shopOrders = orders.filter(o => !o.items?.some((i: any) => i.gameItemId?.startsWith("DIAMOND_")));

  const statusBadge = (s: string) => {
    const cls = s === "PENDING" ? "bg-yellow-100 text-yellow-800" : s === "EXPORTED" ? "bg-purple-100 text-purple-800" : s === "SENT" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800";
    return <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{s}</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reward Orders</h2>
        <div className="flex gap-2">
          {csvData && (<><button onClick={copyCsv} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500">📋 Copy</button>
            <button onClick={downloadCsv} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500">📥 Download</button></>)}
          <button onClick={handleExport} disabled={exporting || pendingOrders.length === 0} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-50">{exporting ? "Exporting..." : `Export (${pendingOrders.length} pending)`}</button>
        </div>
      </div>

      {batches.length > 0 && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Export History</h3>
          {batches.map(b => <div key={b.id} className="flex items-center justify-between text-sm"><span>{b.fileName || "Export"}</span><span className="text-gray-500">{b.orderCount} orders · {formatDate(b.exportedAt)}</span></div>)}
        </div>
      )}

      {loading ? <p className="text-gray-500">Loading...</p> : (
        <>
          {diamondOrders.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">💎 Diamond Rewards</h3>
              <div className="bg-white rounded-xl shadow-sm border-2 border-indigo-200 overflow-hidden">
                <table className="w-full text-sm"><thead><tr className="bg-indigo-50 text-left"><th className="px-4 py-3">Creator</th><th className="px-4 py-3">Player ID</th><th className="px-4 py-3">Diamonds</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th><th className="px-4 py-3"></th></tr></thead>
                  <tbody>{diamondOrders.map(o => (
                    <tr key={o.id} className="border-t"><td className="px-4 py-3">{o.creator.displayName}</td><td className="px-4 py-3 font-mono text-xs">{o.playerId}</td><td className="px-4 py-3 font-medium text-indigo-600">{o.totalCreditCost.toLocaleString()}</td><td className="px-4 py-3">{statusBadge(o.status)}</td><td className="px-4 py-3 text-gray-500">{formatDate(o.createdAt)}</td><td className="px-4 py-3">{o.status === "PENDING" && <button onClick={() => handleMarkSent(o.id)} className="text-blue-600 hover:underline text-xs font-medium whitespace-nowrap">📤 Mark Sent</button>}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {shopOrders.length > 0 && (
            <>
              <h3 className="font-semibold text-gray-900 mb-2">🛒 Shop Orders</h3>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3">Creator</th><th className="px-4 py-3">Player ID</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Cost</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th><th className="px-4 py-3"></th></tr></thead>
                  <tbody>{shopOrders.map(o => (
                    <tr key={o.id} className="border-t"><td className="px-4 py-3">{o.creator.displayName}</td><td className="px-4 py-3 font-mono text-xs">{o.playerId}</td><td className="px-4 py-3 text-xs">{o.items.map(i => `${i.itemName} x${i.quantity}`).join(", ")}</td><td className="px-4 py-3 font-medium">{o.totalCreditCost.toLocaleString()}</td><td className="px-4 py-3">{statusBadge(o.status)}</td><td className="px-4 py-3 text-gray-500">{formatDate(o.createdAt)}</td><td className="px-4 py-3">{o.status === "EXPORTED" && <button onClick={() => handleMarkSent(o.id)} className="text-blue-600 hover:underline text-xs font-medium whitespace-nowrap">📤 Mark Sent</button>}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          )}
          {diamondOrders.length === 0 && shopOrders.length === 0 && <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center"><p className="text-gray-500">No orders yet.</p></div>}
        </>
      )}
    </div>
  );
}
