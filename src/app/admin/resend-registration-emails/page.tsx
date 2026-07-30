"use client";

import { useState } from "react";

export default function ResendRegistrationEmailsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [startDate, setStartDate] = useState("2026-07-28");

  async function getCreators() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/resend-registration-emails");
      const data = await res.json();
      setResult(data);
      console.log("Creators:", data);
    } catch (error) {
      console.error("Error:", error);
      setResult({ error: "Failed to fetch creators" });
    } finally {
      setLoading(false);
    }
  }

  async function resendEmails() {
    if (!confirm(`确认重新发送所有创作者的注册邮件？`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/resend-registration-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate }),
      });
      const data = await res.json();
      setResult(data);
      console.log("Send result:", data);
    } catch (error) {
      console.error("Error:", error);
      setResult({ error: "Failed to send emails" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">📧 重新发送注册邮件</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">1️⃣ 查看需要发送的创作者</h3>

        <button
          onClick={getCreators}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 mb-4"
        >
          {loading ? "加载中..." : "📋 查看所有创作者"}
        </button>

        {result?.total && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="font-semibold text-blue-900">总创作者: {result.total}</p>
            <p className="text-sm text-blue-700">有邮箱: {result.withEmail}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">2️⃣ 发送注册邮件</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">开始日期</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">只发送此日期之后创建的账户</p>
        </div>

        <button
          onClick={resendEmails}
          disabled={loading}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 mb-6"
        >
          {loading ? "发送中..." : "🚀 批量发送注册邮件"}
        </button>

        {result?.summary && (
          <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">总数</p>
                <p className="text-2xl font-bold text-gray-900">{result.summary.total}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">✅ 已发送</p>
                <p className="text-2xl font-bold text-green-600">{result.summary.sent}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">❌ 失败</p>
                <p className="text-2xl font-bold text-red-600">{result.summary.failed}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">⏭️ 跳过</p>
                <p className="text-2xl font-bold text-yellow-600">{result.summary.skipped}</p>
              </div>
            </div>
          </div>
        )}

        {result?.results && (
          <div>
            <h4 className="font-semibold mb-3">发送详情</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {result.results.map((r: any, i: number) => (
                <div
                  key={i}
                  className={`p-3 rounded text-sm ${
                    r.status === "sent"
                      ? "bg-green-50 border border-green-200"
                      : r.status === "failed"
                        ? "bg-red-50 border border-red-200"
                        : "bg-yellow-50 border border-yellow-200"
                  }`}
                >
                  <p className="font-medium">{r.displayName}</p>
                  <p className="text-xs text-gray-600">{r.email}</p>
                  {r.status === "sent" && <p className="text-xs text-green-700">✅ 已发送</p>}
                  {r.status === "failed" && (
                    <p className="text-xs text-red-700">❌ {r.reason || r.error}</p>
                  )}
                  {r.status === "skipped" && (
                    <p className="text-xs text-yellow-700">⏭️ {r.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
