"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface CreatorDetail {
  id: string;
  displayName: string;
  creatorCode: string;
  playerId: string | null;
  playerIdLocked: boolean;
  status: string;
  user: { username: string; email: string; role: string; createdAt: string };
  wallet: { balance: number } | null;
  videos: Array<{
    id: string;
    platform: string;
    url: string;
    title: string | null;
    viewCount: number;
    status: string;
    eligibilityStatus: string;
    submittedAt: string;
    campaign: { name: string };
  }>;
  transactions: Array<{
    id: string;
    amount: number;
    type: string;
    reason: string | null;
    createdAt: string;
  }>;
  orders: Array<{
    id: string;
    totalCreditCost: number;
    status: string;
    playerId: string;
    createdAt: string;
    items: Array<{ gameItemId: string; itemName: string; quantity: number; creditCost: number }>;
  }>;
}

export default function AdminCreatorDetailPage() {
  const params = useParams();
  const [creator, setCreator] = useState<CreatorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"videos" | "transactions" | "orders">("videos");

  useEffect(() => {
    fetch(`/api/creators/${params.id}`)
      .then((r) => r.json())
      .then(setCreator)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!creator) return <div className="p-8 text-red-500">Creator not found.</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <a href="/admin/creators" className="text-gray-400 hover:text-gray-600">← Back</a>
        <h2 className="text-2xl font-bold text-gray-900">{creator.displayName}</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          creator.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
        }`}>{creator.status}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Username</p>
          <p className="font-medium">{creator.user.username}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Creator Code</p>
          <p className="font-medium font-mono">{creator.creatorCode}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Player ID</p>
          <p className="font-medium">
            {creator.playerId ? (
              <>{creator.playerId} {creator.playerIdLocked ? "🔒 Locked" : ""}</>
            ) : (
              <span className="text-gray-400">Not set</span>
            )}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Wallet Balance</p>
          <p className="font-medium text-lg">{creator.wallet?.balance?.toLocaleString() ?? 0} credits</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Email</p>
          <p className="font-medium">{creator.user.email}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Joined</p>
          <p className="font-medium">{new Date(creator.user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white rounded-xl shadow-sm border border-gray-100 p-1">
        {(["videos", "transactions", "orders"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              tab === t ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {t} ({t === "videos" ? creator.videos.length : t === "transactions" ? creator.transactions.length : creator.orders.length})
          </button>
        ))}
      </div>

      {/* Videos Tab */}
      {tab === "videos" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {creator.videos.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No videos submitted.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Platform</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Campaign</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Views</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Eligibility</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {creator.videos.map((v) => (
                  <tr key={v.id} className="border-t">
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        v.platform === "YOUTUBE" ? "bg-red-100 text-red-700" : "bg-gray-900 text-white"
                      }`}>{v.platform}</span>
                    </td>
                    <td className="px-4 py-3">{v.campaign.name}</td>
                    <td className="px-4 py-3 font-medium">{v.viewCount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        v.eligibilityStatus === "ELIGIBLE" ? "bg-green-100 text-green-800" :
                        v.eligibilityStatus === "INELIGIBLE" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>{v.eligibilityStatus}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        v.status === "APPROVED" ? "bg-green-100 text-green-800" :
                        v.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>{v.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(v.submittedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {tab === "transactions" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {creator.transactions.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No transactions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Type</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Amount</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Reason</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {creator.transactions.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        t.type === "MILESTONE_REWARD" ? "bg-blue-100 text-blue-800" :
                        t.type === "SHOP_REDEMPTION" ? "bg-orange-100 text-orange-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>{t.type}</span>
                    </td>
                    <td className={`px-4 py-3 font-medium ${t.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                      {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{t.reason || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {tab === "orders" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {creator.orders.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No orders yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Order ID</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Items</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Cost</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {creator.orders.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="px-4 py-3 font-mono text-xs">{o.id.slice(-8)}</td>
                    <td className="px-4 py-3">{o.items.map((i) => `${i.itemName} x${i.quantity}`).join(", ")}</td>
                    <td className="px-4 py-3 font-medium">{o.totalCreditCost.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        o.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                        o.status === "EXPORTED" ? "bg-purple-100 text-purple-800" :
                        "bg-green-100 text-green-800"
                      }`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
