"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
    <header className="sticky top-0 z-50 w-full bg-charcoal-900/90 backdrop-blur-md border-b border-charcoal-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Brand/Logo Left */}
        <Link
          href="/"
          className="group flex items-center gap-2 font-mono text-sm sm:text-base font-black tracking-widest text-white transition-all duration-200"
        >
          <span className="text-electric-500 animate-pulse">&gt;_</span>
          <span className="relative py-1">
            <span className="hidden sm:inline">TYPING SPEED TEST</span>
            <span className="inline sm:hidden">TST</span>
            <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-electric-500 scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100 shadow-[0_0_8px_#3B82F6]" />
          </span>
        </Link>

        {/* Navigation Center */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="group relative flex items-center justify-center px-2.5 sm:px-4 py-1.5 font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-200"
              >
                {/* Active Backing */}
                {isActive ? (
                  <div className="absolute inset-0 bg-electric-500/10 border border-electric-500/30 rounded shadow-[0_0_12px_rgba(59,130,246,0.15)] pointer-events-none" />
                ) : (
                  <div className="absolute inset-0 bg-transparent rounded pointer-events-none transition-all duration-200 group-hover:bg-electric-500/5 group-hover:border group-hover:border-electric-500/10" />
                )}

                {/* Left Bracket */}
                <span className={`transition-all duration-200 mr-1 sm:mr-1.5 ${
                  isActive
                    ? "opacity-100 text-electric-500 scale-100"
                    : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 text-electric-400"
                }`}>
                  [
                </span>

                {/* Text */}
                <span className={isActive ? "text-white" : "text-slate-400 group-hover:text-white transition-colors duration-150"}>
                  {item.label}
                </span>

                {/* Right Bracket */}
                <span className={`transition-all duration-200 ml-1 sm:ml-1.5 ${
                  isActive
                    ? "opacity-100 text-electric-500 scale-100"
                    : "opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 text-electric-400"
                }`}>
                  ]
                </span>
              </Link>
            );
          })}
        </nav>

        {/* PB Badge Right */}
        <div className="flex items-center justify-end min-w-[70px] sm:min-w-[100px]">
          {pbWPM !== null && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-electric-500/30 bg-electric-500/5 text-[10px] font-mono text-electric-400 font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(59,130,246,0.05)] select-none animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-electric-500 animate-pulse"></span>
              <span>PB: {pbWPM} WPM</span>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
