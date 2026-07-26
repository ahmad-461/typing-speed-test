"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import Link from "next/link";
import { passageBank } from "../../lib/passages";

// Helper client-side sanitization function
function sanitizePassageText(text: string): string {
  if (!text) return "";

  let sanitized = text;

  // 1. Convert any line breaks/tabs to spaces
  sanitized = sanitized.replace(/[\r\n\t]+/g, " ");

  // 2. Trim leading/trailing whitespace
  sanitized = sanitized.trim();

  // 3. Remove leading and trailing quotation marks if wrapped completely
  // Handle double quotes
  if (sanitized.startsWith('"') && sanitized.endsWith('"')) {
    sanitized = sanitized.substring(1, sanitized.length - 1);
  }
  // Handle single quotes
  if (sanitized.startsWith("'") && sanitized.endsWith("'")) {
    sanitized = sanitized.substring(1, sanitized.length - 1);
  }

  // 4. Strip markdown formatting (asterisks, backticks, header hashes, etc.)
  sanitized = sanitized
    .replace(/[*_`#~]/g, "") // Remove *, _, `, #, ~
    .replace(/\s+/g, " ")     // Collapse multiple spaces to a single space
    .trim();

  return sanitized;
}

function TestScreenContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawDifficulty = searchParams.get("difficulty") || "medium";
  const difficulty = (["easy", "medium", "hard"].includes(rawDifficulty) ? rawDifficulty : "medium") as "easy" | "medium" | "hard";

  const [selectedPassage, setSelectedPassage] = useState<string>("");
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Core typing state
  const [typedInput, setTypedInput] = useState("");
  const [totalTypedCount, setTotalTypedCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch AI-generated passage from server-side API or fall back
  const fetchPassage = useCallback(async () => {
    setLoading(true);
    setTypedInput("");
    setTotalTypedCount(0);
    setStartTime(null);
    setElapsedSeconds(0);
    setIsActive(false);

    try {
      const response = await fetch(`/api/generate-passage?difficulty=${difficulty}`);
      if (response.ok) {
        const data = await response.json();
        const rawText = data?.passage;
        if (rawText && typeof rawText === "string") {
          const sanitized = sanitizePassageText(rawText);
          if (sanitized) {
            setSelectedPassage(sanitized);
            setLoading(false);
            return;
          }
        }
      }
      throw new Error("Failed to load valid passage from API");
    } catch (err) {
      console.warn("Client fetch error, using local fallback:", err);
      // Client-side local redundant fallback
      const list = passageBank[difficulty];
      const randomIndex = Math.floor(Math.random() * list.length);
      setSelectedPassage(sanitizePassageText(list[randomIndex].text));
    } finally {
      setLoading(false);
    }
  }, [difficulty]);

  // Initial load
  useEffect(() => {
    fetchPassage();
  }, [fetchPassage]);

  // Handle live stopwatch update
  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - startTime;
      setElapsedSeconds(Math.floor(elapsedMs / 1000));
    }, 200);

    return () => clearInterval(interval);
  }, [startTime]);

  // Reset test state and pick a new AI-generated passage
  const handleReset = async () => {
    await fetchPassage();
    if (containerRef.current) {
      containerRef.current.focus();
    }
  };

  // Keyboard Event Capture
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isActive || loading) return;

    // Filter out modifier combinations (e.g. Ctrl+C, Alt+Tab, Cmd+R)
    if (e.ctrlKey || e.altKey || e.metaKey) {
      return;
    }

    const key = e.key;

    // Ignore major control and navigation keys
    if (key === "Tab" || key === "Escape" || key === "Shift") {
      return;
    }

    if (key === "Backspace") {
      e.preventDefault();
      setTypedInput((prev) => prev.slice(0, -1));
      return;
    }

    if (key === "Space" || key === " " || key === "Spacebar") {
      e.preventDefault();
    }

    // Do not allow typing past the end of the passage
    if (typedInput.length >= selectedPassage.length) {
      return;
    }

    // Capture standard single-character keys
    if (key.length === 1) {
      if (key === " ") {
        e.preventDefault();
      }

      const nextInput = typedInput + key;
      setTypedInput(nextInput);
      setTotalTypedCount((prev) => prev + 1);

      let actualStartTime = startTime;
      if (!startTime) {
        actualStartTime = Date.now();
        setStartTime(actualStartTime);
      }

      // If typed correctly up to the very last character
      if (nextInput === selectedPassage) {
        const endTime = Date.now();
        const durationMs = actualStartTime ? endTime - actualStartTime : 0;
        const durationSecs = Math.max(1, Math.round(durationMs / 1000));

        const correctCount = selectedPassage.length;
        const finalWPM = Math.round((correctCount / 5) / (durationSecs / 60));
        const finalAccuracy = Math.round((correctCount / (totalTypedCount + 1)) * 100);

        // Immediate redirection on correct completion
        router.push(
          `/results?difficulty=${difficulty}&wpm=${finalWPM}&accuracy=${finalAccuracy}&time=${durationSecs}`
        );
      }
    }
  };

  // Compute live real-time statistics
  const liveCorrectCount = (() => {
    let count = 0;
    for (let i = 0; i < typedInput.length; i++) {
      if (typedInput[i] === selectedPassage[i]) {
        count++;
      }
    }
    return count;
  })();

  const liveWPM = elapsedSeconds >= 1
    ? Math.round((liveCorrectCount / 5) / (elapsedSeconds / 60))
    : 0;

  const liveAccuracy = totalTypedCount > 0
    ? Math.round((liveCorrectCount / totalTypedCount) * 100)
    : 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Styled, terminal-themed loading state
  if (loading || !selectedPassage) {
    return (
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="text-center space-y-6">
          {/* Pulsing prompt cursor motif */}
          <div className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 rounded-full bg-electric-500 animate-pulse"></span>
            <span className="font-mono text-xs text-slate-400 tracking-widest uppercase">
              Initializing AI Session
            </span>
          </div>
          {/* Dynamic dot loading sequence */}
          <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl px-8 py-6 font-mono text-sm max-w-md mx-auto">
            <div className="text-left text-slate-400 mb-2">
              <span className="text-electric-400 font-bold">&gt;_</span> fetch_passage_stream()
            </div>
            <div className="text-left text-emerald-400 flex items-center gap-1">
              <span>Establishing secure connection</span>
              <span className="animate-pulse">...</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const stats = [
    { label: "TIMER", value: formatTime(elapsedSeconds), unit: "", icon: "⏱️" },
    { label: "WPM", value: liveWPM.toString(), unit: "wpm", icon: "⚡" },
    { label: "ACCURACY", value: liveAccuracy.toString(), unit: "%", icon: "🎯" },
  ];

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

      {/* Stats Panel */}
      <div className="grid grid-cols-3 gap-4 w-full mb-8">
        {stats.map((stat) => (
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
              {stat.unit && (
                <span className="text-xs font-normal text-slate-500 ml-0.5">{stat.unit}</span>
              )}
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

        <div
          ref={containerRef}
          tabIndex={0}
          onFocus={() => setIsActive(true)}
          onBlur={() => setIsActive(false)}
          onKeyDown={handleKeyDown}
          onClick={() => {
            setIsActive(true);
            containerRef.current?.focus();
          }}
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
            {selectedPassage.split("").map((char, index) => {
              let colorClass = "";

              if (index < typedInput.length) {
                // Typed character
                const isCorrect = typedInput[index] === char;
                colorClass = isCorrect ? "text-emerald-400" : "text-rose-500 bg-rose-500/10";
              } else {
                // Untyped character
                colorClass = "text-slate-500";
              }

              const isCurrent = index === typedInput.length;

              return (
                <span key={index} className={`relative ${colorClass}`}>
                  {char}
                  {isCurrent && isActive && (
                    <span className="absolute left-0 bottom-0 top-0 w-[2px] bg-electric-400 animate-blink" />
                  )}
                  {isCurrent && !isActive && (
                    <span className="absolute left-0 bottom-0 top-0 w-[2px] bg-electric-400 opacity-40" />
                  )}
                </span>
              );
            })}

            {/* Render a virtual cursor past the last character when typedInput matches selectedPassage length */}
            {typedInput.length === selectedPassage.length && (
              <span className="relative">
                {isActive ? (
                  <span className="absolute left-0 bottom-0 top-0 w-[2px] bg-electric-400 animate-blink" />
                ) : (
                  <span className="absolute left-0 bottom-0 top-0 w-[2px] bg-electric-400 opacity-40" />
                )}
              </span>
            )}
          </div>

          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-charcoal-900/60 backdrop-blur-[1px] transition-all duration-200">
              <span className="bg-charcoal-800 border border-charcoal-700 text-electric-400 font-mono text-sm px-4 py-2.5 rounded-lg shadow-xl font-bold animate-pulse">
                Click here to start typing
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Control Actions */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 bg-charcoal-800/40 border border-charcoal-700/60 rounded-xl p-4 font-mono text-xs">
        <div className="text-slate-400 text-center sm:text-left leading-normal">
          💡 <span className="text-slate-300 font-semibold">Tip:</span> Simply start typing on your physical keyboard. Revert errors with Backspace.
        </div>
        <button
          onClick={handleReset}
          className="w-full sm:w-auto text-center px-6 py-3 bg-charcoal-700 hover:bg-charcoal-600 hover:text-white text-slate-300 font-bold rounded-lg border border-charcoal-600 transition-colors duration-200 uppercase tracking-wider text-[11px]"
        >
          Reset Test 🔄
        </button>
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
