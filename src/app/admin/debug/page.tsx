"use client";

import { useState } from "react";

export default function AdminDebugPage() {
  const [creatorEmail, setCreatorEmail] = useState("1538308476@qq.com");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function testSendEmail() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/test-send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorEmail,
          type: "SPECIAL",
          diamonds: 500,
          rewardName: "Debug Test Reward",
        }),
      });

      const data = await res.json();
      setResult(data);
      console.log("[DEBUG] Response:", data);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
      console.error("[DEBUG] Error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-lg">
      <h2 className="text-2xl font-bold mb-4">📧 Email Debug Test</h2>

      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4 text-sm">
        <p><strong>Purpose:</strong> Test email sending directly</p>
        <p><strong>Status:</strong> ✅ All environment variables configured</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Creator Email</label>
          <input
            type="email"
            value={creatorEmail}
            onChange={(e) => setCreatorEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="creator@example.com"
          />
        </div>

        <button
          onClick={testSendEmail}
          disabled={loading || !creatorEmail}
          className="w-full bg-indigo-600 text-white rounded px-4 py-2 disabled:opacity-50 hover:bg-indigo-500"
        >
          {loading ? "Sending..." : "📤 Send Test Email"}
        </button>

        {result && (
          <div className={`p-4 rounded border ${result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <div className="font-mono text-sm">
              <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t text-xs text-gray-500">
        <p>Tip: Check your email (~30sec delay) or check Vercel logs for detailed error messages</p>
      </div>
    </div>
  );
}
