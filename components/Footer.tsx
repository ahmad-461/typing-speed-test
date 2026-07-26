"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function Footer() {
  const [showSecret, setShowSecret] = useState(false);
  const clicksRef = useRef(0);

  const handleVersionClick = () => {
    clicksRef.current += 1;
    if (clicksRef.current >= 5) {
      setShowSecret(true);
      setTimeout(() => {
        setShowSecret(false);
      }, 4005);
      clicksRef.current = 0;
    }
  };

  return (
    <footer className="w-full bg-[#0E0F11] border-t border-[#1E293B] pt-12 pb-8 select-none text-[13px] relative overflow-hidden">
      {/* Subtle background scanline/grid grid simulation */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: "linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)",
          backgroundSize: "30px 30px"
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-10">

        {/* SESSION COMPLETE Center Module */}
        <div className="max-w-xl mx-auto text-center border border-[#1E293B] bg-[#121316]/50 rounded-2xl p-6 sm:p-8 shadow-[0_0_25px_rgba(59,130,246,0.03)] space-y-5 relative overflow-hidden group hover:border-[#3B82F6]/30 transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#3B82F6]/55 to-transparent" />

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[#3B82F6] font-mono text-xs tracking-widest uppercase font-black">
                SESSION COMPLETE
              </span>
              <span className="inline-block w-1.5 h-3.5 bg-[#3B82F6] animate-blink" />
            </div>

            <div className="h-[1px] bg-[#1E293B] w-2/3 mx-auto my-3" />

            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-widest">
              READY FOR ANOTHER RUN?
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Your next high score is one test away.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-2.5 bg-[#3B82F6]/10 hover:bg-[#3B82F6] border border-[#3B82F6]/40 hover:border-[#3B82F6] text-white hover:text-[#0E0F11] font-mono text-xs uppercase tracking-wider font-extrabold rounded-lg transition-all duration-200 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] cursor-pointer"
            >
              [ START NEW TEST ]
            </Link>
            <Link
              href="/leaderboard"
              className="w-full sm:w-auto px-6 py-2.5 bg-[#1E293B]/40 hover:bg-[#1E293B]/85 border border-[#1E293B] hover:border-slate-500 text-slate-300 hover:text-white font-mono text-xs uppercase tracking-wider font-extrabold rounded-lg transition-all duration-200 cursor-pointer"
            >
              [ VIEW LEADERBOARD ]
            </Link>
          </div>
        </div>

        {/* Separator */}
        <div className="h-[1px] bg-[#1E293B]/60 w-full" />

        {/* Bottom Panel Split: left, center, right */}
        <div className="flex flex-col md:flex-row items-center md:items-stretch justify-between gap-8 pt-2">

          {/* Column Left: Brand Signature */}
          <div className="flex flex-col justify-center items-center md:items-start text-center md:text-left md:w-1/3">
            <span className="text-base font-black tracking-[0.25em] text-white font-mono uppercase">
              NOKY
            </span>
            <span className="text-[9px] text-[#475569] font-mono font-bold tracking-[0.18em] uppercase mt-1 leading-none">
              TYPE FASTER. THINK SHARPER.
            </span>
          </div>

          {/* Column Center: Compact System Panel */}
          <div className="w-full max-w-sm md:w-1/3 bg-[#121316] border border-[#1E293B] rounded-xl p-4 font-mono text-[11px] text-slate-400 flex flex-col justify-center space-y-1.5 shadow-inner">
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
              <span className="text-slate-500 font-bold">&gt; NEXT OBJECTIVE</span>
              <span className="text-slate-200 font-extrabold text-[10px] uppercase tracking-wide">
                BEAT YOUR PERSONAL BEST
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/40 pt-1.5 mt-1.5">
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

          {/* Column Right: Minimal Nav */}
          <div className="flex flex-col justify-center items-center md:items-end md:w-1/3 font-mono text-xs space-y-3">
            <div className="flex items-center gap-4 sm:gap-6 text-slate-400">
              <Link
                href="/leaderboard"
                className="hover:text-[#3B82F6] transition-colors duration-150 font-bold uppercase tracking-wider relative group"
              >
                LEADERBOARD
                <span className="absolute bottom-[-3px] left-0 right-0 h-[1px] bg-[#3B82F6] scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
              </Link>
              <span className="text-slate-600 font-bold select-none">•</span>
              <Link
                href="/history"
                className="hover:text-[#3B82F6] transition-colors duration-150 font-bold uppercase tracking-wider relative group"
              >
                HISTORY
                <span className="absolute bottom-[-3px] left-0 right-0 h-[1px] bg-[#3B82F6] scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
              </Link>
              <span className="text-slate-600 font-bold select-none">•</span>
              <a
                href="https://github.com/ahmad-461/typing-speed-test"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#3B82F6] transition-colors duration-150 font-bold uppercase tracking-wider relative group inline-flex items-center gap-1"
              >
                GITHUB
                <span className="absolute bottom-[-3px] left-0 right-0 h-[1px] bg-[#3B82F6] scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
              </a>
            </div>

            <p className="text-[10px] text-slate-500 text-center md:text-right font-mono">
              © {new Date().getFullYear()} NOKY INDUSTRIES. ALL RIGHT PATTERNS RESERVED.
            </p>
          </div>

        </div>

      </div>
    </footer>
  );
}
