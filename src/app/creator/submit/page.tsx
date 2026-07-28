"use client";

import { formatDate } from "@/lib/utils";
import { useT } from "@/lib/i18n/LanguageContext";
import { useState, useEffect } from "react";

interface Campaign {
  id: string;
  name: string;
  platform: string;
  active: boolean;
}

interface VideoInfo {
  title?: string;
  publishedAt?: string;
  channelTitle?: string;
  thumbnailUrl?: string;
  requiresManualEntry: boolean;
  message?: string;
}

export default function SubmitVideoPage() {
  const { t } = useT();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [platform, setPlatform] = useState("YOUTUBE");
  const [campaignId, setCampaignId] = useState("");
  const [url, setUrl] = useState("");
  const [uploadTime, setUploadTime] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [fetchMsg, setFetchMsg] = useState("");

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => {
        const active = data.filter((c: Campaign) => c.active);
        setCampaigns(active);
        if (active.length > 0 && !campaignId) setCampaignId(active[0].id);
      });
  }, []);

  async function handleFetchInfo() {
    if (!url) return;
    setFetching(true);
    setFetchMsg("");
    setVideoInfo(null);
    setTitle("");
    setUploadTime("");

    try {
      const res = await fetch("/api/videos/fetch-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, platform }),
      });
      const data: VideoInfo = await res.json();

      if (res.ok && !data.requiresManualEntry) {
        // Auto-fill!
        setTitle(data.title || "");
        // Convert ISO 8601 to datetime-local format
        if (data.publishedAt) {
          const d = new Date(data.publishedAt);
          setUploadTime(d.toISOString().slice(0, 10));
        }
        setVideoInfo(data);
        setFetchMsg(`✅ ${t("submit.autoDetectedMsg")}: ${data.title || t("submit.unknownTitle")} ${t("general.by")} ${data.channelTitle || t("submit.unknownChannel")}`);
      } else {
        setVideoInfo(data);
        setFetchMsg(`⚠️ ${data.message || t("submit.fetchFailed")}`);
      }
    } catch {
      setFetchMsg(`❌ ${t("submit.fetchFailed")}`);
    }
    setFetching(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId,
        platform,
        url,
        uploadTime: new Date(uploadTime).toISOString(),
        title: title || null,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (res.ok) {
      setSuccess(`${t("submit.videoSubmitted")} ${t("submit.status")}: ${data.eligibilityStatus === "ELIGIBLE" ? "✅ " + t("submit.eligible") : "⚠️ " + t("submit.notEligible")}`);
      setUrl("");
      setTitle("");
      setUploadTime("");
      setVideoInfo(null);
      setFetchMsg("");
    } else {
      setError(data.error || t("submit.failed"));
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("submit.title")}</h2>
      <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2.5 text-sm text-indigo-700">
        ⚠️ {t("submit.hashtagHint")} <code className="bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-800 font-bold">#galaxydefense #galaxydefensepathfinder</code> {t("submit.hashtagHint2")}
        <br /><a href="/guide" target="_blank" className="text-indigo-500 underline text-xs mt-1 inline-block">📖 New to creating videos? Read our free starter guide →</a>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
        {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">{success}</p>}

        {/* Platform */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t("submit.platform")}</label>
          <div className="flex gap-2">
            {["YOUTUBE", "TIKTOK"].map((p) => (
              <button
                key={p} type="button" onClick={() => { setPlatform(p); setVideoInfo(null); setFetchMsg(""); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  platform === p
                    ? p === "YOUTUBE" ? "bg-red-600 text-white" : "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p === "YOUTUBE" ? "▶ YouTube" : "🎵 TikTok"}
              </button>
            ))}
          </div>
        </div>

        {/* Campaign */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("submit.campaign")}</label>
          <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
            <option value="">{t("submit.selectCampaign")}</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.platform})</option>
            ))}
          </select>
        </div>

        {/* URL with Fetch button */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("submit.videoUrl")}</label>
          <div className="flex gap-2">
            <input
              type="url" required value={url} onChange={(e) => setUrl(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              placeholder={platform === "YOUTUBE" ? "https://youtube.com/watch?v=..." : "https://tiktok.com/@user/video/..."}
            />
            <button
              type="button" onClick={handleFetchInfo} disabled={fetching || !url}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {fetching ? `⏳ ${t("submit.detecting")}` : `🔍 ${t("submit.autoDetect")}`}
            </button>
          </div>
          {fetchMsg && (
            <p className={`text-xs mt-2 p-2 rounded-md ${
              fetchMsg.startsWith("✅") ? "bg-green-50 text-green-700" :
              fetchMsg.startsWith("⚠️") ? "bg-yellow-50 text-yellow-700" :
              "bg-red-50 text-red-700"
            }`}>{fetchMsg}</p>
          )}
        </div>

        {/* Fetched video preview */}
        {videoInfo?.thumbnailUrl && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <img src={videoInfo.thumbnailUrl} alt="thumbnail" className="w-20 h-auto rounded" />
            <div className="text-sm">
              <p className="font-medium text-gray-900">{videoInfo.title}</p>
              <p className="text-gray-500">{videoInfo.channelTitle}</p>
              <p className="text-gray-400 text-xs">Published: {videoInfo.publishedAt ? formatDate(videoInfo.publishedAt) : "—"}</p>
            </div>
          </div>
        )}

        {/* Title — auto-filled, editable */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Video Title {videoInfo?.title && <span className="text-green-600 text-xs">({t("submit.autoDetected")})</span>}
          </label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            placeholder={t("submit.placeholder")} />
        </div>

        {/* Upload Time — auto-filled, editable */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("submit.publishTime")} {videoInfo?.publishedAt && <span className="text-green-600 text-xs">({t("submit.autoDetected")})</span>}
          </label>
          <input
            type="date" required value={uploadTime} onChange={(e) => setUploadTime(e.target.value)}
            onKeyDown={(e) => e.preventDefault()}
            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {videoInfo?.requiresManualEntry === false
              ? "✅ Automatically detected. Adjust if needed."
              : platform === "TIKTOK"
                ? "📱 TikTok: Open your TikTok video → tap share → copy link → check the publish date in TikTok app."
                : "Paste URL and click 🔍 Auto-Detect. If detection fails, enter manually."}
          </p>
        </div>

        <button type="submit" disabled={submitting || !uploadTime}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors">
          {submitting ? t("submit.submitting") : t("submit.submitBtn")}
        </button>
      </form>
    </div>
  );
}
