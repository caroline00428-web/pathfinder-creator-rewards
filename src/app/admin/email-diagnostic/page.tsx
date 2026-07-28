"use client";

import { useState } from "react";

export default function EmailDiagnosticPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function runDiagnostic() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/email-diagnostic");
      const data = await res.json();
      setResults(data);
      console.log("Diagnostic results:", data);
    } catch (error) {
      console.error("Error:", error);
      setResults({ error: "Failed to run diagnostic" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">📧 Email Diagnostic Tool</h2>

      <button
        onClick={runDiagnostic}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 mb-6"
      >
        {loading ? "Running diagnosis..." : "🔍 Run Email Diagnostic"}
      </button>

      {results && (
        <div className="space-y-6">
          {/* Summary */}
          {results.summary && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4">Summary</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded p-4 text-center">
                  <p className="text-sm text-gray-600">Total Applications</p>
                  <p className="text-3xl font-bold text-gray-900">{results.summary.total}</p>
                </div>
                <div className="bg-green-50 rounded p-4 text-center">
                  <p className="text-sm text-gray-600">✅ Email Sent</p>
                  <p className="text-3xl font-bold text-green-600">{results.summary.success}</p>
                </div>
                <div className="bg-red-50 rounded p-4 text-center">
                  <p className="text-sm text-gray-600">❌ Failed</p>
                  <p className="text-3xl font-bold text-red-600">{results.summary.failed}</p>
                </div>
                <div className="bg-yellow-50 rounded p-4 text-center">
                  <p className="text-sm text-gray-600">⚠️ No Email</p>
                  <p className="text-3xl font-bold text-yellow-600">{results.summary.noEmail}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {results.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <p className="text-red-800 font-semibold">Error: {results.error}</p>
            </div>
          )}

          {/* Details */}
          {results.diagnostics && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4">Application Details</h3>
              <div className="space-y-4">
                {results.diagnostics.map((diag: any) => (
                  <div
                    key={diag.applicationId}
                    className={`rounded-lg p-4 border-2 ${
                      diag.status === "success"
                        ? "bg-green-50 border-green-200"
                        : diag.status === "failed"
                          ? "bg-red-50 border-red-200"
                          : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{diag.creator}</p>
                        <p className="text-sm text-gray-600">{diag.creatorCode}</p>
                      </div>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          diag.status === "success"
                            ? "bg-green-200 text-green-800"
                            : diag.status === "failed"
                              ? "bg-red-200 text-red-800"
                              : "bg-yellow-200 text-yellow-800"
                        }`}
                      >
                        {diag.status === "success"
                          ? "✅ Sent"
                          : diag.status === "failed"
                            ? "❌ Failed"
                            : "⚠️ No Email"}
                      </span>
                    </div>

                    <div className="text-sm text-gray-700 space-y-1">
                      <p>
                        <strong>Email:</strong> {diag.email}
                      </p>
                      <p>
                        <strong>Reward:</strong> {diag.reward} ({diag.diamonds} 💎)
                      </p>
                      {diag.messageId && (
                        <p>
                          <strong>Message ID:</strong> <code className="text-xs">{diag.messageId}</code>
                        </p>
                      )}
                      {diag.error && (
                        <p>
                          <strong>Error:</strong> <span className="text-red-700">{diag.error}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
