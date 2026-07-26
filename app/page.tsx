"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getPersonalBest } from "../lib/stats";

type Difficulty = "easy" | "medium" | "hard";

export default function Home() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [hasPB, setHasPB] = useState(false);
  const [ghostEnabled, setGhostEnabled] = useState(false);
  const [pbWPM, setPbWPM] = useState<number | null>(null);

  useEffect(() => {
    const pb = getPersonalBest(difficulty);
    setHasPB(!!pb);
    setPbWPM(pb ? pb.wpm : null);
    if (!pb) {
      setGhostEnabled(false);
    }
  }, [difficulty]);

  const difficulties: { value: Difficulty; label: string; desc: string; colors: string }[] = [
    {
      value: "easy",
      label: "Easy",
      desc: "Short sentences, straightforward vocabulary, warm-up pace.",
      colors: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50",
    },
    {
      value: "medium",
      label: "Medium",
      desc: "Standard narrative prose, moderate punctuation and speed.",
      colors: "border-electric-500/30 text-electric-400 bg-electric-500/5 hover:bg-emerald-500/10 hover:border-electric-500/50",
    },
    {
      value: "hard",
      label: "Hard",
      desc: "Complex sentence structure, technical jargon, high punctuation.",
      colors: "border-rose-500/30 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/50",
    },
  ];

  return (
    <div className="flex-grow flex flex-col w-full max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <main className="flex-grow flex flex-col items-center justify-center w-full">
        {/* Header Section */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-charcoal-700 bg-charcoal-800 text-xs font-mono text-slate-400 tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-electric-500 animate-pulse"></span>
            Phase 4 Integrated
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-none">
            Typing <span className="text-electric-500 bg-gradient-to-r from-electric-400 to-electric-600 bg-clip-text text-transparent">Speed</span> Test
          </h1>

          <p className="text-lg text-slate-400 max-w-xl mx-auto font-sans leading-relaxed">
            Benchmark your keyboard accuracy and words-per-minute with a beautiful, editorial terminal designed to evaluate typing precision under pressure.
          </p>
        </div>

        {/* Difficulty Card Selector */}
        <div className="w-full bg-charcoal-800 border border-charcoal-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">Select Difficulty</h2>
            <p className="text-sm text-slate-400">Choose a level that matches your typing proficiency.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {difficulties.map((item) => {
              const isSelected = difficulty === item.value;
              let activeStyles = "";
              if (isSelected) {
                if (item.value === "easy") activeStyles = "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20 shadow-[0_0_10px_1px_rgba(16,185,129,0.2)]";
                else if (item.value === "medium") activeStyles = "border-electric-500 bg-electric-500/10 ring-2 ring-electric-500/20 shadow-[0_0_10px_1px_rgba(59,130,246,0.2)]";
                else activeStyles = "border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/20 shadow-[0_0_10px_1px_rgba(244,63,94,0.2)]";
              }

              return (
                <button
                  key={item.value}
                  onClick={() => setDifficulty(item.value)}
                  className={`flex flex-col text-left p-5 rounded-xl border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 ${
                    isSelected
                      ? activeStyles
                      : "border-charcoal-700 bg-charcoal-900/40 text-slate-300 hover:border-charcoal-600 hover:bg-charcoal-900/60 focus:ring-charcoal-600 focus:border-charcoal-600"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className={`font-mono text-sm uppercase tracking-wider font-bold ${
                      item.value === "easy" ? "text-emerald-400" : item.value === "medium" ? "text-electric-400" : "text-rose-400"
                    }`}>
                      {item.label}
                    </span>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? (item.value === "easy" ? "border-emerald-500" : item.value === "medium" ? "border-electric-500" : "border-rose-500")
                        : "border-slate-600"
                    }`}>
                      {isSelected && (
                        <div className={`w-2 h-2 rounded-full ${
                          item.value === "easy" ? "bg-emerald-500" : item.value === "medium" ? "bg-electric-500" : "bg-rose-500"
                        }`} />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">{item.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Ghost Race Mode Toggle */}
          {hasPB && (
            <div className="bg-charcoal-900/40 border border-charcoal-700 rounded-xl p-4 flex items-center justify-between animate-fade-in">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    👻 Ghost Race Mode
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                    ghostEnabled
                      ? "bg-electric-500/20 text-electric-400 border border-electric-500/30"
                      : "bg-charcoal-700 text-slate-400 border border-charcoal-600"
                  }`}>
                    {ghostEnabled ? "Active" : "Disabled"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-normal font-sans">
                  Race against your personal best run of <span className="text-electric-400 font-mono font-semibold">{pbWPM} WPM</span> on this difficulty.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGhostEnabled(!ghostEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-electric-500 ${
                  ghostEnabled ? "bg-electric-500" : "bg-charcoal-750 bg-charcoal-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    ghostEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}

          {/* Start Test Button */}
          <div className="pt-4 border-t border-charcoal-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span className="text-electric-500">⚡</span> Supports instant keyboard focus activation
            </div>
            <Link
              href={`/test?difficulty=${difficulty}${ghostEnabled ? "&ghost=true" : ""}`}
              className="w-full sm:w-auto text-center px-8 py-3.5 bg-electric-500 text-white font-semibold rounded-xl shadow-lg shadow-electric-500/15 hover:bg-electric-400 active:bg-electric-600 focus:outline-none focus:ring-2 focus:ring-electric-500 focus:ring-offset-2 focus:ring-offset-charcoal-800 transition-all duration-200 hover-glow-electric"
            >
              Start Test
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
