"use client";

import { useEffect, useState } from "react";

const TIPS = [
  "Tip: Switch difficulty to unlock new leaderboard categories",
  "Tip: Revert errors with Backspace",
  "Tip: Practice consistently to build muscle memory",
  "Tip: Take a deep breath and maintain a steady rhythm",
  "Tip: Try Ghost Race mode to beat your personal best"
];

export default function Footer() {
  const [tipIndex, setTipIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Start fade out
      setFade(false);

      // Change tip and fade in after animation completes
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % TIPS.length);
        setFade(true);
      }, 200); // matches transition duration
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-charcoal-900 border-t border-charcoal-800">
      {/* Subtle top indicator - thin electric line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-charcoal-800 via-electric-500/50 to-charcoal-800 animate-pulse" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 py-2">

        {/* Key-cap styled Github link */}
        <div className="flex items-center">
          <a
            href="https://github.com/ahmad-461/typing-speed-test"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono text-slate-400 hover:text-white bg-charcoal-800 hover:bg-charcoal-700/80 rounded border-b-2 border border-charcoal-700 hover:border-electric-500/50 active:border-b transition-all shadow-md cursor-pointer select-none"
            title="GitHub Repository"
          >
            <span className="font-semibold text-electric-400">GH</span>
            <span className="w-1 h-1 rounded-full bg-charcoal-600 group-hover:bg-electric-500 transition-colors" />
            <span className="text-slate-500 group-hover:text-slate-300">repo</span>
          </a>
        </div>

        {/* Short rotating tips/hints with CSS fade effect */}
        <div className="flex-grow flex justify-center max-w-lg overflow-hidden px-2">
          <span
            className={`font-mono text-[10px] sm:text-xs text-slate-500 text-center select-none truncate transition-opacity duration-200 ${
              fade ? "opacity-100" : "opacity-0"
            }`}
          >
            {TIPS[tipIndex]}
          </span>
        </div>

        {/* Small version tag */}
        <div className="flex items-center">
          <span className="font-mono text-[10px] text-slate-600 select-none">
            SYS STATUS: <span className="text-emerald-500 font-bold">ONLINE</span> [v1.5]
          </span>
        </div>

      </div>
    </footer>
  );
}
