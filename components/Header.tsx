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

  // Mobile menu open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Close mobile menu on page transition
    setMobileMenuOpen(false);
  }, [pathname]);

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
    <header className="sticky top-0 z-50 w-full p-[1px] hud-header-outer-glow">
      <div className="hud-header-inner relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">

          {/* Left Side: Logo/Wordmark and Navigation Links Inline */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Brand/Logo - Explicitly sized to avoid cut-off, with high-contrast priority */}
            <Link
              href="/"
              className="flex items-center gap-2 font-mono text-sm sm:text-base font-bold tracking-wide text-[#F1F5F9] hover:opacity-90 transition-opacity select-none py-1 flex-shrink-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 relative flex-shrink-0 flex items-center justify-center bg-[#0e0f11] rounded-lg border border-charcoal-700 p-0.5 shadow-[0_0_8px_rgba(var(--color-accent-rgb),0.15)]">
                <Image
                  src="/logo.svg"
                  alt="TST Logo"
                  width={32}
                  height={32}
                  className="object-contain w-full h-full"
                  priority
                />
              </div>
              <span className="hidden md:inline font-extrabold text-electric-400 tracking-wider text-base uppercase">NOKY</span>
            </Link>

            {/* Navigation links styled as cut-top menu tabs */}
            {!isTestPage && (
              <nav className="hidden sm:flex items-stretch h-10 gap-1.5 self-end mb-[-1px] select-none">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`hud-tab-outer group block p-[1px] ${isActive ? "active" : ""}`}
                    >
                      <div className="hud-tab-inner h-full flex items-center gap-1.5 px-4 font-mono text-xs font-extrabold uppercase tracking-widest transition-all duration-150">
                        {/* Top Bright Accent Line for active tab */}
                        {isActive && (
                          <span className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--color-accent)] animate-pulse" />
                        )}
                        {/* Icon */}
                        <span className={isActive ? "text-[var(--color-accent)]" : "text-slate-400 group-hover:text-slate-200"}>
                          {item.icon}
                        </span>
                        {/* Text Label */}
                        <span className={isActive ? "text-[var(--color-accent)] font-black" : "text-slate-400 group-hover:text-slate-200"}>
                          {item.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right Side: Cohesive Player Status, Operator Console, Sound Toggle */}
          <div className="flex items-center gap-2 sm:gap-4 justify-end select-none">

            {/* Compact Mobile status readout (LVL X | STK Y) - Only visible on mobile/390px screens */}
            {gamification && (
              <div className="flex sm:hidden items-center p-[1px] hud-btn-cut bg-[rgba(var(--color-accent-rgb),0.2)]">
                <div className="hud-btn-cut bg-charcoal-900 px-2.5 py-1.5 font-mono text-[10px] font-bold tracking-widest flex items-center gap-2 text-slate-300">
                  <span className="text-[var(--color-accent)]">LVL {gamification.level}</span>
                  <span className="w-[1px] h-3 bg-charcoal-700" />
                  <span className="text-amber-500">{gamification.streak} STK</span>
                </div>
              </div>
            )}

            {/* Desktop Status Readout Panel: Stylized Parallelogram with slanted division notches */}
            {gamification && (
              <div className="hidden sm:block p-[1px] hud-parallelogram-outer">
                <div className="hud-parallelogram-inner h-9 sm:h-10 px-6 font-mono text-xs font-extrabold uppercase tracking-widest flex items-center">

                  {/* Level Portion */}
                  <div className="flex items-center gap-1.5 text-[var(--color-accent)]">
                    <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>LVL {gamification.level}</span>
                  </div>

                  {/* Slanted Accent Divider */}
                  <div className="w-[2px] h-5 bg-[var(--color-accent)] opacity-30 mx-4 skew-x-[-15deg]" />

                  {/* Streak Portion */}
                  <div className="flex items-center gap-1.5 text-amber-500">
                    <svg className="w-4 h-4 text-amber-500 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                    </svg>
                    <span>{gamification.streak} STREAK</span>
                  </div>

                  {/* PB Portion */}
                  {pbWPM !== null && (
                    <>
                      {/* Slanted Accent Divider */}
                      <div className="w-[2px] h-5 bg-[var(--color-accent)] opacity-30 mx-4 skew-x-[-15deg]" />
                      <div className="flex items-center gap-1.5 text-sky-400">
                        <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
                          <path d="M3 20h18" strokeWidth="2" />
                        </svg>
                        <span>{pbWPM} WPM PB</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Desktop Callsign / Operator Console Module */}
            {!isTestPage && playerName && (
              <div className="hidden sm:block p-[1px] hud-btn-cut bg-charcoal-800">
                <div className="hud-btn-cut bg-charcoal-900/60 h-9 sm:h-10 px-3.5 font-mono text-[11px] text-slate-300 flex items-center gap-2">
                  <span className="text-slate-500 font-bold">&gt;</span>
                  <span className="font-extrabold text-white truncate max-w-[100px] normal-case" title={playerName}>
                    {playerName}
                  </span>

                  {/* Edit callsing button */}
                  <button
                    onClick={triggerEditModal}
                    className="text-slate-500 hover:text-[var(--color-accent)] transition-colors cursor-pointer p-1 active:scale-[0.9]"
                    title="Edit Callsign"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>

                  <div className="w-[1px] h-4 bg-charcoal-700" />

                  {/* Exit session button */}
                  <button
                    onClick={triggerExitModal}
                    className="flex items-center gap-1 text-slate-400 hover:text-red-400 transition-all cursor-pointer py-1 active:scale-[0.9]"
                    title="Exit Session"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span className="text-[10px] font-extrabold uppercase">EXIT</span>
                  </button>
                </div>
              </div>
            )}

            {/* Interactive Sound Switch Module */}
            <div className="p-[1px] hud-btn-cut bg-charcoal-800">
              <button
                onClick={toggleSound}
                className="hud-btn-cut flex items-center justify-center bg-charcoal-900/80 hover:bg-[rgba(var(--color-accent-rgb),0.1)] text-slate-400 hover:text-white cursor-pointer h-9 w-9 sm:h-10 sm:w-10 active:scale-[0.93] border-none"
                title={soundEnabled ? "Mute Keyboard Sounds" : "Unmute Keyboard Sounds"}
              >
                {soundEnabled ? (
                  <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6L4.75 9H3a1 1 0 00-1 1v4a1 1 0 001 1h1.75l3.5 3V6z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Mobile Dropdown Menu Toggle (Notched Corner Button for Mobile/390px screens) */}
            {!isTestPage && (
              <div className="block sm:hidden p-[1px] hud-btn-cut bg-[rgba(var(--color-accent-rgb),0.2)]">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="hud-btn-cut flex items-center justify-center bg-charcoal-900 hover:bg-[rgba(var(--color-accent-rgb),0.1)] text-slate-300 w-9 h-9 active:scale-[0.93] border-none"
                  aria-label="Navigation Menu"
                >
                  {mobileMenuOpen ? (
                    <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                  )}
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Floating Mobile Dropdown Overlay (Beveled HUD styling with monospace links) */}
        {!isTestPage && mobileMenuOpen && (
          <div className="absolute top-14 left-4 right-4 z-50 p-[1.5px] hud-dropdown-outer shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="hud-dropdown-inner p-4 space-y-4">

              {/* Navigation links inside dropdown */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">&gt; NAVIGATION</div>
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`flex items-center gap-3 p-3 font-mono text-xs font-extrabold uppercase tracking-widest rounded-lg border transition-all ${
                        isActive
                          ? "bg-[rgba(var(--color-accent-rgb),0.12)] text-[var(--color-accent)] border-[rgba(var(--color-accent-rgb),0.3)]"
                          : "bg-charcoal-900/50 text-slate-300 border-charcoal-800 hover:border-[rgba(var(--color-accent-rgb),0.25)] hover:text-white"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Operator Details & Actions */}
              {playerName && (
                <div className="space-y-2 border-t border-charcoal-800 pt-3">
                  <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">&gt; OPERATOR</div>

                  <div className="flex items-center justify-between p-3 bg-charcoal-900/30 rounded-lg border border-charcoal-800">
                    <span className="font-mono text-xs font-extrabold text-white normal-case">{playerName}</span>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        triggerEditModal();
                      }}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      triggerExitModal();
                    }}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 rounded-lg font-mono text-xs font-extrabold uppercase tracking-wider"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>EXIT CURRENT SESSION</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </header>
  );
}
