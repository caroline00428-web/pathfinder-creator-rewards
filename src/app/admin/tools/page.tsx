"use client";

import { useState } from "react";

export default function AdminToolsPage() {
  const [creatorsData, setCreatorsData] = useState<any>(null);
  const [loadingCreators, setLoadingCreators] = useState(false);
  const [resetResult, setResetResult] = useState<any>(null);
  const [resettingRewards, setResettingRewards] = useState(false);

  async function checkCreators() {
    setLoadingCreators(true);
    try {
      const res = await fetch("/api/admin/check-creators-email");
      const data = await res.json();
      setCreatorsData(data);
      console.log("Creators data:", data);
    } catch (error) {
      console.error("Error:", error);
      setCreatorsData({ error: "Failed to fetch" });
    } finally {
      setLoadingCreators(false);
    }
  }

  async function resetRewards() {
    if (!confirm("⚠️ Reset all Special Rewards to PENDING? This will clear APPROVED/SENT/REJECTED statuses.")) {
      return;
    }

    setResettingRewards(true);
    try {
      const res = await fetch("/api/admin/reset-special-rewards", { method: "POST" });
      const data = await res.json();
      setResetResult(data);
      console.log("Reset result:", data);
    } catch (error) {
      console.error("Error:", error);
      setResetResult({ error: "Failed to reset" });
    } finally {
      setResettingRewards(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">🛠️ Admin Tools</h2>

      {/* Creators Email Check */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">📧 Creators Email Coverage</h3>

        <button
          onClick={checkCreators}
          disabled={loadingCreators}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 mb-4"
        >
          {loadingCreators ? "Checking..." : "Check Creators"}
        </button>

        {creatorsData && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            {creatorsData.error ? (
              <p className="text-red-600">{creatorsData.error}</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Creators</p>
                    <p className="text-2xl font-bold">{creatorsData.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">✅ With Email</p>
                    <p className="text-2xl font-bold text-green-600">{creatorsData.withEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">❌ No Email</p>
                    <p className="text-2xl font-bold text-red-600">{creatorsData.withoutEmail}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  <strong>Coverage: {creatorsData.coverage}%</strong>
                </p>

                {creatorsData.withoutEmail > 0 && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm font-semibold text-red-800 mb-2">Creators without email:</p>
                    <ul className="text-xs text-red-700 space-y-1">
                      {creatorsData.creators
                        .filter((c: any) => c.email === "NO EMAIL")
                        .map((c: any) => (
                          <li key={c.creatorCode}>• {c.displayName} ({c.creatorCode})</li>
                        ))}
                    </ul>
                  </div>
                )}

                {creatorsData.withEmail === creatorsData.total && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-sm font-semibold text-green-800">✅ All creators have email addresses!</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Reset Special Rewards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">🔄 Reset Special Rewards</h3>

        <p className="text-sm text-gray-600 mb-4">
          Reset all Special Reward applications from APPROVED/SENT/REJECTED back to PENDING.
          This clears test data while keeping creator information.
        </p>

        <button
          onClick={resetRewards}
          disabled={resettingRewards}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-500 disabled:opacity-50 mb-4"
        >
          {resettingRewards ? "Resetting..." : "⚠️ Reset All Special Rewards"}
        </button>

        {resetResult && (
          <div className={`rounded p-4 ${resetResult.error ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
            {resetResult.error ? (
              <p className="text-red-600">{resetResult.error}</p>
            ) : (
              <>
                <p className={`font-semibold mb-2 ${resetResult.error ? "text-red-800" : "text-green-800"}`}>
                  {resetResult.message}
                </p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Applications reset: {resetResult.applicationsReset}</li>
                  <li>• Special reward transactions: {resetResult.specialRewardTransactions}</li>
                  <li>• ⚠️ {resetResult.warning}</li>
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
