"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Creator {
  id: string;
  displayName: string;
  creatorCode: string;
  playerId: string | null;
  playerIdLocked: boolean;
  status: string;
  user: { username: string; email: string };
  wallet: { balance: number } | null;
  _count: { videos: number; orders: number };
}

export default function AdminCreatorsPage() {
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", displayName: "", creatorCode: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/creators")
      .then((r) => r.json())
      .then(setCreators)
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/creators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ username: "", email: "", password: "", displayName: "", creatorCode: "" });
      router.refresh();
      const data = await res.json();
      setCreators((prev) => [{ ...data, user: { username: data.username, email: "" }, wallet: { balance: 0 }, _count: { videos: 0, orders: 0 }, playerId: null, playerIdLocked: false, status: "ACTIVE" }, ...prev]);
    } else {
      const err = await res.json();
      setError(err.error || "Failed to create creator");
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Creator Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors"
        >
          {showForm ? "Cancel" : "+ Create Creator"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Create Creator Account</h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input type="text" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input type="text" required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Creator Code</label>
              <input type="text" required value={form.creatorCode} onChange={(e) => setForm({ ...form, creatorCode: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors">
            Create Creator
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">Creator</th>
              <th className="px-4 py-3 font-medium text-gray-500">Code</th>
              <th className="px-4 py-3 font-medium text-gray-500">Player ID</th>
              <th className="px-4 py-3 font-medium text-gray-500">Credits</th>
              <th className="px-4 py-3 font-medium text-gray-500">Videos</th>
              <th className="px-4 py-3 font-medium text-gray-500">Orders</th>
              <th className="px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 font-medium text-gray-500"></th>
            </tr>
          </thead>
          <tbody>
            {creators.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{c.displayName}</p>
                  <p className="text-xs text-gray-500">{c.user.username} · {c.user.email}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{c.creatorCode}</td>
                <td className="px-4 py-3">
                  {c.playerId ? (
                    <span className="text-sm">{c.playerId} {c.playerIdLocked && <span className="text-xs text-green-600">🔒</span>}</span>
                  ) : (
                    <span className="text-xs text-gray-400">Not set</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium">{c.wallet?.balance?.toLocaleString() ?? 0}</td>
                <td className="px-4 py-3">{c._count.videos}</td>
                <td className="px-4 py-3">{c._count.orders}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    c.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>{c.status}</span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/creators/${c.id}`} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
