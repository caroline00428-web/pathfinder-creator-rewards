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

export default function CreatorDashboard() {
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/wallet").then(r => r.json()),
      fetch("/api/videos").then(r => r.json()),
      fetch("/api/orders").then(r => r.json()),
      fetch("/api/profile").then(r => r.json()),
      fetch("/api/milestones").then(r => r.json()),
    ]).then(([w, v, o, p, m]) => {
      setWallet(w);
      setVideos(v);
      setOrders(o);
      setProfile(p);
      setMilestones(m);
    }).finally(() => setLoading(false));
  }, []);

  function getMilestoneProgress(videos: any[], platform: string, milestones: Milestone[]) {
    const platformVideos = videos.filter((v: any) => v.platform === platform && v.eligibilityStatus === "ELIGIBLE");
    const maxViews = platformVideos.length > 0 ? Math.max(...platformVideos.map((v: any) => v.viewCount)) : 0;
    const claimedIds = new Set(platformVideos.flatMap((v: any) => (v.claims || []).map((c: any) => c.milestoneId)));
    const platformMilestones = milestones.filter(m => m.platform === platform).sort((a, b) => a.viewThreshold - b.viewThreshold);

    return { maxViews, claimedIds, platformMilestones };
  }

  const ytProgress = getMilestoneProgress(videos, "YOUTUBE", milestones);
  const ttProgress = getMilestoneProgress(videos, "TIKTOK", milestones);
  const totalClaimed = videos.reduce((sum: number, v: any) =>
    sum + (v.claims || []).reduce((s: number, c: any) => s + c.creditsAwarded, 0), 0
  );

  const ytVideos = videos.filter((v: any) => v.platform === "YOUTUBE");
  const ttVideos = videos.filter((v: any) => v.platform === "TIKTOK");

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

  function MilestoneBar({ milestones, maxViews, claimedIds, platform }: { milestones: Milestone[]; maxViews: number; claimedIds: Set<string>; platform: string }) {
    if (milestones.length === 0) return <p className="text-sm text-gray-400">No milestones configured yet.</p>;
    const highestMilestone = milestones[milestones.length - 1]?.viewThreshold || 100000;
    const progressPct = Math.min(100, Math.round((maxViews / highestMilestone) * 100));

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>0</span>
          <span>Best video: <b>{maxViews.toLocaleString()} views</b></span>
          <span>{highestMilestone.toLocaleString()}+</span>
        </div>
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          <div className={`absolute left-0 top-0 h-full rounded-full transition-all ${platform === "YOUTUBE" ? "bg-red-500" : "bg-gray-800"}`}
            style={{ width: `${progressPct}%` }} />
          {milestones.map((m) => {
            const pct = Math.round((m.viewThreshold / highestMilestone) * 100);
            const reached = maxViews >= m.viewThreshold;
            const claimed = claimedIds.has(m.id);
            return (
              <div key={m.id} className="absolute top-0 h-full" style={{ left: `${pct}%` }}>
                <div className={`w-3 h-3 rounded-full border-2 border-white absolute -top-0 -translate-x-1/2 ${
                  claimed ? "bg-green-500" : reached ? "bg-yellow-400" : "bg-gray-400"
                }`} title={`${m.viewThreshold.toLocaleString()} views → ${m.creditsAwarded} credits${claimed ? " (Claimed)" : reached ? " (Reached!)" : ""}`} />
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {milestones.map((m, i) => {
            const reached = maxViews >= m.viewThreshold;
            const claimed = claimedIds.has(m.id);
            let bg = "bg-gray-100 text-gray-500";
            if (claimed) bg = "bg-green-100 text-green-700";
            else if (reached) bg = "bg-yellow-100 text-yellow-700 border border-yellow-400";
            return (
              <div key={m.id} className={`text-xs px-2.5 py-1 rounded-full font-medium ${bg}`}>
                {m.viewThreshold.toLocaleString()} → {m.creditsAwarded} credits
                {claimed ? " ✅" : reached ? " 🎯" : ""}
              </div>
            );
          })}
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
            <p className="text-xs uppercase tracking-widest text-purple-400 mb-1">Galaxy Defense · Pathfinder Program</p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Welcome{profile?.displayName ? `, ${profile.displayName}` : ""}!
            </h1>
            <p className="text-sm text-gray-400 mt-1">Create content, earn milestones, redeem epic rewards.</p>
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
          <p className="text-sm text-gray-500">Credit Balance</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">{wallet?.balance?.toLocaleString() ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Total Earned</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{totalClaimed.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Videos</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{videos.length}</p>
          <p className="text-xs text-gray-400">YT: {ytVideos.length} · TT: {ttVideos.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Orders</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{orders.length}</p>
        </div>
      </div>

      {/* Player ID Warning */}
      {profile && !profile.playerId && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ You haven&apos;t bound your game Player ID yet.{" "}
            <Link href="/creator/profile" className="font-medium underline">Set it now →</Link>
          </p>
        </div>
      )}

      {/* Milestone Progress — Most Prominent Section */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🎯 Milestone Progress</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border-2 border-red-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-900">▶ YouTube Rewards</h4>
              <Link href="/creator/videos?filter=YOUTUBE" className="text-xs text-indigo-600 hover:underline">
                {ytVideos.length} video{ytVideos.length !== 1 ? "s" : ""} →
              </Link>
            </div>
            <MilestoneBar milestones={ytProgress.platformMilestones} maxViews={ytProgress.maxViews} claimedIds={ytProgress.claimedIds} platform="YOUTUBE" />
          </div>
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-900">🎵 TikTok Rewards</h4>
              <Link href="/creator/videos?filter=TIKTOK" className="text-xs text-indigo-600 hover:underline">
                {ttVideos.length} video{ttVideos.length !== 1 ? "s" : ""} →
              </Link>
            </div>
            <MilestoneBar milestones={ttProgress.platformMilestones} maxViews={ttProgress.maxViews} claimedIds={ttProgress.claimedIds} platform="TIKTOK" />
          </div>
        </div>
      </div>

      {/* Recent Orders & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Recent Orders</h3>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-400">No orders yet.</p>
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
          <Link href="/creator/orders" className="text-xs text-indigo-600 hover:underline mt-3 inline-block">View all →</Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/creator/submit" className="block w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium text-center hover:bg-indigo-500 transition-colors">
              🎬 Submit New Video
            </Link>
            <Link href="/creator/videos" className="block w-full px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium text-center hover:bg-green-500 transition-colors">
              🎯 My Videos & Claim Rewards
            </Link>
            <Link href="/creator/shop" className="block w-full px-4 py-2.5 bg-gray-700 text-white rounded-lg text-sm font-medium text-center hover:bg-gray-600 transition-colors">
              🛒 Browse Reward Shop
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
