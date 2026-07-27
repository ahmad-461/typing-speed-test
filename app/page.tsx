"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getPersonalBest, getHistory } from "../lib/stats";
import { getGamificationState, ACHIEVEMENTS, GamificationState } from "../lib/gamification";

type Difficulty = "easy" | "medium" | "hard";
type Category = "code_arena" | "knowledge_quest" | "ai_lab" | "world_explorer" | "speed_sprint" | "weak_key_drill";

interface CustomWindow extends Window {
  scrollToConfig?: () => void;
}

export default function Home() {
  const router = useRouter();

  // Mode Selection State
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [ghostEnabled, setGhostEnabled] = useState(false);

  // Identity Gate (First-Visit Flow)
  const [playerName, setPlayerName] = useState<string>("");
  const [hasNameLoaded, setHasNameLoaded] = useState(false);
  const [initialNameInput, setInitialNameInput] = useState("");
  const [initialNameError, setInitialNameError] = useState("");

  // Gamification & Session Stats
  const [overallPbWPM, setOverallPbWPM] = useState<number>(0);
  const [personalGoal, setPersonalGoal] = useState<number | null>(null);
  const [historyLength, setHistoryLength] = useState(0);
  const [todayCompletedTests, setTodayCompletedTests] = useState(0);
  const [gamificationState, setGamificationState] = useState<GamificationState | null>(null);

  // Locked info message state for Weak-Key Drill
  const [showLockedDrillMessage, setShowLockedDrillMessage] = useState(false);

  // Configuration Anchor Ref
  const configSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("tst_player_name") || "";
    setPlayerName(stored);
    setHasNameLoaded(true);

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setPlayerName(customEvent.detail);
      }
    };

    window.addEventListener("tst-name-updated", handleUpdate);
    return () => {
      window.removeEventListener("tst-name-updated", handleUpdate);
    };
  }, []);

  // Sync / Load All History Stats
  const loadStats = () => {
    const history = getHistory();
    setHistoryLength(history.length);

    // Calculate completed tests today (timezone-safe date match)
    const now = new Date();
    const todayStr = now.toDateString();
    const todayTests = history.filter((run) => {
      return new Date(run.timestamp).toDateString() === todayStr;
    });
    setTodayCompletedTests(todayTests.length);

    // Load overall PB and Personal WPM Goal
    const best = getPersonalBest();
    setOverallPbWPM(best ? best.wpm : 0);

    const storedGoal = localStorage.getItem("tst_personal_wpm_goal_v1");
    if (storedGoal) {
      const g = parseInt(storedGoal, 10);
      if (!isNaN(g) && g > 0) {
        setPersonalGoal(g);
      }
    } else {
      setPersonalGoal(null);
    }

    // Refresh gamification parameters
    const state = getGamificationState();
    setGamificationState(state);
  };

  useEffect(() => {
    if (playerName) {
      loadStats();
    }

    const handleSync = () => {
      loadStats();
    };

    window.addEventListener("tst-gamification-updated", handleSync);
    return () => {
      window.removeEventListener("tst-gamification-updated", handleSync);
    };
  }, [playerName]);

  // Handle Initial Callsign Setup
  const handleInitialNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let sanitized = initialNameInput.trim();
    // Validate alphanumeric and spaces only, up to 20 chars
    const isValid = /^[a-zA-Z0-9 ]+$/.test(sanitized);

    if (!sanitized) {
      setInitialNameError("Callsign cannot be empty");
      return;
    }

    if (!isValid) {
      setInitialNameError("Only alphanumeric characters and spaces are allowed");
      return;
    }

    sanitized = sanitized.slice(0, 20);

    localStorage.setItem("tst_player_name", sanitized);
    setPlayerName(sanitized);
    window.dispatchEvent(new CustomEvent("tst-name-updated", { detail: sanitized }));
  };

  const triggerEditModal = () => {
    window.dispatchEvent(new CustomEvent("tst-open-name-modal"));
  };

  const triggerExitModal = () => {
    window.dispatchEvent(new CustomEvent("tst-open-exit-modal"));
  };

  // Setup click target for footer scroll-to-element
  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as unknown as CustomWindow;
      win.scrollToConfig = () => {
        if (configSectionRef.current) {
          configSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
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

  const handleStartTest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedCategory) return;
    router.push(`/test?difficulty=${difficulty}&category=${selectedCategory}${ghostEnabled ? "&ghost=true" : ""}`);
  };

  // Handle category selection and drill locked gates
  const handleSelectCategory = (cat: Category) => {
    if (cat === "weak_key_drill" && historyLength < 3) {
      setShowLockedDrillMessage(true);
      return;
    }
    setShowLockedDrillMessage(false);
    setSelectedCategory(cat);

    // Scroll Configuration into view on select
    setTimeout(() => {
      if (configSectionRef.current) {
        configSectionRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 50);
  };

  // Compute Has Personal Best on Currently Selected Difficulty for Ghost Race
  const hasPBOnSelectedDifficulty = useMemo(() => {
    if (!selectedCategory) return false;
    // Speed Sprint and Weak-Key Drill do not support Ghost Race Mode
    if (selectedCategory === "speed_sprint" || selectedCategory === "weak_key_drill") return false;
    const pb = getPersonalBest(difficulty);
    return !!pb;
  }, [selectedCategory, difficulty]);

  useEffect(() => {
    if (!hasPBOnSelectedDifficulty) {
      setGhostEnabled(false);
    }
  }, [hasPBOnSelectedDifficulty]);

  // Determine closest locked achievement
  const closestLockedAchievement = useMemo(() => {
    if (!gamificationState) return null;
    const unlocked = gamificationState.unlockedAchievements;
    const history = getHistory();

    const candidates = ACHIEVEMENTS.filter((badge) => !unlocked.includes(badge.id));
    if (candidates.length === 0) return null; // All achievements unlocked

    // Calculate completion % for each candidate
    const mapped = candidates.map((badge) => {
      let progress = 0;
      let target = 1;
      let label = "";

      if (badge.id === "speed_demon") {
        target = 80;
        progress = overallPbWPM;
        label = `PB: ${progress}/${target} WPM`;
      } else if (badge.id === "perfect_accuracy") {
        target = 100;
        const bestAccRun = history.reduce((best, r) => (r.accuracy > best ? r.accuracy : best), 0);
        progress = bestAccRun;
        label = `Best: ${progress}% / 100%`;
      } else if (badge.id === "seven_day_streak") {
        target = 7;
        progress = gamificationState.streakDays;
        label = `Streak: ${progress}/${target} days`;
      } else if (badge.id === "code_warrior") {
        target = 10;
        progress = gamificationState.stats.codeArenaCount;
        label = `Runs: ${progress}/${target}`;
      } else if (badge.id === "knowledge_master") {
        target = 10;
        progress = gamificationState.stats.knowledgeQuestCount;
        label = `Runs: ${progress}/${target}`;
      } else if (badge.id === "typing_legend_badge") {
        target = 100;
        progress = historyLength;
        label = `Tests: ${progress}/${target}`;
      } else if (badge.id === "goal_crusher") {
        target = personalGoal || 1;
        progress = overallPbWPM;
        label = personalGoal ? `PB: ${progress}/${target} WPM` : "No goal set";
      } else if (badge.id === "trend_setter") {
        // Simple mock ratio for progress representation
        target = 3;
        progress = 0;
        label = "Compounding Compound";
      }

      const percent = Math.min(100, Math.round((progress / target) * 100));
      return { badge, percent, label };
    });

    // Return the one with the highest non-100% completion percent
    return mapped.sort((a, b) => b.percent - a.percent)[0] || null;
  }, [gamificationState, overallPbWPM, historyLength, personalGoal]);

  if (!hasNameLoaded) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-electric-500"></div>
      </div>
    );
  }

  // IDENTITY GATE (First-Visit Flow)
  if (!playerName) {
    return (
      <div className="fixed inset-0 z-50 bg-[#090A0C]/95 backdrop-blur-md flex items-center justify-center px-4">
        {/* CRT Scanline simulated overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%]" />

        <div className="w-full max-w-md bg-[#0E0F11] border-2 border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-[0_0_35px_rgba(59,130,246,0.15)] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-electric-500 to-sky-500" />

          <div className="flex items-center gap-2 border-b border-charcoal-700 pb-3 mb-6 font-mono text-xs text-slate-400">
            <span className="text-electric-400 font-bold animate-pulse">&gt;</span>
            <span>IDENTITY_SECURE_GATEWAY // PROT_INIT</span>
          </div>

          <div className="space-y-6">
            <div className="space-y-1 font-mono text-xs">
              <span className="text-rose-400 font-bold block animate-pulse">
                &gt; IDENTITY PROTOCOL UNINITIALIZED
              </span>
              <span className="text-slate-400 block">
                &gt; SYSTEM REQUIRES OPERATOR CALLSIGN BEFORE BOOTING HUB.
              </span>
            </div>

            <form onSubmit={handleInitialNameSubmit} className="space-y-5">
              <div>
                <label htmlFor="gate-callsign" className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">
                  &gt; ENTER CALLSIGN_
                </label>
                <input
                  id="gate-callsign"
                  type="text"
                  maxLength={20}
                  value={initialNameInput}
                  onChange={(e) => {
                    setInitialNameInput(e.target.value);
                    setInitialNameError("");
                  }}
                  placeholder="e.g. SpeedTyper99"
                  className="w-full bg-[#121316] border border-[#23272F] rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500/20 transition-all text-center"
                  autoFocus
                />
                {initialNameError && (
                  <p className="text-rose-400 text-[10px] font-mono mt-2 text-center">
                    ⚠️ {initialNameError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-electric-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-electric-500/15 hover:bg-electric-400 transition-all duration-200 cursor-pointer text-center"
              >
                [ CONFIRM CALLSIGN ]
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const isNewRecruit = historyLength === 0;

  return (
    <div className="flex-grow flex flex-col w-full max-w-5xl mx-auto px-4 py-4 sm:py-8 lg:px-8 animate-fade-in space-y-6 sm:space-y-10">

      {/* SYSTEM DIAGNOSTICS & HUB NAVIGATION (Compact System Label) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 pb-3 sm:pb-4 border-b border-[#1E293B]">
        <div className="space-y-0.5 sm:space-y-1">
          <span className="font-mono text-[9px] sm:text-[10px] text-electric-400 uppercase tracking-widest font-black block">
            {"// TERMINAL OVERVIEW"}
          </span>
          <h1 className="text-sm sm:text-xl font-bold text-white tracking-wider font-mono">
            NOKY // MISSION CONTROL
          </h1>
        </div>

        {/* Dynamic Player Status HUD Header (compact game HUD save-file style) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          {isNewRecruit ? (
            <div className="inline-flex items-center h-7 sm:h-8 px-3 sm:px-4 rounded-full border border-rose-500/30 bg-rose-500/[0.04] text-[9px] sm:text-[10px] font-mono text-rose-400 font-extrabold uppercase tracking-widest animate-pulse">
              <span>⚠️ Status: New Recruit</span>
            </div>
          ) : (
            gamificationState && (
              <>
                {/* Mobile view: Stack into exactly two clean, deliberate, and compact rows */}
                <div className="flex flex-col gap-1.5 sm:hidden w-full">
                  {/* Row 1: Level Title + Level + Streak */}
                  <div className="inline-flex items-center h-7 rounded-full border border-[#3B82F6]/20 bg-charcoal-800 text-[9px] font-mono text-white font-bold uppercase tracking-wider overflow-hidden">
                    <span className="px-2.5 text-slate-400">{gamificationState.levelTitle}</span>
                    <span className="h-full w-[1px] bg-charcoal-700" />
                    <span className="px-2.5 text-[#3B82F6]">Lvl {gamificationState.currentLevel}</span>
                    <span className="h-full w-[1px] bg-charcoal-700" />
                    <span className="px-2.5 text-amber-500 flex items-center gap-0.5">
                      <span>🔥</span> {gamificationState.streakDays}
                    </span>
                  </div>
                  {/* Row 2: Personal Best if available */}
                  {overallPbWPM > 0 && (
                    <div className="self-start inline-flex items-center h-7 px-2.5 rounded-full border border-emerald-500/20 bg-charcoal-800 text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                      <span>PB: {overallPbWPM} WPM</span>
                    </div>
                  )}
                </div>

                {/* Desktop view: Single horizontal pill container */}
                <div className="hidden sm:inline-flex items-center h-8 rounded-full border border-[#3B82F6]/20 bg-charcoal-800 text-[10px] sm:text-[11px] font-mono text-white font-bold uppercase tracking-wider">
                  <span className="px-3 text-slate-400">{gamificationState.levelTitle}</span>
                  <span className="h-full w-[1px] bg-charcoal-700" />
                  <span className="px-3 text-[#3B82F6]">Lvl {gamificationState.currentLevel}</span>
                  <span className="h-full w-[1px] bg-charcoal-700" />
                  <span className="px-3 text-amber-500 flex items-center gap-1">
                    <span>🔥</span> {gamificationState.streakDays} Day Streak
                  </span>
                  {overallPbWPM > 0 && (
                    <>
                      <span className="h-full w-[1px] bg-charcoal-700" />
                      <span className="px-3 text-emerald-400 font-bold">PB: {overallPbWPM} WPM</span>
                    </>
                  )}
                </div>
              </>
            )
          )}
          {/* Global player identity pencil edit (reduced padding / simple inline treatment on mobile) */}
          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400 sm:bg-charcoal-800 sm:border sm:border-charcoal-750 sm:px-3 sm:py-1.5 rounded-lg">
            <span>Playing as:</span>
            <span className="font-extrabold text-white underline decoration-electric-500 decoration-2 underline-offset-2 normal-case">{playerName}</span>
            <button
              onClick={triggerEditModal}
              className="text-slate-500 hover:text-white transition-colors cursor-pointer p-0.5 ml-1"
              title="Edit Callsign"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={triggerExitModal}
              className="flex items-center justify-center border border-[#3B82F6]/30 hover:border-[#3B82F6] hover:bg-[#3B82F6]/10 text-slate-400 hover:text-white rounded px-1.5 py-0.5 transition-all cursor-pointer ml-1"
              title="Exit Session"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 2. THE SIX PRACTICE MODE TILES GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-slate-400 uppercase tracking-widest">
            &gt; select practice sector
          </span>
          {personalGoal !== null && (
            <div className="text-[10px] font-mono text-electric-400 uppercase tracking-widest font-extrabold flex items-center gap-1.5 bg-electric-500/5 px-2.5 py-1 rounded border border-electric-500/20">
              <span>🎯 TARGET:</span>
              <span className="font-extrabold text-white">{personalGoal} WPM</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Code Arena */}
          <button
            onClick={() => handleSelectCategory("code_arena")}
            className={`flex flex-col text-left p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer relative group overflow-hidden ${
              selectedCategory === "code_arena"
                ? "border-emerald-500 bg-emerald-500/[0.04] shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                : "border-[#1E293B] bg-charcoal-800/40 hover:border-emerald-500/40 text-slate-300"
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none" />
            <div className="text-3xl mb-4">💻</div>
            <h3 className="text-base font-bold font-mono text-white mb-1 tracking-wide">
              Code Arena
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Type software architectures, language history, and paradigms from modern coding languages.
            </p>
            <span className="absolute bottom-4 right-4 text-[10px] font-mono text-emerald-500/60 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              [ SELECT ]
            </span>
          </button>

          {/* Card 2: Knowledge Quest */}
          <button
            onClick={() => handleSelectCategory("knowledge_quest")}
            className={`flex flex-col text-left p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer relative group overflow-hidden ${
              selectedCategory === "knowledge_quest"
                ? "border-sky-500 bg-sky-500/[0.04] shadow-[0_0_20px_rgba(56,189,248,0.15)]"
                : "border-[#1E293B] bg-charcoal-800/40 hover:border-sky-500/40 text-slate-300"
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-500/10 to-transparent rounded-bl-full pointer-events-none" />
            <div className="text-3xl mb-4">🧠</div>
            <h3 className="text-base font-bold font-mono text-white mb-1 tracking-wide">
              Knowledge Quest
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Discover educational insights, historical records, astronomy, and factual trivia elements.
            </p>
            <span className="absolute bottom-4 right-4 text-[10px] font-mono text-sky-500/60 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              [ SELECT ]
            </span>
          </button>

          {/* Card 3: AI Lab */}
          <button
            onClick={() => handleSelectCategory("ai_lab")}
            className={`flex flex-col text-left p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer relative group overflow-hidden ${
              selectedCategory === "ai_lab"
                ? "border-teal-500 bg-teal-500/[0.04] shadow-[0_0_20px_rgba(20,184,166,0.15)]"
                : "border-[#1E293B] bg-charcoal-800/40 hover:border-teal-500/40 text-slate-300"
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal-500/10 to-transparent rounded-bl-full pointer-events-none" />
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-base font-bold font-mono text-white mb-1 tracking-wide">
              AI Lab
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Explore complex neural layers, prompt mechanics, reinforcement training, and future tech.
            </p>
            <span className="absolute bottom-4 right-4 text-[10px] font-mono text-teal-500/60 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              [ SELECT ]
            </span>
          </button>

          {/* Card 4: World Explorer */}
          <button
            onClick={() => handleSelectCategory("world_explorer")}
            className={`flex flex-col text-left p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer relative group overflow-hidden ${
              selectedCategory === "world_explorer"
                ? "border-amber-500 bg-amber-500/[0.04] shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                : "border-[#1E293B] bg-charcoal-800/40 hover:border-amber-500/40 text-slate-300"
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full pointer-events-none" />
            <div className="text-3xl mb-4">🌍</div>
            <h3 className="text-base font-bold font-mono text-white mb-1 tracking-wide">
              World Explorer
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Type vivid traveling records, cultural heritage structures, and geographic wonders.
            </p>
            <span className="absolute bottom-4 right-4 text-[10px] font-mono text-amber-500/60 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              [ SELECT ]
            </span>
          </button>

          {/* Card 5: Speed Sprint */}
          <button
            onClick={() => handleSelectCategory("speed_sprint")}
            className={`flex flex-col text-left p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer relative group overflow-hidden ${
              selectedCategory === "speed_sprint"
                ? "border-orange-500 bg-orange-500/[0.04] shadow-[0_0_20px_rgba(249,115,22,0.15)]"
                : "border-[#1E293B] bg-charcoal-800/40 hover:border-orange-500/40 text-slate-300"
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full pointer-events-none" />
            <div className="absolute top-4 right-4 bg-orange-500 text-charcoal-900 font-mono font-bold text-[9px] tracking-wider uppercase px-2 py-0.5 rounded animate-pulse">
              HOT
            </div>
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-base font-bold font-mono text-white mb-1 tracking-wide">
              Speed Sprint
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Fixed 15-20 word punchy sentences. Flat 20-second countdown starting on first key. High pressure.
            </p>
            <span className="absolute bottom-4 right-4 text-[10px] font-mono text-orange-500/60 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              [ SELECT ]
            </span>
          </button>

          {/* Card 6: Weak-Key Drill */}
          <button
            onClick={() => handleSelectCategory("weak_key_drill")}
            className={`flex flex-col text-left p-6 rounded-2xl border-2 transition-all duration-200 relative group overflow-hidden ${
              historyLength < 3
                ? "border-dashed border-charcoal-700 bg-charcoal-900/10 text-slate-600 cursor-not-allowed"
                : selectedCategory === "weak_key_drill"
                ? "border-electric-500 bg-electric-500/[0.04] shadow-[0_0_20px_rgba(59,130,246,0.15)] text-slate-300 cursor-pointer"
                : "border-[#1E293B] bg-charcoal-800/40 hover:border-electric-500/40 text-slate-300 cursor-pointer"
            }`}
          >
            {historyLength < 3 && (
              <div className="absolute inset-0 bg-[#090A0C]/40 backdrop-blur-[0.5px] pointer-events-none" />
            )}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full pointer-events-none" />

            <div className="text-3xl mb-4">
              {historyLength < 3 ? "🔒" : "🎯"}
            </div>

            <h3 className="text-base font-bold font-mono text-white mb-1 tracking-wide flex items-center gap-1.5">
              Weak-Key Drill
              {historyLength < 3 && (
                <span className="text-[9px] bg-charcoal-700 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold tracking-widest uppercase">
                  LOCKED
                </span>
              )}
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Personalized spaced repetition targeted paragraphs designed around keys causing you the most errors.
            </p>

            {historyLength >= 3 && (
              <span className="absolute bottom-4 right-4 text-[10px] font-mono text-electric-500/60 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                [ SELECT ]
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Stylized Centered Locked Drill Blocking Banner inside Hub */}
      {showLockedDrillMessage && (
        <div className="p-6 rounded-2xl border border-charcoal-700 bg-charcoal-900/40 font-mono text-xs text-slate-400 space-y-3 max-w-xl mx-auto animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-rose-500/40" />
          <div className="flex items-center gap-2 text-rose-400 font-bold uppercase">
            <span>🔒</span> security lock protocol active
          </div>
          <p className="leading-relaxed font-sans text-xs text-slate-400">
            Weak-Key Drill mode cannot analyze metrics without a robust historical profile. Complete at least <strong className="text-white">{3 - historyLength} more</strong> standard runs first to map your physical typing weaknesses.
          </p>
          <div className="flex justify-between items-center text-[10px] border-t border-charcoal-750/50 pt-2.5">
            <span>BASELINE VERIFICATION: {historyLength} / 3 RUNS COMPLETED</span>
            <button
              onClick={() => setShowLockedDrillMessage(false)}
              className="text-slate-500 hover:text-white underline transition-colors"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* 3. MODE SELECTION FLOW: MISSION CONFIGURATION CONSOLE */}
      {selectedCategory && (
        <div
          ref={configSectionRef}
          className="bg-charcoal-800 border-2 border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 transition-all duration-300 animate-slide-in relative overflow-hidden"
        >
          {/* subtle accent based on category */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#3B82F6]" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1E293B] pb-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-electric-400 uppercase tracking-widest font-black block">
                [ SECTOR CONFIGURATION PROMPT ]
              </span>
              <h2 className="text-lg font-bold text-white tracking-wide font-mono uppercase">
                Active Mission: {selectedCategory.replace("_", " ")}
              </h2>
            </div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-slate-500 hover:text-white font-mono text-xs border border-charcoal-700 px-3 py-1 rounded hover:bg-charcoal-900/60"
            >
              Deselect Mode [X]
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Difficulty selector column */}
            {selectedCategory !== "speed_sprint" && selectedCategory !== "weak_key_drill" ? (
              <div className="space-y-3">
                <label className="block font-mono text-xs text-slate-400 uppercase tracking-wider">
                  &gt;_ select difficulty tier
                </label>
                <div className="flex flex-col gap-2.5">
                  {(["easy", "medium", "hard"] as const).map((tier) => {
                    const isTierSelected = difficulty === tier;
                    return (
                      <button
                        key={tier}
                        onClick={() => setDifficulty(tier)}
                        className={`w-full flex justify-between items-center px-4 py-3 border rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          isTierSelected
                            ? tier === "easy"
                              ? "border-emerald-500 bg-emerald-500/5 text-emerald-400"
                              : tier === "medium"
                              ? "border-electric-500 bg-electric-500/5 text-electric-400"
                              : "border-rose-500 bg-rose-500/5 text-rose-400"
                            : "border-charcoal-750 bg-charcoal-900/20 text-slate-400 hover:border-charcoal-600 hover:text-white"
                        }`}
                      >
                        <span>{tier} Tier</span>
                        <span className="text-[10px] font-normal lowercase italic text-slate-500">
                          {tier === "easy" ? "~30 words" : tier === "medium" ? "~60 words" : "~100 words"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-2 bg-[#121316] border border-charcoal-750 rounded-xl p-5">
                <span className="font-mono text-[10px] text-electric-400 font-extrabold uppercase tracking-widest block">
                  SYSTEM DIAGNOSTIC INFO
                </span>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {selectedCategory === "speed_sprint"
                    ? "Speed Sprint bypasses standard parameters. You will type punchy paragraphs under a flat 20-second countdown. No tiers apply."
                    : "Weak-Key Drill generates customized, target-letter dense passages based on your aggregated historical keyboard errors. Difficulty levels are automated."}
                </p>
              </div>
            )}

            {/* Ghost Mode settings segment */}
            <div className="space-y-4">
              <label className="block font-mono text-xs text-slate-400 uppercase tracking-wider">
                &gt;_ modular settings
              </label>

              {hasPBOnSelectedDifficulty ? (
                <div className="bg-[#121316] border border-charcoal-750 rounded-xl p-4 flex items-center justify-between transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                        <span>👻</span> Ghost Race Mode
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                        ghostEnabled
                          ? "bg-electric-500/20 text-electric-400 border border-electric-500/30 animate-pulse"
                          : "bg-charcoal-700 text-slate-400 border border-charcoal-600"
                      }`}>
                        {ghostEnabled ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal font-sans">
                      Race against your local best run on the {difficulty} tier.
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
              ) : (
                <div className="bg-charcoal-900/20 border border-charcoal-750 rounded-xl p-4 text-left select-none text-[11px] text-slate-500 font-mono">
                  <span>👻 GHOST RACE BLOCKED</span>
                  <p className="font-sans text-[10px] text-slate-500 mt-1 leading-normal">
                    Requires a stored Personal Best run on the currently active parameter settings to enable race tracking.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Start CTA */}
          <div className="pt-4 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <span className="text-electric-500 animate-pulse">●</span> ready_to_launch_session()
            </div>
            <button
              onClick={handleStartTest}
              className="w-full sm:w-auto text-center px-10 py-3.5 bg-electric-500 text-white font-semibold rounded-xl shadow-lg shadow-electric-500/15 hover:bg-electric-400 transition-all duration-200 hover-glow-electric cursor-pointer text-xs uppercase tracking-wider font-mono"
            >
              Launch Test ⚡
            </button>
          </div>
        </div>
      )}

      {/* 4. SESSION STATS STRIP PANEL */}
      <div className="bg-charcoal-800 border border-[#1E293B] rounded-2xl p-5 shadow-inner">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">

          {/* completed tests today */}
          <div className="space-y-1 sm:border-r sm:border-charcoal-750/60 pr-4">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
              tests completed today
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {todayCompletedTests} {todayCompletedTests === 1 ? "Test" : "Tests"}
            </div>
            <p className="text-[10px] text-slate-500 font-sans leading-normal">
              Refreshes dynamically with daily completed runs.
            </p>
          </div>

          {/* current streak */}
          <div className="space-y-1 sm:border-r sm:border-charcoal-750/60 px-0 sm:px-4">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
              active daily streak
            </span>
            <div className="text-2xl font-black text-amber-500 font-mono flex items-center gap-1">
              <span>🔥</span>
              <span>{gamificationState ? gamificationState.streakDays : 0} Days</span>
            </div>
            <p className="text-[10px] text-slate-500 font-sans leading-normal">
              Practice consecutive days to maintain your multiplier.
            </p>
          </div>

          {/* closest locked achievement to completion */}
          <div className="space-y-1.5 pl-0 sm:pl-4">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
              closest locked achievement
            </span>
            {closestLockedAchievement ? (
              <div className="space-y-1">
                <div className="flex justify-between items-baseline text-[10px] font-mono">
                  <span className="text-white font-bold truncate max-w-[120px]" title={closestLockedAchievement.badge.title}>
                    {closestLockedAchievement.badge.title}
                  </span>
                  <span className="text-slate-400 font-bold">{closestLockedAchievement.percent}%</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[#121316] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${closestLockedAchievement.percent}%` }}
                    className="h-full bg-electric-500 rounded-full"
                  />
                </div>
                <div className="text-[9px] text-slate-500 font-mono text-right">
                  {closestLockedAchievement.label}
                </div>
              </div>
            ) : (
              <div className="text-xs font-bold text-emerald-400 font-mono">
                🎉 ALL ACHIEVEMENTS UNLOCKED!
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
