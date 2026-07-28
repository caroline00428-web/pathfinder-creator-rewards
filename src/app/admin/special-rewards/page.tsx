"use client";

import { useState, useEffect } from "react";

interface Application {
  id: string;
  rewardId: string;
  creatorId: string;
  campaignId: string;
  videoId: string | null;
  followerCount: number | null;
  profileUrl: string | null;
  notes: string | null;
  adminNotes: string | null;
  status: string;
  createdAt: string;
  creator: { id: string; displayName: string; creatorCode: string; playerId: string | null };
  reward: { id: string; name: string; rewardType: string; diamonds: number };
  campaign: { id: string; name: string };
}

export default function AdminSpecialRewardsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [exportWeek, setExportWeek] = useState("");
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [toast, setToast] = useState("");

  // Generate week options (current week + last 4 weeks)
  const weekOptions = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const year = d.getFullYear();
    const weekNum = Math.ceil((((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + new Date(year, 0, 1).getDay() + 1) / 7);
    weekOptions.push({ label: `${year} Week ${weekNum}`, value: `${year}-${String(weekNum).padStart(2, "0")}` });
  }

  useEffect(() => { fetchApps(); }, [filterStatus, filterType]);

  function fetchApps() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterType) params.set("rewardType", filterType);
    fetch(`/api/admin/special-rewards/applications?${params}`)
      .then(r => {
        if (!r.ok) throw new Error(`API error: ${r.status}`);
        return r.json();
      })
      .then(data => {
        console.log("[Admin] Loaded applications:", data);
        setApplications(Array.isArray(data) ? data : []);
      })
      .catch(e => {
        console.error("[Admin] Failed to load applications:", e);
        setApplications([]);
      })
      .finally(() => setLoading(false));
  }

  async function handleReview(id: string, newStatus: string) {
    const res = await fetch(`/api/admin/special-rewards/applications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, adminNotes }),
    });
    const data = await res.json();
    if (res.ok) {
      setToast(`✅ Application ${newStatus.toLowerCase()} successfully`);
      setReviewId(null);
      setAdminNotes("");
      fetchApps();
    } else {
      setToast(`❌ ${data.error}`);
    }
  }

  function handleExport() {
    const url = `/api/admin/special-rewards/export${exportWeek ? `?week=${exportWeek}` : ""}`;
    window.open(url, "_blank");
  }

  function exportCsv() {
    const headers = ["Creator", "UID (Creator Code)", "Player ID", "Reward", "Type", "Diamonds", "Status", "Video ID", "Notes", "Date"];
    const rows = applications.map(a => [
      a.creator.displayName,
      a.creator.creatorCode,
      a.creator.playerId || "Not set",
      a.reward.name,
      a.reward.rewardType,
      a.reward.diamonds,
      a.status,
      a.videoId || "",
      (a.notes || "").replace(/,/g, ";"),
      new Date(a.createdAt).toLocaleDateString("en-US"),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, "\"\"")}"`).join(","))].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `special-rewards-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(a.href);
  }

  const typeColors: Record<string, string> = {
    REGISTRATION: "bg-blue-100 text-blue-800",
    PARTICIPATION: "bg-yellow-100 text-yellow-800",
    DILIGENCE: "bg-green-100 text-green-800",
    STAR_CREATOR: "bg-purple-100 text-purple-800",
    AI_COMIC: "bg-pink-100 text-pink-800",
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🎁 Special Reward Applications</h2>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select value={exportWeek} onChange={e => setExportWeek(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">Export: All Weeks</option>
          {weekOptions.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
        </select>
        <button onClick={handleExport}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500 transition-colors">
          📥 Export TSV
        </button>
        <button onClick={exportCsv}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors">
          📊 Export CSV
        </button>
        <span className="text-xs text-gray-400 ml-auto">Exports tab-separated format for game backend</span>
      </div>

      {toast && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${toast.startsWith("✅") ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {toast}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">All Types</option>
          <option value="REGISTRATION">Registration Bonus</option>
          <option value="PARTICIPATION">Participation Award</option>
          <option value="DILIGENCE">Diligence Award</option>
          <option value="STAR_CREATOR">Star Creator Award</option>
          <option value="AI_COMIC">AI Comic Award</option>
        </select>
        <span className="text-sm text-gray-500 self-center ml-auto">{applications.length} applications</span>
      </div>

      {loading ? <p className="text-gray-500">Loading...</p> : applications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-500">No applications found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">Creator</th>
                <th className="px-4 py-3 font-medium text-gray-500">Reward</th>
                <th className="px-4 py-3 font-medium text-gray-500">Diamonds</th>
                <th className="px-4 py-3 font-medium text-gray-500">Campaign</th>
                <th className="px-4 py-3 font-medium text-gray-500">Details</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr key={app.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium">{app.creator.displayName}</span>
                    <span className="text-xs text-gray-400 block">{app.creator.creatorCode}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[app.reward.rewardType] || "bg-gray-100"}`}>
                      {app.reward.rewardType}
                    </span>
                    <span className="block text-xs text-gray-500 mt-0.5">{app.reward.name}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-indigo-600">{app.reward.diamonds.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{app.campaign.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[300px]">
                    {app.followerCount && <span>Followers: {app.followerCount.toLocaleString()}<br/></span>}
                    {app.profileUrl && <span>URL: {app.profileUrl.slice(0, 40)}...<br/></span>}
                    {app.videoId && <span className="text-gray-600">🎬 Video: {app.videoId.slice(-8)}<br/></span>}
                    {app.notes && <span className="text-gray-700">Note: {app.notes.slice(0, 60)}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      app.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                      app.status === "APPROVED" ? "bg-green-100 text-green-800" :
                      "bg-red-100 text-red-800"
                    }`}>{app.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(app.createdAt).toLocaleDateString("en-US")}</td>
                  <td className="px-4 py-3">
                    {app.status === "PENDING" ? (
                      reviewId === app.id ? (
                        <div className="flex flex-col gap-1">
                          <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                            className="w-32 rounded border border-gray-300 px-2 py-1 text-xs" placeholder="Notes (optional)" rows={2} />
                          <button onClick={() => handleReview(app.id, "APPROVED")}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs">Approve</button>
                          <button onClick={() => handleReview(app.id, "REJECTED")}
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs">Reject</button>
                          <button onClick={() => setReviewId(null)}
                            className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => { setReviewId(app.id); setAdminNotes(""); }}
                          className="text-indigo-600 hover:underline text-xs">Review</button>
                      )
                    ) : app.status === "APPROVED" ? (
                      <button onClick={() => handleReview(app.id, "SENT")}
                        className="text-green-600 hover:underline text-xs font-medium">📤 Mark Sent</button>
                    ) : app.status === "SENT" ? (
                      <span className="text-xs text-green-600 font-medium">✅ Sent</span>
                    ) : (
                      <span className="text-xs text-gray-400">Done</span>
                    )}
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
