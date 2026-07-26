"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getPersonalBest } from "../lib/stats";

export default function Header() {
  const pathname = usePathname();
  const [pbWPM, setPbWPM] = useState<number | null>(null);

  useEffect(() => {
    const best = getPersonalBest();
    if (best) {
      setPbWPM(best.wpm);
    } else {
      setPbWPM(null);
    }
  }, [pathname]);

  const navItems = [
    { label: "Play", href: "/" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "History", href: "/history" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#121316]/90 backdrop-blur-md border-b border-[#1E293B]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Brand/Logo Left */}
        <Link
          href="/"
          className="flex items-center gap-3 font-mono text-base sm:text-lg font-bold tracking-wide text-[#F1F5F9] hover:opacity-90 transition-opacity select-none"
        >
          <Image
            src="/logo.svg"
            alt="TST Logo"
            width={36}
            height={36}
            className="object-contain"
            priority
          />
          <span>TST</span>
        </Link>

        {/* Navigation Center */}
        <nav className="flex items-center gap-4 sm:gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`group relative flex items-center py-1.5 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors duration-200 ${
                  isActive ? "text-[#3B82F6]" : "text-[#94A3B8] hover:text-[#3B82F6]"
                }`}
              >
                {/* Subtle glowing dot indicator to the left of active/hovered link */}
                <span
                  className={`w-1.5 h-1.5 rounded-full bg-[#3B82F6] shadow-[0_0_8px_#3B82F6] transition-all duration-200 mr-2 ${
                    isActive
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100"
                  }`}
                />

                {/* Text */}
                <span>{item.label}</span>

                {/* Underline for active link only (animates in from center) */}
                <span
                  className={`absolute bottom-[-6px] left-0 right-0 h-[2px] bg-[#3B82F6] transition-transform duration-300 origin-center ${
                    isActive ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* PB Badge Right */}
        <div className="flex items-center justify-end min-w-[70px] sm:min-w-[100px]">
          {pbWPM !== null && (
            <div className="hidden min-[480px]:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/[0.08] text-[11px] font-mono text-[#3B82F6] font-bold uppercase tracking-wider select-none animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse"></span>
              <span>PB: {pbWPM} WPM</span>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
