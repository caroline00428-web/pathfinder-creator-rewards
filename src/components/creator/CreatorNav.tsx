"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n/LanguageContext";

const navItems = [
  { href: "/creator/dashboard", label: "nav.dashboard", icon: "📊" },
  { href: "/creator/profile", label: "nav.profile", icon: "👤" },
  { href: "/creator/submit", label: "nav.submit", icon: "🎬" },
  { href: "/creator/videos", label: "nav.videos", icon: "📹" },
  { href: "/creator/shop", label: "nav.shop", icon: "🛒" },
  { href: "/creator/special-rewards", label: "nav.special", icon: "🎁" },
  { href: "/creator/orders", label: "nav.orders", icon: "📦" },
];

export default function CreatorNav() {
  const pathname = usePathname();
  const { t } = useT();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 flex items-center justify-between h-12 sm:h-14">
        {/* Brand + Hamburger */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden text-white p-1 text-lg">
            {menuOpen ? "✕" : "☰"}
          </button>
          <Link href="/creator/dashboard" className="font-bold text-xs sm:text-sm whitespace-nowrap">
            Galaxy Defense · Pathfinder
          </Link>
          {/* Desktop nav */}
          <nav className="hidden sm:flex gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}
                className={`px-2 lg:px-3 py-1.5 rounded-md text-xs transition-colors ${isActive(item.href) ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
                <span className="mr-1">{item.icon}</span>{t(item.label)}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-[10px] sm:text-xs text-gray-400 hover:text-white transition-colors whitespace-nowrap">
            {t("nav.signout")}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden bg-gray-800 border-t border-gray-700 px-3 py-2 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${isActive(item.href) ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-gray-700"}`}>
              <span className="mr-2">{item.icon}</span>{t(item.label)}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
