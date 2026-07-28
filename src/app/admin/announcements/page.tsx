"use client";

import { useState, useEffect } from "react";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/announcements").then(r => r.json()).then(setAnnouncements).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    if (res.ok) {
      setMsg("✅ Announcement posted!");
      setTitle(""); setContent("");
      const data = await fetch("/api/announcements").then(r => r.json());
      setAnnouncements(data);
    } else {
      setMsg("❌ Failed");
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📢 Announcements</h2>
      <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 space-y-3">
        <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Title" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <textarea value={content} onChange={e => setContent(e.target.value)} required placeholder="Content" rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        {msg && <p className={`text-sm ${msg.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>{msg}</p>}
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Post Announcement</button>
      </form>
      {loading ? <p className="text-gray-500">Loading...</p> : announcements.length === 0 ? <p className="text-gray-500">No announcements.</p> : (
        <div className="space-y-3">
          {announcements.map((a: any) => (
            <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{a.title}</p>
                <p className="text-sm text-gray-600">{a.content}</p>
              </div>
              <button onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-600 text-xs font-medium ml-4 whitespace-nowrap">✕ Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
