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
    <footer className="w-full bg-[#0E0F11] border-t border-[#1E293B] py-5 select-none text-[13px] sm:text-[14px]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Left: GitHub Link */}
        <div className="flex items-center justify-center md:justify-start md:w-1/4">
          <a
            href="https://github.com/ahmad-461/typing-speed-test"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-[#3B82F6] transition-colors duration-150 font-medium select-none"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            <span className="font-mono text-xs sm:text-[13px] uppercase tracking-wider font-bold">GitHub</span>
          </a>
        </div>

        {/* Center: Rotating Tips */}
        <div className="flex-1 max-w-lg text-center px-4 py-1 flex items-center justify-center min-h-[40px] md:w-2/4">
          <div className={`transition-opacity duration-300 ${
            fade ? "opacity-100" : "opacity-0"
          }`}>
            <span className="text-[#3B82F6] font-bold uppercase tracking-wider mr-2 text-[11px] sm:text-xs">TIP:</span>
            <span className="text-[#94A3B8] font-medium leading-relaxed font-mono text-xs sm:text-[13px]">{TIPS[tipIndex]}</span>
          </div>
        </div>

        {/* Right: Version Tag */}
        <div className="flex items-center justify-center md:justify-end md:w-1/4">
          <div className="flex items-center text-[#475569] font-mono text-[11px] sm:text-xs tracking-wider select-none">
            <span>v1.6</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
