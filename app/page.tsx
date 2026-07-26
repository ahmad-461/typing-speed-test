"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPersonalBest } from "../lib/stats";

type Difficulty = "easy" | "medium" | "hard" | "custom";

export default function Home() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [hasPB, setHasPB] = useState(false);
  const [ghostEnabled, setGhostEnabled] = useState(false);
  const [pbWPM, setPbWPM] = useState<number | null>(null);

  // Custom passage modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customText, setCustomText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    // Ghost Mode is only applicable for easy, medium, hard
    if (difficulty === "custom") {
      setHasPB(false);
      setPbWPM(null);
      setGhostEnabled(false);
    } else {
      const pb = getPersonalBest(difficulty);
      setHasPB(!!pb);
      setPbWPM(pb ? pb.wpm : null);
      if (!pb) {
        setGhostEnabled(false);
      }
    }
  }, [difficulty]);

  // Handle escape key to close custom modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

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
      colors: "border-electric-500/30 text-electric-400 bg-electric-500/5 hover:bg-electric-500/10 hover:border-electric-500/50",
    },
    {
      value: "hard",
      label: "Hard",
      desc: "Complex sentence structure, technical jargon, high punctuation.",
      colors: "border-rose-500/30 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/50",
    },
    {
      value: "custom",
      label: "Custom",
      desc: "Paste or write your own text to type. Completely control your test content.",
      colors: "border-sky-500/30 text-sky-400 bg-sky-500/5 hover:bg-sky-500/10 hover:border-sky-500/50",
    },
  ];

  const getWordCount = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  };

  const handleStartTest = () => {
    if (difficulty === "custom") {
      setIsModalOpen(true);
    } else {
      router.push(`/test?difficulty=${difficulty}${ghostEnabled ? "&ghost=true" : ""}`);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    let sanitized = customText.trim();
    // Collapse excessive whitespace/line breaks/tabs into a single space
    sanitized = sanitized.replace(/[\s\r\n\t]+/g, " ");

    if (!sanitized) {
      setValidationError("Text cannot be empty. Please paste or enter your paragraph.");
      return;
    }

    const wordCount = getWordCount(sanitized);

    if (wordCount < 20) {
      setValidationError(`Text is too short (${wordCount} words). Please enter at least 20 words.`);
      return;
    }

    if (wordCount > 300) {
      setValidationError(`Text is too long (${wordCount} words). Please keep it under 300 words.`);
      return;
    }

    // Save to sessionStorage
    sessionStorage.setItem("custom_passage", sanitized);
    setIsModalOpen(false);

    // Route to /test?difficulty=custom
    router.push(`/test?difficulty=custom`);
  };

  const currentWordCount = getWordCount(customText);

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
            <p className="text-sm text-slate-400">Choose a level that matches your typing proficiency, or supply your own text.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {difficulties.map((item) => {
              const isSelected = difficulty === item.value;
              let activeStyles = "";
              if (isSelected) {
                if (item.value === "easy") activeStyles = "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20 shadow-[0_0_10px_1px_rgba(16,185,129,0.2)]";
                else if (item.value === "medium") activeStyles = "border-electric-500 bg-electric-500/10 ring-2 ring-electric-500/20 shadow-[0_0_10px_1px_rgba(59,130,246,0.2)]";
                else if (item.value === "hard") activeStyles = "border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/20 shadow-[0_0_10px_1px_rgba(244,63,94,0.2)]";
                else activeStyles = "border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/20 shadow-[0_0_10px_1px_rgba(14,165,233,0.2)]";
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
                    <span className={`font-mono text-xs uppercase tracking-wider font-bold ${
                      item.value === "easy" ? "text-emerald-400" : item.value === "medium" ? "text-electric-400" : item.value === "hard" ? "text-rose-400" : "text-sky-400"
                    }`}>
                      {item.label}
                    </span>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? (item.value === "easy" ? "border-emerald-500" : item.value === "medium" ? "border-electric-500" : item.value === "hard" ? "border-rose-500" : "border-sky-500")
                        : "border-slate-600"
                    }`}>
                      {isSelected && (
                        <div className={`w-2 h-2 rounded-full ${
                          item.value === "easy" ? "bg-emerald-500" : item.value === "medium" ? "bg-electric-500" : item.value === "hard" ? "bg-rose-500" : "bg-sky-500"
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
          {hasPB && difficulty !== "custom" && (
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
            <button
              onClick={handleStartTest}
              className="w-full sm:w-auto text-center px-8 py-3.5 bg-electric-500 text-white font-semibold rounded-xl shadow-lg shadow-electric-500/15 hover:bg-electric-400 active:bg-electric-600 focus:outline-none focus:ring-2 focus:ring-electric-500 focus:ring-offset-2 focus:ring-offset-charcoal-800 transition-all duration-200 hover-glow-electric cursor-pointer text-sm"
            >
              Start Test
            </button>
          </div>
        </div>
      </main>

      {/* Terminal-themed Modal for Custom Paragraph Mode */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Modal Backdrop */}
          <div
            className="absolute inset-0 bg-[#0E0F11]/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="bg-charcoal-800 border-2 border-[#1E293B] rounded-2xl w-full max-w-xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 animate-fade-in shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <div className="flex items-center justify-between border-b border-charcoal-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sky-400 text-sm font-bold font-mono">&gt;_</span>
                <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                  CUSTOM RUN INITIALIZER
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors font-mono text-xs cursor-pointer"
              >
                [ CLOSE ]
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="custom-passage" className="block text-xs font-mono text-slate-400 uppercase tracking-wide">
                  Paste or Write Custom Paragraph:
                </label>
                <textarea
                  id="custom-passage"
                  rows={6}
                  value={customText}
                  onChange={(e) => {
                    setCustomText(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="The quick brown fox jumps over the lazy dog... Enter your text here. It must contain at least 20 words and no more than 300 words to start a standard timed run."
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl p-4 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 transition-all resize-none"
                  autoFocus
                />
              </div>

              {/* Word counter and validation */}
              <div className="flex items-center justify-between font-mono text-xs">
                <span className={`font-semibold ${
                  currentWordCount < 20 || currentWordCount > 300
                    ? "text-slate-500"
                    : "text-emerald-400"
                }`}>
                  {currentWordCount} / 300 words
                </span>
                <span className="text-slate-500 uppercase tracking-widest text-[10px]">
                  {currentWordCount < 20 ? "Min 20 required" : currentWordCount > 300 ? "Max 300 allowed" : "Ready to run ✓"}
                </span>
              </div>

              {validationError && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs font-mono text-rose-400 animate-fade-in">
                  ⚠️ {validationError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-charcoal-700 hover:bg-charcoal-600 text-slate-300 font-mono text-xs uppercase tracking-wider rounded-lg border border-charcoal-600 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={currentWordCount < 20 || currentWordCount > 300}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-charcoal-700 disabled:border-charcoal-600 disabled:text-slate-500 border border-sky-500 text-white font-mono text-xs uppercase tracking-wider rounded-lg transition-all shadow-md shadow-sky-500/10 hover-glow-sky cursor-pointer disabled:cursor-not-allowed"
                >
                  Initialize Run ⚡
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
