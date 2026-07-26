"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const [pbWPM, setPbWPM] = useState<number | null>(null);

  // Load Personal Best from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("tst_history_v1");
      if (stored) {
        const history = JSON.parse(stored);
        if (Array.isArray(history) && history.length > 0) {
          const wpms = history.map((item: { wpm: number }) => item.wpm || 0);
          const maxWPM = Math.max(...wpms, 0);
          if (maxWPM > 0) {
            setPbWPM(maxWPM);
          }
        }
      }
    } catch (e) {
      console.warn("Could not read tst_history_v1 from localStorage:", e);
    }

    // Add event listener to update PB if scores are submitted/changed
    const handleStorageUpdate = () => {
      try {
        const stored = localStorage.getItem("tst_history_v1");
        if (stored) {
          const history = JSON.parse(stored);
          if (Array.isArray(history) && history.length > 0) {
            const wpms = history.map((item: { wpm: number }) => item.wpm || 0);
            const maxWPM = Math.max(...wpms, 0);
            if (maxWPM > 0) {
              setPbWPM(maxWPM);
              return;
            }
          }
        }
        setPbWPM(null);
      } catch {
        // Safe fallback
      }
    };

    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener("tst_history_updated", handleStorageUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageUpdate);
      window.removeEventListener("tst_history_updated", handleStorageUpdate);
    };
  }, []);

  // Helper to determine if path is active
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/" || pathname?.startsWith("/test");
    }
    return pathname?.startsWith(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-charcoal-900/85 backdrop-blur-md border-b border-charcoal-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Brand Logo - Game Title Style */}
        <Link href="/" className="flex items-center group relative py-1 focus:outline-none">
          <span className="font-mono text-base sm:text-lg font-black tracking-widest text-white transition-all duration-300">
            <span className="text-electric-500 font-mono">⚡</span>{" "}
            <span className="hidden sm:inline">TYPING SPEED TEST</span>
            <span className="inline sm:hidden">TST</span>
          </span>
          {/* Subtle electric blue glow underline accent */}
          <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-electric-500 scale-x-50 group-hover:scale-x-100 transition-transform duration-300 origin-center shadow-[0_0_8px_#3B82F6]" />
        </Link>

        {/* HUD Nav Links (Compact condensed horizontal navbar) */}
        <nav className="flex items-center gap-1 sm:gap-4 font-mono text-xs font-semibold">
          {/* Play Link */}
          <Link
            href="/"
            className="group px-2 py-1.5 transition-all relative flex items-center gap-1 focus:outline-none"
          >
            <span className={`transition-all duration-200 ${
              isActive("/")
                ? "text-electric-400 opacity-100 font-bold"
                : "text-slate-600 opacity-0 group-hover:opacity-100 group-hover:text-electric-500"
            }`}>
              [
            </span>
            <span className={`transition-colors duration-200 ${
              isActive("/") ? "text-white font-bold" : "text-slate-400 group-hover:text-white"
            }`}>
              Play
            </span>
            <span className={`transition-all duration-200 ${
              isActive("/")
                ? "text-electric-400 opacity-100 font-bold"
                : "text-slate-600 opacity-0 group-hover:opacity-100 group-hover:text-electric-500"
            }`}>
              ]
            </span>
            {isActive("/") && (
              <span className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-electric-500 shadow-[0_0_6px_#3B82F6]" />
            )}
          </Link>

          {/* Leaderboard Link */}
          <Link
            href="/leaderboard"
            className="group px-2 py-1.5 transition-all relative flex items-center gap-1 focus:outline-none"
          >
            <span className={`transition-all duration-200 ${
              isActive("/leaderboard")
                ? "text-electric-400 opacity-100 font-bold"
                : "text-slate-600 opacity-0 group-hover:opacity-100 group-hover:text-electric-500"
            }`}>
              [
            </span>
            <span className={`transition-colors duration-200 ${
              isActive("/leaderboard") ? "text-white font-bold" : "text-slate-400 group-hover:text-white"
            }`}>
              Leaderboard
            </span>
            <span className={`transition-all duration-200 ${
              isActive("/leaderboard")
                ? "text-electric-400 opacity-100 font-bold"
                : "text-slate-600 opacity-0 group-hover:opacity-100 group-hover:text-electric-500"
            }`}>
              ]
            </span>
            {isActive("/leaderboard") && (
              <span className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-electric-500 shadow-[0_0_6px_#3B82F6]" />
            )}
          </Link>

          {/* History Link */}
          <Link
            href="/history"
            className="group px-2 py-1.5 transition-all relative flex items-center gap-1 focus:outline-none"
          >
            <span className={`transition-all duration-200 ${
              isActive("/history")
                ? "text-electric-400 opacity-100 font-bold"
                : "text-slate-600 opacity-0 group-hover:opacity-100 group-hover:text-electric-500"
            }`}>
              [
            </span>
            <span className={`transition-colors duration-200 ${
              isActive("/history") ? "text-white font-bold" : "text-slate-400 group-hover:text-white"
            }`}>
              History
            </span>
            <span className={`transition-all duration-200 ${
              isActive("/history")
                ? "text-electric-400 opacity-100 font-bold"
                : "text-slate-600 opacity-0 group-hover:opacity-100 group-hover:text-electric-500"
            }`}>
              ]
            </span>
            {isActive("/history") && (
              <span className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-electric-500 shadow-[0_0_6px_#3B82F6]" />
            )}
          </Link>
        </nav>

        {/* HUD Personal Best Stat Badge */}
        <div className="flex items-center min-w-[70px] sm:min-w-[90px] justify-end">
          {pbWPM !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-electric-500/5 border border-electric-500/30 font-mono text-[10px] sm:text-xs text-electric-400 uppercase tracking-wider shadow-[0_0_10px_rgba(59,130,246,0.1)] select-none">
              <span className="text-slate-500">PB:</span>
              <span className="font-extrabold text-white">{pbWPM}</span>
              <span className="text-[9px] text-electric-400/80">WPM</span>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
