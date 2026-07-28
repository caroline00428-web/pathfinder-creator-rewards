"use client";

import { formatDate } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Campaign {
  id: string;
  name: string;
  platform: string;
  startTime: string;
  endTime: string;
  active: boolean;
  description: string | null;
  _count: { videos: number; milestones: number };
}

export default function AdminCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", platform: "BOTH", startTime: "", endTime: "", description: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then(setCampaigns)
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, active: true }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ name: "", platform: "BOTH", startTime: "", endTime: "", description: "" });
      router.refresh();
      const data = await res.json();
      setCampaigns((prev) => [{ ...data, _count: { videos: 0, milestones: 0 } }, ...prev]);
    } else {
      const err = await res.json();
      setError(err.error || "Failed to create campaign");
    }
  }

  async function toggleActive(campaign: Campaign) {
    await fetch(`/api/campaigns/${campaign.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !campaign.active }),
    });
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaign.id ? { ...c, active: !c.active } : c))
    );
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Campaign Management</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors">
          {showForm ? "Cancel" : "+ Create Campaign"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Create Campaign</h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                placeholder="Pathfinder Program - Season 2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
              <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
                <option value="BOTH">Both YouTube & TikTok</option>
                <option value="YOUTUBE">YouTube Only</option>
                <option value="TIKTOK">TikTok Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="datetime-local" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="datetime-local" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" rows={2} />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors">Create Campaign</button>
        </form>
      )}

      <div className="grid gap-4">
        {campaigns.map((c) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{c.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    c.platform === "YOUTUBE" ? "bg-red-100 text-red-700" :
                    c.platform === "TIKTOK" ? "bg-gray-900 text-white" : "bg-purple-100 text-purple-700"
                  }`}>{c.platform}</span>
                  {" · "}
                  {formatDate(c.startTime)} → {formatDate(c.endTime)}
                  {" · "}{c._count.videos} videos · {c._count.milestones} milestones
                </p>
                {c.description && <p className="text-xs text-gray-400 mt-1">{c.description}</p>}
              </div>
              <button
                onClick={() => toggleActive(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  c.active
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {c.active ? "Active" : "Inactive"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
