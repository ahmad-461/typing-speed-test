"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getPersonalBest } from "../lib/stats";
import { getGamificationState } from "../lib/gamification";

export default function Header() {
  const pathname = usePathname();
  const [pbWPM, setPbWPM] = useState<number | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [gamification, setGamification] = useState<{
    level: number;
    title: string;
    streak: number;
    resetOccurred: boolean;
  } | null>(null);

  const loadPlayerData = () => {
    const best = getPersonalBest();
    if (best) {
      setPbWPM(best.wpm);
    } else {
      setPbWPM(null);
    }

    if (typeof window !== "undefined") {
      setPlayerName(localStorage.getItem("tst_player_name") || "");
    }

    // Read gamification state on route change to keep header accurate
    const state = getGamificationState();
    setGamification({
      level: state.currentLevel,
      title: state.levelTitle,
      streak: state.streakDays,
      resetOccurred: state.streakResetOccurred,
    });
  };

  useEffect(() => {
    loadPlayerData();
  }, [pathname]);

  useEffect(() => {
    window.addEventListener("tst-name-updated", loadPlayerData);
    return () => {
      window.removeEventListener("tst-name-updated", loadPlayerData);
    };
  }, []);

  const handleOpenEditModal = () => {
    window.dispatchEvent(new Event("tst-open-name-modal"));
  };

  const navItems = [
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "History", href: "/history" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#121316]/90 backdrop-blur-md border-b border-[#1E293B]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Left Side: Logo/Wordmark and Navigation Links Inline */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Brand/Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-sm sm:text-base font-bold tracking-wide text-[#F1F5F9] hover:opacity-90 transition-opacity select-none"
          >
            <Image
              src="/logo.svg"
              alt="TST Logo"
              width={26}
              height={26}
              className="object-contain sm:w-8 sm:h-8"
              priority
            />
            <span className="hidden sm:inline">TST</span>
          </Link>

          {/* Navigation links inline */}
          <nav className="flex items-center gap-2.5 sm:gap-5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group relative flex items-center py-1 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                    isActive ? "text-[#3B82F6]" : "text-[#94A3B8] hover:text-[#3B82F6]"
                  }`}
                >
                  {/* Subtle glowing dot indicator to the left of active/hovered link on desktop */}
                  <span
                    className={`hidden sm:inline-block w-1 h-1 rounded-full bg-[#3B82F6] shadow-[0_0_8px_#3B82F6] transition-all duration-200 mr-1.5 ${
                      isActive
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100"
                    }`}
                  />

                  {/* Text */}
                  <span>{item.label}</span>

                  {/* Underline for active link only (animates in from center) */}
                  <span
                    className={`absolute bottom-[-4px] left-0 right-0 h-[1.5px] bg-[#3B82F6] transition-transform duration-300 origin-center ${
                      isActive ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Cohesive Player Status Pill */}
        <div className="flex items-center justify-end select-none">
          {gamification && (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Playing as: [Name] + Edit Pencil (hidden on /test page) */}
                {playerName && pathname !== "/test" && (
                  <div className="flex items-center gap-1 font-mono text-[10px] sm:text-xs text-slate-400">
                    <span className="hidden sm:inline">Playing as:</span>
                    <span className="text-white font-bold max-w-[80px] sm:max-w-[120px] truncate">{playerName}</span>
                    <button
                      onClick={handleOpenEditModal}
                      className="text-[#3B82F6] hover:text-[#3B82F6]/80 p-1 cursor-pointer transition-colors"
                      title="Edit Callsign"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                )}

                <div className="inline-flex items-center h-8 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/[0.06] text-[10px] sm:text-[11px] font-mono text-white font-bold uppercase tracking-wider overflow-hidden animate-fade-in">
                  {/* Level portion */}
                  <span className="px-2.5 sm:px-3 text-[#3B82F6]">
                    Lvl {gamification.level}
                  </span>

                  {/* Partition Line */}
                  <span className="h-full w-[1px] bg-[#3B82F6]/30" />

                  {/* Streak portion */}
                  <span className="px-2.5 sm:px-3 text-amber-500 flex items-center gap-1">
                    <span>🔥</span>
                    <span>{gamification.streak}</span>
                    <span className="hidden sm:inline">Streak</span>
                  </span>

                  {/* Personal Best portion - Desktop only */}
                  {pbWPM !== null && (
                    <>
                      <span className="hidden md:inline-block h-full w-[1px] bg-[#3B82F6]/30" />
                      <span className="hidden md:inline-flex px-3 text-sky-400 items-center gap-1">
                        <span>PB:</span>
                        <span>{pbWPM} WPM</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {gamification.resetOccurred && (
                <div className="text-[8px] sm:text-[9px] font-mono text-rose-400 font-semibold tracking-wider uppercase mt-0.5 animate-pulse">
                  Streak reset — start fresh today
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
