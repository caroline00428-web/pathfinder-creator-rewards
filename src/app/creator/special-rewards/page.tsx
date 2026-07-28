"use client";

import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n/LanguageContext";

interface SpecialReward {
  id: string;
  rewardType: string;
  name: string;
  description: string;
  diamonds: number;
  campaign: { id: string; name: string };
}

interface Application {
  id: string;
  rewardId: string;
  status: string;
  createdAt: string;
  reward: { name: string };
}

interface VideoItem {
  id: string;
  title: string | null;
  platform: string;
  url: string;
}

export default function SpecialRewardsPage() {
  const { t } = useT();
  const [rewards, setRewards] = useState<SpecialReward[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyId, setApplyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [videoId, setVideoId] = useState("");
  const [followerCount, setFollowerCount] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [toast, setToast] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/special-rewards").then(r => r.json()),
      fetch("/api/special-rewards/my-applications").then(r => r.json()),
      fetch("/api/videos").then(r => r.json()),
    ]).then(([r, a, v]) => {
      setRewards(r);
      setApplications(a);
      setVideos(Array.isArray(v) ? v : []);
    }).finally(() => setLoading(false));
  }, []);

  function getAppStatus(rewardId: string): string | null {
    const apps = applications.filter(a => a.rewardId === rewardId);
    if (apps.length === 0) return null;
    if (apps.some(a => a.status === "SENT")) return "SENT";
    if (apps.some(a => a.status === "APPROVED")) return "APPROVED";
    if (apps.some(a => a.status === "PENDING")) return "PENDING";
    if (apps.every(a => a.status === "REJECTED")) return "REJECTED";
    return null;
  }

  function getAppCount(rewardId: string): number {
    return applications.filter(a => a.rewardId === rewardId).length;
  }

  async function handleApply(rewardId: string) {
    setSubmitting(true);
    setToast("");
    const body: any = { notes };
    if (videoId) body.videoId = videoId;
    if (followerCount) body.followerCount = parseInt(followerCount);
    if (profileUrl) body.profileUrl = profileUrl;

    const res = await fetch(`/api/special-rewards/${rewardId}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      setToast(`✅ ${t("special.applied")}`);
      setApplications(prev => [...prev, data.application]);
    } else {
      setToast(`❌ ${data.error}`);
    }
    setSubmitting(false);
    setConfirmId(null);
    setNotes("");
    setVideoId("");
    setFollowerCount("");
    setProfileUrl("");
  }

  const aiComicVideos = videos;

  const rewardIcons: Record<string, string> = {
    REGISTRATION: "📝",
    PARTICIPATION: "☀️",
    DILIGENCE: "💪",
    STAR_CREATOR: "⭐",
    AI_COMIC: "🤖",
  };

  const typeColors: Record<string, string> = {
    REGISTRATION: "border-blue-200 bg-blue-50",
    PARTICIPATION: "border-yellow-200 bg-yellow-50",
    DILIGENCE: "border-green-200 bg-green-50",
    STAR_CREATOR: "border-purple-200 bg-purple-50",
    AI_COMIC: "border-pink-200 bg-pink-50",
  };

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">🎁 {t("special.title")}</h2>
      <p className="text-sm text-gray-500 mb-6">{t("special.subtitle")}</p>

      {toast && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${toast.startsWith("✅") ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {toast}
        </div>
      )}

      <div className="space-y-4">
        {rewards.map(reward => {
          const status = getAppStatus(reward.id);
          const appCount = getAppCount(reward.id);
          const isAIComic = reward.rewardType === "AI_COMIC";
          const isStarCreator = reward.rewardType === "STAR_CREATOR";

          return (
            <div key={reward.id} className={`bg-white rounded-xl shadow-sm border-2 p-5 ${typeColors[reward.rewardType] || "border-gray-100"}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{rewardIcons[reward.rewardType]}</span>
                    <h3 className="text-lg font-bold text-gray-900">{t(`reward.${reward.rewardType}.name`, reward.name)}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{reward.rewardType}</span>
                    {isAIComic && appCount > 0 && (
                      <span className="text-xs text-pink-600 font-medium">{t("special.appliedCount")}: {appCount}x</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{t(`reward.${reward.rewardType}.desc`, reward.description)}</p>
                  <p className="text-sm">
                    <span className="font-bold text-indigo-600">{reward.diamonds.toLocaleString()} {t("special.diamonds")}</span>
                    <span className="text-gray-400 text-xs ml-2">{t("special.campaign")}: {reward.campaign.name}</span>
                  </p>

                  {status && (
                    <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                      status === "SENT" ? "bg-blue-100 text-blue-800" :
                      status === "APPROVED" ? "bg-green-100 text-green-800" :
                      status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {status === "SENT" ? "📤 Sent" :
                       status === "APPROVED" ? t("special.approvedIssued") :
                       status === "PENDING" ? t("special.pendingReview") :
                       t("special.rejectedRetry")}
                      {isAIComic && appCount > 1 && ` (${appCount})`}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    setApplyId(reward.id);
                    setConfirmId(reward.id);
                    setNotes("");
                    setVideoId("");
                    setFollowerCount("");
                    setProfileUrl("");
                  }}
                  disabled={status === "APPROVED" || status === "SENT" || (!isAIComic && status === "PENDING")}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {isAIComic ? t("special.applyAgain") : status === "REJECTED" ? t("special.applyAgain") : status === "PENDING" ? t("special.pending") : status === "SENT" ? "📤 Sent" : status === "APPROVED" ? t("special.received") : t("special.apply")}
                </button>
              </div>

              {/* Application Form */}
              {confirmId === reward.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">⚠️ {t("special.confirmTitle")} <b>{reward.name}</b></p>

                  {isAIComic && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("special.selectVideo")}</label>
                      {aiComicVideos.length === 0 ? (
                        <p className="text-sm text-red-500">{t("special.noVideo")}</p>
                      ) : (
                        <select value={videoId} onChange={e => setVideoId(e.target.value)} required
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
                          <option value="">{t("submit.selectVideo")}</option>
                          {aiComicVideos.map(v => (
                            <option key={v.id} value={v.id}>{v.title || v.url} ({v.platform})</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {isStarCreator && (
                    <>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t("special.followerCount")}</label>
                        <input type="number" value={followerCount} onChange={e => setFollowerCount(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          placeholder={t("submit.followerPlaceholder")} min={5000} />
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t("special.profileUrl")}</label>
                        <input type="url" value={profileUrl} onChange={e => setProfileUrl(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          placeholder="https://youtube.com/@yourchannel or https://tiktok.com/@yourhandle" />
                      </div>
                    </>
                  )}

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("special.notes")}</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      placeholder={t("submit.notesPlaceholder")} />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleApply(reward.id)} disabled={submitting || (isAIComic && !videoId) || (isStarCreator && !followerCount)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500 disabled:opacity-50 transition-colors">
                      {submitting ? t("special.submitting") : `✅ ${t("special.confirmBtn")}`}
                    </button>
                    <button onClick={() => setConfirmId(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                      {t("special.cancel")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
