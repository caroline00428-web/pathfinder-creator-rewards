import Link from "next/link";
import SocialSidebar from "@/components/SocialSidebar";

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SocialSidebar />
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold mb-4">🎬 Creator Starter Guide</h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Zero experience needed. Follow these simple steps to create your first Galaxy Defense video and start earning rewards today.
          </p>
          <div className="mt-6 flex gap-4 justify-center">
            <Link href="/login" className="px-6 py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-400 transition-colors">Start Earning Now →</Link>
            <a href="#tutorials" className="px-6 py-3 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors">Jump to Tutorials ↓</a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">
        {/* Sample Videos */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📺 Sample Videos for Inspiration</h2>
          <p className="text-gray-600 mb-4">Watch how other creators showcase Galaxy Defense. Your videos don't need to be perfect — authentic gameplay content works best!</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: "Gameplay Guide Example", desc: "Walk through campaign levels with commentary", type: "YouTube" },
              { title: "Character Showcase", desc: "Highlight your best Ranger builds & skills", type: "TikTok" },
              { title: "Mode Tutorial", desc: "Explain PvP, Guild Wars, or Event modes", type: "YouTube" },
              { title: "AI Comic Story", desc: "30s+ animated story set in My Defense World", type: "Both" },
            ].map((v, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-3 items-start">
                <div className="w-20 h-14 bg-gray-200 rounded flex items-center justify-center text-2xl flex-shrink-0">🎥</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{v.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{v.desc}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block ${v.type === "YouTube" ? "bg-red-100 text-red-700" : v.type === "TikTok" ? "bg-gray-900 text-white" : "bg-purple-100 text-purple-700"}`}>{v.type}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Topic Suggestions */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">💡 Video Topic Ideas</h2>
          <p className="text-gray-600 mb-4">Pick any topic — or combine several. The more creative, the better!</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { cat: "🎯 Gameplay", items: ["Campaign walkthrough", "Boss strategy guide", "Speedrun challenge", "F2P progression tips"] },
              { cat: "⚔️ Combat & Skills", items: ["Ranger skill showcase", "Best DPS combos", "PvP arena highlights", "Guild War tactics"] },
              { cat: "🎨 Creative", items: ["Livery/Ranger/Guardian showcase", "Base defense layout", "AI Comic story (30s+)", "Funny moments compilation"] },
              { cat: "📊 Guides & Tips", items: ["Beginner's guide 2026", "Best items to buy first", "Event mode walkthrough", "Resource farming routes"] },
              { cat: "🔥 Trending", items: ["Reaction to new update", "Tier list ranking", "Vs. comparison video", "\"Before vs After\" progress"] },
              { cat: "🤖 AI Comic", items: ["Use free AI tools", "Write a short script", "Generate character art", "Add subtitles & music"] },
            ].map((g, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">{g.cat}</h3>
                <ul className="space-y-1">
                  {g.items.map((item, j) => <li key={j} className="text-xs text-gray-600">• {item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Tutorials */}
        <section id="tutorials">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📚 Quick-Start Tutorials (Free Tools Only)</h2>

          <div className="space-y-6">
            {/* YouTube */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">▶ YouTube Tutorial (5 min)</h3>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2"><span className="text-red-500 font-bold">1.</span> Open <b>YouTube Studio</b> on your phone or computer</li>
                <li className="flex gap-2"><span className="text-red-500 font-bold">2.</span> Tap <b>+ Create</b> → <b>Upload Video</b></li>
                <li className="flex gap-2"><span className="text-red-500 font-bold">3.</span> Record gameplay with your phone's built-in screen recorder (free!)</li>
                <li className="flex gap-2"><span className="text-red-500 font-bold">4.</span> Add <b>#galaxydefense #galaxydefensepathfinder</b> in the title or description</li>
                <li className="flex gap-2"><span className="text-red-500 font-bold">5.</span> Set to <b>Public</b> → Publish → Copy the link</li>
                <li className="flex gap-2"><span className="text-red-500 font-bold">6.</span> Paste link on our website → <Link href="/creator/submit" className="text-indigo-600 underline">Submit Video</Link></li>
              </ol>
              <p className="text-xs text-gray-400 mt-3">💡 Tip: Free screen recorders — iPhone/Android built-in, OBS Studio (PC), ScreenPal</p>
            </div>

            {/* TikTok */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-gray-300 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">🎵 TikTok Tutorial (3 min)</h3>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2"><span className="text-gray-900 font-bold">1.</span> Open TikTok app → <b>+</b> button at bottom</li>
                <li className="flex gap-2"><span className="text-gray-900 font-bold">2.</span> Record directly or upload from gallery</li>
                <li className="flex gap-2"><span className="text-gray-900 font-bold">3.</span> Add text overlay: <b>"Galaxy Defense Pathfinder"</b></li>
                <li className="flex gap-2"><span className="text-gray-900 font-bold">4.</span> Add <b>#galaxydefense #galaxydefensepathfinder</b> hashtags</li>
                <li className="flex gap-2"><span className="text-gray-900 font-bold">5.</span> Post → Copy link → <Link href="/creator/submit" className="text-indigo-600 underline">Submit on our site</Link></li>
              </ol>
              <p className="text-xs text-gray-400 mt-3">💡 Tip: Use CapCut (free) to edit videos, add captions and background music</p>
            </div>

            {/* AI Comic */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-pink-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">🤖 AI Comic Tutorial (10 min, 100% Free)</h3>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2"><span className="text-pink-500 font-bold">1.</span> Write a short script (30-60 seconds story in My Defense World universe)</li>
                <li className="flex gap-2"><span className="text-pink-500 font-bold">2.</span> Use free AI tools to generate character art: <b>Leonardo.ai</b>, <b>Tensor.Art</b>, or <b>Bing Image Creator</b></li>
                <li className="flex gap-2"><span className="text-pink-500 font-bold">3.</span> Arrange images into a video using <b>CapCut</b> (free, mobile + PC) or <b>Canva</b></li>
                <li className="flex gap-2"><span className="text-pink-500 font-bold">4.</span> Add AI voiceover: <b>ElevenLabs</b> (free tier) or CapCut's built-in TTS</li>
                <li className="flex gap-2"><span className="text-pink-500 font-bold">5.</span> Add subtitles and background music in CapCut</li>
                <li className="flex gap-2"><span className="text-pink-500 font-bold">6.</span> Add <b>#galaxydefenseAIcomic #galaxydefense #galaxydefensepathfinder</b> in title</li>
                <li className="flex gap-2"><span className="text-pink-500 font-bold">7.</span> Upload to YouTube/TikTok → Submit on our site with AI Comic tag</li>
              </ol>
              <p className="text-xs text-gray-400 mt-3">💡 Free tools: Leonardo.ai (art), CapCut (editing), ElevenLabs (voice), Bing Image Creator (art), Canva (design)</p>
            </div>
          </div>
        </section>

        {/* Rewards Summary */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🏆 What You Can Earn</h2>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { label: "Registration", value: "200 💎", desc: "Just sign up" },
                { label: "First Video", value: "500 💎", desc: "Submit 1 video" },
                { label: "Per Video (AI)", value: "500 💎", desc: "AI comic story" },
                { label: "Top Tier", value: "30,000 💎", desc: "200K+ views" },
              ].map((r, i) => (
                <div key={i} className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500">{r.label}</p>
                  <p className="text-xl font-bold text-indigo-600">{r.value}</p>
                  <p className="text-[10px] text-gray-400">{r.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <Link href="/login" className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors">Join Now →</Link>
            </div>
          </div>
        </section>

        {/* Rules Summary */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Quick Rules</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-sm text-gray-700 space-y-2">
            <p>✅ Must include <code className="bg-gray-100 px-1 rounded">#galaxydefense #galaxydefensepathfinder</code> in video title/description</p>
            <p>✅ AI Comic submissions must also include <code className="bg-gray-100 px-1 rounded">#galaxydefenseAIcomic</code></p>
            <p>✅ Video must be related to Galaxy Defense content</p>
            <p>✅ Original content only — no re-uploads of others' videos</p>
            <p>✅ One account per creator</p>
            <p>💬 Questions? <b>@Hedy</b> in <a href="https://discord.gg/8tcRJ7wwDB" target="_blank" className="text-indigo-600 underline">Discord</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
