"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid username or password");
      return;
    }

    const session = await fetch("/api/auth/session").then((r) => r.json());
    if (session?.user?.role === "ADMIN") {
      router.push("/admin/dashboard");
    } else {
      router.push("/creator/dashboard");
    }
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — Hero Image */}
      <div className="hidden lg:flex lg:w-3/5 relative bg-black">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/pathfinder-hero.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
        <div className="relative z-10 flex flex-col justify-end p-16 text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-purple-300 mb-3">
            Galaxy Defense
          </p>
          <h1 className="text-5xl font-extrabold leading-tight mb-4 drop-shadow-lg">
            Pathfinder<br />Program
          </h1>
          <p className="text-lg text-gray-200 max-w-md leading-relaxed">
            Create. Share. Earn rewards.<br />
            Join the Galaxy Defense creator community and turn your content into in-game rewards.
          </p>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-950 px-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 text-center">
            <h1 className="text-2xl font-bold text-white">Galaxy Defense</h1>
            <p className="mt-1 text-sm text-purple-400">Pathfinder Program</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
            <p className="mt-1 text-sm text-gray-400">Sign in to your creator account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl bg-gray-900 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition-colors"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-gray-900 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition-colors"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-white font-semibold hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-50 transition-all text-sm"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-600">
            Galaxy Defense © 2026 · Pathfinder Creator Program
          </p>
        </div>
      </div>
    </div>
  );
}
