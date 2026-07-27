"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPlayerName } from "../lib/stats";

interface CustomWindow extends Window {
  scrollToConfig?: () => void;
}

export default function Footer() {
  const pathname = usePathname();
  const [playerName, setPlayerName] = useState("");
  const [isTypingActive, setIsTypingActive] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const clicksRef = useRef(0);

  // Synchronize player name
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

  // Synchronize active typing state from /test page
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

  // Synchronize simulated time logs
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
    <footer className="w-full bg-[#0E0F11] border-t border-[#3B82F6]/20 pt-8 pb-10 select-none font-mono">
      {/* Soft electric-blue top border glow strip */}
      <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#3B82F6]/50 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* SIMULATED SYSTEM CONSOLE WINDOW */}
        <div className="w-full bg-[#090A0C] border-2 border-[#1E293B] rounded-2xl overflow-hidden shadow-[0_4px_30px_rgba(59,130,246,0.06)]">

          {/* TERMINAL HEADER / CHROME BAR */}
          <div className="bg-[#121316] px-4 py-3 border-b border-[#1E293B] flex items-center justify-between text-xs">
            {/* Colored Mac window control dots */}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
              <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
              <span className="w-3 h-3 rounded-full bg-[#10B981]" />
            </div>

            {/* Simulated Title */}
            <div className="text-slate-400 font-bold tracking-wider text-[10px] sm:text-[11px] flex items-center gap-2">
              <span>noky_telemetry_feed.sh</span>
              <span className="hidden sm:inline text-slate-600">|</span>
              <span className="hidden sm:inline text-[#3B82F6] font-bold uppercase text-[9px] tracking-widest">
                STREAM ACTIVE
              </span>
            </div>

            {/* Connection Telemetry status badge */}
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isTypingActive ? "bg-[#F59E0B] animate-pulse" : "bg-[#10B981] animate-ping"}`} />
              <span className={`font-bold text-[9px] sm:text-[10px] uppercase ${isTypingActive ? "text-[#F59E0B]" : "text-[#10B981]"}`}>
                {isTypingActive ? "FOCUS ENGAGED" : "SYSTEM ONLINE"}
              </span>
            </div>
          </div>

          {/* TERMINAL BODY / SYSTEM LOGS */}
          <div className="p-4 sm:p-6 space-y-4 text-slate-300 text-xs sm:text-[13px] leading-relaxed relative">

            {/* Subtle scanline CRT overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.015]"
              style={{
                backgroundImage: "linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)",
                backgroundSize: "24px 24px"
              }}
            />

            {/* Log Stream Section */}
            <div className="space-y-1.5 border-b border-[#1E293B]/60 pb-4">
              <div className="flex items-start gap-2 text-[#64748B]">
                <span className="text-slate-500 font-bold">[{currentTime || "00:00:00"}]</span>
                <span className="text-[#3B82F6] font-bold">[SYS]</span>
                <span className="text-slate-400 font-sans">NOKY terminal core v1.6 initiated successfully. Standby active.</span>
              </div>

              {playerName ? (
                <div className="flex items-start gap-2 text-[#64748B] animate-fade-in">
                  <span className="text-slate-500 font-bold">[{currentTime || "00:00:00"}]</span>
                  <span className="text-[#3B82F6] font-bold">[AUTH]</span>
                  <span className="text-slate-400 font-sans">
                    Operator callsign active: <strong className="text-white font-mono normal-case">{playerName}</strong>.
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-[#64748B]">
                  <span className="text-slate-500 font-bold">[{currentTime || "00:00:00"}]</span>
                  <span className="text-[#EF4444] font-bold">[WARN]</span>
                  <span className="text-rose-400/90 font-sans">Operator callsign unassigned. Gate intercept active.</span>
                </div>
              )}

              <div className="flex items-start gap-2 text-[#64748B]">
                <span className="text-slate-500 font-bold">[{currentTime || "00:00:00"}]</span>
                <span className="text-[#10B981] font-bold">[NET]</span>
                <span className="text-slate-400 font-sans">
                  Secure GitHub mirror linked at:{" "}
                  <a
                    href="https://github.com/ahmad-461/typing-speed-test"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3B82F6] hover:underline hover:text-white transition-colors font-mono font-bold"
                  >
                    github.com/ahmad-461/typing-speed-test
                  </a>
                </span>
              </div>

              {/* Secret override easter egg log */}
              {showSecret && (
                <div className="flex items-start gap-2 text-[#F43F5E] animate-bounce">
                  <span className="text-slate-500 font-bold">[{currentTime || "00:00:00"}]</span>
                  <span className="text-[#F43F5E] font-bold">[SEC]</span>
                  <span className="text-rose-300 font-mono tracking-widest font-extrabold uppercase">
                    &gt;_ OVERCLOCK INITIATED. TERMINAL REACTION BUFFER DECREASED TO 0ms.
                  </span>
                </div>
              )}

              {/* Subdued log during active focus */}
              {isTypingActive && (
                <div className="flex items-start gap-2 text-[#F59E0B] animate-pulse">
                  <span className="text-slate-500 font-bold">[{currentTime || "00:00:00"}]</span>
                  <span className="text-[#F59E0B] font-bold">[FOCUS]</span>
                  <span className="text-amber-300 font-sans">Active typing test detected. Layout inputs intercepted.</span>
                </div>
              )}
            </div>

            {/* SYSTEM COMMAND LINE ACTION DIRECTORY (Navigation) */}
            <div className="pt-1">
              <span className="text-slate-500 font-bold uppercase text-[9px] tracking-widest block mb-2.5">
                {"// REGISTERED TELEMETRY COMMANDS"}
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* CMD 1: Leaderboard */}
                <Link
                  href="/leaderboard"
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-[#121316] border border-[#1E293B] hover:border-[#3B82F6]/50 hover:bg-[#3B82F6]/5 transition-all text-slate-300 hover:text-white group"
                >
                  <span className="text-[#3B82F6] font-bold">[CMD]</span>
                  <div className="text-[11px] sm:text-xs">
                    <span className="font-bold block tracking-wider">run standings.cfg</span>
                    <span className="text-[9px] text-slate-500 group-hover:text-slate-400 font-sans">View global leaderboards</span>
                  </div>
                </Link>

                {/* CMD 2: History */}
                <Link
                  href="/history"
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-[#121316] border border-[#1E293B] hover:border-[#3B82F6]/50 hover:bg-[#3B82F6]/5 transition-all text-slate-300 hover:text-white group"
                >
                  <span className="text-[#3B82F6] font-bold">[CMD]</span>
                  <div className="text-[11px] sm:text-xs">
                    <span className="font-bold block tracking-wider">view player_logs.log</span>
                    <span className="text-[9px] text-slate-500 group-hover:text-slate-400 font-sans">Retrieve typing statistics</span>
                  </div>
                </Link>

                {/* CMD 3: Version Info */}
                <button
                  onClick={handleVersionClick}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-[#121316] border border-[#1E293B] hover:border-[#3B82F6]/50 hover:bg-[#3B82F6]/5 transition-all text-slate-300 hover:text-white group text-left cursor-pointer"
                >
                  <span className="text-[#3B82F6] font-bold">[CMD]</span>
                  <div className="text-[11px] sm:text-xs">
                    <span className="font-bold block tracking-wider">info sys_version.txt</span>
                    <span className="text-[9px] text-slate-500 group-hover:text-slate-400 font-sans">
                      Active: v1.6 (Build compiled)
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* INTERACTIVE FLASHING PROMPT EXECUTION BLOCK (CTA) */}
            <div className="pt-3">
              {isTypingActive ? (
                /* Subdued typing indicator in CLI */
                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.02] text-[#F59E0B] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="animate-pulse">●</span>
                    <span>PROMPT LOCKED: EXECUTING TYPING_TEST_STREAM.sh</span>
                  </div>
                  <span className="hidden sm:inline text-[9px] text-[#F59E0B]/60 font-bold uppercase">
                    Interference Shield Enabled
                  </span>
                </div>
              ) : (
                /* Big bold interactive flashing prompt execution CTA block */
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">
                    {"// INITIALIZE TEST INTERACTION"}
                  </div>
                  {pathname === "/" ? (
                    <button
                      onClick={handleCtaClick}
                      className="w-full text-left p-4 rounded-xl bg-charcoal-900 border-2 border-[#1E293B] hover:border-[#3B82F6] hover:bg-[#3B82F6]/5 transition-all duration-300 cursor-pointer shadow-inner relative overflow-hidden group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 text-white">
                        <span className="text-[#3B82F6] font-bold font-mono">guest@noky_terminal:~$</span>
                        <span className="font-extrabold text-[#3B82F6] group-hover:text-white font-mono tracking-wider">
                          ./scroll_to_config.exe
                        </span>
                        <span className="w-1.5 h-3.5 bg-[#3B82F6] group-hover:bg-white animate-blink" />
                      </div>
                      <span className="text-[10px] text-[#3B82F6] group-hover:text-white font-bold tracking-widest uppercase">
                        [ EXECUTE PROTOCOL ]
                      </span>
                    </button>
                  ) : (
                    <Link
                      href="/"
                      className="w-full text-left p-4 rounded-xl bg-charcoal-900 border-2 border-[#1E293B] hover:border-[#3B82F6] hover:bg-[#3B82F6]/5 transition-all duration-300 cursor-pointer shadow-inner relative overflow-hidden group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 block"
                    >
                      <div className="flex items-center gap-2.5 text-white">
                        <span className="text-[#3B82F6] font-bold font-mono">guest@noky_terminal:~$</span>
                        <span className="font-extrabold text-[#3B82F6] group-hover:text-white font-mono tracking-wider">
                          ./launch_typing_test.sh
                        </span>
                        <span className="w-1.5 h-3.5 bg-[#3B82F6] group-hover:bg-white animate-blink" />
                      </div>
                      <span className="text-[10px] text-[#3B82F6] group-hover:text-white font-bold tracking-widest uppercase">
                        [ EXECUTE PROTOCOL ]
                      </span>
                    </Link>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* SIMULATED WINDOW TELEMETRY FOOTER PANEL */}
          <div className="bg-[#121316] px-4 py-3 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-[11px] text-slate-500 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-white font-black tracking-widest text-xs">NOKY</span>
              <span className="text-[9px] text-slate-600 tracking-[0.1em] uppercase">
                TYPE FASTER. THINK SHARPER.
              </span>
            </div>
            <div>
              © {new Date().getFullYear()} NOKY INDUSTRIES. ALL SYSTEM PATTERNS OPERATIONAL.
            </div>
          </div>

        </div>

      </div>
    </footer>
  );
}
