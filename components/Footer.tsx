"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface CustomWindow extends Window {
  scrollToConfig?: () => void;
}

export default function Footer() {
  const pathname = usePathname();
  const [showSecret, setShowSecret] = useState(false);
  const [isTypingActive, setIsTypingActive] = useState(false);
  const clicksRef = useRef(0);

  // Listen to typing active events from /test page
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

  const handleVersionClick = () => {
    clicksRef.current += 1;
    if (clicksRef.current >= 5) {
      setShowSecret(true);
      setTimeout(() => {
        setShowSecret(false);
      }, 4000);
      clicksRef.current = 0;
    }
  };

  const handleCtaClick = (e: React.MouseEvent) => {
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

  return (
    <footer className="w-full bg-[#0E0F11] border-t border-[#3B82F6]/20 pt-10 pb-8 sm:pt-16 sm:pb-12 select-none text-[13px] relative overflow-hidden shadow-[0_-4px_30px_rgba(59,130,246,0.12)]">
      {/* Soft electric-blue top border glow strip */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#3B82F6]/60 to-transparent" />

      {/* Subtle background scanline/grid grid simulation */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: "linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)",
          backgroundSize: "30px 30px"
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ASYMMETRIC TALL COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">

          {/* Dominant Left Side: Call-to-Action Closing Block (65% width equivalent) */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">

            {isTypingActive ? (
              /* Subdued view during active typing */
              <div className="space-y-3 animate-fade-in py-4">
                <div className="flex items-center gap-2 font-mono text-slate-500 text-xs tracking-wider uppercase">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>TRANSMISSION IN PROGRESS</span>
                </div>
                <p className="text-lg sm:text-xl font-bold font-mono text-slate-400 uppercase tracking-wide">
                  Focus engaged. Complete the terminal passage.
                </p>
              </div>
            ) : (
              /* Prominent prominent CTA view */
              <div className="space-y-4 animate-fade-in">
                <span className="font-mono text-xs text-[#3B82F6] tracking-widest uppercase font-black block">
                  {"// CHASE THE NEXT HIGHSCORE"}
                </span>

                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase leading-tight font-sans max-w-xl">
                  Ready to benchmark your keyboard response?
                </h2>

                <p className="text-slate-400 text-xs sm:text-sm max-w-lg leading-relaxed">
                  Your spatial muscle memory updates dynamically with every keystroke. Jump straight back in to establish a new peak performance standard.
                </p>

                <div className="pt-2">
                  {pathname === "/" ? (
                    <button
                      onClick={handleCtaClick}
                      className="inline-flex items-center px-6 py-3.5 sm:px-8 sm:py-4 bg-[#3B82F6]/10 hover:bg-[#3B82F6] border border-[#3B82F6]/40 hover:border-[#3B82F6] text-white hover:text-[#0E0F11] font-mono text-xs sm:text-sm uppercase tracking-wider font-extrabold rounded-xl transition-all duration-200 hover:shadow-[0_0_25px_rgba(59,130,246,0.25)] cursor-pointer"
                    >
                      [ SCROLL TO CONFIGURATIONS ]
                    </button>
                  ) : (
                    <Link
                      href="/"
                      className="inline-flex items-center px-6 py-3.5 sm:px-8 sm:py-4 bg-[#3B82F6]/10 hover:bg-[#3B82F6] border border-[#3B82F6]/40 hover:border-[#3B82F6] text-white hover:text-[#0E0F11] font-mono text-xs sm:text-sm uppercase tracking-wider font-extrabold rounded-xl transition-all duration-200 hover:shadow-[0_0_25px_rgba(59,130,246,0.25)] cursor-pointer"
                    >
                      [ START NEW TYPING RUN ]
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Smaller Right Side: System telemetry dashboard and links (35% width equivalent) */}
          <div className="lg:col-span-4 space-y-6 w-full lg:border-l lg:border-[#1E293B]/60 lg:pl-8">

            {/* System Status telemetry container */}
            <div className="bg-[#121316] border border-[#1E293B] rounded-xl p-4 sm:p-5 font-mono text-[11px] text-slate-400 flex flex-col justify-center space-y-2 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">&gt; SYSTEM STATUS</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-[#10B981] font-extrabold text-[10px]">ONLINE</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">&gt; LEADERBOARD</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
                  <span className="text-[#3B82F6] font-extrabold text-[10px]">ACTIVE</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">&gt; TARGET OBJECTIVE</span>
                <span className="text-slate-200 font-extrabold text-[10px] uppercase tracking-wide">
                  BEAT PERSONAL BEST
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-[#1E293B] pt-2 mt-2">
                <span className="text-slate-500 font-bold">&gt; VERSION</span>
                <div className="flex items-center gap-2">
                  {showSecret && (
                    <span className="text-rose-400 font-extrabold text-[10px] tracking-wide animate-pulse">
                      &gt;_ SECRET PROTOCOL ACTIVATED
                    </span>
                  )}
                  <button
                    onClick={handleVersionClick}
                    className="text-slate-500 hover:text-[#3B82F6] font-extrabold font-mono text-[10px] tracking-widest cursor-pointer select-none transition-colors border-b border-dashed border-slate-600 hover:border-[#3B82F6]"
                  >
                    v1.6
                  </button>
                </div>
              </div>
            </div>

            {/* Utility Navigation */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 font-mono text-xs">
              <Link
                href="/leaderboard"
                className="text-slate-400 hover:text-white hover:underline transition-colors font-bold uppercase tracking-wider"
              >
                LEADERBOARD
              </Link>
              <span className="text-slate-700 font-bold">•</span>
              <Link
                href="/history"
                className="text-slate-400 hover:text-white hover:underline transition-colors font-bold uppercase tracking-wider"
              >
                HISTORY
              </Link>
              <span className="text-slate-700 font-bold">•</span>
              <a
                href="https://github.com/ahmad-461/typing-speed-test"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white hover:underline transition-colors font-bold uppercase tracking-wider"
              >
                GITHUB
              </a>
            </div>

          </div>

        </div>

        {/* Separator */}
        <div className="h-[1px] bg-[#1E293B]/60 w-full my-6 sm:my-8" />

        {/* Bottom copyright branding */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="text-white font-black tracking-widest">NOKY</span>
            <span className="text-[9px] text-slate-600 tracking-[0.1em] uppercase">TYPE FASTER. THINK SHARPER.</span>
          </div>
          <p className="text-center sm:text-right">
            © {new Date().getFullYear()} NOKY INDUSTRIES. ALL RIGHT PATTERNS RESERVED.
          </p>
        </div>

      </div>
    </footer>
  );
}
