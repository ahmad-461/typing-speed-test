"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getPersonalBest, getPlayerName } from "../lib/stats";
import { getGamificationState } from "../lib/gamification";

export default function Header() {
  const pathname = usePathname();
  const isTestPage = pathname === "/test";

  const [pbWPM, setPbWPM] = useState<number | null>(null);
  const [gamification, setGamification] = useState<{
    level: number;
    title: string;
    streak: number;
    resetOccurred: boolean;
  } | null>(null);

  useEffect(() => {
    const refreshHeader = () => {
      const best = getPersonalBest();
      if (best) {
        setPbWPM(best.wpm);
      } else {
        setPbWPM(null);
      }

      // Read gamification state to keep header accurate
      const state = getGamificationState();
      setGamification({
        level: state.currentLevel,
        title: state.levelTitle,
        streak: state.streakDays,
        resetOccurred: state.streakResetOccurred,
      });
    };

    refreshHeader();

    window.addEventListener("tst-gamification-updated", refreshHeader);
    return () => {
      window.removeEventListener("tst-gamification-updated", refreshHeader);
    };
  }, [pathname]);

  const navItems = [
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "History", href: "/history" },
  ];

  const [playerName, setPlayerName] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    const stored = getPlayerName();
    setPlayerName(stored);

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== undefined) {
        setPlayerName(customEvent.detail);
      }
    };

    window.addEventListener("tst-name-updated", handleUpdate);
    return () => {
      window.removeEventListener("tst-name-updated", handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSoundEnabled(localStorage.getItem("tst_sound_enabled") === "true");
    }

    const handleSoundChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== undefined) {
        setSoundEnabled(customEvent.detail);
      }
    };

    window.addEventListener("tst-sound-changed", handleSoundChange);
    return () => {
      window.removeEventListener("tst-sound-changed", handleSoundChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const applySkin = () => {
      const activeSkin = localStorage.getItem("tst_active_skin") || "electric-blue";
      document.documentElement.classList.remove("skin-emerald", "skin-amber", "skin-crimson");
      if (activeSkin !== "electric-blue") {
        document.documentElement.classList.add(`skin-${activeSkin.split("-")[0]}`);
      }
    };

    applySkin();

    window.addEventListener("tst-skin-changed", applySkin);
    return () => {
      window.removeEventListener("tst-skin-changed", applySkin);
    };
  }, []);

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem("tst_sound_enabled", newVal ? "true" : "false");
    window.dispatchEvent(new CustomEvent("tst-sound-changed", { detail: newVal }));
  };

  const triggerEditModal = () => {
    window.dispatchEvent(new CustomEvent("tst-open-name-modal"));
  };

  const triggerExitModal = () => {
    window.dispatchEvent(new CustomEvent("tst-open-exit-modal"));
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#121316]/90 backdrop-blur-md border-b border-[#1E293B]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">

        {/* Left Side: Logo/Wordmark and Navigation Links Inline */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Brand/Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-sm sm:text-base font-bold tracking-wide text-[#F1F5F9] hover:opacity-90 transition-opacity select-none min-h-[44px] py-1"
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
          {!isTestPage && (
            <nav className="flex items-center gap-2.5 sm:gap-5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`group relative flex items-center py-2.5 px-1 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors duration-200 min-h-[44px]`}
                  >
                    {/* Subtle glowing dot indicator to the left of active/hovered link on desktop */}
                    <span
                      className={`hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-electric-500 shadow-[0_0_8px_var(--color-accent)] transition-all duration-200 mr-1.5 ${
                        isActive
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100"
                      }`}
                    />

                    {/* Text */}
                    <span>{item.label}</span>

                    {/* Underline for active link only (animates in from center) */}
                    <span
                      className={`absolute bottom-[4px] left-0 right-0 h-[1.5px] bg-electric-500 transition-transform duration-300 origin-center ${
                        isActive ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right Side: Cohesive Player Status Pill & Callsign display */}
        <div className="flex items-center gap-3 justify-end select-none">
          {/* Sound Toggle Icon Button (min 44x44px for perfect mobile usability) */}
          <button
            onClick={toggleSound}
            className="flex items-center justify-center border border-charcoal-700 bg-charcoal-800 hover:border-electric-500 hover:bg-electric-500/10 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer h-11 w-11 active:scale-[0.95]"
            title={soundEnabled ? "Mute Keyboard Sounds" : "Unmute Keyboard Sounds"}
          >
            {soundEnabled ? (
              <svg className="w-4 h-4 text-electric-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6L4.75 9H3a1 1 0 00-1 1v4a1 1 0 001 1h1.75l3.5 3V6z" />
              </svg>
            )}
          </button>

          {!isTestPage && playerName && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-charcoal-700 bg-charcoal-800 font-mono text-[11px] text-slate-300">
              <span className="text-slate-500 font-bold">&gt;</span>
              <span className="font-extrabold text-white truncate max-w-[100px] normal-case" title={playerName}>
                {playerName}
              </span>
              <button
                onClick={triggerEditModal}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer ml-1 h-9 w-9 flex items-center justify-center active:scale-[0.9]"
                title="Edit Callsign"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                onClick={triggerExitModal}
                className="flex items-center justify-center border border-electric-500/30 hover:border-electric-500 hover:bg-electric-500/10 text-slate-400 hover:text-white rounded-lg h-9 px-2.5 transition-all cursor-pointer ml-1 active:scale-[0.9]"
                title="Exit Session"
              >
                <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="text-[10px] font-bold">EXIT</span>
              </button>
            </div>
          )}

          {!isTestPage && gamification && (
            <div className="flex flex-col items-end">
              <div className="inline-flex items-center h-11 rounded-xl border border-electric-500/30 bg-electric-500/[0.06] text-[9px] sm:text-[11px] font-mono text-white font-bold uppercase tracking-wider overflow-hidden animate-fade-in">
                {/* Level portion */}
                <span className="px-2.5 sm:px-3 text-electric-500">
                  Lvl {gamification.level}
                </span>

                {/* Partition Line */}
                <span className="h-full w-[1px] bg-electric-500/30" />

                {/* Streak portion */}
                <span className="px-2.5 sm:px-3 text-amber-500 flex items-center gap-1">
                  <span>🔥</span>
                  <span>{gamification.streak}</span>
                  <span className="hidden sm:inline">Streak</span>
                </span>

                {/* Personal Best portion - Desktop only */}
                {pbWPM !== null && (
                  <>
                    <span className="hidden md:inline-block h-full w-[1px] bg-electric-500/30" />
                    <span className="hidden md:inline-flex px-3 text-sky-400 items-center gap-1">
                      <span>PB:</span>
                      <span>{pbWPM} WPM</span>
                    </span>
                  </>
                )}
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
