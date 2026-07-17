"use client";

import { useState, useEffect } from "react";

export default function CreatorProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [playerId, setPlayerId] = useState("");
  const [youtubeChannelId, setYoutubeChannelId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setPlayerId(data.playerId || "");
        setYoutubeChannelId(data.youtubeChannelId || "");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleBindPlayerId(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Player ID saved and locked successfully!");
        setProfile({ ...profile, playerId: data.playerId, playerIdLocked: data.playerIdLocked });
      } else {
        setError(data.error || "Failed to save Player ID");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  }

  async function handleBindYouTube(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeChannelId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("YouTube channel saved!");
        setProfile({ ...profile, youtubeChannelId: data.youtubeChannelId });
      } else {
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!profile) return <div className="p-8 text-red-500">Profile not found.</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Account Info</h3>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Username</dt>
            <dd className="font-medium">{profile.user?.username}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Display Name</dt>
            <dd className="font-medium">{profile.displayName}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Creator Code</dt>
            <dd className="font-medium font-mono">{profile.creatorCode}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Credits</dt>
            <dd className="font-medium text-lg">{profile.wallet?.balance?.toLocaleString() ?? 0}</dd>
          </div>
        </dl>
      </div>

      {/* Player ID */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Game Player ID</h3>
        {profile.playerIdLocked ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              ✅ Your Player ID is locked: <span className="font-mono font-bold">{profile.playerId}</span>
            </p>
            <p className="text-xs text-green-600 mt-1">Player ID cannot be changed after binding.</p>
          </div>
        ) : (
          <form onSubmit={handleBindPlayerId} className="space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
            {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">{success}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter your game Player ID</label>
              <input type="text" value={playerId} onChange={(e) => setPlayerId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                placeholder="e.g., S5HDh2khfrSkZjhVfUiDpW6fwZG3" required disabled={profile.playerIdLocked} />
              <p className="text-xs text-gray-500 mt-1">⚠️ This can only be set once and cannot be changed later.</p>
            </div>
            <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors">
              Save & Lock Player ID
            </button>
          </form>
        )}
      </div>

      {/* YouTube Channel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">YouTube Channel (for view sync)</h3>
        <form onSubmit={handleBindYouTube} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Channel ID or Handle</label>
            <input type="text" value={youtubeChannelId} onChange={(e) => setYoutubeChannelId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g., @YourChannel or UCxxxxxxxxxx" />
            <p className="text-xs text-gray-500 mt-1">Bind your channel to enable one-click view count sync. Can be updated anytime.</p>
          </div>
          <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors">
            Save Channel
          </button>
          {success && <p className="text-sm text-green-600">{success}</p>}
        </form>
      </div>
    </div>
  );
}
