"use client";

import { formatDate } from "@/lib/utils";
import { useT } from "@/lib/i18n/LanguageContext";
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
  const { t } = useT();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [showScheme, setShowScheme] = useState(false);

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
    } else if (data.needSchemeChoice) {
      setShowScheme(true);
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

  function getVideoMilestoneInfo(video: VideoItem, allVideos: VideoItem[]) {
    const platformMilestones = milestones
      .filter(m => m.platform === video.platform && m.active)
      .sort((a, b) => a.viewThreshold - b.viewThreshold);
    // Total views across ALL eligible videos in same platform for this creator
    const totalViews = allVideos
      .filter(v => v.platform === video.platform && v.eligibilityStatus === "ELIGIBLE")
      .reduce((sum, v) => sum + v.viewCount, 0);
    // Collect all claimed milestone IDs (unique per creator+milestone)
    const claimedIds = new Set(allVideos.flatMap(v => (v.claims || []).map(c => c.milestoneId)));
    const nextUnclaimed = platformMilestones.find(m => !claimedIds.has(m.id) && totalViews >= m.viewThreshold);
    const upcoming = platformMilestones.find(m => !claimedIds.has(m.id) && totalViews < m.viewThreshold);
    return { platformMilestones, claimedIds, totalViews, nextUnclaimed, upcoming };
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{t("videos.title")}</h2>
        <div className="flex gap-2">
          {["", "YOUTUBE", "TIKTOK"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f ? "bg-indigo-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"
              }`}>{f || t("videos.filterAll")}</button>
          ))}
        </div>
      </div>

      {toast && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${toast.startsWith("✅") || toast.startsWith("🔄") ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {toast}
        </div>
      )}

      {/* Reward Scheme Selection Dialog */}
      {showScheme && (
        <div className="mb-4 bg-indigo-50 border-2 border-indigo-300 rounded-xl p-5">
          <h3 className="font-bold text-indigo-900 mb-2">🎯 {t("scheme.title")}</h3>
          <p className="text-sm text-indigo-700 mb-4">{t("scheme.subtitle")}</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={async () => {
              const r = await fetch("/api/profile/scheme", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rewardScheme: "DIAMOND" }) });
              if (r.ok) { setShowScheme(false); setToast("✅ Diamond scheme selected!"); fetchData(); } else { const d = await r.json(); setToast(`❌ ${d.error}`); }
            }} className="p-4 bg-white border-2 border-indigo-200 rounded-lg hover:border-indigo-400 transition-colors text-left">
              <p className="font-bold text-indigo-900">{t("scheme.diamondTitle")}</p>
              <p className="text-xs text-gray-600 mt-1">{t("scheme.diamondDesc")}</p>
            </button>
            <button onClick={async () => {
              const r = await fetch("/api/profile/scheme", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rewardScheme: "POINTS" }) });
              if (r.ok) { setShowScheme(false); setToast("✅ Points scheme selected!"); fetchData(); } else { const d = await r.json(); setToast(`❌ ${d.error}`); }
            }} className="p-4 bg-white border-2 border-amber-200 rounded-lg hover:border-amber-400 transition-colors text-left">
              <p className="font-bold text-amber-800">{t("scheme.pointsTitle")}</p>
              <p className="text-xs text-gray-600 mt-1">{t("scheme.pointsDesc")}</p>
            </button>
          </div>
        </div>
      )}

      {/* Discord support notice */}

      {/* Milestone summary */}
      {videos.length > 0 && (() => {
        const ytVideos = videos.filter((v: VideoItem) => v.platform === "YOUTUBE" && v.eligibilityStatus === "ELIGIBLE");
        const ttVideos = videos.filter((v: VideoItem) => v.platform === "TIKTOK" && v.eligibilityStatus === "ELIGIBLE");
        const ytTotal = ytVideos.reduce((s: number, v: VideoItem) => s + v.viewCount, 0);
        const ttTotal = ttVideos.reduce((s: number, v: VideoItem) => s + v.viewCount, 0);
        const allClaims = new Set(videos.flatMap((v: VideoItem) => v.claims.map(c => c.milestoneId)));

        const summaryBox = (platform: string, total: number, color: string) => {
          const ms = milestones.filter(m => m.platform === platform && m.active).sort((a, b) => a.viewThreshold - b.viewThreshold);
          const next = ms.find(m => !allClaims.has(m.id) && total < m.viewThreshold);
          return (
            <div key={platform} className={`bg-white rounded-xl shadow-sm border-2 p-3 flex-1 min-w-0 ${color}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{platform === "YOUTUBE" ? "▶ YouTube" : "🎵 TikTok"}</span>
                <span className="text-xs text-gray-500">{ytVideos.length + ttVideos.length > 0 ? "" : ""}</span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold text-gray-900">{total.toLocaleString()}</span>
                <span className="text-xs text-gray-500">total views</span>
              </div>
              {next ? (
                <p className="text-xs text-indigo-600 mt-1">
                  🎯 Next: {next.viewThreshold.toLocaleString()} → 💎{next.creditsAwarded.toLocaleString()} / ${Math.floor(next.creditsAwarded / 100)} ({((next.viewThreshold - total)).toLocaleString()} more)
                </p>
              ) : (
                <p className="text-xs text-green-600 mt-1">🎉 All milestones reached!</p>
              )}
            </div>
          );
        };

        return (
          <div className="flex gap-3 mb-4">
            {summaryBox("YOUTUBE", ytTotal, "border-red-200")}
            {summaryBox("TIKTOK", ttTotal, "border-gray-300")}
          </div>
        );
      })()}

      {videos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-500">{t("videos.empty")}</p>
          <Link href="/creator/submit" className="text-indigo-600 text-sm hover:underline mt-2 inline-block">{t("videos.emptyHint")}</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((v) => {
            const { platformMilestones, claimedIds, totalViews, nextUnclaimed, upcoming } = getVideoMilestoneInfo(v, videos);
            const claimableCount = platformMilestones.filter(m => !claimedIds.has(m.id) && totalViews >= m.viewThreshold).length;
            return (
            <div key={v.id} className={`bg-white rounded-xl shadow-sm border p-5 ${
              claimableCount > 0 ? "border-green-300 ring-1 ring-green-200" : "border-gray-100"
            }`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  {/* Video Title — prominent */}
                  <h4 className="text-base font-bold text-gray-900 mb-1 truncate">
                    {v.title || t("videos.untitled")}
                  </h4>
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
                    className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors truncate block">
                    {v.url}
                  </a>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                    <span>{t("videos.published")}: {formatDate(v.uploadTime)}</span>
                    <span className="font-semibold text-gray-900">{t("videos.views")}: {v.viewCount.toLocaleString()}</span>
                    {v.lastSyncedAt && <span className="text-gray-400">{t("videos.synced")}: {formatDate(v.lastSyncedAt)}</span>}
                    {v.claims.length > 0 && (
                      <span className="text-green-600 font-medium">
                        {v.claims.length} {t("videos.claimed")} ({v.claims.reduce((s, c) => s + c.creditsAwarded, 0)} credits)
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 ml-4">
                  {v.platform === "YOUTUBE" && (
                    <button onClick={() => handleSync(v.id)} disabled={syncingId === v.id}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors whitespace-nowrap">
                      {syncingId === v.id ? `⏳ ${t("videos.syncing")}` : `🔄 ${t("videos.sync")}`}
                    </button>
                  )}
                  {claimableCount > 0 && (
                    <button onClick={() => handleClaim(v.id)} disabled={claimingId === v.id || v.eligibilityStatus === "INELIGIBLE"}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap animate-pulse">
                      {claimingId === v.id ? t("videos.claiming") : `🎯 ${t("videos.claim")} (+${claimableCount})`}
                    </button>
                  )}
                </div>
              </div>

              {/* Discord notice */}
              <p className="text-[10px] text-gray-400 mt-2 text-center border-t pt-2">
                💬 Questions? Contact <b>@Hedy</b> in our <a href="https://discord.gg/8tcRJ7wwDB" target="_blank" className="text-indigo-500 hover:underline">Discord</a>
              </p>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
