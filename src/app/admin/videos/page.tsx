"use client";

import { useState, useEffect } from "react";

interface Video {
  id: string;
  platform: string;
  url: string;
  title: string | null;
  viewCount: number;
  status: string;
  eligibilityStatus: string;
  uploadTime: string;
  creator: { displayName: string; creatorCode: string };
  campaign: { name: string };
}

export default function AdminVideoReviewPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("ALL");
  const [editId, setEditId] = useState<string | null>(null);
  const [viewCount, setViewCount] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");

  useEffect(() => { fetchVideos(); }, [tab]);

  function fetchVideos() {
    setLoading(true);
    const url = tab !== "ALL" ? `/api/videos?platform=${tab}` : "/api/videos";
    fetch(url).then(r => r.json()).then(setVideos).finally(() => setLoading(false));
  }

  async function handleReview(videoId: string) {
    const res = await fetch(`/api/videos/${videoId}/review`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: reviewStatus, viewCount: viewCount ? parseInt(viewCount) : undefined }),
    });
    if (res.ok) {
      setEditId(null);
      setViewCount("");
      setReviewStatus("");
      fetchVideos();
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Video Review</h2>
      <div className="flex gap-2 mb-4">
        {["ALL", "YOUTUBE", "TIKTOK"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t ? "bg-indigo-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"
            }`}>{t === "ALL" ? "All" : t === "YOUTUBE" ? "YouTube" : "TikTok"}</button>
        ))}
      </div>

      {loading ? <p className="text-gray-500">Loading...</p> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">Creator</th>
                <th className="px-4 py-3 font-medium text-gray-500">Platform</th>
                <th className="px-4 py-3 font-medium text-gray-500">URL</th>
                <th className="px-4 py-3 font-medium text-gray-500">Upload Time</th>
                <th className="px-4 py-3 font-medium text-gray-500">Views</th>
                <th className="px-4 py-3 font-medium text-gray-500">Eligibility</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map(v => (
                <tr key={v.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{v.creator.displayName}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      v.platform === "YOUTUBE" ? "bg-red-100 text-red-700" : "bg-gray-900 text-white"
                    }`}>{v.platform}</span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate">
                    <a href={v.url} target="_blank" className="text-indigo-600 hover:underline">{v.title || v.url}</a>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(v.uploadTime).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium">{v.viewCount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      v.eligibilityStatus === "ELIGIBLE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>{v.eligibilityStatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      v.status === "APPROVED" ? "bg-green-100 text-green-800" :
                      v.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>{v.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {editId === v.id ? (
                      <div className="flex gap-2 items-center">
                        <input type="number" value={viewCount} onChange={e => setViewCount(e.target.value)}
                          className="w-20 rounded border border-gray-300 px-2 py-1 text-xs" placeholder="Views" />
                        <select value={reviewStatus} onChange={e => setReviewStatus(e.target.value)}
                          className="rounded border border-gray-300 px-2 py-1 text-xs">
                          <option value="">Status</option>
                          <option value="APPROVED">Approve</option>
                          <option value="REJECTED">Reject</option>
                        </select>
                        <button onClick={() => handleReview(v.id)}
                          className="px-2 py-1 bg-indigo-600 text-white rounded text-xs">Save</button>
                        <button onClick={() => setEditId(null)}
                          className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">X</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditId(v.id); setViewCount(v.viewCount.toString()); setReviewStatus(v.status); }}
                        className="text-indigo-600 hover:underline text-xs">Review</button>
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
