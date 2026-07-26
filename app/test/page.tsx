"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";

function TestScreenContent() {
  const searchParams = useSearchParams();
  const rawDifficulty = searchParams.get("difficulty") || "medium";
  const difficulty = (["easy", "medium", "hard"].includes(rawDifficulty) ? rawDifficulty : "medium") as "easy" | "medium" | "hard";

  const [isActive, setIsActive] = useState(false);

  // Hardcoded dummy passages (~60 words each) tailored to selected difficulty
  const passages = {
    easy: "The beautiful blue bird sat on a tall green tree branch. It sang a happy little song in the warm morning sun. Many children stopped to watch it as they walked to school. It was a lovely day to be outside and enjoy the fresh summer air. Small things like this can make everyone smile.",
    medium: "Learning to code represents a profound journey of discovery and constant problem solving. Writing high quality code requires patience, focus, and a willingness to learn from your mistakes. Every error message is not a setback, but rather a guidepost pointing towards a better solution. Practice daily and watch your professional development flourish rapidly over time.",
    hard: "Implementing critical concurrent algorithms requires synchronization primitives to carefully avoid complex race conditions. Developers must thoroughly analyze memory structures, operational complexities, and potential deadlocks when writing highly distributed microservices. Optimization, although vital, must not precede clarity in software architecture; asynchronous interfaces demand rigorous telemetry and debugging protocols.",
  };

  const selectedPassage = passages[difficulty];

  // Helper to split text into characters so we can render the first character with a blinking cursor
  const firstChar = selectedPassage[0] || "";
  const remainingText = selectedPassage.slice(1);

  return (
    <main className="flex-grow flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      {/* Top Meta info */}
      <div className="w-full flex items-center justify-between mb-8 pb-4 border-b border-charcoal-700/60">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-mono text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal-800 border border-charcoal-700"
          >
            ← Back
          </Link>
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Difficulty:{" "}
            <span
              className={`font-bold ${
                difficulty === "easy"
                  ? "text-emerald-400"
                  : difficulty === "medium"
                  ? "text-electric-400"
                  : "text-rose-400"
              }`}
            >
              {difficulty}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-mono text-slate-400">Live Connection Secured</span>
        </div>
      </div>

      {/* Stats Panel (Placeholder) */}
      <div className="grid grid-cols-3 gap-4 w-full mb-8">
        {[
          { label: "TIMER", value: "01:00", unit: "s", icon: "⏱️" },
          { label: "WPM", value: "0", unit: "wpm", icon: "⚡" },
          { label: "ACCURACY", value: "100", unit: "%", icon: "🎯" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-4 sm:p-5 text-center flex flex-col justify-center items-center relative overflow-hidden group"
          >
            <div className="absolute top-2 right-2 text-xs opacity-20 group-hover:opacity-40 transition-opacity">
              {stat.icon}
            </div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              {stat.label}
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono leading-none">
              {stat.value}
              <span className="text-xs font-normal text-slate-500 ml-0.5">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Terminal Typing Block */}
      <div className="w-full mb-8">
        <div className="text-xs text-slate-400 font-mono mb-2 flex justify-between items-center px-1">
          <span>⌨️ PROMPT TERMINAL</span>
          <span>{isActive ? "🔴 READY TO TYPE" : "⏸️ CLICK BOX TO ACTIVATE"}</span>
        </div>

        <button
          onClick={() => setIsActive(true)}
          onFocus={() => setIsActive(true)}
          onBlur={() => setIsActive(false)}
          className={`w-full text-left bg-charcoal-800 border-2 rounded-2xl p-6 sm:p-8 font-mono text-lg sm:text-xl leading-relaxed transition-all duration-300 outline-none select-none relative overflow-hidden cursor-pointer ${
            isActive
              ? "border-electric-500 shadow-lg shadow-electric-500/10 ring-2 ring-electric-500/10"
              : "border-charcoal-700 hover:border-charcoal-600 hover:bg-charcoal-800/80"
          }`}
        >
          {/* Subtle glowing active accent inside terminal */}
          {isActive && (
            <div className="absolute inset-0 bg-gradient-to-br from-electric-500/5 to-transparent pointer-events-none" />
          )}

          <div className="relative text-slate-300 font-mono tracking-wide selection:bg-transparent">
            {/* Blinking cursor at the start position */}
            <span className="relative">
              {firstChar}
              <span
                className={`absolute left-0 bottom-0 top-0 w-[2px] bg-electric-400 ${
                  isActive ? "animate-blink" : "opacity-40"
                }`}
              />
            </span>
            {remainingText}
          </div>

          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-charcoal-900/60 backdrop-blur-[1px] transition-all duration-200">
              <span className="bg-charcoal-800 border border-charcoal-700 text-electric-400 font-mono text-sm px-4 py-2.5 rounded-lg shadow-xl font-bold animate-pulse">
                Click here to start typing
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Control Actions */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 bg-charcoal-800/40 border border-charcoal-700/60 rounded-xl p-4 font-mono text-xs">
        <div className="text-slate-400 text-center sm:text-left leading-normal">
          💡 <span className="text-slate-300 font-semibold">Tip:</span> Simply start typing on your physical keyboard. Phase 1 represents layout setup.
        </div>
        <Link
          href={`/results?difficulty=${difficulty}&wpm=82&accuracy=97&time=45`}
          className="w-full sm:w-auto text-center px-6 py-3 bg-charcoal-700 hover:bg-charcoal-600 hover:text-white text-slate-300 font-bold rounded-lg border border-charcoal-600 transition-colors duration-200 uppercase tracking-wider text-[11px]"
        >
          Simulate Results Screen →
        </Link>
      </div>
    </main>
  );
}

export default function TestPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-electric-500"></div>
      </div>
    }>
      <TestScreenContent />
    </Suspense>
  );
}
