"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getPersonalBest, getPlayerName, getNamespacedKey } from "../lib/stats";
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
    {
      label: "Leaderboard",
      mobileLabel: "LDR",
      href: "/leaderboard",
      icon: (
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
          <path d="M12 2a4 4 0 0 1 4 4v5c0 2.2-1.8 4-4 4s-4-1.8-4-4V6a4 4 0 0 1 4-4z" />
        </svg>
      )
    },
    {
      label: "History",
      mobileLabel: "HST",
      href: "/history",
      icon: (
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
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
      const activeSkin = localStorage.getItem(getNamespacedKey("tst_active_skin")) || "electric-blue";
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
      <div className="max-w-6xl mx-auto px-2 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">

        {/* Left Side: Logo/Wordmark and Navigation Links Inline */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Brand/Logo */}
          <Link
            href="/"
            className="flex items-center gap-1.5 font-mono text-sm sm:text-base font-bold tracking-wide text-[#F1F5F9] hover:opacity-90 transition-opacity select-none min-h-[44px] py-1"
          >
            <Image
              src="/logo.svg"
              alt="TST Logo"
              width={26}
              height={26}
              className="object-contain sm:w-8 sm:h-8"
              priority
            />
            <span className="hidden sm:inline font-extrabold text-electric-400 tracking-wider">NOKY</span>
          </Link>

          {/* Navigation links inline */}
          {!isTestPage && (
            <nav className="flex items-center gap-1 sm:gap-2 bg-charcoal-800/40 p-1 rounded-lg border border-charcoal-700/50">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`group flex items-center gap-1 sm:gap-1.5 py-1 px-2 rounded-md font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-150 min-h-[44px] sm:min-h-[32px] ${
                      isActive
                        ? "bg-electric-500/15 text-electric-400 border border-electric-500/30 shadow-[0_0_8px_rgba(59,130,246,0.1)]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-charcoal-700/40 border border-transparent"
                    }`}
                  >
                    {/* Icon */}
                    <span className={isActive ? "text-electric-400" : "text-slate-400 group-hover:text-slate-200"}>
                      {item.icon}
                    </span>
                    {/* Text Label */}
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="inline sm:hidden">{item.mobileLabel}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right Side: Cohesive Player Status Pill, Callsign, Sound Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 justify-end select-none">
          {/* Sound Toggle Icon Button (min 44x44px for perfect mobile usability) */}
          <button
            onClick={toggleSound}
            className="flex items-center justify-center border border-charcoal-700 bg-charcoal-800 hover:border-electric-500 hover:bg-electric-500/10 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer h-11 w-11 sm:h-10 sm:w-10 active:scale-[0.95]"
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
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg border border-charcoal-700 bg-charcoal-800 font-mono text-[11px] text-slate-300 h-10">
              <span className="text-slate-500 font-bold">&gt;</span>
              <span className="font-extrabold text-white truncate max-w-[100px] normal-case" title={playerName}>
                {playerName}
              </span>
              <button
                onClick={triggerEditModal}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer ml-1 h-8 w-8 flex items-center justify-center active:scale-[0.9]"
                title="Edit Callsign"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                onClick={triggerExitModal}
                className="flex items-center justify-center border border-electric-500/30 hover:border-electric-500 hover:bg-electric-500/10 text-slate-400 hover:text-white rounded-md h-8 px-2 transition-all cursor-pointer ml-1 active:scale-[0.9]"
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

          {gamification && (
            <div className="inline-flex items-center h-10 rounded-lg border border-electric-500/30 bg-electric-500/[0.04] shadow-[0_0_12px_rgba(59,130,246,0.03)] font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider overflow-hidden">
              {/* Level Portion */}
              <div className="flex items-center gap-1 px-2 sm:px-3 text-electric-400">
                <svg className="w-3.5 h-3.5 text-electric-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>LVL {gamification.level}</span>
              </div>

              {/* Divider */}
              <span className="h-4 w-[1px] bg-electric-500/25" />

              {/* Streak Portion */}
              <div className="flex items-center gap-1 px-2 sm:px-3 text-amber-500">
                <svg className="w-3.5 h-3.5 text-amber-500 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
                <span>{gamification.streak}<span className="hidden sm:inline"> STREAK</span></span>
              </div>

              {/* PB Portion */}
              {pbWPM !== null && (
                <>
                  {/* Divider */}
                  <span className="h-4 w-[1px] bg-electric-500/25" />
                  <div className="flex items-center gap-1 px-2 sm:px-3 text-sky-400">
                    <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
                      <path d="M3 20h18" strokeWidth="2" />
                    </svg>
                    <span>{pbWPM}<span className="hidden sm:inline"> WPM</span><span className="inline sm:hidden"> PB</span></span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
