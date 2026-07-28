"use client";

import { useState, useEffect } from "react";

interface Milestone {
  id: string;
  platform: string;
  viewThreshold: number;
  creditsAwarded: number;
  active: boolean;
  campaign: { name: string } | null;
}

export default function AdminMilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ platform: "YOUTUBE", viewThreshold: "", creditsAwarded: "" });
  const [error, setError] = useState("");

  useEffect(() => { fetchMilestones(); }, []);

  function fetchMilestones() {
    fetch("/api/milestones").then(r => r.json()).then(setMilestones).finally(() => setLoading(false));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/milestones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, viewThreshold: parseInt(form.viewThreshold), creditsAwarded: parseInt(form.creditsAwarded) }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ platform: "YOUTUBE", viewThreshold: "", creditsAwarded: "" });
      fetchMilestones();
    } else {
      const err = await res.json();
      setError(err.error || "Failed");
    }
  }

  async function toggleActive(m: Milestone) {
    await fetch(`/api/milestones/${m.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !m.active }),
    });
    fetchMilestones();
  }

  const ytMilestones = milestones.filter(m => m.platform === "YOUTUBE");
  const ttMilestones = milestones.filter(m => m.platform === "TIKTOK");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Milestone Settings</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors">
          {showForm ? "Cancel" : "+ Add Milestone"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Add Milestone</h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
              <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
                <option value="YOUTUBE">YouTube</option>
                <option value="TIKTOK">TikTok</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">View Threshold</label>
              <input type="number" required value={form.viewThreshold} onChange={e => setForm({ ...form, viewThreshold: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" placeholder="1000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diamonds (1 point = $0.01)</label>
              <input type="number" required value={form.creditsAwarded} onChange={e => setForm({ ...form, creditsAwarded: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" placeholder="100" />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors">Add Milestone</button>
        </form>
      )}

      {loading ? <p className="text-gray-500">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[{ platform: "YOUTUBE", label: "YouTube", data: ytMilestones, color: "bg-red-600" },
            { platform: "TIKTOK", label: "TikTok", data: ttMilestones, color: "bg-gray-900" }].map(({ platform, label, data, color }) => (
            <div key={platform} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className={`${color} text-white px-4 py-3`}>
                <h3 className="font-semibold text-sm">{label} Milestones</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-2 font-medium text-gray-500">Views ≥</th>
                    <th className="px-4 py-2 font-medium text-gray-500">Diamonds</th>
                    <th className="px-4 py-2 font-medium text-gray-500">Points ($)</th>
                    <th className="px-4 py-2 font-medium text-gray-500">Status</th>
                    <th className="px-4 py-2 font-medium text-gray-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(m => (
                    <tr key={m.id} className="border-t">
                      <td className="px-4 py-2 font-medium">{m.viewThreshold.toLocaleString()}</td>
                      <td className="px-4 py-2">{m.creditsAwarded.toLocaleString()}</td>
                      <td className="px-4 py-2 text-green-600 font-medium">${Math.floor(m.creditsAwarded / 100)}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          m.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>{m.active ? "Active" : "Inactive"}</span>
                      </td>
                      <td className="px-4 py-2">
                        <button onClick={() => toggleActive(m)}
                          className="text-xs text-indigo-600 hover:underline">{m.active ? "Disable" : "Enable"}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
