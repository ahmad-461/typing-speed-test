"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from "react";
import Link from "next/link";
import { passageBank } from "../../lib/passages";
import { getPersonalBest } from "../../lib/stats";

// Helper client-side sanitization function
function sanitizePassageText(text: string): string {
  if (!text) return "";

  let sanitized = text;

  // 1. Convert any line breaks/tabs to spaces
  sanitized = sanitized.replace(/[\r\n\t]+/g, " ");

  // 2. Trim leading/trailing whitespace
  sanitized = sanitized.trim();

  // 3. Remove leading and trailing quotation marks if wrapped completely
  if (sanitized.startsWith('"') && sanitized.endsWith('"')) {
    sanitized = sanitized.substring(1, sanitized.length - 1);
  }
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

  const isGhostEnabled = searchParams.get("ghost") === "true";

  const [selectedPassage, setSelectedPassage] = useState<string>("");
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Core typing state
  const [typedInput, setTypedInput] = useState("");
  const [totalTypedCount, setTotalTypedCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Ghost Mode position state
  const [ghostPosition, setGhostPosition] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch PB for ghost race
  const ghostPB = useMemo(() => {
    if (typeof window === "undefined" || !isGhostEnabled) return null;
    return getPersonalBest(difficulty);
  }, [isGhostEnabled, difficulty]);

  // Fetch AI-generated passage from server-side API or fall back
  const fetchPassage = useCallback(async () => {
    setLoading(true);
    setTypedInput("");
    setTotalTypedCount(0);
    setStartTime(null);
    setElapsedSeconds(0);
    setGhostPosition(0);
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

  // Handle continuous ghost cursor movement independent of user input
  useEffect(() => {
    if (!isGhostEnabled || loading || !selectedPassage || !ghostPB) {
      setGhostPosition(0);
      return;
    }

    const ghostStartTime = Date.now();
    // Ghost target duration in milliseconds: (characters * 12 * 1000) / PB WPM
    const ghostTargetMs = (selectedPassage.length * 12 * 1000) / ghostPB.wpm;

    const interval = setInterval(() => {
      const elapsed = Date.now() - ghostStartTime;
      const pos = Math.min(
        selectedPassage.length,
        Math.floor((elapsed / ghostTargetMs) * selectedPassage.length)
      );
      setGhostPosition(pos);

      if (pos >= selectedPassage.length) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isGhostEnabled, loading, selectedPassage, ghostPB]);

  // Reset test state and pick a new AI-generated passage
  const handleReset = async () => {
    await fetchPassage();
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);
  };

  // Keyboard and Mobile Typing Capture via Hidden Input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isActive || loading) return;

    const newValue = e.target.value;

    // Do not allow typing past the end of the passage
    if (newValue.length > selectedPassage.length) {
      return;
    }

    const diff = newValue.length - typedInput.length;
    if (diff > 0) {
      setTotalTypedCount((prev) => prev + diff);

      let actualStartTime = startTime;
      if (!startTime) {
        actualStartTime = Date.now();
        setStartTime(actualStartTime);
      }

      setTypedInput(newValue);

      // Check completion
      if (newValue === selectedPassage) {
        const endTime = Date.now();
        const durationMs = actualStartTime ? endTime - actualStartTime : 0;
        const durationSecs = Math.max(1, Math.round(durationMs / 1000));

        const correctCount = selectedPassage.length;
        const finalWPM = Math.round((correctCount / 5) / (durationSecs / 60));
        const updatedTotalCount = totalTypedCount + diff;
        const finalAccuracy = Math.round((correctCount / updatedTotalCount) * 100);

        // Save passage text in session storage for performance share cards
        if (typeof window !== "undefined") {
          sessionStorage.setItem("last_passage", selectedPassage);
        }

        // Compare against the ghost if active
        let ghostMsg = "";
        if (isGhostEnabled && ghostPB) {
          const ghostTargetSecs = (selectedPassage.length * 12) / ghostPB.wpm;
          const diffVal = Math.abs(durationSecs - ghostTargetSecs).toFixed(1);
          if (durationSecs < ghostTargetSecs) {
            ghostMsg = `You beat your ghost by ${diffVal} seconds! ⚡`;
          } else {
            ghostMsg = `Your ghost finished ${diffVal} seconds ahead — try again! 👻`;
          }
        }

        // Immediate redirection on correct completion
        router.push(
          `/results?difficulty=${difficulty}&wpm=${finalWPM}&accuracy=${finalAccuracy}&time=${durationSecs}${ghostMsg ? `&ghostMsg=${encodeURIComponent(ghostMsg)}` : ""}`
        );
      }
    } else if (diff < 0) {
      // Characters were deleted (Backspace)
      setTypedInput(newValue);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent cursor movement inside the hidden input
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleInputFocus = () => {
    setIsActive(true);
    if (inputRef.current) {
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
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
          <div className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 rounded-full bg-electric-500 animate-pulse"></span>
            <span className="font-mono text-xs text-slate-400 tracking-widest uppercase">
              Initializing AI Session
            </span>
          </div>
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
    <main className="flex-grow flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full animate-fade-in">
      {/* Top Meta info */}
      <div className="w-full flex items-center justify-between mb-8 pb-4 border-b border-charcoal-700/60">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal-800 border border-charcoal-700 hover-glow-electric"
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
          {isGhostEnabled && ghostPB && (
            <div className="text-[10px] bg-electric-500/10 border border-electric-500/30 text-electric-400 font-mono font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
              <span>👻</span> Racin&apos; Ghost: {ghostPB.wpm} WPM
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-mono text-slate-400">Live Session Ready</span>
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
          <div className="flex items-center gap-3">
            {isGhostEnabled && (
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                👻 slate badge: ghost cursor position
              </span>
            )}
            <span>{isActive ? "🔴 READY TO TYPE" : "⏸️ CLICK BOX TO ACTIVATE"}</span>
          </div>
        </div>

        <div
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }}
          className={`w-full text-left bg-charcoal-800 border-2 rounded-2xl p-6 sm:p-8 font-mono text-lg sm:text-xl leading-relaxed transition-all duration-300 outline-none select-none relative overflow-hidden cursor-pointer ${
            isActive
              ? "border-electric-500 shadow-lg shadow-electric-500/10 ring-2 ring-electric-500/10"
              : "border-charcoal-700 hover:border-charcoal-600 hover:bg-charcoal-800/80"
          }`}
        >
          {/* Hidden text input to seamlessly handle mobile keyboards and physical events */}
          <input
            ref={inputRef}
            type="text"
            value={typedInput}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onFocus={handleInputFocus}
            onBlur={() => setIsActive(false)}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer pointer-events-none z-10"
          />

          {/* Subtle glowing active accent inside terminal */}
          {isActive && (
            <div className="absolute inset-0 bg-gradient-to-br from-electric-500/5 to-transparent pointer-events-none" />
          )}

          <div className="relative text-slate-300 font-mono tracking-wide selection:bg-transparent z-0">
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
              const isGhostCurrent = isGhostEnabled && index === ghostPosition;

              return (
                <span key={index} className={`relative ${colorClass}`}>
                  {char}
                  {/* Subtle translucent ghost cursor marker behind or around the character */}
                  {isGhostCurrent && (
                    <span className="absolute -inset-x-0.5 inset-y-0 border border-slate-500/30 bg-slate-500/10 rounded pointer-events-none" />
                  )}
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
                {isGhostEnabled && ghostPosition === selectedPassage.length && (
                  <span className="absolute -inset-x-0.5 inset-y-0 border border-slate-500/30 bg-slate-500/10 rounded pointer-events-none" />
                )}
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
          💡 <span className="text-slate-300 font-semibold">Tip:</span> Tap the terminal box to focus, then type on your physical or virtual keyboard. Revert errors with Backspace.
        </div>
        <button
          onClick={handleReset}
          className="w-full sm:w-auto text-center px-6 py-3 bg-charcoal-700 hover:bg-charcoal-600 hover:text-white text-slate-300 font-bold rounded-lg border border-charcoal-600 transition-all duration-200 uppercase tracking-wider text-[11px] hover-glow-electric cursor-pointer focus:outline-none focus:ring-1 focus:ring-electric-500"
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
