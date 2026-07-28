"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/LanguageContext";

const socialLinks = [
  { label: "Discord", url: "https://discord.gg/8tcRJ7wwDB", icon: "💬", color: "bg-[#5865F2]" },
  { label: "YouTube", url: "https://www.youtube.com/@GalaxyDefenseFortressTD", icon: "▶", color: "bg-red-600" },
  { label: "TikTok", url: "https://www.tiktok.com/@officialgalaxydefense", icon: "🎵", color: "bg-gray-900" },
];

const promoText: Record<string, string> = {
  en: "✨ Quality content may be featured on our official channels!",
  ja: "✨ 優れた作品は公式チャンネルで紹介されます！",
  "zh-TW": "✨ 優質作品可被官方轉發！",
  ko: "✨ 우수 작품은 공식 채널에 소개될 수 있습니다!",
};

export default function SocialSidebar() {
  const [open, setOpen] = useState(false);
  const { t, lang } = useT();

  return (
    <div className="fixed right-0 top-1/3 z-40 flex">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="bg-gray-900 text-white px-2 py-3 rounded-l-lg text-xs font-medium hover:bg-gray-800 transition-colors"
        style={{ writingMode: "vertical-rl" }}
      >
        {open ? `✕ ${t("social.hide")}` : `🔗 ${t("social.official")}`}
      </button>

      {/* Links panel */}
      {open && (
        <div className="bg-white border border-gray-200 rounded-l-xl shadow-lg p-3 space-y-2 w-48">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t("social.officialLinks")}</p>
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white ${link.color} hover:opacity-90 transition-opacity`}
            >
              <span>{link.icon}</span>
              {link.label}
            </a>
          ))}
          <div className="pt-2 mt-2 border-t border-gray-100">
            <p className="text-xs text-indigo-600 font-medium leading-relaxed">
              {promoText[lang] || promoText.en}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
