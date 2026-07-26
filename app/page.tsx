"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getPersonalBest } from "../lib/stats";

type Difficulty = "easy" | "medium" | "hard";
type Category = "programming" | "general_knowledge" | "custom";

const SNIPPETS = [
  "A compiler translates human-readable code into efficient machine language instructions.",
  "The light emitted from the sun takes approximately eight minutes to reach the Earth.",
  "Write with complete absolute freedom. Your custom paragraph, your test, your speed."
];

interface CustomWindow extends Window {
  scrollToConfig?: () => void;
}

export default function Home() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [category, setCategory] = useState<Category>("programming");
  const [hasPB, setHasPB] = useState(false);
  const [ghostEnabled, setGhostEnabled] = useState(false);
  const [pbWPM, setPbWPM] = useState<number | null>(null);

  // Custom text ("As You Wish") state
  const [customText, setCustomText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Live typing animation state for right column
  const [typedSnippet, setTypedSnippet] = useState("");
  const [snippetIndex, setSnippetIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reference to the main options area for the footer CTA scroll behavior
  const configSectionRef = useRef<HTMLDivElement>(null);

  // PB check when difficulty changes
  useEffect(() => {
    const pb = getPersonalBest(difficulty);
    setHasPB(!!pb);
    setPbWPM(pb ? pb.wpm : null);
    if (!pb) {
      setGhostEnabled(false);
    }
  }, [difficulty]);

  // Typing animation effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const currentPhrase = SNIPPETS[snippetIndex];

    if (isDeleting) {
      timer = setTimeout(() => {
        setTypedSnippet((prev) => prev.slice(0, -1));
      }, 30);
    } else {
      timer = setTimeout(() => {
        setTypedSnippet((prev) => currentPhrase.slice(0, prev.length + 1));
      }, 50);
    }

    if (!isDeleting && typedSnippet === currentPhrase) {
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 2500); // Wait before backspacing
    } else if (isDeleting && typedSnippet === "") {
      setIsDeleting(false);
      setSnippetIndex((prev) => (prev + 1) % SNIPPETS.length);
    }

    return () => clearTimeout(timer);
  }, [typedSnippet, isDeleting, snippetIndex]);

  // Setup click target for footer scroll-to-element
  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as unknown as CustomWindow;
      // Expose a global callback or trigger that the footer can execute
      win.scrollToConfig = () => {
        if (configSectionRef.current) {
          configSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
          // Highlight with a quick flash effect
          configSectionRef.current.classList.add("ring-2", "ring-electric-500/30");
          setTimeout(() => {
            configSectionRef.current?.classList.remove("ring-2", "ring-electric-500/30");
          }, 1000);
        }
      };
    }
    return () => {
      if (typeof window !== "undefined") {
        const win = window as unknown as CustomWindow;
        delete win.scrollToConfig;
      }
    };
  }, []);

  const getWordCount = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  };

  // Get dynamic limits depending on difficulty
  const getLimits = (diff: Difficulty) => {
    if (diff === "easy") return { min: 20, max: 50 };
    if (diff === "hard") return { min: 80, max: 300 };
    return { min: 40, max: 100 }; // medium
  };

  const { min: minWords, max: maxWords } = getLimits(difficulty);
  const currentWordCount = getWordCount(customText);

  const handleStartTest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError(null);

    if (category === "custom") {
      let sanitized = customText.trim();
      // Collapse excessive whitespace/line breaks/tabs into a single space
      sanitized = sanitized.replace(/[\s\r\n\t]+/g, " ");

      if (!sanitized) {
        setValidationError("Passage cannot be empty. Please enter your text below.");
        return;
      }

      const wordCount = getWordCount(sanitized);

      if (wordCount < minWords) {
        setValidationError(`Text is too short (${wordCount} words). Please enter at least ${minWords} words.`);
        return;
      }

      if (wordCount > maxWords) {
        setValidationError(`Text is too long (${wordCount} words). Please limit to ${maxWords} words.`);
        return;
      }

      sessionStorage.setItem("custom_passage", sanitized);
      router.push(`/test?difficulty=${difficulty}&category=custom&ghost=false`);
    } else {
      router.push(`/test?difficulty=${difficulty}&category=${category}${ghostEnabled ? "&ghost=true" : ""}`);
    }
  };

  // Difficulty configurations with varying borders/glows representing progression
  const difficulties: { value: Difficulty; label: string; desc: string; styles: string; activeStyles: string }[] = [
    {
      value: "easy",
      label: "Easy Tier",
      desc: "~30 words. Clean vocabulary, basic punctuation.",
      styles: "border-emerald-500/10 hover:border-emerald-500/40 text-emerald-400 bg-charcoal-900/40",
      activeStyles: "border-emerald-500 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20",
    },
    {
      value: "medium",
      label: "Medium Tier",
      desc: "~60 words. Balanced prose, narrative sentences.",
      styles: "border-electric-500/10 hover:border-electric-500/40 text-electric-400 bg-charcoal-900/40",
      activeStyles: "border-electric-500 bg-electric-500/5 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-2 ring-electric-500/20",
    },
    {
      value: "hard",
      label: "Hard Tier",
      desc: "~100 words. Sophisticated jargon, high punctuation density.",
      styles: "border-rose-500/10 hover:border-rose-500/40 text-rose-400 bg-charcoal-900/40",
      activeStyles: "border-rose-500 bg-rose-500/5 shadow-[0_0_25px_rgba(244,63,94,0.25)] ring-[3px] ring-rose-500/30",
    },
  ];

  const categories: { value: Category; label: string; desc: string }[] = [
    {
      value: "programming",
      label: "Programming",
      desc: "Code-adjacent plain English prose themed around technical & computer science principles.",
    },
    {
      value: "general_knowledge",
      label: "General Knowledge",
      desc: "Science, astronomical observations, historical discoveries, and interesting factual trivia.",
    },
    {
      value: "custom",
      label: "As You Wish",
      desc: "Supply your own text to execute a perfectly customized local test run.",
    },
  ];

  return (
    <div className="flex-grow flex flex-col w-full max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8 animate-fade-in">

      {/* ASYMMETRIC GRID HERO SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">

        {/* Left Column: Bold Typographic Statement & Brand Info (~60% width equivalent) */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-charcoal-700 bg-charcoal-800 text-[10px] font-mono text-slate-400 tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-electric-500 animate-pulse"></span>
            SYSTEM REDESIGN V2.0
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.05] uppercase">
            Precision <br />
            Chases <span className="text-electric-500 bg-gradient-to-r from-electric-400 to-electric-600 bg-clip-text text-transparent">Speed.</span>
          </h1>

          <p className="text-sm font-mono text-slate-400 tracking-wider uppercase">
            {"// TERMINAL PROTOCOLS ENGAGED"}
          </p>

          <p className="text-base text-slate-400 max-w-xl font-sans leading-relaxed">
            Reject the ordinary. NOKY is a premium editorial environment designed to evaluate spatial keyboard accuracy and words-per-minute with deliberate intent. Choose your parameters and type with absolute confidence.
          </p>
        </div>

        {/* Right Column: Interactive Live Demonstration Panel (~40% width equivalent) */}
        <div className="lg:col-span-5 w-full bg-charcoal-800 border border-charcoal-700 rounded-2xl p-6 shadow-2xl relative overflow-hidden group hover:border-electric-500/30 transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#3B82F6]/30 to-transparent" />

          <div className="flex items-center justify-between border-b border-charcoal-700 pb-3 mb-4">
            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
              <span className="text-electric-400 font-bold">&gt;_</span>
              <span>LIVE_DEMO_PREVIEW.sh</span>
            </div>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
            </div>
          </div>

          <div className="min-h-[140px] flex flex-col justify-between">
            <p className="font-mono text-sm sm:text-base text-slate-300 leading-relaxed min-h-[90px] select-none">
              {typedSnippet}
              <span className="inline-block w-1.5 h-4 bg-electric-400 ml-0.5 animate-blink" />
            </p>

            <div className="border-t border-charcoal-750/50 pt-3 flex items-center justify-between font-mono text-[10px] text-slate-500">
              <span>STATUS: CAPTURING_INPUTS</span>
              <span className="text-electric-500/70 font-semibold uppercase">Category snippet {snippetIndex + 1}/3</span>
            </div>
          </div>
        </div>

      </div>

      {/* SELECTION GRID CONTROLLER */}
      <div
        ref={configSectionRef}
        className="w-full bg-charcoal-800 border border-charcoal-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-8 transition-all duration-300"
      >

        {/* Step 1: Select Difficulty with visual asymmetry */}
        <div className="space-y-4">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs text-electric-400 font-bold bg-electric-500/10 px-2.5 py-0.5 rounded border border-electric-500/20">01</span>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-sans">Select Difficulty Tier</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {difficulties.map((item) => {
              const isSelected = difficulty === item.value;
              const borderWeight = item.value === "easy" ? "border" : item.value === "medium" ? "border-2" : "border-4";

              return (
                <button
                  key={item.value}
                  onClick={() => {
                    setDifficulty(item.value);
                    setValidationError(null);
                  }}
                  className={`flex flex-col text-left p-5 rounded-xl transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 ${borderWeight} ${
                    isSelected
                      ? item.activeStyles
                      : `${item.styles} border-charcoal-700 hover:border-charcoal-500/60`
                  }`}
                >
                  <span className={`font-mono text-[10px] uppercase tracking-widest font-extrabold mb-1 ${
                    item.value === "easy" ? "text-emerald-400" : item.value === "medium" ? "text-electric-400" : "text-rose-400"
                  }`}>
                    {item.label}
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select Category */}
        <div className="space-y-4 pt-4 border-t border-charcoal-750/60">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs text-electric-400 font-bold bg-electric-500/10 px-2.5 py-0.5 rounded border border-electric-500/20">02</span>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-sans">Select Content Category</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {categories.map((item) => {
              const isSelected = category === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => {
                    setCategory(item.value);
                    setValidationError(null);
                  }}
                  className={`flex flex-col text-left p-5 rounded-xl border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 ${
                    isSelected
                      ? "border-electric-500 bg-electric-500/5 shadow-[0_0_15px_rgba(59,130,246,0.12)] ring-1 ring-electric-500/20"
                      : "border-charcoal-700 bg-charcoal-900/40 text-slate-300 hover:border-charcoal-600 hover:bg-charcoal-900/60"
                  }`}
                >
                  <span className="font-mono text-xs uppercase tracking-wider font-bold text-white mb-2">
                    {item.label}
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Category Context Content */}
        {category === "custom" ? (
          <div className="pt-6 border-t border-charcoal-750/60 space-y-4 animate-fade-in">
            <div className="bg-charcoal-900 border border-charcoal-700 rounded-xl p-5 space-y-4 relative">
              <div className="flex items-center justify-between border-b border-charcoal-700/60 pb-2">
                <span className="font-mono text-xs text-electric-400 font-bold flex items-center gap-1.5">
                  <span>&gt;_</span> INLINE_CUSTOM_PARAGRAPH_INITIALIZER
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  Target difficulty: <span className="text-slate-300 font-bold uppercase">{difficulty}</span>
                </span>
              </div>

              <div className="space-y-2">
                <label htmlFor="custom-text-entry" className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  Paste or write custom prose:
                </label>
                <textarea
                  id="custom-text-entry"
                  rows={5}
                  value={customText}
                  onChange={(e) => {
                    setCustomText(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder={`Write or paste your custom paragraph. For ${difficulty} tier, it must contain between ${minWords} and ${maxWords} words to maintain an appropriate timing metric.`}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-4 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500/20 transition-all resize-none"
                />
              </div>

              {/* Counter and Validations */}
              <div className="flex items-center justify-between font-mono text-xs text-slate-400 pt-1">
                <div className="flex gap-2">
                  <span>Words:</span>
                  <span className={`font-bold ${
                    currentWordCount < minWords || currentWordCount > maxWords ? "text-amber-500" : "text-emerald-400"
                  }`}>
                    {currentWordCount}
                  </span>
                  <span className="text-slate-600">/</span>
                  <span className="text-slate-500">{maxWords} max</span>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-slate-500">
                  {currentWordCount < minWords ? `Min ${minWords} required` : currentWordCount > maxWords ? `Max ${maxWords} allowed` : "Passed criteria ✓"}
                </span>
              </div>

              {validationError && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs font-mono text-rose-400 animate-fade-in">
                  ⚠️ {validationError}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t border-charcoal-750/60 space-y-4 animate-fade-in">
            {hasPB && (
              <div className="bg-charcoal-900/40 border border-charcoal-700 rounded-xl p-4 flex items-center justify-between transition-all">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <span>👻</span> Ghost Race Mode
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                      ghostEnabled
                        ? "bg-electric-500/20 text-electric-400 border border-electric-500/30"
                        : "bg-charcoal-700 text-slate-400 border border-charcoal-600"
                    }`}>
                      {ghostEnabled ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-normal font-sans">
                    Race against your previous best run of <span className="text-electric-400 font-mono font-semibold">{pbWPM} WPM</span> on the {difficulty} tier.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGhostEnabled(!ghostEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-electric-500 ${
                    ghostEnabled ? "bg-electric-500" : "bg-charcoal-700"
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
          </div>
        )}

        {/* Start Control Actions */}
        <div className="pt-4 border-t border-charcoal-750/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span className="text-electric-500">⚡</span> Focus triggers instantly on initialization
          </div>
          <button
            onClick={handleStartTest}
            disabled={category === "custom" && (currentWordCount < minWords || currentWordCount > maxWords)}
            className="w-full sm:w-auto text-center px-10 py-3.5 bg-electric-500 disabled:bg-charcoal-700 disabled:text-slate-500 disabled:border-charcoal-600 disabled:shadow-none text-white font-semibold rounded-xl shadow-lg shadow-electric-500/15 hover:bg-electric-400 active:bg-electric-600 focus:outline-none focus:ring-2 focus:ring-electric-500 transition-all duration-200 hover-glow-electric cursor-pointer disabled:cursor-not-allowed text-sm uppercase tracking-wider font-mono"
          >
            {category === "custom" ? "Initialize Run ⚡" : "Start Speed Test"}
          </button>
        </div>

      </div>

    </div>
  );
}
