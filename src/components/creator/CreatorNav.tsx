"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/creator/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/creator/profile", label: "Profile", icon: "👤" },
  { href: "/creator/submit", label: "Submit Video", icon: "🎬" },
  { href: "/creator/videos", label: "My Videos", icon: "📹" },
  { href: "/creator/shop", label: "Reward Shop", icon: "🛒" },
  { href: "/creator/orders", label: "Order History", icon: "📦" },
];

export default function CreatorNav() {
  const pathname = usePathname();

  return (
    <header className="bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/creator/dashboard" className="font-bold text-sm">
            Galaxy Defense · Pathfinder
          </Link>
          <nav className="flex gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
