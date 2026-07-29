"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from "react";
import Link from "next/link";
import { passageBank } from "../../lib/passages";
import { getPersonalBest, saveKeyErrors, saveKeyTypedCounts, getWeakestKeys } from "../../lib/stats";
import { playCorrectClick, playIncorrectClick, playCompleteChime } from "../../lib/sounds";

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

// Programmatic filter for Punctuation & Numbers
function applyFiltering(text: string, punctuationOn: boolean, numbersOn: boolean): string {
  let cleaned = text;

  if (!numbersOn) {
    const words = cleaned.split(/\s+/);
    // remove the whole word token if it contains a digit (e.g. "In 2019," -> removed)
    const filteredWords = words.filter(word => !/\d/.test(word));
    cleaned = filteredWords.join(" ");
  }

  if (!punctuationOn) {
    // strip all standard punctuation/symbols, keep only letters, numbers, and single spaces
    cleaned = cleaned.replace(/[^a-zA-Z0-9\s]/g, "");
    cleaned = cleaned.replace(/\s+/g, " ").trim();
  }

  return cleaned;
}

// Helper to get a random static passage for a category with applied filters
function getRandomCategoryPassage(category: string, punctuationOn: boolean, numbersOn: boolean): string {
  const allPassages: string[] = [];
  for (const diff of ["easy", "medium", "hard"] as const) {
    const list = passageBank[diff].filter((p) => p.category === category);
    list.forEach(p => allPassages.push(p.text));
  }

  if (allPassages.length === 0) {
    for (const diff of ["easy", "medium", "hard"] as const) {
      passageBank[diff].forEach(p => allPassages.push(p.text));
    }
  }

  const rawText = allPassages[Math.floor(Math.random() * allPassages.length)] || "Practice typing daily to enhance your speed and accuracy.";
  const sanitized = sanitizePassageText(rawText);
  return applyFiltering(sanitized, punctuationOn, numbersOn);
}

function getTrackedKey(char: string): string | null {
  if (char === " ") return "SPACE";
  if (/^[a-zA-Z]$/.test(char)) return char.toUpperCase();
  return null;
}

function calculateConsistencyScore(samples: number[]): number {
  if (samples.length < 3) {
    return 100; // default for extremely fast runs or insufficient samples
  }

  const n = samples.length;
  const mean = samples.reduce((a, b) => a + b, 0) / n;

  if (mean === 0) {
    return 0;
  }

  const variance = samples.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;

  const score = Math.max(0, Math.round(100 - (cv * 100)));
  return score;
}

function TestScreenContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Mode Type Parsing: "time" | "words" | "passage" (default "passage")
  const rawMode = searchParams.get("mode") || "passage";
  const mode = (["time", "words", "passage"].includes(rawMode) ? rawMode : "passage") as "time" | "words" | "passage";

  const rawDifficulty = searchParams.get("difficulty") || "medium";
  const difficulty = (["easy", "medium", "hard"].includes(rawDifficulty) ? rawDifficulty : "medium") as "easy" | "medium" | "hard";

  const rawCategory = searchParams.get("category") || "code_arena";
  const category = (["code_arena", "knowledge_quest", "ai_lab", "world_explorer", "weak_key_drill", "speed_sprint"].includes(rawCategory) ? rawCategory : "code_arena") as "code_arena" | "knowledge_quest" | "ai_lab" | "world_explorer" | "weak_key_drill" | "speed_sprint";

  const isSpeedSprint = category === "speed_sprint";
  // Ghost Mode is exclusive to Passage mode easy, medium, and hard
  const isGhostEnabled = !isSpeedSprint && mode === "passage" && searchParams.get("ghost") === "true";

  // Time & Word Count mode params
  const duration = parseInt(searchParams.get("duration") || "60", 10);
  const wordCount = parseInt(searchParams.get("word_count") || "25", 10);

  // Punctuation & Numbers Toggles (default true/on)
  const punctuationOn = searchParams.get("punctuation") !== "off";
  const numbersOn = searchParams.get("numbers") !== "off";

  const [selectedPassage, setSelectedPassage] = useState<string>("");
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Core typing state
  const [typedInput, setTypedInput] = useState("");
  const [totalTypedCount, setTotalTypedCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Key error and typed count tracking
  const [keyErrors, setKeyErrors] = useState<Record<string, number>>({});
  const [keyTypedCounts, setKeyTypedCounts] = useState<Record<string, number>>({});

  // WPM samples for consistency score
  const wpmSamplesRef = useRef<number[]>([]);
  const lastSampledSecondRef = useRef<number>(0);

  // Ghost Mode position state
  const [ghostPosition, setGhostPosition] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Refs to avoid interval closures
  const typedInputRef = useRef(typedInput);
  const selectedPassageRef = useRef(selectedPassage);

  useEffect(() => {
    typedInputRef.current = typedInput;
  }, [typedInput]);

  useEffect(() => {
    selectedPassageRef.current = selectedPassage;
  }, [selectedPassage]);

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
    setKeyErrors({});
    setKeyTypedCounts({});
    wpmSamplesRef.current = [];
    lastSampledSecondRef.current = 0;

    let weakestKeysQuery = "";
    if (category === "weak_key_drill") {
      const weakest = getWeakestKeys(8);
      if (weakest.length > 0) {
        weakestKeysQuery = `&weak_keys=${encodeURIComponent(weakest.join(","))}`;
        if (typeof window !== "undefined") {
          sessionStorage.setItem("last_drill_keys", JSON.stringify(weakest));
        }
      }
    }

    try {
      // Determine what to pass to Gemini API
      let apiWordCount = "";
      if (mode === "words") {
        // Pass the explicit word target to Gemini
        apiWordCount = `&word_count=${wordCount}`;
      } else if (mode === "time") {
        // Fetch a long passage segment (e.g. ~100 words baseline) to start the flowing stream
        apiWordCount = `&difficulty=hard`;
      }

      const response = await fetch(`/api/generate-passage?difficulty=${difficulty}&category=${category}${weakestKeysQuery}${apiWordCount}`);
      if (response.ok) {
        const data = await response.json();
        const rawPassages = data?.passages;
        if (Array.isArray(rawPassages) && rawPassages.length >= 1) {
          const sanitized = sanitizePassageText(rawPassages[0]);
          if (sanitized) {
            // Apply filtering first
            let filtered = applyFiltering(sanitized, punctuationOn, numbersOn);
            // If words mode, slice to exact word count target
            if (mode === "words") {
              const words = filtered.split(/\s+/).filter(Boolean);
              filtered = words.slice(0, wordCount).join(" ");
            }
            setSelectedPassage(filtered);
            setLoading(false);
            return;
          }
        }
      }
      throw new Error("Failed to load valid passage from API");
    } catch (err) {
      console.warn("Client fetch error, using local fallback:", err);
      // Fallback: search fallback list
      const list = passageBank[difficulty].filter((p) => p.category === category);
      const fallbackList = list.length > 0 ? list : passageBank[difficulty];
      const randomItem = fallbackList[Math.floor(Math.random() * fallbackList.length)];
      const sanitized = sanitizePassageText(randomItem?.text || "Practice typing daily to improve your speed.");

      let filtered = applyFiltering(sanitized, punctuationOn, numbersOn);
      if (mode === "words") {
        const words = filtered.split(/\s+/).filter(Boolean);
        filtered = words.slice(0, wordCount).join(" ");
      }
      setSelectedPassage(filtered);
    } finally {
      setLoading(false);
    }
  }, [difficulty, category, mode, wordCount, punctuationOn, numbersOn]);

  // Initial load
  useEffect(() => {
    fetchPassage();
  }, [fetchPassage]);

  // Function to finalize and redirect cleanly
  const finalizeTestAndRedirect = useCallback((durationSecs: number) => {
    playCompleteChime();
    const activePassage = selectedPassageRef.current;
    const activeInput = typedInputRef.current;

    let correctCount = 0;
    for (let i = 0; i < activeInput.length; i++) {
      if (activeInput[i] === activePassage[i]) {
        correctCount++;
      }
    }

    const duration = Math.max(1, durationSecs);
    const finalWPM = Math.round((correctCount / 5) / (duration / 60));
    const totalCount = totalTypedCount || activeInput.length || 1;
    const finalAccuracy = Math.round((correctCount / totalCount) * 100);

    // Save aggregated key errors & typed counts to localStorage
    saveKeyErrors(keyErrors);
    saveKeyTypedCounts(keyTypedCounts);

    // Compute consistency score
    const allSamples = [...wpmSamplesRef.current, finalWPM];
    const consistencyScore = calculateConsistencyScore(allSamples);

    // Save passage text and specific run stats in session storage for performance share cards/coaching
    if (typeof window !== "undefined") {
      sessionStorage.setItem("last_passage", activePassage);
      sessionStorage.setItem("last_test_errors", JSON.stringify(keyErrors));
      sessionStorage.setItem("last_test_typed_counts", JSON.stringify(keyTypedCounts));
    }

    // Compare against the ghost if active
    let ghostMsg = "";
    if (isGhostEnabled && ghostPB) {
      const ghostTargetSecs = (activePassage.length * 12) / ghostPB.wpm;
      const diffVal = Math.abs(duration - ghostTargetSecs).toFixed(1);
      if (duration < ghostTargetSecs) {
        ghostMsg = `You beat your ghost by ${diffVal} seconds! ⚡`;
      } else {
        ghostMsg = `Your ghost finished ${diffVal} seconds ahead — try again! 👻`;
      }
    }

    // Ahmad instruction: Store difficulty as 'custom' for Time and Word Count modes
    const testDifficulty = (mode === "time" || mode === "words" || isSpeedSprint) ? "custom" : difficulty;

    // Direct result navigation with new metadata parameters
    router.push(
      `/results?difficulty=${testDifficulty}&category=${category}&wpm=${finalWPM}&accuracy=${finalAccuracy}&time=${duration}&consistency=${consistencyScore}${ghostMsg ? `&ghostMsg=${encodeURIComponent(ghostMsg)}` : ""}&modeType=${mode}&modeDuration=${duration}&modeWordCount=${wordCount}`
    );
  }, [difficulty, category, isGhostEnabled, ghostPB, keyErrors, keyTypedCounts, totalTypedCount, isSpeedSprint, mode, wordCount, router]);

  // Handle live stopwatch update & WPM sampling
  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - startTime;
      const secs = Math.floor(elapsedMs / 1000);
      setElapsedSeconds(secs);

      // Speed Sprint Countdown check: terminates immediately at 20 seconds
      if (isSpeedSprint && secs >= 20) {
        clearInterval(interval);
        finalizeTestAndRedirect(20);
        return;
      }

      // Time Mode Countdown check: terminates immediately at selected duration
      if (mode === "time" && secs >= duration) {
        clearInterval(interval);
        finalizeTestAndRedirect(duration);
        return;
      }

      // Sample WPM every second mark
      if (secs > 0 && secs > lastSampledSecondRef.current) {
        lastSampledSecondRef.current = secs;

        let correctCount = 0;
        const currentTyped = typedInputRef.current;
        const currentPassage = selectedPassageRef.current;
        for (let i = 0; i < currentTyped.length; i++) {
          if (currentTyped[i] === currentPassage[i]) {
            correctCount++;
          }
        }
        const instantWPM = Math.round((correctCount / 5) / (secs / 60));
        wpmSamplesRef.current.push(instantWPM);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [startTime, isSpeedSprint, mode, duration, finalizeTestAndRedirect]);

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

  // Keyboard and Mobile Typing Capture via Hidden Input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (loading || !selectedPassage) return;

    const newValue = e.target.value;

    // Do not allow typing past the end of the passage unless streaming is extending it
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

      // Track weak-key errors and typed counts for newly typed characters
      const updatedErrors = { ...keyErrors };
      const updatedTypedCounts = { ...keyTypedCounts };
      let hadNewError = false;
      let hadNewType = false;
      for (let i = typedInput.length; i < newValue.length; i++) {
        const expectedChar = selectedPassage[i];
        const isCorrect = newValue[i] === expectedChar;
        if (isCorrect) {
          playCorrectClick();
        } else {
          playIncorrectClick();
        }
        const tracked = getTrackedKey(expectedChar);
        if (tracked) {
          updatedTypedCounts[tracked] = (updatedTypedCounts[tracked] || 0) + 1;
          hadNewType = true;
          if (newValue[i] !== expectedChar) {
            updatedErrors[tracked] = (updatedErrors[tracked] || 0) + 1;
            hadNewError = true;
          }
        }
      }
      if (hadNewError) {
        setKeyErrors(updatedErrors);
      }
      if (hadNewType) {
        setKeyTypedCounts(updatedTypedCounts);
      }

      // Time Mode Continuous Text Streaming mechanism
      if (mode === "time") {
        if (selectedPassage.length - newValue.length < 100) {
          const nextSegment = getRandomCategoryPassage(category, punctuationOn, numbersOn);
          setSelectedPassage((prev) => prev + " " + nextSegment);
        }
      }

      setTypedInput(newValue);

      // Check completion (for non-time modes)
      if (mode !== "time" && newValue === selectedPassage) {
        const endTime = Date.now();
        const durationMs = actualStartTime ? endTime - actualStartTime : 0;
        const durationSecs = Math.max(1, Math.round(durationMs / 1000));
        finalizeTestAndRedirect(durationSecs);
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
    if (isSpeedSprint) {
      // Display countdown style for Speed Sprint
      const remaining = Math.max(0, 20 - seconds);
      return `${remaining}s`;
    }
    if (mode === "time") {
      // Display countdown style for Time Mode
      const remaining = Math.max(0, duration - seconds);
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    // Count UP for other modes
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Setup click-to-focus on first load once page renders
  useEffect(() => {
    if (!loading && selectedPassage) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("typing_active", "true");
      }
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
    }
    return () => {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("typing_active");
      }
    };
  }, [loading, selectedPassage]);

  // Clean typing-active indicator if blurred
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isActive) {
        sessionStorage.setItem("typing_active", "true");
      } else {
        sessionStorage.removeItem("typing_active");
      }
      window.dispatchEvent(new Event("typing_focus_change"));
    }
  }, [isActive]);

  // Dynamic Typewriter Task Loader text
  const loadingText = useMemo(() => {
    if (category === "weak_key_drill") return "COMPILING_WEAK_KEYS_DRILL";
    if (category === "speed_sprint") return "INIT_SPEED_SPRINT_PROTOCOL";
    return "GENERATING_CHALLENGE_PASSAGE";
  }, [category]);

  // Styled, terminal-themed loading state
  if (loading) {
    return (
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full animate-fade-in">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 rounded-full bg-electric-500 animate-pulse"></span>
            <span className="font-mono text-xs text-slate-400 tracking-widest uppercase">
              Establishing Prompts
            </span>
          </div>
          <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl p-6 sm:p-8 font-mono text-sm max-w-md mx-auto shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-electric-500 to-sky-500" />
            <div className="text-left text-slate-400 mb-2 flex items-center gap-1.5">
              <span className="text-electric-400 font-bold">&gt;_</span>
              <span>system_gateway.sh</span>
            </div>
            <div className="text-left text-emerald-400 font-mono flex items-center gap-1 h-8">
              <span>&gt; {loadingText}...</span>
              <span className="inline-block w-2 h-4 bg-emerald-400 animate-blink" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const timerLabel = (isSpeedSprint || mode === "time") ? "COUNTDOWN" : "TIMER";
  const stats = [
    { label: timerLabel, value: formatTime(elapsedSeconds), unit: "", icon: "⏱️" },
    { label: "WPM", value: liveWPM.toString(), unit: "wpm", icon: "⚡" },
    { label: "ACCURACY", value: liveAccuracy.toString(), unit: "%", icon: "🎯" },
  ];

  return (
    <main className="flex-grow flex flex-col items-center justify-center px-4 py-6 sm:py-12 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full animate-fade-in">
      {/* Top Meta info */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-charcoal-700/60 font-mono">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="btn-secondary min-h-[44px] px-4 py-2 hover:bg-charcoal-800 hover-glow-electric text-xs text-slate-400 hover:text-white flex items-center gap-1.5 rounded-xl border border-charcoal-700 transition-all duration-200 active:scale-[0.97]"
          >
            ← Back
          </Link>
          <div className="text-xs text-slate-450 uppercase tracking-wider flex items-center gap-2 flex-wrap font-bold">
            <span>MODE:</span>
            <span className="font-extrabold text-electric-500 uppercase">
              {mode}
            </span>
            <span className="text-slate-700">•</span>
            <span>CATEGORY:</span>
            <span className="font-extrabold text-sky-400 uppercase">
              {category.replace("_", " ")}
            </span>
          </div>
          {isGhostEnabled && ghostPB && (
            <div className="text-[10px] bg-electric-500/10 border border-electric-500/30 text-electric-400 font-mono font-bold px-2.5 py-1 rounded-xl uppercase tracking-wider flex items-center gap-1 animate-fade-in">
              <span>👻</span> Racin&apos; Ghost: {ghostPB.wpm} WPM
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[9px] bg-amber-500/[0.04] border border-amber-500/20 text-amber-500/90 font-mono px-2 py-0.5 rounded uppercase font-bold tracking-widest flex items-center gap-1">
            <span>🤖</span> AI-GENERATED
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-slate-450 font-bold uppercase tracking-wider font-mono">Live Session Ready</span>
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="grid grid-cols-3 gap-4 w-full mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-charcoal-800 border border-charcoal-700 rounded-2xl p-4 sm:p-6 text-center flex flex-col justify-center items-center relative overflow-hidden group card-hover-lift"
          >
            <div className="absolute top-3 right-3 text-xs opacity-20 group-hover:opacity-40 transition-opacity">
              {stat.icon}
            </div>
            <span className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase tracking-wider mb-1 font-bold">
              {stat.label}
            </span>
            <div className="text-xl sm:text-3xl font-extrabold text-white font-mono leading-none">
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
        <div className="text-[10px] text-slate-450 font-mono mb-2 flex justify-between items-center px-1 uppercase tracking-wider font-bold">
          <span>{"⌨️ PROMPT TERMINAL"}</span>
          <div className="flex items-center gap-3">
            {isGhostEnabled && (
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold">
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
          className={`w-full text-left bg-charcoal-800 border-2 rounded-2xl p-4 sm:p-8 font-mono text-base sm:text-xl leading-relaxed transition-all duration-300 outline-none select-none relative overflow-hidden cursor-pointer ${
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
                colorClass = "text-slate-400";
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
              <span className="bg-charcoal-800 border border-charcoal-700 text-electric-400 font-mono text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xl font-bold animate-pulse">
                Click here to start typing
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Control Actions */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 bg-charcoal-800/40 border border-charcoal-700/60 rounded-2xl p-4 font-mono text-xs">
        <div className="text-slate-400 text-center sm:text-left leading-normal font-sans text-xs">
          💡 <span className="text-slate-300 font-bold font-mono uppercase tracking-wider">Tip:</span> Tap the terminal box to focus, then type on your physical or virtual keyboard. Revert errors with Backspace.
        </div>
        <button
          onClick={fetchPassage}
          className="btn-secondary py-2.5 px-5 text-[11px] rounded-lg border border-charcoal-700 min-h-[44px] cursor-pointer w-full sm:w-auto"
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
