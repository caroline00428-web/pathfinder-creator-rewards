"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { useT } from "@/lib/i18n/LanguageContext";

const adminLangs = [
  { code: "en", label: "🇺🇸 EN" },
  { code: "zh-TW", label: "🇹🇼 繁中" },
] as const;

const navItems = [
  { href: "/admin/dashboard", label: "nav.dashboard", icon: "📊" },
  { href: "/admin/creators", label: "nav.creators", icon: "👥" },
  { href: "/admin/campaigns", label: "nav.campaigns", icon: "📢" },
  { href: "/admin/videos", label: "nav.review", icon: "🎬" },
  { href: "/admin/milestones", label: "nav.milestones", icon: "🎯" },
  { href: "/admin/shop", label: "nav.shopitems", icon: "🛒" },
  { href: "/admin/special-rewards", label: "nav.specialrewards", icon: "🎁" },
  { href: "/admin/announcements", label: "📢 Announcements", icon: "📢" },
  { href: "/admin/orders", label: "nav.rewardorders", icon: "📦" },
  { href: "/admin/csv-bulk-send", label: "📧 CSV Bulk Send", icon: "📧" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { t, lang, setLang } = useT();
  const [open, setOpen] = useState(false);

  const linkClass = (href: string) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
      pathname.startsWith(href) ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
    }`;

  return (
    <>
      {/* Mobile hamburger */}
      <button onClick={() => setOpen(!open)} className="lg:hidden fixed top-3 left-3 z-50 bg-gray-900 text-white p-2 rounded-lg text-lg shadow-lg">
        {open ? "✕" : "☰"}
      </button>

      {/* Overlay */}
      {open && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`bg-gray-900 text-white flex flex-col h-screen transition-all z-40
        ${open ? "fixed left-0 top-0 w-64" : "fixed -left-64 top-0 w-64"}
        lg:static lg:w-60 xl:w-64`}>
        <div className="p-4 sm:p-5 border-b border-gray-700">
          <h1 className="text-base sm:text-lg font-bold">Galaxy Defense</h1>
          <p className="text-[10px] sm:text-xs text-gray-400">Pathfinder Program · Admin</p>
        </div>
        <nav className="flex-1 p-3 sm:p-4 space-y-0.5 sm:space-y-1 overflow-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className={linkClass(item.href)}>
              <span>{item.icon}</span><span className="hidden sm:inline">{t(item.label)}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 sm:p-4 border-t border-gray-700 space-y-2">
          <select value={lang} onChange={(e) => setLang(e.target.value as typeof lang)}
            className="w-full bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-600 focus:border-indigo-500 focus:outline-none cursor-pointer">
            {adminLangs.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-left">
            {t("nav.signout")}
          </button>
        </div>
      </aside>
    </>
  );
}
