"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPlayerName } from "../lib/stats";
import { getGamificationState } from "../lib/gamification";

interface CustomWindow extends Window {
  scrollToConfig?: () => void;
}

export default function Footer() {
  const pathname = usePathname();
  const footerRef = useRef<HTMLDivElement>(null);

  // Core state variables
  const [playerName, setPlayerName] = useState("");
  const [isTypingActive, setIsTypingActive] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const clicksRef = useRef(0);

  // Uptime/Session Counter
  const [uptime, setUptime] = useState(0);

  // IntersectionObserver for Scroll Animation
  const [isVisible, setIsVisible] = useState(false);

  // Typewriter Animation
  const bottomText = "SYSTEM READY... KEEP TYPING. KEEP IMPROVING.";
  const [typedText, setTypedText] = useState("");

  // Mouse Glow Ref
  const glowRef = useRef<HTMLDivElement>(null);

  // Real Operator Metrics
  const [stats, setStats] = useState({
    totalTests: 0,
    bestWpm: 0,
    bestAccuracy: 0,
    streakDays: 0,
    currentLevel: 1,
  });

  // 1. Session Uptime Timer
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setUptime(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Real-time Clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const hrs = d.getHours().toString().padStart(2, "0");
      const mins = d.getMinutes().toString().padStart(2, "0");
      const secs = d.getSeconds().toString().padStart(2, "0");
      setCurrentTime(`${hrs}:${mins}:${secs}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3. Observer for Visibility & Single-Play Typewriter Trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    if (footerRef.current) {
      observer.observe(footerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // 4. Typewriter animation (runs once when footer is visible)
  useEffect(() => {
    if (isVisible) {
      let currentText = "";
      let index = 0;
      const timer = setInterval(() => {
        if (index < bottomText.length) {
          currentText += bottomText[index];
          setTypedText(currentText);
          index++;
        } else {
          clearInterval(timer);
        }
      }, 45);
      return () => clearInterval(timer);
    }
  }, [isVisible]);

  // 5. Synchronize player name
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPlayerName(getPlayerName());
    }

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

  // 6. Synchronize active typing state from /test page
  useEffect(() => {
    const checkTypingStatus = () => {
      if (typeof window !== "undefined") {
        const active = sessionStorage.getItem("typing_active") === "true";
        setIsTypingActive(active);
      }
    };

    checkTypingStatus();

    if (typeof window !== "undefined") {
      window.addEventListener("typing_focus_change", checkTypingStatus);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("typing_focus_change", checkTypingStatus);
      }
    };
  }, [pathname]);

  // 7. Load operator stats and subscribe to gamification updates
  const loadPlayerStats = () => {
    if (typeof window !== "undefined") {
      try {
        const state = getGamificationState();
        setStats({
          totalTests: state.stats.totalTests || 0,
          bestWpm: state.stats.bestWpm || 0,
          bestAccuracy: state.stats.bestAccuracy || 0,
          streakDays: state.streakDays || 0,
          currentLevel: state.currentLevel || 1,
        });
      } catch (err) {
        console.error("Error loading stats in footer:", err);
      }
    }
  };

  useEffect(() => {
    loadPlayerStats();

    const handleSync = () => {
      loadPlayerStats();
    };

    window.addEventListener("tst-gamification-updated", handleSync);
    return () => {
      window.removeEventListener("tst-gamification-updated", handleSync);
    };
  }, [pathname]);

  // Handle clicking version for the secret easter egg
  const handleVersionClick = () => {
    clicksRef.current += 1;
    if (clicksRef.current >= 5) {
      setShowSecret(true);
      setTimeout(() => {
        setShowSecret(false);
      }, 5000);
      clicksRef.current = 0;
    }
  };

  // Quick Command scroll handling for homepage
  const handleCommandHomepageScroll = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      if (typeof window !== "undefined") {
        const win = window as unknown as CustomWindow;
        if (win.scrollToConfig) {
          win.scrollToConfig();
        }
      }
    }
  };

  // Mouse Tracker for Pointer Devices (radial glow)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
      return; // Disable on touch devices
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (glowRef.current) {
      glowRef.current.style.setProperty("--mouse-x", `${x}px`);
      glowRef.current.style.setProperty("--mouse-y", `${y}px`);
      glowRef.current.style.opacity = "1";
    }
  };

  const handleMouseLeave = () => {
    if (glowRef.current) {
      glowRef.current.style.opacity = "0";
    }
  };

  // Format uptime to HH:MM:SS
  const formatUptime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Randomized ambient drift particles coordinates
  const particles = [
    { id: 1, left: "12%", top: "25%", duration: "16s", anim: "drift1" },
    { id: 2, left: "38%", top: "65%", duration: "24s", anim: "drift2" },
    { id: 3, left: "55%", top: "15%", duration: "18s", anim: "drift1" },
    { id: 4, left: "72%", top: "80%", duration: "22s", anim: "drift2" },
    { id: 5, left: "88%", top: "35%", duration: "20s", anim: "drift1" },
  ];

  return (
    <footer
      ref={footerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`w-full bg-[#08090b] border-t border-electric-500/20 py-10 select-none font-mono relative overflow-hidden transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      {/* 1. Custom Keyframes & Motion Styles Isolation */}
      <style jsx global>{`
        @keyframes gridScroll {
          from { background-position: 0 0; }
          to { background-position: 32px 32px; }
        }
        @keyframes sweepLine {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 0.12; }
          90% { opacity: 0.12; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes drift1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(12px, -12px); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-15px, 10px); }
        }
        .footer-grid-bg {
          background-image:
            linear-gradient(rgba(var(--color-accent-rgb), 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(var(--color-accent-rgb), 0.04) 1px, transparent 1px);
          background-size: 32px 32px;
          animation: gridScroll 35s linear infinite;
        }
        .footer-scan-line {
          animation: sweepLine 7s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* 2. Background Scrolling Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none footer-grid-bg" />

      {/* 3. Sweeping Scan-Line Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-full h-[1px] bg-electric-500/20 shadow-[0_0_8px_rgba(var(--color-accent-rgb),0.4)] absolute top-0 left-0 footer-scan-line" />
      </div>

      {/* 4. Soft Top Neon Glowing Border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-electric-500/40 to-transparent shadow-[0_1px_15px_rgba(var(--color-accent-rgb),0.3)]" />

      {/* 5. Ambient Low-Opacity Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute w-1 h-1 rounded-full bg-electric-500/20 blur-[0.5px]"
            style={{
              left: p.left,
              top: p.top,
              animation: `${p.anim} ${p.duration} ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* 6. Mouse-Following GPU-Accelerated Radial Glow */}
      <div
        ref={glowRef}
        className="absolute pointer-events-none rounded-full blur-[80px] transition-opacity duration-300 opacity-0"
        style={{
          left: "var(--mouse-x, 0px)",
          top: "var(--mouse-y, 0px)",
          width: "220px",
          height: "220px",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(var(--color-accent-rgb), 0.07) 0%, transparent 70%)",
        }}
      />

      {/* 7. Footer Grid Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* SECTION 1: SYSTEM STATUS */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-black">
              <span className="text-electric-500 font-extrabold">&gt;</span> SYSTEM STATUS
            </div>

            <div className="flex items-center gap-2.5 bg-[#0e0f11]/60 border border-[#1e293b] p-3 rounded-xl shadow-inner">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
              </div>
              <div className="text-xs">
                <span className="text-slate-400 font-bold block leading-none">TERMINAL STATUS</span>
                <span className="text-[#10B981] font-black text-[9px] tracking-widest uppercase">ONLINE</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center border-b border-[#1e293b]/60 pb-2.5">
                <span className="text-slate-500 font-medium">CORE VERSION</span>
                <span
                  onClick={handleVersionClick}
                  className="text-white font-extrabold cursor-pointer hover:text-electric-500 transition-colors min-h-[30px] flex items-center"
                >
                  v1.6
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-[#1e293b]/60 pb-2.5">
                <span className="text-slate-500 font-medium">SESSION UPTIME</span>
                <span className="text-electric-500 font-bold font-mono">{formatUptime(uptime)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">SECURITY</span>
                <span className="text-emerald-400 font-black text-[9px] tracking-wider px-2 py-1 rounded bg-emerald-500/[0.04] border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]">
                  [SECURE_LINK: ACTIVE]
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: QUICK COMMANDS (Ensured touch targets >= 44px on mobile via vertical padding) */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-black">
              <span className="text-electric-500 font-extrabold">&gt;</span> QUICK COMMANDS
            </div>

            <div className="flex flex-col space-y-1">
              <Link
                href="/"
                onClick={handleCommandHomepageScroll}
                className="group flex items-center justify-between text-xs text-slate-400 hover:text-white hover:border-electric-500/30 transition-colors py-3 border-b border-[#1e293b]/40 min-h-[44px]"
              >
                <span className="font-mono text-slate-400 group-hover:text-white">&gt; start_test.sh</span>
                <span className="text-[9px] text-electric-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 font-bold tracking-wider">[EXEC]</span>
              </Link>

              <Link
                href="/leaderboard"
                className="group flex items-center justify-between text-xs text-slate-400 hover:text-white hover:border-electric-500/30 transition-colors py-3 border-b border-[#1e293b]/40 min-h-[44px]"
              >
                <span className="font-mono text-slate-400 group-hover:text-white">&gt; standings.cfg</span>
                <span className="text-[9px] text-electric-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 font-bold tracking-wider">[LOAD]</span>
              </Link>

              <Link
                href="/history"
                className="group flex items-center justify-between text-xs text-slate-400 hover:text-white hover:border-electric-500/30 transition-colors py-3 border-b border-[#1e293b]/40 min-h-[44px]"
              >
                <span className="font-mono text-slate-400 group-hover:text-white">&gt; player_logs.log</span>
                <span className="text-[9px] text-electric-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 font-bold tracking-wider">[OPEN]</span>
              </Link>

              <Link
                href="/"
                onClick={handleCommandHomepageScroll}
                className="group flex items-center justify-between text-xs text-slate-400 hover:text-white hover:border-electric-500/30 transition-colors py-3 border-b border-[#1e293b]/40 min-h-[44px]"
              >
                <span className="font-mono text-slate-400 group-hover:text-white">&gt; sectors.cfg</span>
                <span className="text-[9px] text-electric-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 font-bold tracking-wider">[EXEC]</span>
              </Link>

              <Link
                href="/data-protocol"
                className="group flex items-center justify-between text-xs text-slate-400 hover:text-white hover:border-electric-500/30 transition-colors py-3 border-b border-[#1e293b]/40 min-h-[44px]"
              >
                <span className="font-mono text-slate-400 group-hover:text-white">&gt; [CMD] data_protocol.log</span>
                <span className="text-[9px] text-electric-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 font-bold tracking-wider">[OPEN]</span>
              </Link>

              <Link
                href="/about"
                className="group flex items-center justify-between text-xs text-slate-400 hover:text-white hover:border-electric-500/30 transition-colors py-3 border-b border-[#1e293b]/40 min-h-[44px]"
              >
                <span className="font-mono text-slate-400 group-hover:text-white">&gt; [CMD] about_operator.txt</span>
                <span className="text-[9px] text-electric-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 font-bold tracking-wider">[INFO]</span>
              </Link>

              <Link
                href="/rules-of-engagement"
                className="group flex items-center justify-between text-xs text-slate-400 hover:text-white hover:border-electric-500/30 transition-colors py-3 border-b border-[#1e293b]/40 min-h-[44px]"
              >
                <span className="font-mono text-slate-400 group-hover:text-white">&gt; [CMD] rules.txt</span>
                <span className="text-[9px] text-electric-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 font-bold tracking-wider">[READ]</span>
              </Link>

              <Link
                href="/changelog"
                className="group flex items-center justify-between text-xs text-slate-400 hover:text-white hover:border-electric-500/30 transition-colors py-3 border-b border-[#1e293b]/40 min-h-[44px]"
              >
                <span className="font-mono text-slate-400 group-hover:text-white">&gt; [CMD] changelog.log</span>
                <span className="text-[9px] text-electric-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 font-bold tracking-wider">[LOG]</span>
              </Link>

              <a
                href="https://github.com/ahmad-461/typing-speed-test"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between text-xs text-slate-400 hover:text-white transition-colors py-3 min-h-[44px]"
              >
                <span className="font-mono text-slate-400 group-hover:text-white">&gt; github.git</span>
                <span className="text-[9px] text-electric-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 font-bold tracking-wider">[LINK]</span>
              </a>
            </div>
          </div>

          {/* SECTION 3: PLAYER STATS */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-black">
              <span className="text-electric-500 font-extrabold">&gt;</span> OPERATOR METRICS
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0e0f11]/60 border border-[#1e293b] p-2.5 rounded-xl shadow-inner group hover:border-electric-500/40 transition-colors duration-200">
                <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider leading-none mb-1">LEVEL</span>
                <span className="text-xs font-black text-electric-500 font-mono leading-none">Lvl {stats.currentLevel}</span>
              </div>

              <div className="bg-[#0e0f11]/60 border border-[#1e293b] p-2.5 rounded-xl shadow-inner group hover:border-electric-500/40 transition-colors duration-200">
                <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider leading-none mb-1">STREAK</span>
                <span className="text-xs font-black text-amber-500 font-mono leading-none">🔥 {stats.streakDays}d</span>
              </div>

              <div className="bg-[#0e0f11]/60 border border-[#1e293b] p-2.5 rounded-xl shadow-inner group hover:border-electric-500/40 transition-colors duration-200">
                <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider leading-none mb-1">RUNS</span>
                <span className="text-xs font-black text-white font-mono leading-none">{stats.totalTests}</span>
              </div>

              <div className="bg-[#0e0f11]/60 border border-[#1e293b] p-2.5 rounded-xl shadow-inner group hover:border-electric-500/40 transition-colors duration-200">
                <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider leading-none mb-1">BEST SPEED</span>
                <span className="text-xs font-black text-emerald-400 font-mono leading-none">
                  {stats.bestWpm > 0 ? `${stats.bestWpm} W` : "—"}
                </span>
              </div>

              <div className="bg-[#0e0f11]/60 border border-[#1e293b] p-2.5 rounded-xl shadow-inner group hover:border-electric-500/40 transition-colors duration-200 col-span-2">
                <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider leading-none mb-1">BEST PRECISION</span>
                <span className="text-xs font-black text-sky-400 font-mono leading-none">
                  {stats.bestAccuracy > 0 ? `${stats.bestAccuracy}%` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 4: TELEMETRY FEED */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-black">
              <span className="text-electric-500 font-extrabold">&gt;</span> TELEMETRY FEED
            </div>

            <div className="bg-[#0e0f11]/70 border border-[#1e293b] p-3 rounded-xl text-[10px] leading-relaxed font-mono space-y-2 h-[125px] overflow-hidden relative shadow-inner">
              <div className="flex items-start gap-1.5 text-[#64748B]">
                <span className="text-electric-500 font-black">[SYS]</span>
                <span className="text-slate-400 font-sans">Core engine active. Systems normal.</span>
              </div>

              {playerName ? (
                <div className="flex items-start gap-1.5 text-[#64748B]">
                  <span className="text-electric-500 font-black">[AUTH]</span>
                  <span className="text-slate-400 font-sans truncate">
                    Operator connected: <strong className="text-white normal-case">{playerName}</strong>
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-1.5 text-rose-500">
                  <span className="text-rose-500 font-black">[WARN]</span>
                  <span className="text-rose-400/90 font-sans">Identity unassigned. Gate intercept active.</span>
                </div>
              )}

              {isTypingActive && (
                <div className="flex items-start gap-1.5 text-amber-500 animate-pulse">
                  <span className="text-amber-500 font-black">[FOCUS]</span>
                  <span className="text-amber-300 font-sans">Active typing test focus engaged.</span>
                </div>
              )}

              {showSecret && (
                <div className="flex items-start gap-1.5 text-rose-500 animate-bounce">
                  <span className="text-rose-500 font-black">[SEC]</span>
                  <span className="text-rose-300 font-bold uppercase">OVERCLOCK MODE ARMED.</span>
                </div>
              )}

              <div className="flex items-start gap-1.5 text-[#64748B]">
                <span className="text-[#10B981] font-black">[NET]</span>
                <span className="text-slate-400 font-sans truncate">Secure mirror synced.</span>
              </div>

              {/* Dynamic Telemetry Time Log */}
              <div className="absolute bottom-2.5 right-3 text-[8px] text-slate-600 font-mono tracking-wider">
                CLK: {currentTime || "00:00:00"}
              </div>
            </div>
          </div>

        </div>

        {/* Divider above bottom copyright row */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-electric-500/30 to-transparent my-8" />

        {/* BOTTOM SECTION */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500 pt-1">
          {/* Animated Single-play Typewriter prompt */}
          <div className="flex items-center gap-1.5 text-slate-400 h-4">
            <span className="text-electric-500 font-extrabold">&gt;</span>
            <span className="tracking-wide">{typedText}</span>
            <span className="w-1.5 h-3.5 bg-electric-500 animate-blink" />
          </div>

          <div className="text-center sm:text-right flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[10px]">
            <span>© 2026 NOKY Terminal Systems</span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span>Built with Next.js • TypeScript • Tailwind CSS</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
