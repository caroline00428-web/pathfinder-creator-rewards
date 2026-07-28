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

export default function CreatorDashboard() {
  const { t } = useT();
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/wallet").then(r => r.json()),
      fetch("/api/videos").then(r => r.json()),
      fetch("/api/orders").then(r => r.json()),
      fetch("/api/profile").then(r => r.json()),
      fetch("/api/milestones").then(r => r.json()),
      fetch("/api/announcements").then(r => r.json()),
    ]).then(([w, v, o, p, m, a]) => {
      setWallet(w);
      setVideos(v);
      setOrders(o);
      setProfile(p);
      setMilestones(m);
      setAnnouncements(a);
    }).finally(() => setLoading(false));
  }, []);

  function getMilestoneProgress(videos: any[], platform: string, milestones: Milestone[]) {
    const platformVideos = videos.filter((v: any) => v.platform === platform && v.eligibilityStatus === "ELIGIBLE");
    const totalViews = platformVideos.reduce((sum: number, v: any) => sum + v.viewCount, 0);
    // Get claimed milestone IDs from ALL videos (unique per creator+milestone now)
    const claimedIds = new Set(platformVideos.flatMap((v: any) => (v.claims || []).map((c: any) => c.milestoneId)));
    const platformMilestones = milestones.filter(m => m.platform === platform).sort((a, b) => a.viewThreshold - b.viewThreshold);

    return { totalViews, claimedIds, platformMilestones };
  }

  const ytProgress = getMilestoneProgress(videos, "YOUTUBE", milestones);
  const ttProgress = getMilestoneProgress(videos, "TIKTOK", milestones);
  const totalClaimed = videos.reduce((sum: number, v: any) =>
    sum + (v.claims || []).reduce((s: number, c: any) => s + c.creditsAwarded, 0), 0
  );

  const ytVideos = videos.filter((v: any) => v.platform === "YOUTUBE");
  const ttVideos = videos.filter((v: any) => v.platform === "TIKTOK");

  if (loading) return <div className="p-8 text-gray-500">{t("general.loading")}</div>;

  function MilestoneBar({ milestones, totalViews, claimedIds, platform }: { milestones: Milestone[]; totalViews: number; claimedIds: Set<string>; platform: string }) {
    if (milestones.length === 0) return <p className="text-sm text-gray-400">{t("dashboard.noMilestones")}</p>;
    const nextMilestone = milestones.find(m => !claimedIds.has(m.id) && totalViews < m.viewThreshold);
    const headerColor = platform === "YOUTUBE" ? "border-red-200" : "border-gray-300";

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">{t("dashboard.total")}: <b className="text-gray-900">{totalViews.toLocaleString()}</b></span>
          {nextMilestone ? (
            <span className="text-indigo-600 font-medium">🎯 {nextMilestone.viewThreshold.toLocaleString()} → {nextMilestone.creditsAwarded} cr ({((nextMilestone.viewThreshold - totalViews)).toLocaleString()} more)</span>
          ) : (
            <span className="text-green-600 font-medium">{t("dashboard.allReached")}</span>
          )}
        </div>
        <div className={`rounded-lg border ${headerColor} overflow-hidden bg-white`}>
          <table className="w-full text-xs">
            <thead><tr className="border-b bg-gray-50">
              <th className="py-1.5 px-2 text-left font-medium text-gray-500">Views</th>
              <th className="py-1.5 px-2 text-right font-medium text-gray-500">💎</th>
              <th className="py-1.5 px-2 text-right font-medium text-gray-500">🪙 $</th>
              <th className="py-1.5 px-2 text-center font-medium text-gray-500 w-10">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {milestones.map((m) => {
                const reached = totalViews >= m.viewThreshold;
                const claimed = claimedIds.has(m.id);
                const rowBg = claimed ? "bg-green-50" : reached ? "bg-yellow-50" : "";
                return (
                  <tr key={m.id} className={rowBg}>
                    <td className="py-1 px-2 font-medium">{m.viewThreshold.toLocaleString()}</td>
                    <td className="py-1 px-2 text-right text-indigo-600 font-bold">{m.creditsAwarded.toLocaleString()}</td>
                    <td className="py-1 px-2 text-right text-green-600 font-medium">${Math.floor(m.creditsAwarded / 100)}</td>
                    <td className="py-1 px-2 text-center text-sm">{claimed ? "✅" : reached ? "🎯" : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Banner */}
      <div className="mb-6 relative rounded-2xl overflow-hidden h-40 md:h-48 bg-gray-900">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url(/pathfinder-hero.jpg)", backgroundPosition: "center 30%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/60 to-transparent" />
        <div className="relative z-10 flex items-center h-full px-6 md:px-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-purple-400 mb-1">{t("brand.tagline")}</p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              {t("dashboard.welcome")}{profile?.displayName ? `, ${profile.displayName}` : ""}!
            </h1>
            <p className="text-sm text-gray-400 mt-1">{t("brand.heroSub")}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">📊 Overview</h2>
        <Link href="/creator/submit" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-purple-500 hover:to-indigo-500 transition-all shadow-md">
          🎬 Submit Video
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">{t("dashboard.creditBalance")}</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">{wallet?.balance?.toLocaleString() ?? 0}</p>
          {profile?.rewardScheme && (
            <p className="text-xs text-gray-400 mt-1">
              Scheme: {profile.rewardScheme === "DIAMOND" ? "💎 Diamond" : "🪙 Points"}
            </p>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">{t("dashboard.totalEarned")}</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{totalClaimed.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">{t("dashboard.videos")}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{videos.length}</p>
          <p className="text-xs text-gray-400">YT: {ytVideos.length} · TT: {ttVideos.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">{t("dashboard.orders")}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{orders.length}</p>
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="mb-4 space-y-2">
          {announcements.map((a: any) => (
            <div key={a.id} className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <p className="text-sm font-semibold text-blue-900">📢 {a.title}</p>
              <p className="text-xs text-blue-700 mt-0.5">{a.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* New Creator Onboarding Banner */}
      {videos.length === 0 && (
        <div className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-lg">🎬 Ready to earn rewards?</h3>
              <p className="text-sm text-indigo-100 mt-1">Create your first Galaxy Defense video and start earning diamonds! Zero experience needed — we have a free guide.</p>
            </div>
            <div className="flex gap-2">
              <a href="/guide" target="_blank" className="px-4 py-2 bg-white text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors">📖 View Guide</a>
              <Link href="/creator/submit" className="px-4 py-2 bg-indigo-300 text-indigo-900 rounded-lg text-sm font-bold hover:bg-indigo-200 transition-colors">Submit Now →</Link>
            </div>
          </div>
        </div>
      )}
      {profile && !profile.playerId && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ {t("dashboard.playerIdWarning")}{" "}
            <Link href="/creator/profile" className="font-medium underline">{t("dashboard.setItNow")}</Link>
          </p>
        </div>
      )}

      {/* Milestone Progress — Most Prominent Section */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🎯 {t("dashboard.milestoneProgress")}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border-2 border-red-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-900">▶ {t("dashboard.youtubeRewards")}</h4>
              <Link href="/creator/videos?filter=YOUTUBE" className="text-xs text-indigo-600 hover:underline">
                {ytVideos.length} {ytVideos.length !== 1 ? t("dashboard.videos_plural") : t("dashboard.video")} →
              </Link>
            </div>
            <MilestoneBar milestones={ytProgress.platformMilestones} totalViews={ytProgress.totalViews} claimedIds={ytProgress.claimedIds} platform="YOUTUBE" />
          </div>
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-900">🎵 {t("dashboard.tiktokRewards")}</h4>
              <Link href="/creator/videos?filter=TIKTOK" className="text-xs text-indigo-600 hover:underline">
                {ttVideos.length} video{ttVideos.length !== 1 ? "s" : ""} →
              </Link>
            </div>
            <MilestoneBar milestones={ttProgress.platformMilestones} totalViews={ttProgress.totalViews} claimedIds={ttProgress.claimedIds} platform="TIKTOK" />
          </div>
        </div>
      </div>

      {/* Recent Orders & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">{t("dashboard.recentOrders")}</h3>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-400">{t("orders.empty")}</p>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 5).map((o: any) => (
                <div key={o.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{o.items?.map((i: any) => `${i.itemName} x${i.quantity}`).join(", ")}</span>
                  <span className="font-medium">{o.totalCreditCost.toLocaleString()} cr</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    o.status === "PENDING" ? "bg-yellow-100 text-yellow-800" : "bg-purple-100 text-purple-800"
                  }`}>{o.status}</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/creator/orders" className="text-xs text-indigo-600 hover:underline mt-3 inline-block">{t("general.viewAll")} →</Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">{t("dashboard.quickActions")}</h3>
          <div className="space-y-2">
            <Link href="/creator/submit" className="block w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium text-center hover:bg-indigo-500 transition-colors">
              🎬 {t("general.submitVideo")}
            </Link>
            <Link href="/creator/videos" className="block w-full px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium text-center hover:bg-green-500 transition-colors">
              🎯 {t("general.myVideosClaim")}
            </Link>
            <Link href="/creator/shop" className="block w-full px-4 py-2.5 bg-gray-700 text-white rounded-lg text-sm font-medium text-center hover:bg-gray-600 transition-colors">
              🛒 {t("general.browseShop")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
