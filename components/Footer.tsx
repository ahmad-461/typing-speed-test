"use client";

import { useState, useEffect } from "react";

const TIPS = [
  "Focus on accuracy over speed — speed naturally follows precision.",
  "Keep your wrists slightly elevated to minimize strain and speed up key reach.",
  "Race your virtual Ghost to beat your overall difficulty personal best.",
  "Tapping the ESC or Reset key is the fastest way to roll a fresh AI passage.",
  "Look one or two words ahead of your active cursor to build rhythmic typing flow."
];

export default function Footer() {
  const [tipIndex, setTipIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % TIPS.length);
        setFade(true);
      }, 300); // Wait for fade out to finish before changing text
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="w-full bg-charcoal-900 border-t border-charcoal-800 text-[10px] sm:text-xs font-mono text-slate-500 py-3 select-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">

        {/* Left: Keycap Github Link */}
        <div className="flex items-center">
          <a
            href="https://github.com/ahmad-461/typing-speed-test"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-charcoal-800 border-t border-l border-charcoal-700 border-b-2 border-r-2 border-charcoal-950 text-[10px] text-slate-400 hover:text-white hover:bg-charcoal-750 transition-all duration-150 active:border-b active:border-r active:border-t-2 active:border-l-2 shadow-sm font-bold uppercase tracking-wider"
          >
            <span>⌨️</span>
            <span>GITHUB</span>
          </a>
        </div>

        {/* Center: Rotating Tips */}
        <div className="flex-1 max-w-lg text-center px-4 overflow-hidden py-1">
          <div className={`transition-all duration-300 transform ${
            fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}>
            <span className="text-electric-500 font-bold uppercase tracking-widest mr-1.5">[TIP]:</span>
            <span className="text-slate-400 font-medium leading-relaxed">{TIPS[tipIndex]}</span>
          </div>
        </div>

        {/* Right: Version Tag */}
        <div className="flex items-center text-slate-500 font-bold uppercase tracking-widest gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-electric-500/50" />
          <span>v1.6</span>
        </div>

      </div>
    </footer>
  );
}
