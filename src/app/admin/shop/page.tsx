"use client";

import { useState, useEffect } from "react";

interface ShopItem {
  id: string;
  gameItemId: string;
  itemName: string;
  creditCost: number;
  quantity: number;
  description: string | null;
  active: boolean;
}

export default function AdminShopPage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [importing, setImporting] = useState(false);
  const [form, setForm] = useState({ gameItemId: "", itemName: "", creditCost: "", quantity: "-1", description: "" });
  const [error, setError] = useState("");

  useEffect(() => { fetch("/api/shop").then(r => r.json()).then(setItems).finally(() => setLoading(false)); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameItemId: form.gameItemId,
        itemName: form.itemName,
        creditCost: parseInt(form.creditCost),
        quantity: parseInt(form.quantity),
        description: form.description || null,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ gameItemId: "", itemName: "", creditCost: "", quantity: "-1", description: "" });
      const data = await res.json();
      setItems(prev => [...prev, data]);
    } else {
      setError((await res.json()).error || "Failed");
    }
  }

  async function handleImport() {
    setImporting(true);
    setImportMsg("");
    const text = csvText.trim();
    if (!text) { setImporting(false); return; }

    const lines = text.split("\n").filter(l => l.trim());
    // Auto-detect: tab-separated or comma-separated?
    const sep = text.includes("\t") ? "\t" : ",";

    // Detect if first line is header (contains non-numeric fields like "名称"/"Name"/"ID")
    const firstLine = lines[0].split(sep).map(s => s.trim());
    const hasHeader = firstLine.some(h =>
      h.includes("名称") || h.toLowerCase() === "name" || h === "ID" || h === "_id" || h === "itemName" || h.includes("description")
    );

    const dataLines = hasHeader ? lines.slice(1) : lines;

    // Column mapping for known header names
    let idCol = 0, nameCol = 1, costCol = 2, qtyCol = 3, descCol = 4;
    if (hasHeader) {
      for (let i = 0; i < firstLine.length; i++) {
        const h = firstLine[i].toLowerCase().replace(/[^a-z0-9]/g, "");
        if (h === "id" || h === "id" || h === "gameitemid") idCol = i;
        else if (h.includes("name") || h.includes("名称")) nameCol = i;
        else if (h.includes("score") || h.includes("credit") || h.includes("积分") || h.includes("cost")) costCol = i;
        else if (h.includes("qty") || h.includes("quantity") || h.includes("限购")) qtyCol = i;
        else if (h.includes("desc") || h.includes("描述")) descCol = i;
      }
    }

    const items = [];
    for (const line of dataLines) {
      const parts = line.split(sep).map(s => s.trim().replace(/^"|"$/g, ""));
      if (parts.length < 3) continue;
      const id = parts[idCol];
      const name = parts[nameCol];
      const cost = parts[costCol];
      // Skip header rows that slip through, or rows without a numeric cost
      if (!id || !name || isNaN(Number(cost)) || Number(cost) <= 0) continue;
      items.push({
        gameItemId: id,
        itemName: name,
        creditCost: cost,
        quantity: parts[qtyCol] || "-1",
        description: parts[descCol] || "",
      });
    }

    if (items.length === 0) {
      setImportMsg("❌ No valid items found. Paste tab-separated data (ID, Name, Cost columns required).");
      setImporting(false);
      return;
    }

    const res = await fetch("/api/shop/bulk-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    if (res.ok) {
      setImportMsg(`✅ ${data.message}`);
      setCsvText("");
      const r = await fetch("/api/shop");
      setItems(await r.json());
    } else {
      setImportMsg(`❌ ${data.error || "Import failed"}`);
    }
    setImporting(false);
  }

  async function toggleActive(item: ShopItem) {
    await fetch(`/api/shop/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !item.active }),
    });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, active: !i.active } : i));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Shop Management</h2>
        <div className="flex gap-2">
          <button onClick={() => { setShowImport(!showImport); setShowForm(false); }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500 transition-colors">
            {showImport ? "Cancel" : "📥 Import"}
          </button>
          <button onClick={() => { setShowForm(!showForm); setShowImport(false); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors">
            {showForm ? "Cancel" : "+ Add Item"}
          </button>
        </div>
      </div>

      {showImport && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 space-y-3">
          <h3 className="font-semibold text-gray-900">Import Shop Items</h3>
          <p className="text-xs text-gray-500">Paste tab-separated data (from spreadsheet). Auto-detects headers. Columns: ID, 充值名称, 描述, 充值积分, 限购次数</p>
          <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={8}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            placeholder={`10003\t新手礼包3\t新手礼包3\t30\t1\n10004\t限时礼包1\t限时礼包1\t50\t1\n10005\t钻石充值1\t钻石充值1\t100\t-1`} />
          {importMsg && (
            <p className={`text-sm ${importMsg.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>{importMsg}</p>
          )}
          <button onClick={handleImport} disabled={importing || !csvText.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500 disabled:opacity-50 transition-colors">
            {importing ? "Importing..." : "Import Items"}
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Add Shop Item</h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Game Item ID</label>
              <input type="text" required value={form.gameItemId} onChange={e => setForm({ ...form, gameItemId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input type="text" required value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Cost</label>
              <input type="number" required value={form.creditCost} onChange={e => setForm({ ...form, creditCost: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (-1 = unlimited)</label>
              <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors">Add Item</button>
        </form>
      )}

      {loading ? <p className="text-gray-500">Loading...</p> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">Item ID</th>
                <th className="px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 font-medium text-gray-500">Cost</th>
                <th className="px-4 py-3 font-medium text-gray-500">Stock</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3 font-mono text-xs">{item.gameItemId}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.itemName}</p>
                    {item.description && <p className="text-xs text-gray-400">{item.description}</p>}
                  </td>
                  <td className="px-4 py-3">{item.creditCost.toLocaleString()} credits</td>
                  <td className="px-4 py-3">{item.quantity === -1 ? "∞" : item.quantity}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {item.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(item)}
                      className="text-xs text-indigo-600 hover:underline">{item.active ? "Disable" : "Enable"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
