"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Milestone {
  id: string;
  platform: string;
  viewThreshold: number;
  creditsAwarded: number;
  active: boolean;
}

interface VideoItem {
  id: string;
  platform: string;
  url: string;
  title: string | null;
  viewCount: number;
  status: string;
  eligibilityStatus: string;
  uploadTime: string;
  submittedAt: string;
  lastSyncedAt: string | null;
  campaign: { name: string };
  claims: Array<{ milestoneId: string; creditsAwarded: number }>;
}

export default function MyVideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetchData();
  }, [filter]);

  function fetchData() {
    setLoading(true);
    const url = filter ? `/api/videos?platform=${filter}` : "/api/videos";
    Promise.all([
      fetch(url).then(r => r.json()),
      fetch("/api/milestones").then(r => r.json()),
    ]).then(([v, m]) => {
      setVideos(v);
      setMilestones(m);
    }).finally(() => setLoading(false));
  }

  async function handleClaim(videoId: string) {
    setClaimingId(videoId);
    setToast("");
    const res = await fetch(`/api/videos/${videoId}/claim`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setToast(`✅ Claimed! +${data.creditsAwarded} credits`);
      fetchData();
    } else {
      setToast(`❌ ${data.error}`);
    }
    setClaimingId(null);
  }

  async function handleSync(videoId: string) {
    setSyncingId(videoId);
    setToast("");
    const res = await fetch(`/api/videos/${videoId}/sync`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setToast(`🔄 Synced! ${data.previousViewCount?.toLocaleString()} → ${data.viewCount?.toLocaleString()} views`);
      fetchData();
    } else {
      setToast(`❌ ${data.error}`);
    }
    setSyncingId(null);
  }

  function getVideoMilestoneInfo(video: VideoItem) {
    const platformMilestones = milestones
      .filter(m => m.platform === video.platform && m.active)
      .sort((a, b) => a.viewThreshold - b.viewThreshold);
    const claimedIds = new Set(video.claims.map(c => c.milestoneId));
    const nextUnclaimed = platformMilestones.find(m => !claimedIds.has(m.id) && video.viewCount >= m.viewThreshold);
    const upcoming = platformMilestones.find(m => !claimedIds.has(m.id) && video.viewCount < m.viewThreshold);
    return { platformMilestones, claimedIds, nextUnclaimed, upcoming };
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">My Videos</h2>
        <div className="flex gap-2">
          {["", "YOUTUBE", "TIKTOK"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f ? "bg-indigo-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"
              }`}>{f || "All"}</button>
          ))}
        </div>
      </div>

      {toast && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${toast.startsWith("✅") || toast.startsWith("🔄") ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {toast}
        </div>
      )}

      {videos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-500">No videos submitted yet.</p>
          <Link href="/creator/submit" className="text-indigo-600 text-sm hover:underline mt-2 inline-block">Submit your first video →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((v) => {
            const { platformMilestones, claimedIds, nextUnclaimed, upcoming } = getVideoMilestoneInfo(v);
            const claimableCount = platformMilestones.filter(m => !claimedIds.has(m.id) && v.viewCount >= m.viewThreshold).length;
            return (
            <div key={v.id} className={`bg-white rounded-xl shadow-sm border p-5 ${
              claimableCount > 0 ? "border-green-300 ring-1 ring-green-200" : "border-gray-100"
            }`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      v.platform === "YOUTUBE" ? "bg-red-600 text-white" : "bg-gray-900 text-white"
                    }`}>{v.platform}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      v.eligibilityStatus === "ELIGIBLE" ? "bg-green-100 text-green-800" :
                      v.eligibilityStatus === "INELIGIBLE" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>{v.eligibilityStatus}</span>
                    <span className="text-xs text-gray-400">{v.campaign.name}</span>
                  </div>
                  <a href={v.url} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors truncate block">
                    {v.title || v.url}
                  </a>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                    <span>Published: {new Date(v.uploadTime).toLocaleDateString()}</span>
                    <span className="font-semibold text-gray-900">Views: {v.viewCount.toLocaleString()}</span>
                    {v.lastSyncedAt && <span className="text-gray-400">Synced: {new Date(v.lastSyncedAt).toLocaleString()}</span>}
                    {v.claims.length > 0 && (
                      <span className="text-green-600 font-medium">
                        {v.claims.length} claimed ({v.claims.reduce((s, c) => s + c.creditsAwarded, 0)} credits)
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 ml-4">
                  {v.platform === "YOUTUBE" && (
                    <button onClick={() => handleSync(v.id)} disabled={syncingId === v.id}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors whitespace-nowrap">
                      {syncingId === v.id ? "⏳ Syncing..." : "🔄 Sync Views"}
                    </button>
                  )}
                  {claimableCount > 0 && (
                    <button onClick={() => handleClaim(v.id)} disabled={claimingId === v.id || v.eligibilityStatus === "INELIGIBLE"}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap animate-pulse">
                      {claimingId === v.id ? "Claiming..." : `🎯 Claim (+${claimableCount})`}
                    </button>
                  )}
                </div>
              </div>

              {/* Milestone Progress Bar */}
              {platformMilestones.length > 0 && (
                <div className="mt-2 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">Milestone Progress</p>
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                    {platformMilestones.map((m) => {
                      const highestMs = platformMilestones[platformMilestones.length - 1]?.viewThreshold || 100000;
                      const pct = Math.round((m.viewThreshold / highestMs) * 100);
                      const reached = v.viewCount >= m.viewThreshold;
                      const claimed = claimedIds.has(m.id);
                      return (
                        <div key={m.id} className="absolute top-0 h-full" style={{ left: `${pct}%` }}>
                          <div className={`w-2.5 h-2.5 rounded-full border border-white absolute -top-0.5 -translate-x-1/2 ${
                            claimed ? "bg-green-500" : reached ? "bg-yellow-400 ring-2 ring-yellow-300" : "bg-gray-300"
                          }`} title={`${m.viewThreshold.toLocaleString()} views → ${m.creditsAwarded} credits${claimed ? " (Claimed)" : reached ? " (Reached!)" : ""}`} />
                        </div>
                      );
                    })}
                    {/* Current view marker */}
                    {(() => {
                      const highestMs = platformMilestones[platformMilestones.length - 1]?.viewThreshold || 100000;
                      const viewPct = Math.min(100, Math.round((v.viewCount / highestMs) * 100));
                      return (
                        <div className="absolute top-0 h-full" style={{ left: `${viewPct}%` }}>
                          <div className="w-0.5 h-2 bg-indigo-600 absolute top-0 -translate-x-1/2" />
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {platformMilestones.map((m) => {
                      const reached = v.viewCount >= m.viewThreshold;
                      const claimed = claimedIds.has(m.id);
                      let cls = "text-xs px-1.5 py-0.5 rounded font-medium ";
                      if (claimed) cls += "bg-green-100 text-green-700";
                      else if (reached) cls += "bg-yellow-100 text-yellow-700 border border-yellow-400";
                      else cls += "bg-gray-50 text-gray-400";
                      return (
                        <span key={m.id} className={cls}>
                          {m.viewThreshold.toLocaleString()}: {m.creditsAwarded}cr{claimed ? " ✅" : reached ? " 🎯" : ""}
                        </span>
                      );
                    })}
                  </div>
                  {/* Upcoming milestone hint */}
                  {upcoming && !nextUnclaimed && (
                    <p className="text-xs text-gray-400 mt-2">
                      Next milestone: {upcoming.viewThreshold.toLocaleString()} views — you need {(upcoming.viewThreshold - v.viewCount).toLocaleString()} more
                    </p>
                  )}
                </div>
              )}
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
