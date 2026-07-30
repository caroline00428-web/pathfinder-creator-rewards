"use client";

import { useState } from "react";

// Simple CSV parser
function parseCSV(text: string) {
  const lines = text.split("\n").filter((line) => line.trim());
  const headers = lines[0].split(",").map((h) => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: any = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    data.push(row);
  }

  return data;
}

export default function CSVBulkSendPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [dryRun, setDryRun] = useState(true);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  }

  async function processCSV() {
    if (!file) {
      alert("Please select a CSV file");
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);

      // Transform data to match API expectations
      const csvData = parsed.map((row: any) => ({
        email: row["Email address"],
        discordUsername: row["Discord Username"],
        status: row["Column 1"],
      }));

      console.log("Parsed data:", csvData.slice(0, 3));

      const res = await fetch("/api/admin/csv-bulk-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData, dryRun }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ error: data.error || "API Error" });
        console.error("API Error:", data);
        return;
      }

      setResult(data);
      console.log("Result:", data);
    } catch (error: any) {
      console.error("Error:", error);
      setResult({ error: error.message || "Failed to process CSV" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">📧 Bulk Send Registration Emails</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">📤 Upload CSV File</h3>

        <div className="mb-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="w-full px-4 py-2 border rounded-lg"
          />
          {file && <p className="text-sm text-gray-600 mt-2">✅ {file.name}</p>}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            id="dryRun"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="dryRun" className="text-sm">
            👁️ Preview Mode (no email sent)
          </label>
        </div>

        <button
          onClick={processCSV}
          disabled={loading || !file}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Processing..." : dryRun ? "👁️ Preview" : "🚀 Send Now"}
        </button>
      </div>

      {result && (
        <div className="space-y-6">
          {result.error && (
            <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-2">❌ Error</h3>
              <p className="text-red-700">{result.error}</p>
            </div>
          )}

          {result.summary && (
            <>
              {/* Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold mb-4">📊 Summary</h3>
            <div className="grid grid-cols-5 gap-4 mb-4">
              <div className="bg-gray-50 rounded p-4 text-center">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{result.summary.total}</p>
              </div>
              <div className="bg-blue-50 rounded p-4 text-center">
                <p className="text-sm text-gray-600">Preview</p>
                <p className="text-2xl font-bold text-blue-600">{result.summary.would_send}</p>
              </div>
              <div className="bg-green-50 rounded p-4 text-center">
                <p className="text-sm text-gray-600">✅ Sent</p>
                <p className="text-2xl font-bold text-green-600">{result.summary.sent}</p>
              </div>
              <div className="bg-red-50 rounded p-4 text-center">
                <p className="text-sm text-gray-600">❌ Failed</p>
                <p className="text-2xl font-bold text-red-600">{result.summary.failed}</p>
              </div>
              <div className="bg-yellow-50 rounded p-4 text-center">
                <p className="text-sm text-gray-600">⏭️ Skipped</p>
                <p className="text-2xl font-bold text-yellow-600">{result.summary.skipped}</p>
              </div>
            </div>

            {result.dryRun && result.summary.would_send > 0 && (
              <button
                onClick={() => setDryRun(false)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
              >
                ✉️ Confirm Send to {result.summary.would_send} People
              </button>
            )}
          </div>

          {/* Results */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold mb-4">📋 Details</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {result.results.map((r: any, i: number) => (
                <div
                  key={i}
                  className={`p-3 rounded text-sm ${
                    r.status === "would_send"
                      ? "bg-blue-50 border border-blue-200"
                      : r.status === "sent"
                        ? "bg-green-50 border border-green-200"
                        : r.status === "failed"
                          ? "bg-red-50 border border-red-200"
                          : "bg-yellow-50 border border-yellow-200"
                  }`}
                >
                  <p className="font-medium">{r.discordName}</p>
                  <p className="text-xs text-gray-600">{r.email}</p>
                  {r.username && <p className="text-xs text-gray-500">Username: {r.username}</p>}
                  {r.creatorCode && <p className="text-xs text-gray-500">Creator Code: {r.creatorCode}</p>}
                  {r.status === "would_send" && (
                    <p className="text-xs text-blue-700">👁️ Preview: Will send email</p>
                  )}
                  {r.status === "sent" && <p className="text-xs text-green-700">✅ Sent</p>}
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
